-- Corrige o perfil de teste do Portal do Incorporador no ambiente STAGING
-- Sintoma: login funciona, mas o sistema recusa com "Este acesso é exclusivo para clientes do Portal"
-- Causa: staging.perfis não tem esse usuário com role='cliente' vinculado à empreendedora certa
-- (staging é uma cópia diária da produção, então pode ter ficado desatualizado ou nunca foi criado lá)

-- 1) Ver o estado atual (rode antes, só para conferir)
SELECT user_id, email, role, empreendedora_id, ativo
FROM staging.perfis
WHERE email = 'patysilva285@gmail.com';

-- 2) Ver o id da empreendedora "Sdi" no staging (para confirmar o vínculo certo)
SELECT id, nome FROM staging.empreendedoras WHERE nome ILIKE '%sdi%';

-- 3) Corrige o perfil: garante role='cliente', ativo=true e vincula à empreendedora Sdi
UPDATE staging.perfis
SET role = 'cliente',
    ativo = true,
    empreendedora_id = (SELECT id FROM staging.empreendedoras WHERE nome ILIKE '%sdi%' LIMIT 1)
WHERE email = 'patysilva285@gmail.com';

-- 4) Confirma que ficou certo
SELECT user_id, email, role, empreendedora_id, ativo
FROM staging.perfis
WHERE email = 'patysilva285@gmail.com';
