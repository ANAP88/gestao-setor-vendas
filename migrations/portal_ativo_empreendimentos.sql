-- Adiciona campo portal_ativo aos empreendimentos para controlar acesso ao Portal do Cliente

-- Schema PUBLIC
ALTER TABLE public.empreendimentos
ADD COLUMN portal_ativo BOOLEAN DEFAULT FALSE;

-- Schema STAGING
ALTER TABLE staging.empreendimentos
ADD COLUMN portal_ativo BOOLEAN DEFAULT FALSE;

-- Cria índice para melhor performance ao filtrar empreendimentos por portal
CREATE INDEX idx_empreendimentos_portal_ativo ON public.empreendimentos(portal_ativo);
CREATE INDEX idx_staging_empreendimentos_portal_ativo ON staging.empreendimentos(portal_ativo);
