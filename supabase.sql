create table if not exists public.easy_store_state (
  store_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create extension if not exists pg_trgm;

create table if not exists public.easy_store_ncm (
  codigo text primary key,
  codigo_digits text not null,
  capitulo text not null,
  descricao text not null,
  descricao_concatenada text not null,
  descricao_normalized text not null,
  descricao_concatenada_normalized text not null,
  data_inicio date,
  data_fim date,
  updated_at timestamptz not null default now()
);

create index if not exists idx_easy_store_ncm_codigo_digits
  on public.easy_store_ncm (codigo_digits);

create index if not exists idx_easy_store_ncm_capitulo
  on public.easy_store_ncm (capitulo);

create index if not exists idx_easy_store_ncm_descricao_norm_trgm
  on public.easy_store_ncm using gin (descricao_normalized gin_trgm_ops);

create index if not exists idx_easy_store_ncm_desc_concat_norm_trgm
  on public.easy_store_ncm using gin (descricao_concatenada_normalized gin_trgm_ops);

alter table public.easy_store_state enable row level security;
alter table public.easy_store_ncm enable row level security;

drop policy if exists "allow service role read" on public.easy_store_state;
drop policy if exists "allow service role insert" on public.easy_store_state;
drop policy if exists "allow service role update" on public.easy_store_state;
drop policy if exists "allow service role read ncm" on public.easy_store_ncm;
drop policy if exists "allow service role insert ncm" on public.easy_store_ncm;
drop policy if exists "allow service role update ncm" on public.easy_store_ncm;

create policy "allow service role read"
on public.easy_store_state
for select
to service_role
using (true);

create policy "allow service role insert"
on public.easy_store_state
for insert
to service_role
with check (true);

create policy "allow service role update"
on public.easy_store_state
for update
to service_role
using (true)
with check (true);

create policy "allow service role read ncm"
on public.easy_store_ncm
for select
to service_role
using (true);

create policy "allow service role insert ncm"
on public.easy_store_ncm
for insert
to service_role
with check (true);

create policy "allow service role update ncm"
on public.easy_store_ncm
for update
to service_role
using (true)
with check (true);
