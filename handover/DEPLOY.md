# Deploy

## Fluxo normal de publicação de uma mudança

O projeto não tem build nem testes automatizados — "publicar" é literalmente "dar `git push`".

1. `git checkout staging`
2. Editar `app.js`/`index.html`/`migrations/*.sql` conforme necessário. Se a mudança envolve
   banco, aplicar o SQL primeiro no schema `staging` (via SQL editor do Supabase ou uma
   ferramenta com acesso ao Postgres), documentando num arquivo novo em `migrations/`.
3. Como não há linter/build para pegar erro de sintaxe, conferir manualmente o JS antes de
   commitar (nem que seja um `node --check app.js`, se houver Node disponível — o ambiente usado
   nesta auditoria não tinha Node instalado, então essa checagem tem que ser lembrada
   manualmente).
4. `git add` + `git commit` + `git push origin staging` → Netlify publica sozinho em
   `staging--secretaria-vendas-gestao.netlify.app` (alguns segundos).
5. **Validar em staging antes de qualquer coisa ir para produção** — esta é a disciplina seguida
   em todo o histórico do projeto (confirmar em [CHANGELOG.md](CHANGELOG.md)).
6. Quando aprovado: `git checkout main` → `git merge staging` → `git push origin main` → Netlify
   publica em produção.
7. **Se a mudança envolveu banco**: replicar o mesmo SQL aplicado em `staging` também em
   `public` (schema de produção) — isso **não é automático**, precisa ser feito manualmente,
   idealmente pela mesma pessoa que fez a mudança, comparando os dois schemas antes (ver
   consulta de comparação em [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md)).
8. `git checkout staging` de volta, para deixar a árvore de trabalho no branch de teste por
   padrão (convenção observada no histórico do projeto, não uma exigência técnica).

Não existe rollback automático de deploy — ver [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md) para
como reverter uma publicação ruim.

## Como subir o ambiente inteiro do zero

Cenário: nova organização quer rodar uma cópia própria do sistema (não uma migração da conta
existente — para migrar a conta existente, ver [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md),
que é o caminho mais rápido e o recomendado).

### 1. Banco (Supabase)

1. Criar um projeto novo no Supabase (Postgres 15+; testado em Postgres 17).
2. Habilitar as extensões: `pg_cron`, `pg_net`, `pgcrypto`, `unaccent`, `uuid-ossp` (Database →
   Extensions no dashboard).
3. Recriar as 52 tabelas, com colunas/tipos/defaults exatamente como documentado em
   [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md) — **não existe um único arquivo de schema "mestre"
   neste repositório para rodar de uma vez**; o schema real vive no banco de produção atual, e os
   arquivos em `migrations/` documentam só as mudanças mais recentes, não o schema inteiro desde
   o início (ver observação em [PENDENCIAS.md](PENDENCIAS.md)). O caminho mais confiável é
   exportar o schema do projeto atual (`pg_dump --schema-only`, ver comando em
   [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md)) e rodar esse dump no projeto novo — em vez de
   recriar tabela por tabela manualmente a partir deste documento.
4. Criar as 25 funções e 37 triggers (idem — via `pg_dump` inclui automaticamente; se for manual,
   usar as definições completas em [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md)/consultando
   `pg_get_functiondef` no projeto atual).
5. Criar as 19 views, na ordem certa (algumas dependem de outras — `metas_fds` depende de
   `fds_solo`, por exemplo).
6. Ativar RLS em todas as tabelas e recriar as policies (ver [SEGURANCA.md](SEGURANCA.md) para a
   lista completa).
7. Criar os 8 buckets de Storage com as policies correspondentes (ver
   [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#storage-buckets)).
8. Repetir os passos 3-7 para um segundo schema `staging`, ou decidir não usar staging (nesse
   caso, simplificar `app.js` removendo a lógica de `EH_STAGING`).
9. Recriar os jobs de `pg_cron` (ver tabela em [ARQUITETURA.md](ARQUITETURA.md)) — a URL do
   Power Automate/Teams **tem que ser trocada** por um webhook novo (a atual pertence à Neo
   Service — ver [SEGURANCA.md](SEGURANCA.md)).
10. Criar o schema `backup` com a tabela `snapshots` e a função
    `backup.rodar_snapshot_diario()` se quiser manter o backup diário próprio (ver
    [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md)).

### 2. Autenticação

- Supabase Auth já vem habilitado por padrão no projeto novo — só e-mail/senha é usado, nenhuma
  configuração de provedor OAuth é necessária.
- Criar manualmente o primeiro usuário admin (ele vira admin automaticamente pelo trigger
  `perfil_role_default`, por ser o primeiro).

### 3. Edge Functions

Publicar as 8 funções (código-fonte completo em [API.md](API.md)) via Supabase CLI
(`supabase functions deploy <nome>`) ou pelo dashboard. As env vars `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente pelo Supabase em toda função — não
precisam ser configuradas manualmente. A função `whatsapp-webhook` tem um token de verificação
hardcoded que precisa ser trocado (ver [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md)).

### 4. Front-end

1. Editar `config.js` com a URL e a chave `anon`/`publishable` do projeto novo.
2. Nenhum outro arquivo precisa mudar.

### 5. Hospedagem

1. Criar site novo no Netlify (ou qualquer host estático) apontando para o repositório.
2. Copiar `netlify.toml`/`_headers`/`_redirects` como estão (ajustar a URL do Supabase na CSP —
   `img-src`/`connect-src` referenciam `dbhqgxdsbploioujmqrs.supabase.co` explicitamente).
3. Trocar, em `app.js`, a constante `EH_STAGING` (hoje compara com
   `'secretaria-vendas-gestao.netlify.app'` hardcoded) para o novo domínio de produção, se for
   manter a lógica de dois ambientes.
4. Configurar branch deploys se quiser manter o fluxo staging/produção.

### 6. Validação pós-subida

Ver checklist completo em [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md#checklist-de-validação-pós-migração).
