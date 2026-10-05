-- =====================================================================
-- Esquema de la tabla "latas" (comparador de latas de comida para gatos)
-- Proyecto: Lara
-- Instrucciones: copia TODO este archivo y pégalo en el SQL Editor de
-- tu proyecto Supabase (https://app.supabase.com -> tu proyecto ->
-- SQL Editor -> New query) y pulsa "Run". Es seguro volver a ejecutarlo
-- (usa IF NOT EXISTS / OR REPLACE donde es posible).
-- =====================================================================

-- 1) Tabla principal -----------------------------------------------------
create table if not exists public.latas (
  id bigint generated always as identity primary key,
  marca text not null,
  producto text not null,
  composicion text,
  lleva_huevo text not null default 'NO',
  tipo text,
  le_gusta text,
  tiendanimal_puntos text,
  enlace text,
  precio numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.latas is 'Comparativa de latas/sobres de comida húmeda para gatos';
comment on column public.latas.marca is 'Marca del producto';
comment on column public.latas.producto is 'Nombre del producto / variante';
comment on column public.latas.composicion is 'Composición / ingredientes';
comment on column public.latas.lleva_huevo is 'Si lleva huevo y detalle (texto libre: NO / SÍ - detalle)';
comment on column public.latas.tipo is 'Completo / Complementario';
comment on column public.latas.le_gusta is 'A qué gato le gusta: Los dos / ARTEMIS / LUNA / Ninguno';
comment on column public.latas.tiendanimal_puntos is 'Disponibilidad en Tiendanimal / puntos';
comment on column public.latas.enlace is 'Enlace a la ficha del producto';
comment on column public.latas.precio is 'Precio en euros (columna añadida para uso futuro)';

-- 2) Columna de precio (por si la tabla ya existía sin ella) -------------
alter table public.latas add column if not exists precio numeric(10, 2);

-- 3) updated_at automático -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists latas_set_updated_at on public.latas;
create trigger latas_set_updated_at
  before update on public.latas
  for each row
  execute function public.set_updated_at();

-- 4) Índices útiles para ordenar/filtrar ----------------------------------
create index if not exists latas_marca_idx on public.latas (marca);
create index if not exists latas_tipo_idx on public.latas (tipo);
create index if not exists latas_le_gusta_idx on public.latas (le_gusta);

-- 5) Seguridad (RLS) -------------------------------------------------------
-- Acceso abierto (sin login), tal como se ha solicitado: cualquiera con la
-- URL y la clave anon puede leer y escribir. Si en el futuro quieres
-- restringir la edición, cambia estas políticas para exigir
-- "to authenticated" en vez de "to anon, authenticated".
alter table public.latas enable row level security;

drop policy if exists "latas_select_all" on public.latas;
create policy "latas_select_all" on public.latas
  for select to anon, authenticated using (true);

drop policy if exists "latas_insert_all" on public.latas;
create policy "latas_insert_all" on public.latas
  for insert to anon, authenticated with check (true);

drop policy if exists "latas_update_all" on public.latas;
create policy "latas_update_all" on public.latas
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "latas_delete_all" on public.latas;
create policy "latas_delete_all" on public.latas
  for delete to anon, authenticated using (true);

-- 6) Datos iniciales (importados desde LATAS.xlsx) ------------------------
-- Solo se insertan la primera vez, para evitar duplicar filas si vuelves a
-- ejecutar este script.
do $$
begin
  if not exists (select 1 from public.latas limit 1) then
insert into public.latas (marca, producto, composicion, lleva_huevo, tipo, le_gusta, tiendanimal_puntos, enlace) values
  ('Leonardo', 'Finest Selection Pollo y queso 16×85 g', 'Carne, hígado y corazón de pato (30%); corazón e hígado de pollo (28,5%), caldo de carne de pato, pollo y ternera (28,3%), pulmón de ternera (8%), dados de queso (4%), cáscaras de huevo (0,5%, deshidratadas), minerales (0,5%), aceite de salmón (0,2%).', 'SÍ — cáscara de huevo deshidratada 0,5%', 'Completo', 'Los dos', 'No', 'https://www.zooplus.es/shop/tienda_gatos/comida_humeda/leonardo/leonardo_bolsitas/586640?variantId=586640.17'),
  ('Criadores', 'Light Atún y Mejillones 170 g', 'Atún 40%, mejillones 4%, sustancias minerales, agua de cocción.', 'NO', 'Completo', 'LUNA', 'SÍ', 'https://www.tiendanimal.es/170-g-criadores-light-atun-y-mejillones-lata-para-gatos/CRD0895.html'),
  ('Dibaq Sense', 'Atún con Conejo (Fillets)', 'Atún 50%, conejo 4%, calabaza 2%, aceite de salmón, prebióticos 0,2 g/kg, extracto de yuca 65 mg/kg, sustancias minerales.', 'NO', 'Complementario', 'LUNA', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/dibaq-sense-lata-de-atun-con-conejo-para-gato.html'),
  ('Puromenu', 'Momento de Ternura BIO — Pollo 100 g', 'Pechuga de pollo 57%, caldo de pollo 20%, hígado de pollo 7,6%, carcasa/cuello de pollo 7,6%, corazón de pollo 3,8%, coco 1,4%, brócoli 1,17%, levadura de cerveza, aceite de hígado de bacalao, Ascophyllum nodosum.', 'NO', 'Completo', 'ARTEMIS', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/comida-humeda-puromenu-pollo-momento-de-ternura-gatos.html'),
  ('Inaba', 'Dashi Pollo y Bonito', 'Caldo sabor vieira, pollo 39,2%, virutas de bonito 1,2%, tapioca (seca).', 'NO', 'Complementario', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/inaba-dashi-pollo-y-bonito-gatos.html'),
  ('Herrmann''s', 'Selection Cat Conejo con Queso 100 g', 'Conejo 90,5% (carne muscular, caldo, corazón, pulmones, hígado), queso 4%, levadura de cerveza 2%, copos de coco 1,5%, aceite de girasol 0,9%, calcio de algas 0,5%, aceite de hígado de bacalao 0,35%, minerales 0,2%, fucus 0,05%.', 'NO', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/herrmanns-comida-humeda-conejo-con-queso-para-gato.html'),
  ('Schesir', 'Atún y Anchovetas en Gelatina 85 g', 'Atún 51%, anchovetas 4%, arroz 1,5%, aceite de girasol refinado 2%, sustancias minerales.', 'NO', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/schesir-lata-atun-y-anchovetas-en-gelatina-para-gato.html'),
  ('Applaws', 'Filete de Atún con Besugo en Caldo 70 g', 'Filete de atún 70%, caldo de pescado 23%, besugo 5%, arroz integral 2%.', 'NO', 'Complementario', 'Los dos', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/applaws-sobre-filete-de-atun-con-besugo-gato.html'),
  ('Wild Balance', 'Cazuela de Pollo con Verduras', 'Pollo (entero, hígado, corazón) 95%, zanahoria 4%, guisantes 1%. La ficha también indica huesos triturados integrados en la mezcla.', 'NO', 'Completo', 'ARTEMIS', 'No', 'https://patitasco.com/comida-humeda-gatos/wild-balance-cazuela-de-pollo-con-verduras-gato.html'),
  ('Leonardo', 'Búfalo + Arándanos azules 85 g', 'Búfalo 30% (pulmón, hígado, corazón, riñón), pollo 30% (carne, hígado, corazón), caldo de carne 29,8%, pulmón de ternera 6%, arándanos rojos 3%, cáscaras de huevo 0,5%, minerales 0,5%, aceite de salmón 0,2%.', 'SÍ — cáscara de huevo deshidratada 0,5%', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/leonardo-comida-humeda-bufalo-y-arandanos-gato.html'),
  ('Schesir', 'After Dark Perfect Mousse Pollo y Pato 80 g', 'Pollo 61% (mollejas 5%, hígados 5%, corazones 5%), caldo de pollo 26%, pato 6%, aceite de girasol refinado, almidón de tapioca, huevo en polvo, minerales.', 'SÍ — huevo en polvo', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/schesir-after-dark-perfect-mousse-pollo-y-pato-80g.html'),
  ('Schesir', 'Filetes de Sardina en Salsa 70 g', 'Sardinas 60%, salsa de sardinas, almidón de tapioca, pimentón.', 'NO', 'Complementario', 'LUNA', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/schesir-filetes-de-sardina-en-salsa-para-gatos-70g.html'),
  ('Milo y Lola', 'Paté de Pollo con Vísceras 100 g', 'Carne de pollo, corazón, hígado y molleja de pollo 68%; caldo de carne de pollo 30,2%; minerales 1%; cáscaras de huevo deshidratadas 0,5%; aceite de oliva 0,2%; hierba gatera 0,1%.', 'SÍ — cáscaras de huevo deshidratadas 0,5%', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/milo-y-lola-sobre-de-pollo-con-corazones-para-gatos.html'),
  ('Dibaq Sense', 'Bocaditos en Salsa Pavo, Conejo y Pollo 100 g', 'Pavo 57%, conejo 20%, pollo 5%, almidón de tapioca 1,4%, minerales, manzana deshidratada 0,4%, arándanos deshidratados 0,4%, inulina 0,4%.', 'NO', 'Completo', 'ARTEMIS', 'NO para puntos', 'https://patitasco.com/comida-humeda-gatos/dibaq-sense-bocaditos-en-salsa-de-pavo-con-conejo-para-gato.html'),
  ('Puromenu', 'Bigotes Felices Vacuno', 'Carne de músculo de vacuno 45,6%, caldo de vacuno 20%, corazón de vacuno 15,2%, hígado de vacuno 7,6%, pulmón de vacuno 7,6%, calabaza 1,67%, levadura de cerveza, ortiga 0,4%, citrato de calcio, aceite de hígado de bacalao y Ascophyllum nodosum (algas marinas).', 'NO', 'Completo', 'Los dos', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/comida-humeda-puromenu-vacuno-menu-bigotes-felices-gatos.html?srsltid=AU7gw4X8WxGVGqe2tTG-93SN_yjgG9pp79wW2JhafrCrJVBdndUy2OLm'),
  ('Almo Nature', 'HFC Atún y Gambas 70 g', 'Atún 55%, caldo de pescado 24%, gambas 20%, arroz 1%', 'NO', 'Complementario', 'Los dos', 'Sí — 115 puntos', 'https://www.tiendanimal.es/almo-nature-hfc-atun-y-gambas-lata-para-gatos/ALM5023H_M.html?srsltid=AU7gw4XgW2NMym0k4k5blT4y-mpx5WOPYQ4yt_3q7LuqyPtNNDb-OtI6'),
  ('Schesir', 'Adult Atún y Dorada 85 g', 'Atún 55%, dorada 4%, arroz 1,5%', 'NO', 'Complementario', 'Los dos', 'Sí — 115 puntos', 'https://www.tiendanimal.es/85-g-schesir-adult-atun-y-dorada-sobre-para-gatos/SHR1958524.html'),
  ('True Origins', 'Wild Adult Pacific Salmón y Arenque 100 g', 'Salmón 35%, arenque 33%, caldo de salmón 28,7%, batata 5%, minerales 1%, aceite de salmón 0,2%, hierbas 0,1%', 'NO', 'Complementario', 'ARTEMIS', 'Sí — 145 puntos', 'https://www.tiendanimal.es/true-origins-wild-adult-pacific-salmon-y-arenque-lata-para-gatos/TRU88063_M.html?srsltid=AU7gw4X-q2x5WZ15mIQUVniye0KLqGWiXrdTqp-YvhnTTaDerYzBY7Yb'),
  ('Applaws', 'Pollo y Pato en caldo 70 g', 'Pechuga de pollo 70%, caldo de pollo 24%, pato 5%, arroz 1%', 'NO', 'Complementario', 'Los dos', 'Sí — 110 puntos', 'https://www.tiendanimal.es/applaws-pollo-y-pato-en-caldo-lata-para-gatos/APL1025CE-A_M.html?srsltid=AU7gw4VoMfHC1_QKR5sbz_NpN_0UTDGysvbRGs60tmO--R8rdBb7AueM'),
  ('Hill''s', 'Science Plan  Sterilised Cat Adult ≤6 años, Pollo en salsa', 'Carne y derivados animales (pollo 24%), derivados vegetales, verduras, huevos y derivados de huevo, cereales, azúcares, extractos de proteína vegetal, aceites y grasas, minerales', 'SÍ — huevo y derivados de huevo', 'Completo', 'ARTEMIS', 'SÍ', 'https://www.tiendanimal.es/hills-science-plan-sterilised-adult-pollo-y-salmon-en-salsa-sobre-para-gatos/HIL607317_M.html?srsltid=AU7gw4Vtj1CKoF5G9HAlBINwvNJY9508qlwlyNaT98NwF-C8TVDr5EnD'),
  ('CIAO', 'STEW Chicken with Salmon Recipe – 40 g', 'Caldo de vieira 62,7%, pollo 31,5%, salmón 2%, tapioca desecada. Aditivos: goma guar, aromas, Camellia thea y vitamina E.', 'NO', 'Complementario', 'Los dos', 'No', 'https://patitasco.com/caldos-gatos/ciao-stew-guiso-de-pollo-con-salmon-para-gatos.html'),
  ('MAC''s', 'Lata Vacuno con Corazón e Hígado 200 g', '95,8% vacuno (corazón, pulmón, carne, hígado y caldo de vacuno); zanahoria 3%; minerales 1%; aceite de cártamo 0,2%.', 'NO', 'Completo', 'Ninguno', 'No', 'https://patitasco.com/comida-humeda-gatos/macs-lata-vacuno-con-corazon-e-higado-comida-humeda-gato.html'),
  ('MAC''s', 'Lata Salmón y Pollo 200 g', 'Pollo 54,1% (corazón, molleja, hígado y caldo); salmón 42,7%; plátano 2%; minerales 1%; aceite de salmón 0,2%.', 'NO', 'Completo', 'Ninguno', 'No', 'https://patitasco.com/comida-humeda-gatos/macs-lata-salmon-y-pollo-comida-humeda-gato-.html'),
  ('Natura Diet', 'Paté Hipoalergénico Codorniz y Cerdo 85 g', 'Codorniz fresca 40%; cerdo fresco 10%; zanahoria 2%; judías verdes 2%; tomillo; minerales.', 'NO', 'Completo', 'Ninguno', 'No', 'https://patitasco.com/comida-humeda-gatos/natura-diet-pate-hipoalergenico-de-codorniz-y-cerdo-para-gato.html'),
  ('Canagan', 'Lata Atún con Mejillones 75 g', 'Atún 58%; caldo de atún 32–33%; mejillones 5%; tapioca; aceite de girasol; vitaminas y minerales.', 'NO', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/canagan-lata-atun-con-mejillones-para-gatos.html'),
  ('Edgard & Cooper', 'Pollo de Corral en Salsa 85 g', 'Pollo de corral 46%; vacuno 7%; minerales; salvia 0,02%; cúrcuma 0,02%; arándanos 0,01%.', 'NO', 'Completo', 'Ninguno', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/edgard-and-cooper-adult-pollo-lata-85g.html'),
  ('Cat''s Love', 'Sobre Ternera y Pavo 85 g', 'Ternera y pavo 71% (36% ternera + 35% pavo); caldo 27,7%; minerales 1%; aceite de lino 0,2%; hierba gatera 0,1%.', 'NO', 'Completo', 'Ninguno', 'No', 'https://patitasco.com/comida-humeda-gatos/cats-love-ternera-y-pavo-comida-humeda-natural-85g.html'),
  ('Leonardo', 'Drink Caldo de Pato y Pollo 40 g', 'Caldo de pollo y pato 84%; pollo 9%; pato 6%; minerales 1%; taurina.', 'NO', 'Complementario', 'ARTEMIS', 'No', 'https://patitasco.com/caldos-gatos/leonardo-drink-caldo-pato-y-pollo-para-gatos.html'),
  ('Milo y Lola', 'Sobre Conejo y Pollo con Arándanos 100 g', 'Conejo y vísceras 30%; pollo y vísceras 30%; caldo 28%; pulmón de ternera 6,5%; arándanos 4%; minerales 1%; cáscara de huevo seca 0,2%; aceite de oliva 0,2%; hierba gatera 0,1%.', 'SÍ — cáscara de huevo 0,2%', 'Completo', 'Ninguno', 'No', 'https://patitasco.com/comida-humeda-gatos/milo-y-lola-sobre-de-conejo-con-arandanos-para-gatos.html'),
  ('CIAO', 'Bisque Sobre de Pollo con Ternera para Gatos', 'Pollo (28,2 %), ternera (1,8 %), tapioca (desecada), extracto de vieira (0,9 %). Goma guar. Saborizantes, Camellia thea Link.Vitamina E 570 mg.', 'NO', 'Complementario', 'Los dos', 'No', 'https://patitasco.com/comida-natural-para-gato/ciao-bisque-pollo-con-ternera-para-gatos.html'),
  ('Cats Love', 'Sobre Puro de Salmón 85 g', 'Salmón 71%, caldo 27,7%, minerales 1%, aceite de cártamo 0,2%, perejil 0,1%.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/cats-love-salmon-comida-humeda-85g.html'),
  ('Natural Greatness', 'Lata Pescado de Mar', 'Caballa 45%, besugo 30%, caldo de pescado 23%, arroz 1%, maltodextrina 1%.', 'NO', 'Complementario', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/natural-greatness-pescado-comida-humeda-70g-gatos.html'),
  ('Applaws', 'Sobre Atún con Gambas en Caldo 70 g', 'Atún 55%, caldo de pescado 23%, gambas 20%, arroz aprox. 1%.', 'NO', 'Complementario', NULL, 'SÍ', 'https://patitasco.com/comida-humeda-gatos/applaws-wet-food-tuna-with-prawns-cat-on.html'),
  ('Ciao', 'Bisque Atún y Salmón 40 g', 'Caldo de vieira, atún y salmón; tapioca y aditivos tecnológicos/nutricionales.', 'NO', 'Complementario / snack', NULL, 'No', 'https://patitasco.com/comida-natural-para-gato/ciao-bisque-atun-y-salmon-para-gatos.html'),
  ('Applaws', 'Lata Caballa con Sardinas en Caldo 70 g', 'Caballa 70%, caldo de pescado 24%, sardina 5%, arroz aprox. 1%.', 'NO', 'Complementario', NULL, 'SÍ', 'https://patitasco.com/comida-humeda-gatos/applaws-comida-humeda-caballa-y-sardina-70g-gato.html'),
  ('Terra Felis', 'Famousse Salmón', 'Salmón 54%, caldo 38%, calabacín 3%, glicina 2%, concha de ostra, tomate, espinacas, taurina, levadura de cerveza, minerales.', 'NO', 'Complementario', 'ARTEMIS', 'No', 'https://patitasco.com/comida-humeda-gatos/terra-felis-salmon-comida-humeda-para-gato.html'),
  ('Schesir', 'Sardinas en Salsa de Bogavante 70 g', 'Sardinas 67%, salsa de sardinas, salsa de bogavante 4%, huevos en polvo, tapioca, aceite de girasol.', 'SÍ – huevo en polvo', 'Complementario', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/schesir-lata-pate-de-sardinas-en-salsa-de-bogavante-para-gato.html'),
  ('Schesir', 'Sopa Atún con Calamares 40 g', 'Atún 18%, extracto de pescado 4,5%, calamar 4%, tapioca 1,5%, caldo.', 'NO', 'Complementario', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/schesir-sopa-atun-con-calamares-para-gato.html'),
  ('Dibaq Sense', 'Lata Pescado Blanco con Vegetales', 'Pescado blanco 55%, zanahoria 2%, patata 1%, judías 1%, minerales, aceite de salmón, prebióticos.', 'NO', 'Complementario', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/dibaq-sense-lata-de-pescado-blanco-con-vegetales-para-gato.html'),
  ('Inaba Dashi Delights', 'Tarrina Atún con Copos de Bonito', 'Caldo de vieira 69,7%, atún 26,9%, virutas de bonito 1,1%, bonito seco en polvo 0,4%, tapioca.', 'NO', 'Complementario', 'LUNA', 'No', 'https://patitasco.com/comida-humeda-gatos/inaba-dashi-delights-tarrina-de-atun-con-copos-de-bonito-para-gatos.html'),
  ('Catit Cuisine', 'Paté Atún con Sardinas 95 g', 'Atún 26%, sardina 24%, zanahoria 4%, guisantes 4%, aceite de salmón, aceite de oliva, minerales.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/catit-cuisine-pate-de-atun-con-sardinas-para-gato.html'),
  ('Dibaq Sense', 'Bocaditos en Salsa Pollo y Sardinas 100 g', 'Pollo 64%, sardinas 20%, tapioca 1,4%, minerales, arándanos 0,4%, inulina 0,4%.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/dibaq-sense-bocaditos-en-salsa-de-pollo-y-sardinas-para-gato.html'),
  ('Dibaq Natural Moments', 'Salmón con Calabaza 70 g', 'Salmón 22%, pollo 20%, calabaza 4%, guisantes, minerales, aceite de oliva 0,1%, extracto de malta 0,02%.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/dibaq-natural-moments-salmon-con-calabaza-para-gato.html'),
  ('Leonardo', 'Sobre Faisán y Arándanos 85 g', 'Pollo/vísceras 37%, faisán 30%, caldo 29,8%, arándanos 2%, cáscara de huevo 0,5%, minerales, aceite de salmón.', 'SÍ – cáscara de huevo', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/leonardo-sobre-faisan-y-arandanos-comida-humeda-85g-gato.html'),
  ('Puromenu', 'Sobre Ganso “Zarpitas de Amor” 100 g', 'Ganso aprox. 96% (pechuga, caldo, hígado, carcasa/cuello, corazón), pera 1,2%, chía 0,8%, levadura, aceite de hígado de bacalao, algas.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/puromenu-sobre-de-ganso-zarpitas-de-amor-para-gatos.html'),
  ('Ciao Stew', 'Paté de Pollo con Queso 40 g', 'Caldo de vieira, pollo 26%, queso 4%, grasa de pollo, tapioca, carbonato cálcico, inulina, dextrosa, aceite vegetal, minerales.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/ciao-entree-stew-guiso-de-pollo-con-queso-para-gatos.html'),
  ('Wild Balance', 'Guiso del Pescador Salmón y Cerdo 80 g', 'Pollo 50%, salmón 30%, ternera 10%, cerdo 5%, zanahoria 4%, guisantes 1%; huesos triturados.', 'NO', 'Completo', 'ARTEMIS', 'No', 'https://patitasco.com/comida-humeda-gatos/wild-balance-guiso-del-pescador-gato.html'),
  ('Cats Love', 'Sobre Bio Pato 100 g', 'Pollo BIO 57%, pato BIO 14%, caldo BIO 28%, minerales 1%.', 'NO', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/cats-love-bio-pato-comida-humeda-100g-gatos.html'),
  ('Leonardo', 'Lata Caballo y Calabacín 200 g', 'Caballo 66%, caldo de caballo 28,8%, calabacín 4%, cáscara de huevo 0,5%, catnip 0,1%, aceite de salmón 0,1%.', 'SÍ – cáscara de huevo', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/leonardo-comida-humeda-caballo-y-calabacin-gato.html'),
  ('Dibaq Sense', 'Lata Cerdo Ibérico con Aceitunas 70 g', 'Cerdo 55% (45% ibérico), aceitunas 4%, minerales.', 'NO', 'Complementario', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/dibaq-sense-lata-de-cerdo-iberico-con-aceitunas-para-gato.html#/peso-70_g'),
  ('Leonardo', 'Sobre Venado y Arándanos 85 g', 'Vísceras de ave 37%, venado 30%, caldo 29,8%, arándanos 2%, cáscara de huevo 0,5%, minerales, aceite de salmón.', 'SÍ – cáscara de huevo', 'Completo', 'Los dos', 'No', 'https://patitasco.com/comida-humeda-gatos/leonardo-comida-humeda-venado-y-mirtilos-gato.html'),
  ('Leonardo', 'Sobre Cordero, Ave y Arándanos 85 g', 'Cordero 36,5%, ave 30%, caldo 28,3%, arándanos 4%, cáscara de huevo 0,5%, minerales, aceite de salmón.', 'SÍ – cáscara de huevo', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/leonardo-comida-humeda-venado-y-mirtilos-gato.html'),
  ('MAC''s', 'Sobre Pollo, Pato y Camarones 100 g', 'Pollo 56,5%, pato 21,2%, camarones 21,2%, minerales 0,5%, polvo de cáscara de huevo 0,5%, harina de algas 0,1%.', 'SÍ – cáscara de huevo', 'Completo', NULL, 'No', 'https://patitasco.com/comida-humeda-gatos/macs-sobre-pollo-pato-y-camarones-comida-humeda-gato.html'),
  ('Applaws', 'Filete de Atún + Besugo (Sobre)', 'Filete de atún (70%), caldo de pescado (24%), dorada/besugo (5%), arroz (1%).', 'NO', 'Complementario', NULL, 'SÍ', 'https://patitasco.com/comida-humeda-gatos/applaws-sobre-filete-de-atun-con-besugo-gato.html'),
  ('Applaws', 'Atún y Gambas en caldo', 'Filete de atún 55%, Caldo de pescado 23%, Langostino del Pacífico 20% Arroz 2%', 'NO', 'Complementario', 'Los dos', 'SÍ', 'https://patitasco.com/comida-humeda-gatos/applaws-wet-food-tuna-with-prawns-cat-on.html'),
  ('Applaws', 'Caballa con Sardinas en Caldo para Gato', 'Caballa 70%, Caldo de pescado 24%, Sardina 5%, Arroz 1%.', 'NO', 'Complementario', NULL, 'SÍ', 'https://patitasco.com/comida-humeda-gatos/applaws-comida-humeda-caballa-y-sardina-70g-gato.html');

  end if;
end $$;

