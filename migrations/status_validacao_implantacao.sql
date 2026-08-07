-- Adiciona status detalhado (Pendente / Em validação / Recebido) às pendências de implantação
-- Aplicado em staging quando escrito; o bloco de produção abaixo ficou sem rodar até 2026-08-07
-- (achado ao auditar staging vs public antes de publicar em produção — nesse meio-tempo o código
-- do main já esperava essa coluna existir em public).

ALTER TABLE staging.implantacao_pendencias
ADD COLUMN IF NOT EXISTS status_validacao text NOT NULL DEFAULT 'Pendente'
CHECK (status_validacao IN ('Pendente','Em validação','Recebido'));

UPDATE staging.implantacao_pendencias
SET status_validacao = CASE WHEN resolvida THEN 'Recebido' ELSE 'Pendente' END;

-- Produção (rodar só depois de validar em staging)
ALTER TABLE public.implantacao_pendencias
ADD COLUMN IF NOT EXISTS status_validacao text NOT NULL DEFAULT 'Pendente'
CHECK (status_validacao IN ('Pendente','Em validação','Recebido'));

UPDATE public.implantacao_pendencias
SET status_validacao = CASE WHEN resolvida THEN 'Recebido' ELSE 'Pendente' END;
