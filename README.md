# Lara · Comparador de latas para gatos

Web para consultar, filtrar, ordenar y gestionar (alta / edición / baja) la comparativa de
latas y sobres de comida húmeda para gatos, con los datos originalmente recogidos en
[`LATAS.xlsx`](./LATAS.xlsx) y almacenados ahora en Supabase.

## Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (paleta personalizada `periwinkle` #b5c4fa / `butter` #f2f1a2)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`) como base de datos, usando el
  mismo proyecto que el repositorio `Wordle`, en una tabla independiente `latas`

## Puesta en marcha

```bash
npm install
npm run dev
```

La app arranca en `http://localhost:5173`.

### Variables de entorno

Copia `.env.example` a `.env` (ya está creado en este proyecto) y rellena:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Base de datos

El esquema completo (tabla, seguridad e importación de los 56 productos del Excel) está en
[`supabase/schema.sql`](./supabase/schema.sql). Para aplicarlo:

1. Entra en tu proyecto de [Supabase](https://app.supabase.com).
2. Ve a **SQL Editor → New query**.
3. Pega el contenido completo de `supabase/schema.sql` y pulsa **Run**.

El script es idempotente: puedes volver a ejecutarlo sin duplicar los datos (la importación
inicial solo se hace si la tabla está vacía) y sin romper nada si la tabla ya existe.

La tabla `latas` tiene estas columnas:

| Columna               | Tipo          | Descripción                                               |
| ---------------------- | ------------- | ----------------------------------------------------------|
| `id`                   | bigint        | Identificador autogenerado                                 |
| `marca`                | text          | Marca del producto                                          |
| `producto`             | text          | Nombre del producto / variante                              |
| `composicion`          | text          | Ingredientes / composición                                  |
| `lleva_huevo`          | text          | `NO` o `SÍ – detalle`                                        |
| `tipo`                 | text          | `Completo` / `Complementario` / ...                          |
| `le_gusta`             | text          | A qué gato le gusta (`Los dos`, `LUNA`, `ARTEMIS`, ...)       |
| `tiendanimal_puntos`   | text          | Disponibilidad en Tiendanimal / puntos                       |
| `enlace`               | text          | URL a la ficha del producto                                  |
| `precio`               | numeric(10,2) | Precio en euros (columna preparada para rellenar más adelante) |
| `created_at`/`updated_at` | timestamptz | Control de auditoría (automático)                           |

> **Seguridad**: por decisión explícita, el acceso es abierto (sin login): cualquiera con la
> URL y la clave `anon` puede leer y escribir. Si en el futuro quieres restringir la edición,
> edita las políticas RLS en `supabase/schema.sql` (sección 5) para exigir usuarios autenticados.

## Funcionalidades

- **Listado responsive**: tabla completa en escritorio/tablet y tarjetas apiladas en móvil.
- **Filtros estilo Excel**: cada columna categórica (`marca`, `lleva_huevo`, `tipo`, `le_gusta`,
  `tiendanimal_puntos`) tiene un desplegable con la lista de valores únicos y casillas de
  selección múltiple, más buscador de texto dentro del propio desplegable.
- **Ordenación** por columna (ascendente / descendente / sin ordenar) incluyendo precio.
- **Búsqueda global** por marca, producto, composición o enlace.
- **Alta / edición / baja** de filas mediante un formulario modal, con confirmación antes de
  eliminar y avisos (toast) de éxito/error.
- **Columna de precio** ya preparada en base de datos y en el formulario para cuando quieras
  rellenarla.

## Scripts disponibles

- `npm run dev` – servidor de desarrollo
- `npm run build` – build de producción (`dist/`)
- `npm run preview` – sirve el build de producción localmente
- `npm run lint` – linting con ESLint

## Despliegue en GitHub Pages

El repositorio incluye un workflow ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml))
que compila y publica automáticamente la web en GitHub Pages cada vez que se hace push a `main`.

Para activarlo (solo la primera vez):

1. Entra en el repositorio de GitHub → **Settings → Pages**.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Haz push a `main` (o relanza el workflow desde la pestaña **Actions**).

La web quedará publicada en `https://<usuario>.github.io/<repositorio>/`. El `base` de Vite y
las rutas de los assets (favicon, icono del gato) se calculan automáticamente a partir del
nombre del repositorio, así que no hace falta tocar nada más.
