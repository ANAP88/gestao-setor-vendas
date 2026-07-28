# Guia de Transferência do Sistema

Este documento descreve como transferir o sistema para a infraestrutura da organização.
Escrito para a equipe de TI/desenvolvimento que vai assumir o projeto.

## Autoria

Ver [AUTHORS.md](AUTHORS.md). A hospedagem em infraestrutura interna da empresa não altera a
autoria do sistema.

## Hospedagem em servidor Windows interno (IIS)

Passo a passo para o TI publicar os arquivos num servidor Windows já existente na empresa:

1. No **Gerenciador do Servidor**, adicionar a função **Web Server (IIS)** (se ainda não estiver instalada).
2. Copiar os arquivos `index.html`, `app.js`, `config.js` e a pasta `fluxogramas/` para uma pasta
   dentro de `C:\inetpub\wwwroot\` (ex.: `C:\inetpub\wwwroot\secretaria-vendas\`).
3. No **Gerenciador do IIS**, criar um novo **Site** (ou aplicativo) apontando para essa pasta,
   com `index.html` como documento padrão.
4. **Importante:** garantir que o IIS sirva arquivos `.js` como `text/javascript` (não `application/octet-stream`).
   Isso já vem configurado por padrão nas versões recentes do IIS; se der erro de "tipo MIME não permitido",
   adicionar em **Tipos MIME** do site: extensão `.js` → `text/javascript`.
5. Liberar HTTPS (certificado interno ou da empresa) — o sistema faz login e trafega dados sensíveis,
   não deve rodar em HTTP puro.
6. Não há build, `npm install` nem Node.js a instalar — é copiar e servir, só isso.

Depois de publicado, o acesso aos dados continua passando pelo Supabase (nuvem), então o servidor
interno só precisa de saída de internet liberada para `https://dbhqgxdsbploioujmqrs.supabase.co`.
Se a empresa quiser trazer o banco também para dentro da rede interna, ver a seção "Banco de dados" abaixo.

## Visão geral da arquitetura

| Camada | Tecnologia | Observação |
|---|---|---|
| Front-end | HTML + CSS + JavaScript puro (ES Modules) | Sem framework, sem build step, sem `node_modules` |
| Back-end | Supabase (PostgreSQL + Auth + Edge Functions + Storage) | Postgres padrão — sem lock-in proprietário |
| Hospedagem | Qualquer host de arquivos estáticos | Hoje: Netlify. Funciona igual em IIS, nginx, Apache, S3, Azure Static Web Apps, GitHub Pages |
| Automação | pg_cron + pg_net (dentro do próprio Postgres) | Alerta diário no Teams via webhook |

O front-end são **3 arquivos**: `index.html`, `app.js`, `config.js`. Não há processo de build:
o que está no repositório é exatamente o que roda no navegador.

## O que precisa ser transferido

1. **Código-fonte** — este repositório Git (histórico completo de alterações preservado).
2. **Banco de dados** — projeto Supabase `dbhqgxdsbploioujmqrs` (organização "SERVICE").
3. **Automação de alertas** — 2 agendamentos `pg_cron` no banco (12h e 17h) + webhook do Teams.
4. **Arquivos enviados** — bucket `esteira-documentos` no Supabase Storage.

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

O schema inteiro está versionado em migrações SQL (19 arquivos), então o banco pode ser
**recriado do zero** em qualquer PostgreSQL.

Opção A — manter Supabase, transferindo o projeto para a conta da empresa:
- Supabase Dashboard → Settings → General → **Transfer project** para a organização da empresa.
- É a opção mais rápida: nada no código precisa mudar além do `config.js`.

Opção B — migrar para PostgreSQL próprio da empresa:
```bash
# Exportar (estrutura + dados)
pg_dump "postgresql://postgres:[SENHA]@db.dbhqgxdsbploioujmqrs.supabase.co:5432/postgres" \
  --no-owner --no-privileges -f backup_completo.sql

# Importar no servidor da empresa
psql "postgresql://<usuario>@<host_da_empresa>:5432/<banco>" -f backup_completo.sql
```
Atenção nesta opção: Supabase Auth (login/senha), Storage (upload de documentos) e Edge Functions
são serviços do Supabase. Se sair do Supabase, será necessário substituí-los pelos equivalentes
da empresa (ex.: Entra ID/Active Directory para login, file server ou S3 para documentos).
**Se o objetivo for apenas "ficar sob a conta da empresa", a Opção A evita todo esse trabalho.**

### 3. Apontar o front-end para o novo banco

Editar **apenas** `config.js`:
```js
export const CONFIG = {
  supabaseUrl: 'https://<novo-projeto>.supabase.co',
  supabaseAnonKey: '<nova-chave-publishable>',
  organizacao: 'Neo Service',
  sistemaNome: 'Gestão Setor de Secretaria de Vendas',
};
```
Nenhum outro arquivo contém endereço ou credencial — é o único ponto de configuração.

### 4. Hospedagem

Por ser um site estático, basta servir os arquivos. Exemplos:

- **IIS / nginx / Apache (servidor interno):** copiar os 3 arquivos para o diretório público.
  Exigência: servir `.js` com `Content-Type: text/javascript` (ES Modules não funcionam sem isso).
- **Azure Static Web Apps / S3+CloudFront:** apontar para o repositório ou fazer upload da pasta.
- **Cloudflare Pages / GitHub Pages:** conectar ao repositório; publica a cada push.

Não há variáveis de ambiente de build, comando de build nem versão de Node a configurar.

### 5. Alerta automático no Teams

Está implementado **dentro do banco** (não depende do host do site nem de licença Power Automate):

- Função `enviar_alerta_teams()` — consulta a view `alerta_hoje` e posta um Adaptive Card no canal.
- Agendamentos `pg_cron`: `alerta-plantao-12h` (15:00 UTC) e `alerta-plantao-17h` (20:00 UTC).
  UTC-3 fixo = 12h e 17h de Brasília.
- A URL do webhook está **dentro do corpo da função** no banco — ao migrar, gerar um webhook novo
  no canal de destino da empresa e atualizar a função. Tratar essa URL como senha.

Para listar/alterar os agendamentos:
```sql
select * from cron.job;
```

### 6. Contas de acesso

Os usuários ficam no Supabase Auth. Ao transferir o projeto (Opção A do passo 2), as contas vão junto.
Se migrar para autenticação corporativa (Entra ID/AD), o ponto de troca é a tela de login em `app.js`
(funções `renderLogin` / `sb.auth`), e a tabela `perfis` continua controlando os níveis de acesso.

## Controle de acesso (importante para revisão de segurança)

Três níveis em `perfis.role`: **admin**, **analista**, **leitura**.

As permissões são aplicadas **no banco via RLS**, não apenas escondendo botões na interface:
- Todas as views têm `security_invoker = true` e acesso negado ao papel `anon`.
- Tabelas operacionais têm políticas separadas de select/insert/update/delete.
- Perfil "leitura" é bloqueado para escrita no próprio banco, mesmo via chamada direta à API.
- A trigger `perfil_role_default` impede que um usuário se auto-promova a admin.

Isso foi verificado com testes reais de chamada à API usando apenas a chave pública.

## Dados sensíveis

O sistema armazena CPF, RG, renda e nomes de clientes (tabelas `demandas` e `clientes`).
Considerar na revisão de LGPD da empresa: retenção, anonimização em ambientes de teste e
registro de acesso. Há um "Modo Apresentação" na interface que anonimiza nomes de analistas
para exibições em tela compartilhada.

## Contato / histórico

Todo o histórico de decisões técnicas está nas mensagens de commit (`git log`).
As migrações do banco estão em ordem cronológica e descrevem cada mudança de estrutura.
