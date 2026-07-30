-- =====================================================================
-- CORREÇÃO DO AMBIENTE DE TESTE (schema staging)
-- =====================================================================
-- Contexto: o espelhamento diário copia os DADOS de public -> staging,
-- mas não recria chaves estrangeiras, views nem permissões. Resultado:
--   * Produção (Pipeline) mostra "0 registros" mesmo com dados
--   * Dashboard/Insights/Analytics/Implantação aparecem zerados
--   * Qualidade/Retrabalho dá erro 403 em exclusões pendentes
--
-- Este script corrige tudo isso. Rodar no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez (idempotente).
-- NÃO altera nada em produção (public) — só o schema staging.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PARTE 1 — Chaves estrangeiras faltantes
-- ---------------------------------------------------------------------
-- Sem estas FKs, o PostgREST não consegue fazer os "joins" que a tela de
-- Produção usa (erro PGRST200), e a lista vem vazia silenciosamente.

DO $$
BEGIN
  -- demandas -> analistas
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_demandas_analista_id_fkey') THEN
    ALTER TABLE staging.demandas
      ADD CONSTRAINT staging_demandas_analista_id_fkey
      FOREIGN KEY (analista_id) REFERENCES staging.analistas(id);
  END IF;

  -- demandas -> empreendedoras
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_demandas_empreendedora_id_fkey') THEN
    ALTER TABLE staging.demandas
      ADD CONSTRAINT staging_demandas_empreendedora_id_fkey
      FOREIGN KEY (empreendedora_id) REFERENCES staging.empreendedoras(id);
  END IF;

  -- demandas -> empreendimentos
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_demandas_empreendimento_id_fkey') THEN
    ALTER TABLE staging.demandas
      ADD CONSTRAINT staging_demandas_empreendimento_id_fkey
      FOREIGN KEY (empreendimento_id) REFERENCES staging.empreendimentos(id);
  END IF;

  -- demandas -> atividades
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_demandas_atividade_id_fkey') THEN
    ALTER TABLE staging.demandas
      ADD CONSTRAINT staging_demandas_atividade_id_fkey
      FOREIGN KEY (atividade_id) REFERENCES staging.atividades(id);
  END IF;

  -- esteira_processos -> analistas (não quebra tela hoje, mas alinha com produção)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staging_esteira_processos_analista_atual_id_fkey') THEN
    ALTER TABLE staging.esteira_processos
      ADD CONSTRAINT staging_esteira_processos_analista_atual_id_fkey
      FOREIGN KEY (analista_atual_id) REFERENCES staging.analistas(id);
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- PARTE 2 — Permissões faltantes
-- ---------------------------------------------------------------------
-- Garante que o papel "authenticated" (usuário logado) consegue ler/escrever
-- nas tabelas do staging, como já acontece em produção.

GRANT USAGE ON SCHEMA staging TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA staging TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA staging TO authenticated;

-- Tabelas criadas no futuro já nascem com a permissão certa
ALTER DEFAULT PRIVILEGES IN SCHEMA staging
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA staging
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- O papel "anon" (não logado) NÃO deve ler nada — mantém o mesmo padrão de segurança de produção
REVOKE ALL ON ALL TABLES IN SCHEMA staging FROM anon;


-- ---------------------------------------------------------------------
-- PARTE 3 — Views analíticas faltantes
-- ---------------------------------------------------------------------
-- Recria em staging todas as views que existem em public, apontando para as
-- tabelas de staging. Faz isso automaticamente: lê a definição da view em
-- public e troca as referências "public." por "staging.".
--
-- Views afetadas (as que estavam dando 404):
--   ranking_analistas, producao_diaria, producao_analista_dia, fds_solo,
--   implantacao_painel, alerta_hoje, insights_sla, evolucao_analista_mes,
--   tempo_por_atividade, mix_atividade_analista, empreendedora_mes,
--   top_empreendedoras, volume_atividades, metas_fds, cartorios, prefeituras

DO $$
DECLARE
  v record;
  nova_def text;
BEGIN
  FOR v IN
    SELECT c.relname AS nome, pg_get_viewdef(c.oid, true) AS definicao
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')   -- views e materialized views
    ORDER BY c.relname
  LOOP
    -- aponta a view para as tabelas do staging
    nova_def := replace(v.definicao, 'public.', 'staging.');

    BEGIN
      EXECUTE format('CREATE OR REPLACE VIEW staging.%I AS %s', v.nome, nova_def);
      -- mesmo padrão de segurança das views de produção
      EXECUTE format('ALTER VIEW staging.%I SET (security_invoker = true)', v.nome);
      EXECUTE format('GRANT SELECT ON staging.%I TO authenticated', v.nome);
      EXECUTE format('REVOKE ALL ON staging.%I FROM anon', v.nome);
      RAISE NOTICE 'View recriada: staging.%', v.nome;
    EXCEPTION WHEN OTHERS THEN
      -- se uma view depender de algo que não existe em staging, avisa e segue
      RAISE WARNING 'Não foi possível criar staging.%: %', v.nome, SQLERRM;
    END;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- PARTE 4 — Conferência
-- ---------------------------------------------------------------------
-- Rode estas consultas depois para confirmar que deu tudo certo.

-- 4a) As chaves estrangeiras existem agora?
SELECT conname AS chave_estrangeira
FROM pg_constraint
WHERE conname LIKE 'staging_%_fkey'
ORDER BY conname;

-- 4b) Quantas views existem em cada schema? (os números devem ser próximos)
SELECT n.nspname AS schema, count(*) AS total_views
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public','staging') AND c.relkind IN ('v','m')
GROUP BY n.nspname;

-- 4c) Views que existem em public mas ainda faltam em staging (ideal: nenhuma linha)
SELECT c.relname AS view_faltando_em_staging
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c2 JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
    WHERE n2.nspname = 'staging' AND c2.relname = c.relname AND c2.relkind IN ('v','m')
  )
ORDER BY c.relname;
