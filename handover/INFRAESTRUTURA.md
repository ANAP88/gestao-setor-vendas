# Infraestrutura

Três serviços, nenhum servidor próprio para administrar.

## Netlify

| Item | Valor |
|---|---|
| Site | `secretaria-vendas-gestao` |
| Site ID | `37305d4c-e0cf-4ac1-9162-9a0c473472e6` |
| Plano | `nf_team_dev` (time) |
| URL produção | `https://secretaria-vendas-gestao.netlify.app` |
| URL staging | `https://staging--secretaria-vendas-gestao.netlify.app` |
| Repositório conectado | `github.com/ANAP88/gestao-setor-vendas` |
| Branch de produção | `main` |
| Branch deploys | habilitado (branch `staging` publica sozinha) |
| Comando de build | `echo 'Static site - no build needed'` (não faz nada de fato) |
| Diretório publicado | raiz do repositório (`.`) |

Não há variável de ambiente de build configurada — não é necessária, porque não há build de
verdade. Ver [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md).

### Redirects (`_redirects` na raiz)
```
/portal      /index.html   200
/portal/*    /index.html   200
```
Garante que `/portal` e qualquer sub-rota do Portal sirvam o mesmo `index.html` (SPA de rota
única) sem cair em 404.

### Redirects adicionais (`netlify.toml`)
Bloqueiam acesso direto a arquivos sensíveis por convenção (`/.env*`, `/.git*`, `/*.map`,
`/.well-known/security.txt`) devolvendo 404 — nenhum desses arquivos existe no repositório
(não há `.env`, `.git` não é servido por padrão pelo Netlify), então é uma camada de defesa
redundante, não uma correção de um problema real encontrado.

### Cabeçalhos — definidos **duas vezes**, de forma redundante

Tanto `netlify.toml` (`[[headers]]`) quanto `_headers` (formato nativo do Netlify) definem
cabeçalhos de segurança e cache. Os dois arquivos são **consistentes entre si** hoje (mesmas
diretivas), mas isso é uma duplicação de manutenção: uma mudança de CSP feita só em um dos dois
arquivos gera divergência silenciosa. Recomendação para quem assumir o projeto: escolher um dos
dois mecanismos e remover o outro.

Cabeçalhos aplicados a `/*`:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://dbhqgxdsbploioujmqrs.supabase.co;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://dbhqgxdsbploioujmqrs.supabase.co https://cdn.jsdelivr.net;
  frame-src https://viewer.diagrams.net; frame-ancestors 'none';
```
Nota: a CSP libera `fonts.googleapis.com`/`fonts.gstatic.com`, mas **nenhum CSS do projeto
carrega Google Fonts** (`index.html` só usa fontes de sistema: `Calibri, Candara, "Segoe UI",
Arial, sans-serif`) — é uma permissão sem uso, segura de remover se algum dia a CSP for revisada.

Cache: `*.html` e `*.js` são servidos com `no-cache, must-revalidate` (proposital — projeto sem
hash de conteúdo no nome do arquivo, então cache agressivo faria o navegador nunca buscar a
versão nova após um deploy). Imagens/fontes (`*.{png,jpg,jpeg,gif,svg,webp,woff,woff2}`) usam
cache agressivo de 1 ano.

## GitHub

- Repositório: `ANAP88/gestao-setor-vendas`.
- Branches: `main` (produção), `staging` (teste). Sem outras branches, sem tags.
- Sem GitHub Actions (`.github/workflows` não existe) — o deploy é 100% responsabilidade do
  Netlify, disparado por webhook a cada push.
- **Não verificado nesta auditoria** (sem `gh` CLI disponível no ambiente): visibilidade exata
  do repositório (público/privado), lista de colaboradores/times com acesso, branch protection
  rules. Conferir direto em `github.com/ANAP88/gestao-setor-vendas/settings`.

## Supabase

- Projeto: `dbhqgxdsbploioujmqrs`, organização "SERVICE", região `sa-east-1`, Postgres 17.6.1.
- URL: `https://dbhqgxdsbploioujmqrs.supabase.co`.
- Serviços em uso: Postgres (2 schemas), Auth, Storage (8 buckets), Edge Functions (8 funções,
  runtime Deno), `pg_cron`/`pg_net` (4 jobs agendados dentro do banco).
- Detalhes completos de cada peça: [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md),
  [API.md](API.md), [AUTENTICACAO.md](AUTENTICACAO.md).
- **Não verificado nesta auditoria** (só visível no dashboard, não via SQL): plano de billing
  exato e seus limites (linhas de banco, egress, invocações de Edge Function), se PITR
  (point-in-time recovery) da própria Supabase está ativo/em qual plano, política de retenção de
  backup automático do Supabase (distinto do backup próprio em `backup.snapshots`, ver
  [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md)). Conferir em Project Settings → Billing e
  Database → Backups no dashboard.

## Ambiente de desenvolvimento local

Não requer Node.js nem `npm install`. Duas formas de servir os arquivos localmente:

```powershell
./server.ps1        # Windows — HttpListener nativo do .NET, serve em http://localhost:8123
```
ou, com Node disponível:
```bash
npx serve
```
`server.ps1` é um servidor estático mínimo (25 linhas), sem HTTPS, sem live-reload — serve
`.html`/`.js`/`.css` com o `Content-Type` correto e 404 para o resto. Como qualquer hostname
diferente de `secretaria-vendas-gestao.netlify.app` já conta como "staging" no `app.js` (ver
[ARQUITETURA.md](ARQUITETURA.md)), rodar local automaticamente aponta para o schema `staging` do
banco — não há como testar contra `public` localmente sem editar `app.js` temporariamente.

## Domínio

O domínio usado hoje é o subdomínio gratuito do próprio Netlify
(`secretaria-vendas-gestao.netlify.app`). Não há domínio próprio (`.com.br` ou similar)
configurado — se a empresa que assumir o projeto quiser um domínio próprio, é uma configuração
nova a fazer no Netlify (Domain settings), sem impacto em código.
