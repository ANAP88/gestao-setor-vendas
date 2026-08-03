-- =====================================================================
-- IMPLANTAÇÃO — lista de status do checklist e regra de avanço
-- Aplicado em 2026-08-02 nos schemas public e staging.
-- =====================================================================
-- Pedido: ter uma lista de status por item (documentação recebida, sendo
-- validada, pendente, aprovado, reprovado) e garantir que o produto só
-- conte como concluído no dashboard — e só chegue a 100% de avanço —
-- quando TODOS os itens estiverem aprovados.
--
-- Antes: o avanço era "itens marcados / total", e o campo booleano
-- `concluido` podia divergir do `status_validacao` (eram atualizados
-- separadamente), então um produto podia aparecer como 100% concluído
-- com itens ainda em validação.
-- =====================================================================

-- 1) Nova lista de status, com migração dos valores antigos.
do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format($f$
      update %I.implantacao_checklist set status_validacao = case
        when status_validacao = 'Recebido'      then 'Documentação recebida'
        when status_validacao = 'Em validação'  then 'Documentação em validação'
        when status_validacao = 'Aprovado'      then 'Aprovado'
        when status_validacao = 'Reprovado'     then 'Reprovado'
        when status_validacao is null and concluido then 'Aprovado'
        else 'Documentação pendente'
      end$f$, s);

    execute format($f$alter table %I.implantacao_checklist
      alter column status_validacao set default 'Documentação pendente'$f$, s);
    execute format($f$update %I.implantacao_checklist set status_validacao = 'Documentação pendente'
      where status_validacao is null$f$, s);
    execute format($f$alter table %I.implantacao_checklist
      alter column status_validacao set not null$f$, s);

    execute format($f$alter table %I.implantacao_checklist
      drop constraint if exists implantacao_checklist_status_chk$f$, s);
    execute format($f$alter table %I.implantacao_checklist add constraint implantacao_checklist_status_chk
      check (status_validacao in ('Documentação pendente','Documentação recebida',
                                  'Documentação em validação','Aprovado','Reprovado'))$f$, s);
  end loop;
end $$;

-- 2) `concluido` passa a ser derivado do status — os dois nunca podem divergir.
create or replace function public.fn_implantacao_checklist_sync()
returns trigger language plpgsql set search_path = 'public' as $function$
begin
  new.concluido := (new.status_validacao = 'Aprovado');
  return new;
end $function$;

create or replace function staging.fn_implantacao_checklist_sync()
returns trigger language plpgsql set search_path = 'staging' as $function$
begin
  new.concluido := (new.status_validacao = 'Aprovado');
  return new;
end $function$;

do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format('drop trigger if exists trg_implantacao_checklist_sync on %I.implantacao_checklist', s);
    execute format('create trigger trg_implantacao_checklist_sync before insert or update
                    on %I.implantacao_checklist for each row execute function %I.fn_implantacao_checklist_sync()', s, s);
    -- reprocessa as linhas existentes para o booleano ficar coerente
    execute format('update %I.implantacao_checklist set status_validacao = status_validacao', s);
  end loop;
end $$;

-- 3) Painel: avanço ponderado pelo status, com teto de 99% enquanto houver
--    qualquer item não aprovado. Pesos: aprovado 1,0 · em validação 0,66 ·
--    recebida 0,33 · pendente e reprovado 0.
--    No item o status é "Reprovado"; no produto o rótulo é "Com reprovação"
--    (o produto não está reprovado, ele TEM item reprovado).
--    Rodar o bloco abaixo uma vez para cada schema, trocando <SCHEMA>.
--    (Aqui está escrito para public; a versão de staging é idêntica trocando
--     public. por staging. em todas as referências.)

create or replace view public.implantacao_painel as
select
  i.id, i.empreendedora, i.empreendimento, i.tipo, i.sistemas, i.fase, i.link_sistema,
  i.unidades, i.previsao_lancamento, i.observacoes, i.documentacao_recebida_em,
  i.sla_dias_uteis, i.criado_em, i.atualizado_em,
  coalesce(ck.total, 0)        as checklist_total,
  coalesce(ck.aprovados, 0)    as checklist_feitos,
  coalesce(ck.aprovados, 0)    as checklist_aprovados,
  coalesce(ck.reprovados, 0)   as checklist_reprovados,
  coalesce(ck.em_validacao, 0) as checklist_em_validacao,
  coalesce(ck.recebidos, 0)    as checklist_recebidos,
  coalesce(ck.pendentes, 0)    as checklist_pendentes,
  case
    when coalesce(ck.total, 0) = 0 then 0::numeric
    when ck.aprovados = ck.total then 100::numeric
    else least(99, round(100.0 * ck.peso / ck.total))
  end as avanco_pct,
  coalesce(pd.abertas, 0) as pendencias_abertas,
  case
    when coalesce(ck.total, 0) > 0 and ck.aprovados = ck.total then 'Concluído'
    when coalesce(ck.reprovados, 0) > 0 then 'Com reprovação'
    when coalesce(ck.peso, 0) = 0 then 'Não iniciado'
    else 'Em andamento'
  end as status_auto,
  case
    when coalesce(ck.total, 0) > 0 and ck.aprovados = ck.total then '✓ Concluído'
    when i.previsao_lancamento is null then '—'
    when (i.previsao_lancamento - current_date) < 28 then '🔴 Risco crítico'
    when (i.previsao_lancamento - current_date) < 42 then '🟠 Risco de atraso'
    when (i.previsao_lancamento - current_date) < 56 then '🟡 Atenção'
    else '🟢 No prazo'
  end as criticidade,
  i.previsao_lancamento - current_date as dias_para_lancamento
from public.implantacoes i
left join (
  select implantacao_id,
    count(*) as total,
    count(*) filter (where status_validacao = 'Aprovado')                  as aprovados,
    count(*) filter (where status_validacao = 'Reprovado')                 as reprovados,
    count(*) filter (where status_validacao = 'Documentação em validação') as em_validacao,
    count(*) filter (where status_validacao = 'Documentação recebida')     as recebidos,
    count(*) filter (where status_validacao = 'Documentação pendente')     as pendentes,
    sum(case status_validacao
          when 'Aprovado' then 1.0
          when 'Documentação em validação' then 0.66
          when 'Documentação recebida' then 0.33
          else 0 end) as peso
  from public.implantacao_checklist group by implantacao_id
) ck on ck.implantacao_id = i.id
left join (
  select implantacao_id, count(*) as abertas
  from public.implantacao_pendencias where not resolvida group by implantacao_id
) pd on pd.implantacao_id = i.id;

alter view public.implantacao_painel set (security_invoker = true);
revoke all on public.implantacao_painel from anon;
grant select on public.implantacao_painel to authenticated;

notify pgrst, 'reload schema';

-- =====================================================================
-- CONFERÊNCIA (feita ao aplicar, com um produto de 4 itens em staging)
--   3 aprovados + 1 em validação -> 92%  · Em andamento     (não fecha)
--   3 aprovados + 1 reprovado    -> 75%  · Com reprovação   (não fecha)
--   4 aprovados                  -> 100% · Concluído        (fecha)
-- =====================================================================
