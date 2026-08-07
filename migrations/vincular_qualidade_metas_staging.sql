-- Vincula Qualidade/Retrabalho (apontamentos_erro) e Produção (esteira_processos) à base de
-- Metas & Indicadores, por analista e por indicador — em vez de digitar quantidade_processos e
-- quantidade_erros manualmente todo mês em meta_colaborador_mensal.
--
-- Aplicado primeiro no schema STAGING para validação, replicado em `public` em 2026-08-07.
--
-- Escopo (revisado): quantidade_erros é SEMPRE automática, para qualquer um dos 6 indicadores —
-- basta o admin marcar o indicador ao registrar o apontamento (cliente ou validação interna) que
-- ele já conta na meta. quantidade_processos só é automática para os indicadores que têm uma
-- fonte de dado real e inequívoca no sistema hoje (por ora, "Emissão de contrato sem erro" e
-- "Emissão de contrato no prazo (1 dia)", ligados a esteira_tipo = 'emissao_contrato'); nos outros
-- 4 indicadores (SLA de respostas, Pós-Assinatura, Mapeamento de processos, Reclamações), a
-- quantidade de processos continua sendo lançada manualmente em "Lançar resultado individual" —
-- não existe hoje uma tabela de origem no sistema para contar isso sozinho.

-- 1) indicadores_kpi ganha um vínculo opcional com o tipo de esteira que alimenta sua contagem
--    automática de processos. NULL = indicador sem fonte automática, continua 100% manual.
alter table staging.indicadores_kpi add column if not exists esteira_tipo text;

update staging.indicadores_kpi set esteira_tipo = 'emissao_contrato'
where nome in ('Emissão de contrato sem erro', 'Emissão de contrato no prazo (1 dia)');

-- 2) apontamentos_erro ganha o vínculo direto com o indicador que ele afeta. Preenchido no
--    formulário de "Registrar apontamento" a partir de agora; NULL = apontamento antigo ou não
--    associado a nenhum indicador automático (não entra na contagem automática).
alter table staging.apontamentos_erro
  add column if not exists indicador_id uuid references staging.indicadores_kpi(id);

-- Backfill best-effort: apontamentos já existentes cujo processo (demanda) tem atividade com
-- "contrat" no nome viram "Emissão de contrato sem erro". O resto fica sem indicador (ajustável
-- manualmente depois).
update staging.apontamentos_erro ae
set indicador_id = (select id from staging.indicadores_kpi where nome = 'Emissão de contrato sem erro')
from staging.demandas d
join staging.atividades at on at.id = d.atividade_id
where ae.demanda_id = d.id
  and ae.indicador_id is null
  and at.nome ilike '%contrat%';

-- 3) Função central: recalcula quantidade_processos/quantidade_erros de UM analista + UM
--    indicador + UM mês, a partir dos dados reais, e grava (upsert) em meta_colaborador_mensal.
--    Erros: sempre automático, pra qualquer indicador. Processos: automático só quando o
--    indicador tem esteira_tipo; nos demais, preserva o valor já lançado manualmente (não zera).
create or replace function staging.recalcular_meta_colaborador_mensal(
  p_analista_id uuid, p_indicador_id uuid, p_mes date
) returns void language plpgsql as $$
declare
  v_esteira_tipo text;
  v_processos int;
  v_erros int := 0;
begin
  if p_analista_id is null or p_indicador_id is null or p_mes is null then return; end if;

  select esteira_tipo into v_esteira_tipo from staging.indicadores_kpi where id = p_indicador_id;

  select count(*) into v_erros from staging.apontamentos_erro
  where analista_id = p_analista_id and indicador_id = p_indicador_id
    and criado_em >= p_mes and criado_em < (p_mes + interval '1 month');

  if v_esteira_tipo is not null then
    select count(*) into v_processos from staging.esteira_processos
    where esteira_tipo = v_esteira_tipo and analista_atual_id = p_analista_id
      and status = 'CONCLUIDO' and concluido_em >= p_mes and concluido_em < (p_mes + interval '1 month');
  else
    select quantidade_processos into v_processos from staging.meta_colaborador_mensal
    where analista_id = p_analista_id and indicador_id = p_indicador_id and mes = p_mes;
    v_processos := coalesce(v_processos, 0);
  end if;

  insert into staging.meta_colaborador_mensal (analista_id, indicador_id, mes, quantidade_processos, quantidade_erros)
  values (p_analista_id, p_indicador_id, p_mes, v_processos, v_erros)
  on conflict (analista_id, indicador_id, mes)
  do update set quantidade_processos = excluded.quantidade_processos,
                quantidade_erros = excluded.quantidade_erros,
                atualizado_em = now();
end;
$$;

-- 4) Trigger em apontamentos_erro: toda vez que um apontamento (cliente OU validação interna) é
--    criado, editado ou apagado, recalcula na hora o mês/analista/indicador afetado.
create or replace function staging.trg_apontamento_erro_sync_meta()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    perform staging.recalcular_meta_colaborador_mensal(OLD.analista_id, OLD.indicador_id, date_trunc('month', OLD.criado_em)::date);
    return OLD;
  end if;

  perform staging.recalcular_meta_colaborador_mensal(NEW.analista_id, NEW.indicador_id, date_trunc('month', NEW.criado_em)::date);

  if TG_OP = 'UPDATE' and (
    OLD.analista_id is distinct from NEW.analista_id
    or OLD.indicador_id is distinct from NEW.indicador_id
    or OLD.criado_em is distinct from NEW.criado_em
  ) then
    perform staging.recalcular_meta_colaborador_mensal(OLD.analista_id, OLD.indicador_id, date_trunc('month', OLD.criado_em)::date);
  end if;

  return NEW;
end;
$$;

drop trigger if exists apontamento_erro_sync_meta on staging.apontamentos_erro;
create trigger apontamento_erro_sync_meta
after insert or update or delete on staging.apontamentos_erro
for each row execute function staging.trg_apontamento_erro_sync_meta();

-- 5) Trigger em esteira_processos: toda vez que um processo de emissão de contrato é concluído
--    (ou tem status/responsável/data de conclusão alterados), recalcula quantidade_processos do
--    analista responsável, para cada indicador ligado a esse esteira_tipo.
create or replace function staging.trg_esteira_processo_sync_meta()
returns trigger language plpgsql as $$
declare
  v_ind record;
begin
  for v_ind in select id from staging.indicadores_kpi where esteira_tipo = coalesce(NEW.esteira_tipo, OLD.esteira_tipo)
  loop
    if NEW.status = 'CONCLUIDO' and NEW.concluido_em is not null and NEW.analista_atual_id is not null then
      perform staging.recalcular_meta_colaborador_mensal(NEW.analista_atual_id, v_ind.id, date_trunc('month', NEW.concluido_em)::date);
    end if;
    if TG_OP = 'UPDATE' and OLD.status = 'CONCLUIDO' and OLD.concluido_em is not null and OLD.analista_atual_id is not null
       and (OLD.analista_atual_id is distinct from NEW.analista_atual_id
            or OLD.concluido_em is distinct from NEW.concluido_em
            or OLD.status is distinct from NEW.status) then
      perform staging.recalcular_meta_colaborador_mensal(OLD.analista_atual_id, v_ind.id, date_trunc('month', OLD.concluido_em)::date);
    end if;
  end loop;
  return NEW;
end;
$$;

drop trigger if exists esteira_processo_sync_meta on staging.esteira_processos;
create trigger esteira_processo_sync_meta
after insert or update on staging.esteira_processos
for each row execute function staging.trg_esteira_processo_sync_meta();

-- 6) Sincronização inicial: recalcula todos os meses de 2026 pra quem já tem meta configurada
--    (meta_colaborador_indicador) num indicador com esteira_tipo — popula o histórico existente
--    de uma vez, sem esperar um novo apontamento/conclusão pra "ativar" o mês.
do $$
declare
  r record;
  m date;
begin
  for r in
    select distinct mci.analista_id, mci.indicador_id
    from staging.meta_colaborador_indicador mci
    join staging.indicadores_kpi ik on ik.id = mci.indicador_id
    where ik.esteira_tipo is not null
  loop
    for m in select generate_series('2026-01-01'::date, '2026-12-01'::date, interval '1 month')::date
    loop
      perform staging.recalcular_meta_colaborador_mensal(r.analista_id, r.indicador_id, m);
    end loop;
  end loop;
end $$;
