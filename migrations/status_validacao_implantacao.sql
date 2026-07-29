-- Adiciona status detalhado (Pendente / Em validação / Recebido) às pendências de implantação
-- Rodar no schema staging primeiro, depois no public quando validado.

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
