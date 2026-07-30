-- =====================================================================
-- CORREÇÃO DO AMBIENTE DE TESTE (schema staging)
-- =====================================================================
-- Contexto: o espelhamento diário copia os DADOS de public -> staging,
-- mas não recria chaves (primárias/estrangeiras), views nem permissões.
-- Resultado no ambiente de teste:
--   * Produção (Pipeline) mostra "0 registros" mesmo com dados
--   * Dashboard/Insights/Analytics/Implantação aparecem zerados
--   * Qualidade/Retrabalho dá erro 403 em exclusões pendentes
--
-- Este script lê a estrutura real da produção (public) e replica em staging,
-- na ordem correta: primeiro chaves primárias, depois estrangeiras.
--
-- É seguro rodar mais de uma vez (idempotente) e NÃO altera produção.
-- Se um item falhar, ele avisa e continua com os demais.
-- Rodar no SQL Editor do Supabase e conferir a PARTE 5 no final.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PARTE 1 — Chaves primárias e restrições de unicidade
-- ---------------------------------------------------------------------
-- Precisa vir antes das estrangeiras: não existe chave estrangeira
-- apontando para uma tabela que não tem chave primária.

DO $$
DECLARE
  c record;
  definicao text;
BEGIN
  FOR c IN
    SELECT con.conname AS nome,
           cl.relname  AS tabela,
           pg_get_constraintdef(con.oid, true) AS def,
           con.contype  AS tipo
    FROM pg_constraint con
    JOIN pg_class cl     ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public'
      AND con.contype IN ('p','u')          -- primary key, unique
      AND cl.relkind = 'r'                  -- só tabelas comuns
    ORDER BY con.contype DESC, cl.relname   -- 'p' antes de 'u'
  LOOP
    -- a tabela existe em staging?
    IF NOT EXISTS (
      SELECT 1 FROM pg_class cl2 JOIN pg_namespace n2 ON n2.oid = cl2.relnamespace
      WHERE n2.nspname = 'staging' AND cl2.relname = c.tabela AND cl2.relkind = 'r'
    ) THEN
      CONTINUE;
    END IF;

    -- já tem uma restrição equivalente? (mesma definição, qualquer nome)
    IF EXISTS (
      SELECT 1
      FROM pg_constraint con2
      JOIN pg_class cl2     ON cl2.oid = con2.conrelid
      JOIN pg_namespace n2  ON n2.oid = cl2.relnamespace
      WHERE n2.nspname = 'staging'
        AND cl2.relname = c.tabela
        AND pg_get_constraintdef(con2.oid, true) = c.def
    ) THEN
      CONTINUE;
    END IF;

    definicao := replace(c.def, 'public.', 'staging.');
    BEGIN
      EXECUTE format('ALTER TABLE staging.%I ADD CONSTRAINT %I %s',
                     c.tabela, 'stg_' || c.nome, definicao);
      RAISE NOTICE 'OK  chave criada: staging.% -> %', c.tabela, c.def;
    EXCEPTION WHEN OTHERS THEN
      -- causa comum: dados duplicados na cópia impedem a chave
      RAISE WARNING 'FALHOU chave em staging.% (%): %', c.tabela, c.def, SQLERRM;
    END;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- PARTE 2 — Chaves estrangeiras
-- ---------------------------------------------------------------------
-- São elas que fazem a tela de Produção conseguir buscar o nome do
-- analista/empreendedora/empreendimento junto com o processo.
-- O search_path aponta para staging, então as referências resolvem lá.

DO $$
DECLARE
  c record;
  definicao text;
BEGIN
  FOR c IN
    SELECT con.conname AS nome,
           cl.relname  AS tabela,
           pg_get_constraintdef(con.oid, true) AS def
    FROM pg_constraint con
    JOIN pg_class cl     ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public'
      AND con.contype = 'f'
      AND cl.relkind = 'r'
    ORDER BY cl.relname
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class cl2 JOIN pg_namespace n2 ON n2.oid = cl2.relnamespace
      WHERE n2.nspname = 'staging' AND cl2.relname = c.tabela AND cl2.relkind = 'r'
    ) THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_constraint con2
      JOIN pg_class cl2    ON cl2.oid = con2.conrelid
      JOIN pg_namespace n2 ON n2.oid = cl2.relnamespace
      WHERE n2.nspname = 'staging'
        AND cl2.relname = c.tabela
        AND con2.contype = 'f'
        AND pg_get_constraintdef(con2.oid, true) = replace(c.def, 'public.', 'staging.')
    ) THEN
      CONTINUE;
    END IF;

    definicao := replace(c.def, 'public.', 'staging.');
    BEGIN
      -- NOT VALID: cria a chave sem travar em dados históricos inconsistentes.
      -- O importante aqui é a chave EXISTIR (é o que o PostgREST usa para os joins).
      EXECUTE format('SET LOCAL search_path = staging, public');
      EXECUTE format('ALTER TABLE staging.%I ADD CONSTRAINT %I %s NOT VALID',
                     c.tabela, 'stg_' || c.nome, definicao);
      RAISE NOTICE 'OK  FK criada: staging.% -> %', c.tabela, c.def;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'FALHOU FK em staging.% (%): %', c.tabela, c.def, SQLERRM;
    END;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- PARTE 3 — Permissões
-- ---------------------------------------------------------------------
-- Usuário logado (authenticated) precisa ler/escrever; anônimo, nada.

GRANT USAGE ON SCHEMA staging TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA staging TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA staging TO authenticated;

-- tabelas futuras já nascem com a permissão correta
ALTER DEFAULT PRIVILEGES IN SCHEMA staging
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- mesmo padrão de segurança da produção: anônimo não lê nada
REVOKE ALL ON ALL TABLES IN SCHEMA staging FROM anon;


-- ---------------------------------------------------------------------
-- PARTE 4 — Views (relatórios)
-- ---------------------------------------------------------------------
-- Recria em staging cada view que existe em public, apontando para as
-- tabelas de staging. Repete algumas vezes porque uma view pode depender
-- de outra que ainda não foi criada.

DO $$
DECLARE
  v record;
  nova_def text;
  passada int;
  criadas int;
BEGIN
  FOR passada IN 1..4 LOOP
    criadas := 0;
    FOR v IN
      SELECT c.relname AS nome, pg_get_viewdef(c.oid, true) AS definicao
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('v','m')
        AND NOT EXISTS (
          SELECT 1 FROM pg_class c2 JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
          WHERE n2.nspname = 'staging' AND c2.relname = c.relname AND c2.relkind IN ('v','m')
        )
      ORDER BY c.relname
    LOOP
      nova_def := replace(v.definicao, 'public.', 'staging.');
      BEGIN
        EXECUTE format('CREATE OR REPLACE VIEW staging.%I AS %s', v.nome, nova_def);
        EXECUTE format('ALTER VIEW staging.%I SET (security_invoker = true)', v.nome);
        EXECUTE format('GRANT SELECT ON staging.%I TO authenticated', v.nome);
        EXECUTE format('REVOKE ALL ON staging.%I FROM anon', v.nome);
        criadas := criadas + 1;
        RAISE NOTICE 'OK  view criada: staging.%', v.nome;
      EXCEPTION WHEN OTHERS THEN
        IF passada = 4 THEN
          RAISE WARNING 'FALHOU view staging.%: %', v.nome, SQLERRM;
        END IF;
      END;
    END LOOP;
    EXIT WHEN criadas = 0;   -- nada novo nesta passada: acabou
  END LOOP;
END $$;


-- =====================================================================
-- PARTE 5 — CONFERÊNCIA (o resultado destas consultas é o que importa)
-- =====================================================================

-- 5a) Comparativo geral: os números de staging devem ficar próximos de public
SELECT 'chaves primarias' AS item,
       count(*) FILTER (WHERE ns.nspname='public')  AS em_producao,
       count(*) FILTER (WHERE ns.nspname='staging') AS em_teste
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE ns.nspname IN ('public','staging') AND con.contype = 'p'
UNION ALL
SELECT 'chaves estrangeiras',
       count(*) FILTER (WHERE ns.nspname='public'),
       count(*) FILTER (WHERE ns.nspname='staging')
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE ns.nspname IN ('public','staging') AND con.contype = 'f'
UNION ALL
SELECT 'views (relatorios)',
       count(*) FILTER (WHERE n.nspname='public'),
       count(*) FILTER (WHERE n.nspname='staging')
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public','staging') AND c.relkind IN ('v','m');

-- 5b) Views que ainda faltam em staging (ideal: nenhuma linha)
SELECT c.relname AS view_ainda_faltando
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c2 JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
    WHERE n2.nspname = 'staging' AND c2.relname = c.relname AND c2.relkind IN ('v','m')
  )
ORDER BY 1;

-- 5c) As chaves estrangeiras da tela de Produção existem? (esperado: 4 linhas)
SELECT con.conname AS chave, pg_get_constraintdef(con.oid, true) AS definicao
FROM pg_constraint con
JOIN pg_class cl ON cl.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cl.relnamespace
WHERE ns.nspname = 'staging' AND cl.relname = 'demandas' AND con.contype = 'f'
ORDER BY 1;
