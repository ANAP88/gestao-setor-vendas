-- =====================================================================
-- CORREÇÃO DO AMBIENTE DE TESTE (schema staging) — v2, aplicada 2026-08-02
-- =====================================================================
-- Substitui corrigir_ambiente_staging.sql. Mesma finalidade, com duas
-- correções importantes descobertas ao aplicar de verdade:
--
-- 1) O staging estava com 0 de 51 chaves estrangeiras. Sem elas o PostgREST
--    não resolve os joins do tipo demandas -> analistas(nome) e as telas de
--    Produção e Dashboard quebram com:
--       "Could not find a relationship between 'demandas' and 'analistas'"
--
-- 2) A versão anterior recriava as views fazendo replace('public.','staging.')
--    na definição. Isso NÃO funciona: pg_get_viewdef devolve os nomes de
--    tabela SEM o prefixo de schema, então o replace não encontrava nada e as
--    views de staging nasciam ligadas às tabelas de public — ou seja, o
--    "ambiente de teste" exibia dados de PRODUÇÃO. Confiar em search_path
--    também não resolveu. A correção é qualificar cada nome explicitamente.
--
-- Seguro rodar mais de uma vez. Não altera produção.
-- =====================================================================

-- PARTE 1 — chaves primárias e de unicidade (precisam vir antes das FKs)
DO $$
DECLARE c record; definicao text;
BEGIN
  FOR c IN
    SELECT con.conname AS nome, cl.relname AS tabela,
           pg_get_constraintdef(con.oid, true) AS def
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND con.contype IN ('p','u') AND cl.relkind = 'r'
    ORDER BY con.contype DESC, cl.relname
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class cl2 JOIN pg_namespace n2 ON n2.oid = cl2.relnamespace
                   WHERE n2.nspname='staging' AND cl2.relname=c.tabela AND cl2.relkind='r') THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint con2 JOIN pg_class cl2 ON cl2.oid=con2.conrelid
               JOIN pg_namespace n2 ON n2.oid=cl2.relnamespace
               WHERE n2.nspname='staging' AND cl2.relname=c.tabela
                 AND pg_get_constraintdef(con2.oid,true)=c.def) THEN CONTINUE; END IF;
    definicao := replace(c.def, 'public.', 'staging.');
    BEGIN
      EXECUTE format('ALTER TABLE staging.%I ADD CONSTRAINT %I %s', c.tabela, 'stg_'||c.nome, definicao);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'FALHOU chave em staging.% (%): %', c.tabela, c.def, SQLERRM;
    END;
  END LOOP;
END $$;

-- PARTE 2 — chaves estrangeiras (é o que o PostgREST usa para os joins)
DO $$
DECLARE c record; definicao text;
BEGIN
  FOR c IN
    SELECT con.conname AS nome, cl.relname AS tabela, pg_get_constraintdef(con.oid, true) AS def
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND con.contype = 'f' AND cl.relkind = 'r'
    ORDER BY cl.relname
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class cl2 JOIN pg_namespace n2 ON n2.oid = cl2.relnamespace
                   WHERE n2.nspname='staging' AND cl2.relname=c.tabela AND cl2.relkind='r') THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint con2 JOIN pg_class cl2 ON cl2.oid=con2.conrelid
               JOIN pg_namespace n2 ON n2.oid=cl2.relnamespace
               WHERE n2.nspname='staging' AND cl2.relname=c.tabela AND con2.contype='f'
                 AND pg_get_constraintdef(con2.oid,true)=replace(c.def,'public.','staging.')) THEN CONTINUE; END IF;
    definicao := replace(c.def, 'public.', 'staging.');
    BEGIN
      -- NOT VALID: a chave passa a existir sem travar em dados históricos inconsistentes.
      EXECUTE format('ALTER TABLE staging.%I ADD CONSTRAINT %I %s NOT VALID', c.tabela, 'stg_'||c.nome, definicao);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'FALHOU FK em staging.% (%): %', c.tabela, c.def, SQLERRM;
    END;
  END LOOP;
END $$;

-- PARTE 3 — permissões
GRANT USAGE ON SCHEMA staging TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA staging TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA staging TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA staging FROM anon;

-- PARTE 4 — views, com os nomes de tabela qualificados explicitamente
DO $$
DECLARE v record;
BEGIN
  FOR v IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='staging' AND c.relkind IN ('v','m')
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS staging.%I CASCADE', v.relname);
  END LOOP;
END $$;

DO $$
DECLARE v record; obj record; def text; passada int; criadas int;
BEGIN
  FOR passada IN 1..5 LOOP
    criadas := 0;
    FOR v IN
      SELECT c.relname AS nome, pg_get_viewdef(c.oid, true) AS definicao
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
        AND NOT EXISTS (SELECT 1 FROM pg_class c2 JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
                        WHERE n2.nspname='staging' AND c2.relname=c.relname AND c2.relkind IN ('v','m'))
      ORDER BY c.relname
    LOOP
      def := replace(v.definicao, 'public.', '');
      -- Da maior para a menor, para "empreendimentos" não ser quebrado por "empreendedoras".
      FOR obj IN
        SELECT c.relname AS nome FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='staging' AND c.relkind IN ('r','v','m')
        ORDER BY length(c.relname) DESC
      LOOP
        def := regexp_replace(def, '(^|[^.[:alnum:]_])' || obj.nome || '\y', '\1staging.' || obj.nome, 'g');
      END LOOP;
      BEGIN
        EXECUTE format('CREATE VIEW staging.%I AS %s', v.nome, def);
        -- security_invoker: a view respeita o RLS de quem consulta, não o do dono.
        EXECUTE format('ALTER VIEW staging.%I SET (security_invoker = true)', v.nome);
        EXECUTE format('GRANT SELECT ON staging.%I TO authenticated', v.nome);
        EXECUTE format('REVOKE ALL ON staging.%I FROM anon', v.nome);
        criadas := criadas + 1;
      EXCEPTION WHEN OTHERS THEN
        IF passada = 5 THEN RAISE WARNING 'FALHOU view staging.%: %', v.nome, SQLERRM; END IF;
      END LOOP;
    END LOOP;
    EXIT WHEN criadas = 0;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- =====================================================================
-- CONFERÊNCIA
-- =====================================================================
-- a) chaves: staging deve empatar com public
SELECT con.contype::text AS tipo,
       count(*) FILTER (WHERE ns.nspname='public')  AS em_producao,
       count(*) FILTER (WHERE ns.nspname='staging') AS em_teste
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE ns.nspname IN ('public','staging') AND con.contype IN ('p','u','f') AND cl.relkind='r'
GROUP BY 1 ORDER BY 1;

-- b) nenhuma view de staging pode depender de tabela de public (ideal: 0 linhas)
SELECT DISTINCT v.relname AS view_de_teste, t.relname AS tabela_de_producao
FROM pg_depend d
JOIN pg_rewrite r ON r.oid = d.objid
JOIN pg_class v ON v.oid = r.ev_class
JOIN pg_namespace nv ON nv.oid = v.relnamespace
JOIN pg_class t ON t.oid = d.refobjid
JOIN pg_namespace nt ON nt.oid = t.relnamespace
WHERE nv.nspname='staging' AND nt.nspname='public' AND t.relkind IN ('r','v') AND t.relname <> v.relname;
