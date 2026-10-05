// Supabase Edge Function: scrape-price
//
// Recibe la URL de la ficha de un producto y devuelve el precio detectado,
// leyendo el HTML de la tienda en el servidor (evita el bloqueo CORS que
// impediría hacerlo directamente desde el navegador).
//
// Estrategias de extracción, en orden de preferencia:
//   1. Bloques JSON-LD (schema.org Product/Offer) — intenta además casar la
//      URL del nodo con la URL solicitada, para acertar la variante correcta
//      cuando la ficha agrupa varias (packs, formatos, etc.).
//   2. Variable embebida típica de PrestaShop (`"PriceInclTax":"X.XX"`).
//   3. Metaetiquetas `product:price:amount` / `og:price:amount` / `itemprop="price"`.
//   4. Patrón genérico `X,XX €` / `€ X,XX` como último recurso.

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function normalizeUrlPath(rawUrl: string): string {
  try {
    const u = new URL(rawUrl, 'https://placeholder.invalid')
    return (u.pathname || '').replace(/\/+$/, '').toLowerCase()
  } catch {
    return rawUrl.trim().toLowerCase()
  }
}

function extractNumericPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) return Number(value)
  return null
}

/** Recorre un árbol JSON-LD buscando el precio asociado a la URL solicitada. */
function extractPriceFromJsonLd(node: unknown, targetPath: string): number | null {
  let fallback: number | null = null

  function walk(current: unknown): number | null {
    if (current === null || typeof current !== 'object') return null

    if (Array.isArray(current)) {
      for (const item of current) {
        const found = walk(item)
        if (found !== null) return found
      }
      return null
    }

    const obj = current as Record<string, unknown>
    const ownUrl = typeof obj.url === 'string' ? obj.url : undefined
    const ownUrlMatches = ownUrl !== undefined && normalizeUrlPath(ownUrl) === targetPath

    const ownPrice = extractNumericPrice(obj.price)
    if (ownPrice !== null) {
      if (fallback === null) fallback = ownPrice
      if (ownUrlMatches) return ownPrice
    }

    if (obj.offers && typeof obj.offers === 'object') {
      const offers = obj.offers as Record<string, unknown>
      const offersPrice = extractNumericPrice(offers.price)
      if (offersPrice !== null) {
        if (fallback === null) fallback = offersPrice
        if (ownUrlMatches) return offersPrice
      }
      const nested = walk(obj.offers)
      if (nested !== null) return nested
    }

    for (const key of Object.keys(obj)) {
      if (key === 'offers' || key === 'price' || key === 'url') continue
      const found = walk(obj[key])
      if (found !== null) return found
    }

    return null
  }

  const matched = walk(node)
  return matched !== null ? matched : fallback
}

interface ExtractResult {
  price: number | null
  source: string | null
}

function extractPrice(html: string, targetUrl: string): ExtractResult {
  const targetPath = normalizeUrlPath(targetUrl)

  // 1) JSON-LD
  const ldJsonBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of ldJsonBlocks) {
    try {
      const json = JSON.parse(block[1].trim())
      const price = extractPriceFromJsonLd(json, targetPath)
      if (price !== null && price > 0) return { price, source: 'json-ld' }
    } catch {
      // Bloque JSON-LD malformado: lo ignoramos y seguimos con el siguiente.
    }
  }

  // 2) PrestaShop (klProduct.PriceInclTax)
  const prestaMatch = html.match(/"PriceInclTax"\s*:\s*"(\d+(?:\.\d+)?)"/)
  if (prestaMatch) return { price: Number(prestaMatch[1]), source: 'prestashop' }

  // 3) Metaetiquetas de precio
  const metaMatch =
    html.match(/<meta[^>]+(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]+content=["']([\d.,]+)["']/i) ||
    html.match(/<meta[^>]+itemprop=["']price["'][^>]+content=["']([\d.,]+)["']/i)
  if (metaMatch) {
    const raw = metaMatch[1].includes(',') && !metaMatch[1].includes('.') ? metaMatch[1].replace(',', '.') : metaMatch[1]
    return { price: Number(raw), source: 'meta' }
  }

  // 4) Patrón genérico "X,XX €"
  const genericMatch = html.match(/(\d{1,4}[.,]\d{2})\s?€/) || html.match(/€\s?(\d{1,4}[.,]\d{2})/)
  if (genericMatch) {
    const raw = genericMatch[1].replace(',', '.')
    return { price: Number(raw), source: 'generic' }
  }

  return { price: null, source: null }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no soportado.' }, 405)
  }

  let url: string | undefined
  try {
    const body = await req.json()
    url = typeof body?.url === 'string' ? body.url : undefined
  } catch {
    return jsonResponse({ error: 'Cuerpo de la petición inválido.' }, 400)
  }

  if (!url) {
    return jsonResponse({ error: 'Falta la URL del producto.' }, 400)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    if (!response.ok) {
      return jsonResponse({ price: null, error: `La tienda respondió con estado ${response.status}.` })
    }

    const html = await response.text()
    const { price, source } = extractPrice(html, url)

    if (price === null) {
      return jsonResponse({ price: null, error: 'No se ha encontrado un precio reconocible en la página.' })
    }

    return jsonResponse({ price, source })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al leer la página.'
    return jsonResponse({ price: null, error: message })
  } finally {
    clearTimeout(timeout)
  }
})
