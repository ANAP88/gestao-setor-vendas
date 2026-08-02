-- Auditoria (login/logout + quem alterou o quê), cadastro em massa e vinculo Produção -> Esteira.
-- Aplicado em 2026-08-02 nos schemas public e staging.

-- 1) Login/logout e alterações
do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format($f$
      create table if not exists %I.acessos_log (
        id uuid primary key default gen_random_uuid(),
        user_id uuid,
        email text,
        nome text,
        role text,
        ambiente text not null check (ambiente in ('equipe','portal')),
        evento text not null check (evento in ('login','logout')),
        criado_em timestamptz not null default now()
      )$f$, s);
    execute format('create index if not exists idx_acessos_log_user on %I.acessos_log(user_id, criado_em desc)', s);
    execute format('alter table %I.acessos_log enable row level security', s);

    execute format($f$
      create table if not exists %I.audit_log (
        id uuid primary key default gen_random_uuid(),
        tabela text not null,
        registro_id uuid,
        acao text not null check (acao in ('INSERT','UPDATE','DELETE')),
        dados_antes jsonb,
        dados_depois jsonb,
        autor_user_id uuid,
        autor_email text,
        criado_em timestamptz not null default now()
      )$f$, s);
    execute format('create index if not exists idx_audit_log_tabela on %I.audit_log(tabela, criado_em desc)', s);
    execute format('alter table %I.audit_log enable row level security', s);
  end loop;
end $$;

create or replace function public.registrar_acesso(p_evento text, p_ambiente text)
returns void language plpgsql security definer set search_path = 'public' as $function$
begin
  insert into public.acessos_log (user_id, email, nome, role, ambiente, evento)
  select auth.uid(), p.email, coalesce(p.nome_completo, p.nome), p.role, p_ambiente, p_evento
  from public.perfis p where p.user_id = auth.uid();
end $function$;

create or replace function staging.registrar_acesso(p_evento text, p_ambiente text)
returns void language plpgsql security definer set search_path = 'staging' as $function$
begin
  insert into staging.acessos_log (user_id, email, nome, role, ambiente, evento)
  select auth.uid(), p.email, coalesce(p.nome_completo, p.nome), p.role, p_ambiente, p_evento
  from staging.perfis p where p.user_id = auth.uid();
end $function$;

grant execute on function public.registrar_acesso(text, text) to authenticated;
grant execute on function staging.registrar_acesso(text, text) to authenticated;
revoke all on function public.registrar_acesso(text, text) from anon;
revoke all on function staging.registrar_acesso(text, text) from anon;

-- perfis usa user_id como chave primária (não tem coluna id) — daí o coalesce abaixo.
create or replace function public.fn_audit_log()
returns trigger language plpgsql security definer set search_path = 'public' as $function$
declare v_id text; v_email text;
begin
  v_id := coalesce((to_jsonb(coalesce(new, old))->>'id'), (to_jsonb(coalesce(new, old))->>'user_id'));
  select email into v_email from perfis where user_id = auth.uid();
  insert into audit_log (tabela, registro_id, acao, dados_antes, dados_depois, autor_user_id, autor_email)
  values (TG_TABLE_NAME, v_id::uuid, TG_OP,
    case when TG_OP <> 'INSERT' then to_jsonb(old) end,
    case when TG_OP <> 'DELETE' then to_jsonb(new) end,
    auth.uid(), v_email);
  return coalesce(new, old);
end $function$;

create or replace function staging.fn_audit_log()
returns trigger language plpgsql security definer set search_path = 'staging' as $function$
declare v_id text; v_email text;
begin
  v_id := coalesce((to_jsonb(coalesce(new, old))->>'id'), (to_jsonb(coalesce(new, old))->>'user_id'));
  select email into v_email from perfis where user_id = auth.uid();
  insert into audit_log (tabela, registro_id, acao, dados_antes, dados_depois, autor_user_id, autor_email)
  values (TG_TABLE_NAME, v_id::uuid, TG_OP,
    case when TG_OP <> 'INSERT' then to_jsonb(old) end,
    case when TG_OP <> 'DELETE' then to_jsonb(new) end,
    auth.uid(), v_email);
  return coalesce(new, old);
end $function$;

do $$
declare s text; t text;
  tabelas text[] := array['esteira_processos','demandas','clientes','empreendimentos','empreendedoras','perfis',
    'chamados','escala_plantao','metas_config','apontamentos_erro','atividades','analistas','etapas_esteira',
    'esteira_transicoes','eventos_repasse','empreendimento_documentos','conhecimento_artigos','implantacoes',
    'implantacao_checklist','implantacao_pendencias','indicador_mensal','indicadores_kpi','config_sistema'];
begin
  foreach s in array array['public','staging'] loop
    foreach t in array tabelas loop
      execute format('drop trigger if exists trg_audit_log on %I.%I', s, t);
      execute format('create trigger trg_audit_log after insert or update or delete on %I.%I
                       for each row execute function %I.fn_audit_log()', s, t, s);
    end loop;
  end loop;
end $$;

-- RLS: só admin lê os logs. Escrita só via função SECURITY DEFINER (trigger/RPC), que ignora RLS.
do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format($f$create policy sel_acessos_log_admin on %I.acessos_log for select using (
      exists (select 1 from %I.perfis where user_id = auth.uid() and role = 'admin'))$f$, s, s);
    execute format($f$create policy sel_audit_log_admin on %I.audit_log for select using (
      exists (select 1 from %I.perfis where user_id = auth.uid() and role = 'admin'))$f$, s, s);
    execute format('grant select on %I.acessos_log to authenticated', s);
    execute format('grant select on %I.audit_log to authenticated', s);
    execute format('revoke all on %I.acessos_log from anon', s);
    execute format('revoke all on %I.audit_log from anon', s);
  end loop;
end $$;

-- 2) Produção: campos de Imobiliária e Corretor da venda.
do $$
declare s text;
begin
  foreach s in array array['public','staging'] loop
    execute format('alter table %I.demandas add column if not exists imobiliaria text', s);
    execute format('alter table %I.demandas add column if not exists corretor text', s);
  end loop;
end $$;

-- 3) esteira_processos.origem_demanda_id já existia na tabela, mas nunca era preenchido pela UI —
--    o formulário "Novo processo na esteira" agora busca e vincula um registro de Produção, e a
--    esteira passa a exibir (somente leitura) cliente/incorporadora/empreendimento/unidade/tipo de
--    serviço/imobiliária/corretor via join em origem_demanda_id, sem duplicar os dados.
