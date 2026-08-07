-- Laudo de Crédito (análise de crédito) — aplicado só em schema staging, replicar em public
-- depois de validado.
--
-- Contexto: cada incorporadora (empreendedora) tem seu próprio modelo/padrão de laudo de
-- crédito (campos diferentes). Por isso o desenho não usa colunas fixas — usa um "modelo" de
-- campos por empreendedora (laudos_credito_modelos + laudos_credito_campos), e os laudos de
-- cada processo guardam os valores desses campos em linhas (laudos_credito_valores), no
-- padrão chave/valor. O fluxo de pagamento (parcelas) continua como tabela separada porque é
-- naturalmente uma lista de linhas, não um campo único.
--
-- empreendimentos.logo_path: logo do empreendimento (bucket de storage), usado no cabeçalho do
-- PDF do laudo junto com o logo da incorporadora e o logo da Neo Service.

alter table staging.empreendimentos add column if not exists logo_path text;

create table if not exists staging.laudos_credito_modelos (
  id uuid primary key default gen_random_uuid(),
  empreendedora_id uuid not null references staging.empreendedoras(id) on delete cascade,
  nome text not null default 'Modelo padrão',
  tem_fluxo_pagamento boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empreendedora_id)
);

create table if not exists staging.laudos_credito_campos (
  id uuid primary key default gen_random_uuid(),
  modelo_id uuid not null references staging.laudos_credito_modelos(id) on delete cascade,
  ordem int not null default 0,
  rotulo text not null,
  tipo text not null default 'texto' check (tipo in ('texto','numero','area','data')),
  obrigatorio boolean not null default false
);

create table if not exists staging.laudos_credito (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references staging.esteira_processos(id) on delete cascade,
  modelo_id uuid references staging.laudos_credito_modelos(id),
  criado_por uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (processo_id)
);

create table if not exists staging.laudos_credito_valores (
  id uuid primary key default gen_random_uuid(),
  laudo_id uuid not null references staging.laudos_credito(id) on delete cascade,
  campo_id uuid not null references staging.laudos_credito_campos(id) on delete cascade,
  valor text,
  unique (laudo_id, campo_id)
);

-- Cada linha é uma parcela do fluxo de pagamento ("Fluxo 1", "Fluxo 2"... na planilha de
-- referência): tipo (ex.: Entrada, Mensal, Anual, Chaves), quantidade, valor e o
-- comprometimento (%) da renda naquela parcela — sem coluna de "saldo", que não existe na
-- planilha real que serviu de referência.
create table if not exists staging.laudos_credito_fluxo (
  id uuid primary key default gen_random_uuid(),
  laudo_id uuid not null references staging.laudos_credito(id) on delete cascade,
  ordem int not null default 0,
  tipo_parcela text,
  quantidade_parcela int,
  valor_parcela numeric,
  comprometimento numeric
);

alter table staging.laudos_credito_modelos enable row level security;
alter table staging.laudos_credito_campos enable row level security;
alter table staging.laudos_credito enable row level security;
alter table staging.laudos_credito_valores enable row level security;
alter table staging.laudos_credito_fluxo enable row level security;

create policy "equipe le modelos laudo" on staging.laudos_credito_modelos for select to authenticated using (true);
create policy "equipe grava modelos laudo" on staging.laudos_credito_modelos for all to authenticated using (true) with check (true);
create policy "equipe le campos laudo" on staging.laudos_credito_campos for select to authenticated using (true);
create policy "equipe grava campos laudo" on staging.laudos_credito_campos for all to authenticated using (true) with check (true);
create policy "equipe le laudos" on staging.laudos_credito for select to authenticated using (true);
create policy "equipe grava laudos" on staging.laudos_credito for all to authenticated using (true) with check (true);
create policy "equipe le valores laudo" on staging.laudos_credito_valores for select to authenticated using (true);
create policy "equipe grava valores laudo" on staging.laudos_credito_valores for all to authenticated using (true) with check (true);
create policy "equipe le fluxo laudos" on staging.laudos_credito_fluxo for select to authenticated using (true);
create policy "equipe grava fluxo laudos" on staging.laudos_credito_fluxo for all to authenticated using (true) with check (true);

-- Gap real encontrado ao criar essas tabelas: em staging, privilégio padrão (pg_default_acl)
-- pro role "postgres" só concede grant automático pro service_role, não pro authenticated.
-- Ou seja, toda tabela nova criada em staging precisa de GRANT explícito pro authenticated,
-- senão o PostgREST nega acesso (erro de permissão) mesmo com a policy de RLS certa. Corrigido
-- pontualmente nas tabelas acima e de forma permanente com o ALTER DEFAULT PRIVILEGES abaixo,
-- pra não se repetir em tabelas futuras.
grant select, insert, update, delete on
  staging.laudos_credito_modelos, staging.laudos_credito_campos, staging.laudos_credito,
  staging.laudos_credito_valores, staging.laudos_credito_fluxo
  to authenticated, service_role;

alter default privileges for role postgres in schema staging grant select, insert, update, delete on tables to authenticated;
alter default privileges for role postgres in schema staging grant usage, select on sequences to authenticated;
