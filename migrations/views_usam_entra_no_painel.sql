-- =====================================================================
-- Replica a regra "quem entra no painel" nos relatórios — 2026-08-02
-- =====================================================================
-- O Dashboard Executivo já usava analistas.entra_no_painel (ver
-- analistas_entra_no_painel.sql), mas o Dashboard antigo e os relatórios
-- continuavam filtrando `cargo = 'analista'` direto no SQL. Resultado: as
-- duas telas mostravam listas diferentes de colaboradores.
--
-- Estas 5 views passam a usar a mesma escolha da gestão:
--   evolucao_analista_mes · fds_solo · mix_atividade_analista
--   producao_analista_dia · ranking_analistas
--
-- Efeito colateral esperado e desejado: assistentes passam a contar em
-- capacidade real (fds_solo) e, por consequência, nas metas automáticas
-- (metas_fds deriva de fds_solo). Os números de meta mudam porque a base
-- de quem produz mudou.
-- =====================================================================

do $$
declare s text; v text; def text;
begin
  foreach s in array array['public','staging'] loop
    foreach v in array array['evolucao_analista_mes','fds_solo','mix_atividade_analista',
                             'producao_analista_dia','ranking_analistas'] loop
      select pg_get_viewdef(format('%I.%I', s, v)::regclass, true) into def;
      -- troca só a condição de cargo, preservando o resto da definição
      def := replace(def, 'an.cargo = ''analista''::text', 'an.entra_no_painel');
      def := replace(def, 'cargo = ''analista''::text', 'entra_no_painel');
      -- em staging, qualifica os nomes para a view não apontar para as tabelas de public
      if s = 'staging' then
        def := replace(def, 'public.', '');
        def := regexp_replace(def, '(^|[^.[:alnum:]_])(demandas|analistas|atividades|empreendedoras|empreendimentos|fds_solo)\y',
                              '\1staging.\2', 'g');
      end if;
      execute format('create or replace view %I.%I as %s', s, v, def);
      execute format('alter view %I.%I set (security_invoker = true)', s, v);
      execute format('revoke all on %I.%I from anon', s, v);
      execute format('grant select on %I.%I to authenticated', s, v);
    end loop;
  end loop;
end $$;

notify pgrst, 'reload schema';

-- =====================================================================
-- CONFERÊNCIA
-- =====================================================================
-- a) nenhuma view pode continuar filtrando por cargo (ideal: 0 linhas)
select c.relname as ainda_filtra_por_cargo
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','staging') and c.relkind='v'
  and pg_get_viewdef(c.oid, true) ilike '%cargo%analista%'
order by 1;

-- b) nenhuma view de teste pode apontar para tabela de produção (ideal: 0 linhas)
select distinct v.relname as view_de_teste, t.relname as tabela_de_producao
from pg_depend d
join pg_rewrite r on r.oid = d.objid
join pg_class v on v.oid = r.ev_class
join pg_namespace nv on nv.oid = v.relnamespace
join pg_class t on t.oid = d.refobjid
join pg_namespace nt on nt.oid = t.relnamespace
where nv.nspname='staging' and nt.nspname='public' and t.relkind in ('r','v') and t.relname <> v.relname;
