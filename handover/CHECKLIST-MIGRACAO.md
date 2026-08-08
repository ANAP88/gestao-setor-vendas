# Checklist de migração completa

Este documento assume o caminho recomendado: **transferir a posse do projeto existente**
(GitHub + Supabase) para a nova organização, em vez de recriar tudo do zero em uma conta nova
(essa segunda opção está em [DEPLOY.md](DEPLOY.md#como-subir-o-ambiente-inteiro-do-zero), mas dá
mais trabalho e mais chance de divergência).

## Antes de começar

- [ ] Confirmar com quem tem acesso hoje (Ana Patrícia da Silva / organização Neo Service) que a
      transferência foi autorizada.
- [ ] Ler [ARQUITETURA.md](ARQUITETURA.md) e [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md) antes de
      mexer em qualquer coisa.
- [ ] Rodar o **backup manual completo** descrito em
      [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md#backup-manual-completo-antes-de-uma-migração)
      antes do primeiro passo abaixo, independente de qual caminho for seguido.

## 1. Código-fonte (GitHub)

- [ ] GitHub → repositório `ANAP88/gestao-setor-vendas` → **Settings → Transfer ownership** para
      a organização/conta da nova empresa. Preserva todo o histórico (172 commits) e as duas
      branches (`main`, `staging`).
- [ ] Se transferir não for possível (só espelhar), rodar:
      ```bash
      git clone --mirror https://github.com/ANAP88/gestao-setor-vendas.git
      cd gestao-setor-vendas.git
      git remote set-url --push origin <URL_DO_NOVO_REPOSITORIO>
      git push --mirror
      ```
- [ ] Reconectar o Netlify ao repositório na nova localização (Site settings → Build & deploy →
      Link repository), se o `remote` mudou.

## 2. Banco de dados (Supabase)

**Caminho recomendado — transferir o projeto (não recriar):**
- [ ] Supabase Dashboard → Settings → General → **Transfer project** para a organização da nova
      empresa. Nada no código muda além do que está no passo 3.

**Caminho alternativo — Postgres próprio (só se for realmente sair do Supabase):**
- [ ] Exportar: `pg_dump "postgresql://postgres:[SENHA]@db.dbhqgxdsbploioujmqrs.supabase.co:5432/postgres" --no-owner --no-privileges -f backup_completo.sql`
- [ ] Importar no servidor novo: `psql "postgresql://<usuario>@<host>:5432/<banco>" -f backup_completo.sql`
- [ ] ⚠️ Isso **não** traz Auth, Storage nem Edge Functions — são serviços próprios do Supabase.
      Saindo do Supabase, cada um precisa de um substituto equivalente (ver
      [DEPLOY.md](DEPLOY.md)). Esse caminho só compensa se o objetivo for realmente parar de usar
      Supabase — se for só trocar de dono da conta, use o caminho recomendado acima.

## 3. Apontar o front-end para o projeto (se mudou de projeto Supabase)

- [ ] Editar `config.js` — é o único arquivo com endereço/credencial:
  ```js
  export const CONFIG = {
    supabaseUrl: 'https://<novo-projeto>.supabase.co',
    supabaseAnonKey: '<nova-chave-publishable>',
    organizacao: '<nome da empresa>',
    sistemaNome: 'Gestão Setor de Secretaria de Vendas',
  };
  ```
- [ ] Se o domínio de produção mudar, atualizar a constante `EH_STAGING` em `app.js` (hoje
      compara `location.hostname` com a string literal `'secretaria-vendas-gestao.netlify.app'`).

## 4. Segredos que precisam ser trocados (não são copiados pela transferência de projeto)

- [ ] **Webhook do Power Automate/Teams**: gerar um novo no canal de destino da nova empresa e
      atualizar as duas sobrecargas da função `enviar_alerta_teams()` no Postgres (`create or
      replace function ...`). A URL antiga continua funcionando até ser trocada — tratar como
      comprometida assim que outra empresa tiver acesso de leitura ao banco.
- [ ] **Token de verificação do webhook do WhatsApp** (`VERIFY_TOKEN` em `whatsapp-webhook`) —
      gerar um novo e reconfigurar no app da Meta, se o número for mantido/trocado.
- [ ] **Secret do endpoint `alerta-plantao`** — gerar um valor novo e atualizar quem quer que
      consuma esse endpoint externamente.
- [ ] Detalhe completo de cada um: [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md).

## 5. Hospedagem (Netlify)

- [ ] Se o site do Netlify for mantido: nada a fazer além do passo 1 (reconectar repositório).
- [ ] Se for migrar de host: copiar `netlify.toml`/`_headers`/`_redirects` para a config do novo
      host (ajustando a URL do Supabase na CSP, se o projeto mudou). Passo a passo específico
      para IIS interno em `TRANSFERENCIA.md` na raiz do repositório.

## 6. Contas de acesso

- [ ] Se o projeto Supabase foi transferido (caminho recomendado): as contas em `auth.users`/
      `perfis` vão junto, nada a fazer.
- [ ] Se for migrar para autenticação corporativa (Entra ID/AD): o ponto de troca é a tela de
      login em `app.js` (`renderLogin`/`renderLoginPortal`, `sb.auth`) — a tabela `perfis`
      continua controlando os níveis de acesso independente de qual login for usado, então o
      RLS não precisa mudar.

## Checklist de validação pós-migração

Rodar **antes de avisar os usuários finais** que a migração terminou:

### Banco
- [ ] `select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';` → deve dar **52**.
- [ ] `select count(*) from information_schema.views where table_schema='public';` → deve dar **19**.
- [ ] `select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and p.proname not like 'unaccent%';` → deve dar **25**.
- [ ] `select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname='public';` → deve dar **37**.
- [ ] `select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not relrowsecurity;` → **deve vir vazio** (toda tabela precisa ter RLS ativo).
- [ ] `select * from cron.job;` → deve mostrar os 4 jobs (`alerta-plantao-12h`, `alerta-plantao-17h`, `backup-diario-interno`, `espelho-staging-diario`), todos `active = true`.
- [ ] `select count(*) from storage.buckets;` → deve dar **8**.

### Aplicação
- [ ] Login funciona no sistema interno (`/`) com uma conta `admin`.
- [ ] Login funciona no Portal (`/portal` e `/portal/<slug>` de alguma incorporadora com slug
      cadastrado).
- [ ] Console do navegador sem erro ao abrir cada um dos grupos do menu (Início, Gestão,
      Operação, Administração, Portal do Cliente).
- [ ] Criar uma demanda de teste em Produção, confirmar que o número é gerado automaticamente e
      que, se a atividade for "Análise de Crédito", o card aparece sozinho na Esteira.
- [ ] Abrir um processo de Análise de Crédito de teste, registrar um parecer "Aprovado e enviar
      para emissão de contrato", confirmar que um processo novo aparece em Emissão de Contrato.
- [ ] Importar uma planilha pequena de teste em Produção ou Implantação.
- [ ] Disparar "Enviar lembrete agora" (Automações) e confirmar que a mensagem chega no canal do
      Teams correto (com o webhook **novo**, não o antigo).
- [ ] Subir um arquivo de teste em qualquer bucket (ex.: anexo de chamado) e confirmar
      download.

### Comparação staging vs. public (se os dois ambientes forem mantidos)
Rodar esta consulta (compara estrutura, não dado) e conferir que só retorna diferenças
conhecidas e aceitas (ver [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#staging-vs-public)):
```sql
select table_name from information_schema.tables where table_schema='staging' and table_type='BASE TABLE'
except
select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE';
```
Repetir trocando `staging`/`public` de lugar, e o mesmo para `information_schema.views` e
`pg_proc`/`pg_namespace` (funções) — consultas exatas usadas nesta auditoria, reaproveitáveis
como script de verificação contínua.

### Segurança
- [ ] Os 3 segredos hardcoded (passo 4 acima) foram trocados.
- [ ] Testar como usuário `leitura`: não consegue criar/editar/excluir nada nas telas principais.
- [ ] Testar como usuário `cliente` do Portal: só vê os empreendimentos da própria incorporadora.

## Contato / histórico

Todo o histórico de decisões técnicas está nas mensagens de commit (`git log`). Ver
[CHANGELOG.md](CHANGELOG.md) para o resumo cronológico.
