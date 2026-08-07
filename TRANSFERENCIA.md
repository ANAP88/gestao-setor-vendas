# Guia de Transferência do Sistema

Este documento descreve como transferir o sistema para a infraestrutura da organização.
Escrito para a equipe de TI/desenvolvimento que vai assumir o projeto.

**Autoria:** ver [AUTHORS.md](AUTHORS.md). Hospedar em infraestrutura interna não altera a autoria.

---

## Resumo rápido

- O sistema é **3 arquivos estáticos** (`index.html`, `app.js`, `config.js`) — sem build, sem
  Node.js, sem `npm install`. Copiar e servir, só isso.
- Todo o dado e a lógica de acesso vivem no **Supabase** (projeto `dbhqgxdsbploioujmqrs`).
  Migrar o projeto Supabase é o item que mais importa — o resto é hospedar arquivo estático.
- **Caminho mais rápido de migração:** transferir a posse do projeto Supabase para a conta da
  empresa (passo 2, Opção A) e trocar 4 linhas em `config.js` (passo 3). Nada mais precisa mudar.
- Checklist do que precisa ser transferido:

  | # | Item | Onde está hoje |
  |---|---|---|
  | 1 | Código-fonte | Repositório Git (GitHub) |
  | 2 | Banco de dados | Projeto Supabase `dbhqgxdsbploioujmqrs` (organização "SERVICE") |
  | 3 | Automação de alertas | 2 agendamentos `pg_cron` (12h e 17h) + webhook do Teams |
  | 4 | Arquivos enviados | Bucket `esteira-documentos` no Supabase Storage |

---

## Arquitetura em 1 minuto

| Camada | Tecnologia | Observação |
|---|---|---|
| Front-end | HTML + CSS + JavaScript puro (ES Modules) | Sem framework, sem build step, sem `node_modules` |
| Back-end | Supabase (PostgreSQL + Auth + Edge Functions + Storage) | Postgres padrão — sem lock-in proprietário |
| Hospedagem | Qualquer host de arquivos estáticos | Hoje: Netlify. Funciona igual em IIS, nginx, Apache, S3, Azure Static Web Apps, GitHub Pages |
| Automação | pg_cron + pg_net (dentro do próprio Postgres) | Alerta diário no Teams via webhook |

O front-end são **3 arquivos**: `index.html`, `app.js`, `config.js`. O que está no repositório é
exatamente o que roda no navegador — não há passo de build a rodar antes de publicar.

---

## Passo a passo da migração

### 1. Código-fonte

Opção A (recomendada) — transferir o repositório inteiro, preservando o histórico:
- No GitHub: **Settings → Transfer ownership** para a organização da empresa.

Opção B — espelhar para outro servidor Git (Azure DevOps, GitLab, Bitbucket):
```bash
git clone --mirror https://github.com/ANAP88/gestao-setor-vendas.git
cd gestao-setor-vendas.git
git remote set-url --push origin <URL_DO_NOVO_REPOSITORIO>
git push --mirror
```

### 2. Banco de dados

O schema inteiro está versionado em migrações SQL, então o banco pode ser **recriado do zero**
em qualquer PostgreSQL se for necessário. Mas normalmente isso não é necessário — ver Opção A.

**Opção A — manter Supabase, transferindo o projeto para a conta da empresa (recomendada):**
- Supabase Dashboard → Settings → General → **Transfer project** para a organização da empresa.
- É a opção mais rápida: nada no código muda além do `config.js` (passo 3).

**Opção B — migrar para PostgreSQL próprio da empresa:**
```bash
# Exportar (estrutura + dados)
pg_dump "postgresql://postgres:[SENHA]@db.dbhqgxdsbploioujmqrs.supabase.co:5432/postgres" \
  --no-owner --no-privileges -f backup_completo.sql

# Importar no servidor da empresa
psql "postgresql://<usuario>@<host_da_empresa>:5432/<banco>" -f backup_completo.sql
```
⚠️ **Atenção nesta opção:** Supabase Auth (login/senha), Storage (upload de documentos) e Edge
Functions são serviços do Supabase. Saindo do Supabase, é preciso substituí-los pelos
equivalentes da empresa (ex.: Entra ID/Active Directory para login, file server ou S3 para
documentos). **Se o objetivo for só "ficar sob a conta da empresa", a Opção A evita todo esse
trabalho.**

### 3. Apontar o front-end para o novo banco

Editar **apenas** `config.js` — é o único arquivo com endereço ou credencial:
```js
export const CONFIG = {
  supabaseUrl: 'https://<novo-projeto>.supabase.co',
  supabaseAnonKey: '<nova-chave-publishable>',
  organizacao: 'Neo Service',
  sistemaNome: 'Gestão Setor de Secretaria de Vendas',
};
```

### 4. Hospedagem

Por ser um site 100% estático, basta servir os 3 arquivos. Não há variáveis de ambiente de
build, comando de build nem versão de Node a configurar. Exemplos:

- **Cloudflare Pages / GitHub Pages / Azure Static Web Apps:** conectar ao repositório; publica
  a cada push.
- **S3 + CloudFront:** upload da pasta.
- **Servidor Windows interno com IIS** (passo a passo):
  1. No **Gerenciador do Servidor**, adicionar a função **Web Server (IIS)** (se ainda não estiver instalada).
  2. Copiar `index.html`, `app.js`, `config.js` e a pasta `fluxogramas/` para dentro de
     `C:\inetpub\wwwroot\` (ex.: `C:\inetpub\wwwroot\secretaria-vendas\`).
  3. No **Gerenciador do IIS**, criar um novo **Site** apontando para essa pasta, com
     `index.html` como documento padrão.
  4. Garantir que o IIS sirva `.js` como `text/javascript` (já vem assim por padrão nas versões
     recentes; se der erro de "tipo MIME não permitido", adicionar em **Tipos MIME**: extensão
     `.js` → `text/javascript`).
  5. Liberar HTTPS (certificado interno ou da empresa) — o sistema faz login e trafega dados
     sensíveis, não deve rodar em HTTP puro.
  6. Liberar saída de internet do servidor para `https://dbhqgxdsbploioujmqrs.supabase.co` (ou
     para o novo projeto, se migrado) — o banco continua na nuvem mesmo com o site hospedado
     internamente.

### 5. Alerta automático no Teams

Roda **dentro do banco** (não depende do host do site nem de licença Power Automate):

- Função `enviar_alerta_teams()` — consulta a view `alerta_hoje` e posta um Adaptive Card no canal.
- Agendamentos `pg_cron`: `alerta-plantao-12h` (15:00 UTC) e `alerta-plantao-17h` (20:00 UTC).
  UTC-3 fixo = 12h e 17h de Brasília.
- ⚠️ A URL do webhook está **dentro do corpo da função**, no banco — ao migrar, gerar um webhook
  novo no canal de destino da empresa e atualizar a função. Tratar essa URL como senha.

Para listar/alterar os agendamentos:
```sql
select * from cron.job;
```

### 6. Contas de acesso

Os usuários ficam no Supabase Auth. Transferindo o projeto (passo 2, Opção A), as contas vão
junto — nada a fazer aqui. Se migrar para autenticação corporativa (Entra ID/AD), o ponto de
troca é a tela de login em `app.js` (funções `renderLogin` / `sb.auth`); a tabela `perfis`
continua controlando os níveis de acesso independente de qual login for usado.

---

## Segurança e LGPD (para revisão de TI/compliance)

**Controle de acesso** — três níveis em `perfis.role`: **admin**, **analista**, **leitura**.
As permissões são aplicadas **no banco via RLS**, não apenas escondendo botões na interface:
- Todas as views têm `security_invoker = true` e acesso negado ao papel `anon`.
- Tabelas operacionais têm políticas separadas de select/insert/update/delete.
- Perfil "leitura" é bloqueado para escrita no próprio banco, mesmo via chamada direta à API.
- A trigger `perfil_role_default` impede que um usuário se auto-promova a admin.
- Isso foi verificado com testes reais de chamada à API usando apenas a chave pública.

**Dados sensíveis** — o sistema armazena CPF, RG, renda e nomes de clientes (tabelas `demandas`
e `clientes`). Considerar na revisão de LGPD da empresa: retenção, anonimização em ambientes de
teste e registro de acesso. Há um "Modo Apresentação" na interface que anonimiza nomes de
analistas para exibições em tela compartilhada.

---

## Funcionalidades que quem herdar o sistema precisa conhecer

*Estas seções não são passos de migração — são contexto de produto que ajuda a entender o
sistema depois de transferido.*

**Portal do Incorporador (acesso externo do cliente)** — desde 2026-07, segunda porta de
entrada, separada do sistema interno da equipe, para incorporadoras/loteadoras acompanharem os
próprios processos:
- Acesso em `/portal` na mesma URL do sistema (redirect em `_redirects` no Netlify). O parâmetro
  antigo `?portal` continua funcionando por compatibilidade com links já enviados.
- Login e dados isolados: perfil `role = 'cliente'` em `perfis`, vinculado a uma
  `empreendedora_id`; RLS garante que cada incorporadora só vê os próprios dados.
- Identidade visual por incorporadora (logo, capa, cor) em
  `empreendedoras.logo_path/capa_path/cor_secundaria`, arquivos no bucket
  `empreendimentos-identidade`.
- Controle de quais empreendimentos aparecem no portal: `empreendimentos.portal_ativo`.
- Conversa com o cliente por processo: tabela `processo_mensagens`, visível dos dois lados.
- Menu interno separado propositalmente em **Administração** (equipe) e **Portal do Cliente**
  (usuários e empreendimentos do portal) — não misturados.

**Aprovação de exclusão de apontamentos de qualidade** — analistas não excluem um apontamento de
retrabalho diretamente; abrem uma solicitação com motivo
(`apontamento_exclusao_solicitacoes`) e um admin aprova ou rejeita em Qualidade/Retrabalho, com
registro de quem decidiu e quando.

---

## Apêndice — histórico: ambiente de staging

*Achados de uma varredura em 2026-07-29, já corrigidos em 2026-08-02. Mantido aqui só como
referência histórica — não é uma pendência atual.*

O ambiente de **produção** foi testado e está saudável. O ambiente de **staging** (schema
`staging`, mesmo projeto Supabase) tinha lacunas de configuração, porque o espelhamento diário
(`pg_cron`) copiava dados mas não recriava certas constraints/views/grants:

| Gap encontrado | Efeito |
|---|---|
| Faltavam foreign keys `demandas → analistas/empreendedoras/empreendimentos/atividades` | Tela de Produção mostrava sempre "0 registros" |
| Faltava FK `esteira_processos → analistas` | Sem efeito visível (código já fazia lookup manual) |
| Faltavam ~16 views analíticas (`ranking_analistas`, `producao_diaria`, `alerta_hoje` etc.) | Dashboard, Insights, Analytics e Implantação apareciam "zerados" em staging, sem erro visível |
| Faltava `GRANT SELECT` em `staging.apontamento_exclusao_solicitacoes` | Erro 403 em Qualidade/Retrabalho |

**Correção aplicada:** [`migrations/corrigir_ambiente_staging_v2.sql`](migrations/corrigir_ambiente_staging_v2.sql)
recriou as chaves estrangeiras, todas as views (qualificando os nomes de tabela explicitamente —
o script antigo dependia de `search_path` e por isso as views de staging acabavam ligadas às
tabelas de **produção** por engano) e reaplicou as permissões do papel `authenticated`. Verificado
em 2026-08-02: 51/51 FKs, 12/12 chaves únicas, 18/18 views, nenhuma view de staging dependendo de
tabela de produção. O script é idempotente (pode rodar de novo se necessário).

---

## Contato / histórico

Todo o histórico de decisões técnicas está nas mensagens de commit (`git log`). As migrações do
banco estão em ordem cronológica e descrevem cada mudança de estrutura. Migrações aplicadas
manualmente (fora do fluxo automático) ficam documentadas em `migrations/` na raiz do
repositório, com o SQL exato usado.
