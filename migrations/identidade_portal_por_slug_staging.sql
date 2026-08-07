-- Link exclusivo por incorporadora pro Portal do Cliente (/portal/<slug>), pra tela de login já
-- mostrar a identidade visual dela (logo + cor) misturada com a da Neo Service, antes mesmo do
-- login. Aplicado por enquanto só no schema STAGING. Depois de aprovado, replicar em `public`.

alter table staging.empreendedoras add column if not exists slug text unique;
alter table staging.empreendedoras add column if not exists site text;

-- View pública e restrita: só 4 colunas não sensíveis (nada de dados de cliente/financeiro).
-- ATENÇÃO — isto é uma exceção deliberada à convenção do resto do sistema (todas as views têm
-- security_invoker=true e acesso negado a "anon", ver TRANSFERENCIA.md). Aqui o "anon" PRECISA
-- enxergar isso, porque é consultado ANTES do login (a pessoa ainda não tem sessão). O que essa
-- view expõe é equivalente ao que já fica visível a qualquer um que abra o link do portal daquela
-- incorporadora: nome e logo dela, nada além disso.
create or replace view staging.empreendedoras_marca as
select slug, nome, logo_path, cor_secundaria from staging.empreendedoras where slug is not null;

grant select on staging.empreendedoras_marca to anon, authenticated;
