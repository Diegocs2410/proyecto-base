-- Fase 3: Datos geográficos de Colombia.
-- Carga inicial: 33 departamentos + capitales. Para el listado completo
-- de municipios (~1100) usar dataset DANE y un seed adicional.

create table public.departments (
  id integer primary key,
  code text not null unique,
  name text not null
);

create table public.cities (
  id serial primary key,
  department_id integer not null references public.departments(id) on delete cascade,
  name text not null,
  is_capital boolean not null default false
);

create index cities_department_id_idx on public.cities(department_id);

alter table public.departments enable row level security;
alter table public.cities enable row level security;

create policy "geo lectura pública"
on public.departments
for select
to anon, authenticated
using (true);

create policy "geo ciudades lectura pública"
on public.cities
for select
to anon, authenticated
using (true);

-- Departamentos (código oficial DANE como id numérico).
insert into public.departments (id, code, name) values
  (5,  '05', 'Antioquia'),
  (8,  '08', 'Atlántico'),
  (11, '11', 'Bogotá D.C.'),
  (13, '13', 'Bolívar'),
  (15, '15', 'Boyacá'),
  (17, '17', 'Caldas'),
  (18, '18', 'Caquetá'),
  (19, '19', 'Cauca'),
  (20, '20', 'Cesar'),
  (23, '23', 'Córdoba'),
  (25, '25', 'Cundinamarca'),
  (27, '27', 'Chocó'),
  (41, '41', 'Huila'),
  (44, '44', 'La Guajira'),
  (47, '47', 'Magdalena'),
  (50, '50', 'Meta'),
  (52, '52', 'Nariño'),
  (54, '54', 'Norte de Santander'),
  (63, '63', 'Quindío'),
  (66, '66', 'Risaralda'),
  (68, '68', 'Santander'),
  (70, '70', 'Sucre'),
  (73, '73', 'Tolima'),
  (76, '76', 'Valle del Cauca'),
  (81, '81', 'Arauca'),
  (85, '85', 'Casanare'),
  (86, '86', 'Putumayo'),
  (88, '88', 'San Andrés y Providencia'),
  (91, '91', 'Amazonas'),
  (94, '94', 'Guainía'),
  (95, '95', 'Guaviare'),
  (97, '97', 'Vaupés'),
  (99, '99', 'Vichada')
on conflict (id) do nothing;

-- Capitales por departamento.
insert into public.cities (department_id, name, is_capital) values
  (5,  'Medellín',            true),
  (8,  'Barranquilla',        true),
  (11, 'Bogotá D.C.',         true),
  (13, 'Cartagena de Indias', true),
  (15, 'Tunja',               true),
  (17, 'Manizales',           true),
  (18, 'Florencia',           true),
  (19, 'Popayán',             true),
  (20, 'Valledupar',          true),
  (23, 'Montería',            true),
  (25, 'Bogotá D.C.',         true),
  (27, 'Quibdó',              true),
  (41, 'Neiva',               true),
  (44, 'Riohacha',            true),
  (47, 'Santa Marta',         true),
  (50, 'Villavicencio',       true),
  (52, 'Pasto',               true),
  (54, 'Cúcuta',              true),
  (63, 'Armenia',             true),
  (66, 'Pereira',             true),
  (68, 'Bucaramanga',         true),
  (70, 'Sincelejo',           true),
  (73, 'Ibagué',              true),
  (76, 'Cali',                true),
  (81, 'Arauca',              true),
  (85, 'Yopal',               true),
  (86, 'Mocoa',               true),
  (88, 'San Andrés',          true),
  (91, 'Leticia',             true),
  (94, 'Inírida',             true),
  (95, 'San José del Guaviare', true),
  (97, 'Mitú',                true),
  (99, 'Puerto Carreño',      true);

-- Ciudades secundarias más pobladas (para autocompletar usable de día 1).
-- Para municipios completos: seed adicional con dataset DANE.
insert into public.cities (department_id, name, is_capital) values
  (5,  'Bello',             false),
  (5,  'Itagüí',            false),
  (5,  'Envigado',          false),
  (5,  'Apartadó',          false),
  (5,  'Rionegro',          false),
  (5,  'Sabaneta',          false),
  (5,  'La Estrella',       false),
  (5,  'Caldas',            false),
  (5,  'Copacabana',        false),
  (5,  'Girardota',         false),
  (8,  'Soledad',           false),
  (8,  'Malambo',           false),
  (8,  'Sabanalarga',       false),
  (8,  'Puerto Colombia',   false),
  (13, 'Magangué',          false),
  (13, 'Turbaco',           false),
  (13, 'Arjona',            false),
  (15, 'Duitama',           false),
  (15, 'Sogamoso',          false),
  (15, 'Chiquinquirá',      false),
  (17, 'La Dorada',         false),
  (17, 'Chinchiná',         false),
  (17, 'Villamaría',        false),
  (19, 'Santander de Quilichao', false),
  (20, 'Aguachica',         false),
  (23, 'Lorica',            false),
  (23, 'Cereté',            false),
  (23, 'Sahagún',           false),
  (25, 'Soacha',            false),
  (25, 'Facatativá',        false),
  (25, 'Zipaquirá',         false),
  (25, 'Chía',              false),
  (25, 'Mosquera',          false),
  (25, 'Madrid',            false),
  (25, 'Funza',             false),
  (25, 'Cajicá',            false),
  (25, 'Girardot',          false),
  (25, 'Fusagasugá',        false),
  (41, 'Pitalito',          false),
  (41, 'Garzón',            false),
  (44, 'Maicao',            false),
  (44, 'Uribia',            false),
  (47, 'Ciénaga',           false),
  (47, 'Fundación',         false),
  (50, 'Acacías',           false),
  (50, 'Granada',           false),
  (52, 'Tumaco',            false),
  (52, 'Ipiales',           false),
  (54, 'Ocaña',             false),
  (54, 'Villa del Rosario', false),
  (54, 'Los Patios',        false),
  (66, 'Dosquebradas',      false),
  (66, 'Santa Rosa de Cabal', false),
  (68, 'Floridablanca',     false),
  (68, 'Girón',             false),
  (68, 'Piedecuesta',       false),
  (68, 'Barrancabermeja',   false),
  (68, 'San Gil',           false),
  (70, 'Corozal',           false),
  (73, 'Espinal',           false),
  (73, 'Melgar',            false),
  (73, 'Honda',             false),
  (76, 'Palmira',           false),
  (76, 'Buenaventura',      false),
  (76, 'Tuluá',             false),
  (76, 'Cartago',           false),
  (76, 'Jamundí',           false),
  (76, 'Yumbo',             false),
  (76, 'Buga',              false);
