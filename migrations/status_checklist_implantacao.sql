-- Adiciona status detalhado (Recebido / Em validação / Aprovado) aos itens do checklist de implantação.
-- O item só conta como "feito" (concluido=true) quando status_validacao = 'Aprovado' — a view
-- implantacao_painel já calcula avanco_pct e status_auto='Concluído' em cima da coluna concluido,
-- então não precisou mudar a view, só manter as duas colunas sincronizadas pelo app.

ALTER TABLE staging.implantacao_checklist
ADD COLUMN IF NOT EXISTS status_validacao text NOT NULL DEFAULT 'Recebido'
CHECK (status_validacao IN ('Recebido','Em validação','Aprovado'));

UPDATE staging.implantacao_checklist
SET status_validacao = CASE WHEN concluido THEN 'Aprovado' ELSE 'Recebido' END;

ALTER TABLE public.implantacao_checklist
ADD COLUMN IF NOT EXISTS status_validacao text NOT NULL DEFAULT 'Recebido'
CHECK (status_validacao IN ('Recebido','Em validação','Aprovado'));

UPDATE public.implantacao_checklist
SET status_validacao = CASE WHEN concluido THEN 'Aprovado' ELSE 'Recebido' END;
