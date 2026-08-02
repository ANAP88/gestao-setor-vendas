-- =====================================================================
-- IMPLANTAÇÃO — lista de status do checklist e trava de conclusão
-- Aplicado em 2026-08-02 nos schemas public e staging.
-- =====================================================================
-- Antes: o checklist tinha 3 status (Recebido / Em validação / Aprovado) e não
-- existia como registrar uma reprovação. Além disso a coluna `concluido` era
-- gravada pela interface, o que permitia um item contar como concluído sem
-- estar aprovado (inclusive por chamada direta à API).
--
-- Agora: 5 status, e a regra "só Aprovado conta" vive no banco, via trigger.
-- Consequência: avanco_pct só chega a 100 e status_auto só vira 'Concluído'
-- quando TODOS os itens estiverem Aprovados.

-- 1) Migra os valores antigos e amplia a lista de status
do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format($f$
      update %I.implantacao_checklist set status_validacao = case
        when status_validacao = 'Recebido' then 'Documentação recebida'
        when status_validacao = 'Em validação' then 'Documentação em validação'
        when status_validacao is null then 'Documentação pendente'
        else status_validacao end
    $f$, s);
    execute format('alter table %I.implantacao_checklist alter column status_validacao set default ''Documentação pendente''', s);
    execute format('update %I.implantacao_checklist set concluido = (status_validacao = ''Aprovado'')', s);
    -- a constraint original (nome gerado pelo Postgres) ainda limitava aos 3 status antigos
    execute format('alter table %I.implantacao_checklist drop constraint if exists implantacao_checklist_status_validacao_check', s);
    execute format('alter table %I.implantacao_checklist drop constraint if exists chk_status_validacao', s);
    execute format($f$alter table %I.implantacao_checklist add constraint chk_status_validacao
      check (status_validacao in ('Documentação pendente','Documentação recebida','Documentação em validação','Aprovado','Reprovado'))$f$, s);
  end loop;
end $$;

-- 2) `concluido` passa a ser derivado do status — não dá para forçar pela API
create or replace function public.fn_implantacao_checklist_concluido()
returns trigger language plpgsql as $function$
begin
  new.concluido := (new.status_validacao = 'Aprovado');
  return new;
end $function$;

create or replace function staging.fn_implantacao_checklist_concluido()
returns trigger language plpgsql as $function$
begin
  new.concluido := (new.status_validacao = 'Aprovado');
  return new;
end $function$;

do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format('drop trigger if exists trg_impl_ck_concluido on %I.implantacao_checklist', s);
    execute format('create trigger trg_impl_ck_concluido before insert or update on %I.implantacao_checklist
                    for each row execute function %I.fn_implantacao_checklist_concluido()', s, s);
  end loop;
end $$;

-- 3) View do painel: expõe reprovados/pendentes e ganha o status "Com reprovação".
--    Precisa de DROP + CREATE (CREATE OR REPLACE não aceita colunas novas no meio).
--    Nenhuma outra view depende desta — conferido antes de aplicar.
drop view if exists public.implantacao_painel;
create view public.implantacao_painel as
select i.id, i.empreendedora, i.empreendimento, i.tipo, i.sistemas, i.fase, i.link_sistema,
  i.unidades, i.previsao_lancamento, i.observacoes, i.documentacao_recebida_em, i.sla_dias_uteis,
  i.criado_em, i.atualizado_em,
  coalesce(ck.total, 0) as checklist_total,
  coalesce(ck.feitos, 0) as checklist_feitos,
  coalesce(ck.reprovados, 0) as checklist_reprovados,
  coalesce(ck.pendentes, 0) as checklist_pendentes,
  case when coalesce(ck.total, 0) = 0 then 0::numeric
       else round(100.0 * ck.feitos::numeric / ck.total::numeric) end as avanco_pct,
  coalesce(pd.abertas, 0) as pendencias_abertas,
  case
    when coalesce(ck.total, 0) > 0 and ck.feitos = ck.total then 'Concluído'
    when coalesce(ck.reprovados, 0) > 0 then 'Com reprovação'
    when coalesce(ck.feitos, 0) = 0 then 'Não iniciado'
    else 'Em andamento'
  end as status_auto,
  case
    when coalesce(ck.total, 0) > 0 and ck.feitos = ck.total then '✓ Concluído'
    when i.previsao_lancamento is null then '—'
    when (i.previsao_lancamento - current_date) < 28 then '🔴 Risco crítico'
    when (i.previsao_lancamento - current_date) < 42 then '🟠 Risco de atraso'
    when (i.previsao_lancamento - current_date) < 56 then '🟡 Atenção'
    else '🟢 No prazo'
  end as criticidade,
  i.previsao_lancamento - current_date as dias_para_lancamento
from public.implantacoes i
left join (
  select implantacao_id, count(*) as total,
    count(*) filter (where concluido) as feitos,
    count(*) filter (where status_validacao = 'Reprovado') as reprovados,
    count(*) filter (where status_validacao = 'Documentação pendente') as pendentes
  from public.implantacao_checklist group by implantacao_id) ck on ck.implantacao_id = i.id
left join (
  select implantacao_id, count(*) as abertas
  from public.implantacao_pendencias where not resolvida group by implantacao_id) pd on pd.implantacao_id = i.id;

alter view public.implantacao_painel set (security_invoker = true);
grant select on public.implantacao_painel to authenticated;
revoke all on public.implantacao_painel from anon;

-- Mesma view no ambiente de teste, com os nomes qualificados em staging
-- (ver corrigir_ambiente_staging_v2.sql sobre por que a qualificação é obrigatória).
drop view if exists staging.implantacao_painel;
create view staging.implantacao_painel as
select i.id, i.empreendedora, i.empreendimento, i.tipo, i.sistemas, i.fase, i.link_sistema,
  i.unidades, i.previsao_lancamento, i.observacoes, i.documentacao_recebida_em, i.sla_dias_uteis,
  i.criado_em, i.atualizado_em,
  coalesce(ck.total, 0) as checklist_total,
  coalesce(ck.feitos, 0) as checklist_feitos,
  coalesce(ck.reprovados, 0) as checklist_reprovados,
  coalesce(ck.pendentes, 0) as checklist_pendentes,
  case when coalesce(ck.total, 0) = 0 then 0::numeric
       else round(100.0 * ck.feitos::numeric / ck.total::numeric) end as avanco_pct,
  coalesce(pd.abertas, 0) as pendencias_abertas,
  case
    when coalesce(ck.total, 0) > 0 and ck.feitos = ck.total then 'Concluído'
    when coalesce(ck.reprovados, 0) > 0 then 'Com reprovação'
    when coalesce(ck.feitos, 0) = 0 then 'Não iniciado'
    else 'Em andamento'
  end as status_auto,
  case
    when coalesce(ck.total, 0) > 0 and ck.feitos = ck.total then '✓ Concluído'
    when i.previsao_lancamento is null then '—'
    when (i.previsao_lancamento - current_date) < 28 then '🔴 Risco crítico'
    when (i.previsao_lancamento - current_date) < 42 then '🟠 Risco de atraso'
    when (i.previsao_lancamento - current_date) < 56 then '🟡 Atenção'
    else '🟢 No prazo'
  end as criticidade,
  i.previsao_lancamento - current_date as dias_para_lancamento
from staging.implantacoes i
left join (
  select implantacao_id, count(*) as total,
    count(*) filter (where concluido) as feitos,
    count(*) filter (where status_validacao = 'Reprovado') as reprovados,
    count(*) filter (where status_validacao = 'Documentação pendente') as pendentes
  from staging.implantacao_checklist group by implantacao_id) ck on ck.implantacao_id = i.id
left join (
  select implantacao_id, count(*) as abertas
  from staging.implantacao_pendencias where not resolvida group by implantacao_id) pd on pd.implantacao_id = i.id;

alter view staging.implantacao_painel set (security_invoker = true);
grant select on staging.implantacao_painel to authenticated;
revoke all on staging.implantacao_painel from anon;

notify pgrst, 'reload schema';

-- =====================================================================
-- Testes feitos ao aplicar (schema staging, produto descartável):
--   4 itens Aprovados                 -> avanco 100%, status "Concluído"
--   1 deles Reprovado                 -> avanco  75%, status "Com reprovação"
--   1 deles "Em validação"            -> avanco  75%, status "Em andamento"
--   update direto concluido = true    -> revertido pela trigger (concluido volta a false)
-- =====================================================================
