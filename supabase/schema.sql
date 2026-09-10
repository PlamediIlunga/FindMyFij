-- Schéma de la table "fij" pour le projet fij-carte.
-- À exécuter dans l'éditeur SQL de votre projet Supabase.

create table if not exists public.fij (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- « Global » n'est pas une catégorie propre à une FIJ : elle représente
  -- l'ensemble Jeunes + Jeunes Ados et n'est utilisée que côté filtre (UI).
  category text not null check (category in ('Jeunes', 'Jeunes Ados')),
  address text not null,
  city text not null,
  province text not null,
  country text not null default 'Canada',
  postal_code text not null,
  phone text,
  unit_number text,
  status text not null default 'open' check (status in ('open', 'closed')),
  status_note text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index utilisés par la recherche et les filtres de l'application.
create index if not exists fij_category_idx on public.fij (category);
create index if not exists fij_city_idx on public.fij (city);
create index if not exists fij_province_idx on public.fij (province);
create index if not exists fij_country_idx on public.fij (country);

-- Migration pour bases existantes (exécuter si la table existe déjà sans country) :
-- alter table public.fij add column if not exists country text not null default 'Canada';
-- Migration non destructive pour les nouveaux champs :
alter table public.fij add column if not exists phone text;
alter table public.fij add column if not exists unit_number text;
alter table public.fij add column if not exists status text not null default 'open';
alter table public.fij add column if not exists status_note text;
alter table public.fij drop constraint if exists fij_status_check;
alter table public.fij add constraint fij_status_check check (status in ('open', 'closed'));
-- create index if not exists fij_province_idx on public.fij (province);
-- create index if not exists fij_country_idx on public.fij (country);

-- Migration pour bases existantes créées avant la correction « Global » :
-- « Global » n'a jamais été une vraie catégorie de FIJ (elle représente
-- Jeunes + Jeunes Ados combinés). Si des lignes existantes utilisent encore
-- 'Global', réaffectez-les manuellement à la bonne catégorie AVANT
-- d'appliquer la nouvelle contrainte ci-dessous, par exemple :
-- update public.fij set category = 'Jeunes' where category = 'Global';
-- alter table public.fij drop constraint if exists fij_category_check;
-- alter table public.fij add constraint fij_category_check
--   check (category in ('Jeunes', 'Jeunes Ados'));

-- Maintient updated_at à jour automatiquement lors des modifications.
-- Fonction nommée spécifiquement pour "fij" afin de ne jamais entrer en
-- conflit avec une fonction du même nom utilisée par une autre table.
create or replace function public.set_fij_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists fij_set_updated_at on public.fij;
create trigger fij_set_updated_at
  before update on public.fij
  for each row execute function public.set_fij_updated_at();

-- Row Level Security : lecture publique (la carte doit être consultable par
-- tout le monde), écriture réservée aux utilisateurs authentifiés (protège
-- /admin via Supabase Auth sans système de rôles complexe).
alter table public.fij enable row level security;

drop policy if exists "Lecture publique des FIJ" on public.fij;
create policy "Lecture publique des FIJ"
  on public.fij for select
  using (true);

drop policy if exists "Écriture réservée aux utilisateurs connectés" on public.fij;
create policy "Écriture réservée aux utilisateurs connectés"
  on public.fij for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
