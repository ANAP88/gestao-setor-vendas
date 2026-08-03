-- =====================================================================
-- Quem entra no Dashboard Executivo — 2026-08-02 (public e staging)
-- =====================================================================
-- Antes, a Produtividade por analista e o Ranking do Executivo listavam
-- apenas quem tinha `cargo = 'analista'`. Com isso, assistentes que operam
-- processos (Douglas Lima, Regina) ficavam de fora do painel sem que
-- houvesse como incluí-los pela interface.
--
-- Agora a escolha é explícita da gestão, pelo botão "👥 Quem entra no
-- painel" na aba Equipe do Executivo, que grava nesta coluna. A escolha
-- vale para todo mundo que abrir o dashboard.
--
-- Quem está Inativo/Desligado continua nunca aparecendo, mesmo marcado
-- (esse filtro é aplicado na interface, em execColaboradoresDoPainel).
-- A escrita já é protegida pela policy `upd_analistas` (is_write_role()),
-- então perfil "leitura" não consegue alterar.
-- =====================================================================

do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format('alter table %I.analistas add column if not exists entra_no_painel boolean not null default true', s);
    -- valor inicial: quem opera processos no dia a dia
    execute format($f$update %I.analistas
      set entra_no_painel = (cargo in ('analista','assistente'))$f$, s);
  end loop;
end $$;

notify pgrst, 'reload schema';

-- Conferência
select nome, cargo, status, entra_no_painel
from public.analistas order by entra_no_painel desc, nome;
