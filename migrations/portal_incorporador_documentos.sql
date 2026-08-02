-- Portal do Incorporador — documentos por empreendimento, base de conhecimento no portal
-- e correção de acesso ao bucket da esteira.
-- Aplicado em 2026-08-02 nos schemas public e staging.

-- 1) Documentos publicados pelo admin para cada empreendimento.
--    O schema staging é um espelho sem PK/FK, por isso a FK só existe em public.
create table if not exists public.empreendimento_documentos (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  categoria text not null default 'Geral',
  titulo text not null,
  descricao text,
  tipo text not null default 'arquivo' check (tipo in ('arquivo','link')),
  storage_path text,
  url text,
  visivel_portal boolean not null default true,
  criado_por text,
  criado_em timestamptz not null default now()
);

create table if not exists staging.empreendimento_documentos (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null,
  categoria text not null default 'Geral',
  titulo text not null,
  descricao text,
  tipo text not null default 'arquivo' check (tipo in ('arquivo','link')),
  storage_path text,
  url text,
  visivel_portal boolean not null default true,
  criado_por text,
  criado_em timestamptz not null default now()
);

do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format('create index if not exists idx_emp_docs_emp on %I.empreendimento_documentos(empreendimento_id)', s);
    execute format('alter table %I.empreendimento_documentos enable row level security', s);
    -- 2) Base de conhecimento passa a poder ser vinculada a um empreendimento e publicada no portal.
    execute format('alter table %I.conhecimento_artigos add column if not exists empreendimento_id uuid', s);
    execute format('alter table %I.conhecimento_artigos add column if not exists visivel_portal boolean not null default false', s);
  end loop;
end $$;

-- 3) RLS: equipe escreve, cliente só lê o que é do próprio empreendimento e está marcado como visível.
create policy sel_emp_docs on public.empreendimento_documentos for select using (public.nao_eh_cliente());
create policy ins_emp_docs on public.empreendimento_documentos for insert with check (public.is_write_role());
create policy upd_emp_docs on public.empreendimento_documentos for update using (public.is_write_role()) with check (public.is_write_role());
create policy del_emp_docs on public.empreendimento_documentos for delete using (public.is_write_role());

create policy sel_emp_docs_cliente on public.empreendimento_documentos for select using (
  visivel_portal and exists (
    select 1 from public.perfis p join public.empreendimentos e on e.id = empreendimento_documentos.empreendimento_id
    where p.user_id = auth.uid() and p.role = 'cliente' and p.empreendedora_id = e.empreendedora_id));

create policy sel_conhecimento_cliente on public.conhecimento_artigos for select using (
  visivel_portal and (
    empreendimento_id is null
    or exists (select 1 from public.perfis p join public.empreendimentos e on e.id = conhecimento_artigos.empreendimento_id
               where p.user_id = auth.uid() and p.role = 'cliente' and p.empreendedora_id = e.empreendedora_id))
  and exists (select 1 from public.perfis p where p.user_id = auth.uid() and p.role = 'cliente'));

-- Cliente enxerga apenas anexos de boleto dos processos da própria empreendedora.
create policy sel_esteira_anexos_cliente_boleto on public.esteira_anexos for select using (
  tipo ilike '%boleto%' and exists (
    select 1 from public.perfis p
    join public.esteira_processos ep on ep.id = esteira_anexos.processo_id
    join public.empreendimentos e on e.id = ep.empreendimento_id
    where p.user_id = auth.uid() and p.role = 'cliente' and p.empreendedora_id = e.empreendedora_id));

grant select, insert, update, delete on public.empreendimento_documentos to authenticated;
revoke all on public.empreendimento_documentos from anon;

-- 4) Bucket dos documentos do portal. Caminho: <empreendimento_id>/<arquivo>
insert into storage.buckets (id, name, public) values ('portal-documentos','portal-documentos', false)
on conflict (id) do nothing;

create policy portal_docs_equipe_all on storage.objects for all
  using (bucket_id = 'portal-documentos' and public.nao_eh_cliente())
  with check (bucket_id = 'portal-documentos' and public.is_write_role());

create policy portal_docs_cliente_sel on storage.objects for select using (
  bucket_id = 'portal-documentos' and exists (
    select 1 from public.perfis p
    join public.empreendimentos e on e.id::text = (storage.foldername(name))[1]
    where p.user_id = auth.uid() and p.role = 'cliente' and p.empreendedora_id = e.empreendedora_id));

-- 5) CORREÇÃO DE SEGURANÇA: antes, qualquer usuário autenticado (inclusive cliente do Portal)
--    lia e gravava todo o bucket esteira-documentos, que guarda contrato, RG e comprovante de
--    renda de todos os processos, de todas as incorporadoras.
drop policy if exists esteira_docs_select on storage.objects;
create policy esteira_docs_select on storage.objects for select to authenticated using (
  bucket_id = 'esteira-documentos' and (
    public.nao_eh_cliente()
    or exists (
      select 1 from public.esteira_anexos a
      join public.esteira_processos ep on ep.id = a.processo_id
      join public.empreendimentos e on e.id = ep.empreendimento_id
      join public.perfis p on p.user_id = auth.uid()
      where a.storage_path = objects.name
        and a.tipo ilike '%boleto%'
        and p.role = 'cliente' and p.empreendedora_id = e.empreendedora_id)));

drop policy if exists esteira_docs_insert on storage.objects;
create policy esteira_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'esteira-documentos' and public.is_write_role());

drop policy if exists esteira_docs_update on storage.objects;
create policy esteira_docs_update on storage.objects for update to authenticated
  using (bucket_id = 'esteira-documentos' and public.is_write_role())
  with check (bucket_id = 'esteira-documentos' and public.is_write_role());

-- 6) O espelho diário do ambiente de teste passa a incluir as tabelas novas.
--    (ver staging.atualizar_espelho — lista de tabelas ampliada)
