# Backup e rollback

## Backup automático próprio (`backup.snapshots`)

**Achado desta auditoria**: existe um mecanismo de backup rodando dentro do próprio Postgres,
não documentado em nenhum lugar do repositório até este handover — só existia como um job de
`pg_cron`.

- Job `backup-diario-interno`, todo dia às 06:00 UTC (03:00 Brasília).
- Executa `backup.rodar_snapshot_diario()`, que faz, para **17 tabelas** (não todas as 52):
  `demandas, clientes, empreendimentos, empreendedoras, analistas, atividades, escala_plantao,
  eventos_repasse, esteira_processos, esteira_historico, implantacoes, implantacao_checklist,
  implantacao_pendencias, apontamentos_erro, indicador_mensal, metas_config, perfis`
  — um `INSERT INTO backup.snapshots (tabela, dados)` por tabela, com **todas as linhas daquela
  tabela naquele momento**, serializadas como um único `jsonb` (`jsonb_agg(row_to_json(x))`).
- Retenção: apaga automaticamente snapshots com mais de **35 dias**
  (`delete from backup.snapshots where criado_em < now() - interval '35 days'`).
- Estrutura: `backup.snapshots(id uuid, tabela text, criado_em timestamptz, dados jsonb)`.
- Em 2026-08-08 havia 221 snapshots acumulados, do mais antigo (2026-07-26) ao mais recente
  daquele dia.

### O que este backup NÃO cobre

- **35 das 52 tabelas** não são snapshotadas — nenhuma tabela do módulo Esteira detalhado
  (`esteira_anexos`, `esteira_transicoes`, `esteira_validacoes`, `etapas_esteira`,
  `processo_mensagens`, `repasse_checklist`), nenhuma do Laudo de Crédito, nenhuma de
  configuração/cadastro auxiliar (`audit_log`, `acessos_log`, `chamados_anexos`,
  `clientes_coobrigados`, `conhecimento_artigos`, `empreendimento_documentos`, etc.).
- **Arquivos no Storage** (documentos, anexos, logos) não são copiados por este mecanismo.
- **Schema** (estrutura de tabelas, funções, triggers, policies) não é versionado por este
  mecanismo — só dado.
- Cada snapshot é um "retrato" isolado (uma tabela por vez, sem transação única cobrindo todas)
  — não garante consistência referencial entre tabelas no mesmo instante exato.

### Como restaurar a partir de um snapshot

**Não existe hoje nenhuma função pronta de restauração** — só a de gravar
(`rodar_snapshot_diario`). Para restaurar uma tabela a partir de um snapshot específico, o
padrão seria algo como:

```sql
-- 1. Ver os snapshots disponíveis de uma tabela
select id, criado_em from backup.snapshots
where tabela = 'demandas'
order by criado_em desc;

-- 2. Inspecionar o conteúdo antes de tocar em qualquer coisa
select dados from backup.snapshots where id = '<id escolhido>';

-- 3. Restaurar (SUBSTITUI o conteúdo atual da tabela pelo do snapshot — irreversível,
--    fazer um snapshot manual do estado atual antes, por segurança)
begin;
  truncate table public.demandas;  -- cuidado: isso apaga o dado atual
  insert into public.demandas
  select * from jsonb_populate_recordset(
    null::public.demandas,
    (select dados from backup.snapshots where id = '<id escolhido>')
  );
commit;
```

⚠️ `jsonb_populate_recordset` exige que as colunas do JSON batam exatamente com as colunas atuais
da tabela — se o schema mudou entre a data do snapshot e hoje (coluna nova, tipo alterado), o
`insert` pode falhar ou preencher errado. **Testar sempre em `staging` primeiro.** Para restaurar
só algumas linhas (não a tabela inteira), filtrar o `jsonb` antes do `insert` em vez de truncar.

## Backup nativo do Supabase (PITR / snapshots de plataforma)

**Não verificado nesta auditoria** — visível só no dashboard (Database → Backups), não via SQL.
O Supabase oferece backup automático próprio dependendo do plano contratado (point-in-time
recovery em planos pagos superiores). Antes de depender só do mecanismo próprio acima, **conferir
no dashboard**: qual é o plano atual, se PITR está ativo, e qual a janela de retenção — essa é a
rede de segurança "de verdade" para um desastre total (schema corrompido, banco inteiro
apagado), que o `backup.snapshots` (só 17 tabelas, só dado, sem transação única) não substitui.

## Backup manual completo (antes de uma migração)

Recomendado antes de qualquer passo do [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md):

```bash
pg_dump "postgresql://postgres:[SENHA]@db.dbhqgxdsbploioujmqrs.supabase.co:5432/postgres" \
  --no-owner --no-privileges -f backup_completo_$(date +%Y%m%d).sql
```

Isso cobre schema + dado das 52 tabelas + views + funções + triggers, mas **não** cobre Auth
(`auth.users`), Storage (arquivos), nem configuração de Edge Functions/`pg_cron` — esses só são
preservados de fato se o **projeto Supabase inteiro** for transferido (ver
[CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md), caminho recomendado).

## Rollback de código (deploy ruim)

Duas camadas independentes, nenhuma automática:

1. **Netlify**: todo deploy fica no histórico (Deploys → escolher um anterior → "Publish deploy")
   — reverte o site publicado para uma versão anterior em segundos, sem precisar mexer em Git.
   Não reverte nenhuma mudança de banco que tenha sido feita junto.
2. **Git**: `git revert <commit>` (preferível a `reset --hard`, preserva histórico) na branch
   afetada, seguido de push — dispara novo deploy automático do Netlify com o código revertido.

## Rollback de banco

**Não existe um mecanismo de rollback de schema/dado além do backup manual acima e do
`backup.snapshots`** (que não é desenhado para restauração completa, ver limitações acima). Uma
migração de banco malfeita em produção (`public`) hoje só é reversível se:
- Ela foi testada primeiro em `staging` e documentada num arquivo em `migrations/` com o SQL
  exato (convenção seguida no projeto) — permite escrever o SQL inverso manualmente;
- Ou houver um `pg_dump` recente o suficiente para restaurar de.

Recomendação para quem assumir o projeto: antes de qualquer migração de schema em produção,
rodar um `pg_dump --schema-only` (rápido, sem dado) mais um snapshot manual das tabelas afetadas
via `backup.snapshots` (rodando a função de captura pontualmente, não só esperando o cron das
06:00).

## Ambiente de staging não é backup

O espelhamento diário de `public` para `staging` (`staging.atualizar_espelho()`, 06:30 UTC) é
para **teste**, não para recuperação de desastre — ele **sobrescreve** `staging` com o estado
atual de `public` todo dia; se um dado ruim entrar em produção antes das 06:30, ele também vai
para staging e sobrescreve qualquer coisa que estivesse lá. Não usar `staging` como fonte de
restauração.
