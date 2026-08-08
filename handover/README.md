# Handover técnico — Gestão Setor de Vendas (Neo Service)

Este diretório é o pacote de transferência técnica completo do sistema, escrito para que uma
outra equipe de desenvolvimento consiga assumir o projeto **sem depender da pessoa que o
construiu**. Foi gerado em **2026-08-08** a partir de uma auditoria real do código-fonte, do
banco de dados (schemas `public` e `staging`, projeto Supabase `dbhqgxdsbploioujmqrs`), das 8
Edge Functions publicadas, da configuração do Netlify e do histórico completo do Git.

Não existe nenhum outro sistema de documentação "vivo" (Notion, Confluence, wiki) — a
documentação do projeto é o próprio repositório: este diretório, mais os arquivos na raiz
(`README.md`, `TRANSFERENCIA.md`, `RESUMO-EXECUTIVO.md`, `AUTHORS.md`) e os comentários dentro
de `app.js` e de `migrations/*.sql`.

## Como usar este pacote

Se você está **assumindo o projeto agora**, leia nesta ordem:

1. **[HANDOVER.md](HANDOVER.md)** — resumo executivo. Comece por aqui.
2. **[ARQUITETURA.md](ARQUITETURA.md)** — como as peças se encaixam.
3. **[CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md)** — o que fazer, na ordem certa, para tomar posse de tudo.
4. Os demais documentos, conforme a dúvida específica (tabela abaixo).

## Índice

| Arquivo | Conteúdo |
|---|---|
| [HANDOVER.md](HANDOVER.md) | Resumo executivo: visão geral, status, pendências, checklists de transferência e de onboarding |
| [ARQUITETURA.md](ARQUITETURA.md) | Diagrama e explicação de cada camada (front-end, Supabase, Netlify, automações) |
| [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md) | As 52 tabelas, 19 views, 25 funções, 37 triggers, RLS, índices, extensões e buckets de Storage |
| [INFRAESTRUTURA.md](INFRAESTRUTURA.md) | Netlify, GitHub, Supabase — o que cada serviço hospeda e como estão conectados |
| [DEPLOY.md](DEPLOY.md) | Como publicar uma mudança, como subir o ambiente do zero |
| [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md) | Toda variável/segredo usado, onde mora, e os 2 segredos hardcoded que precisam ser trocados |
| [INTEGRACOES.md](INTEGRACOES.md) | Mapa de todo serviço externo (Supabase, Netlify, Power Automate/Teams, WhatsApp/Meta, draw.io, CDNs) |
| [AUTENTICACAO.md](AUTENTICACAO.md) | Como o login funciona, papéis de usuário, rate limiting, sessões |
| [SEGURANCA.md](SEGURANCA.md) | RLS, CSP, segredos expostos, LGPD, achados de auditoria |
| [API.md](API.md) | API REST automática do Supabase (PostgREST), RPCs e as 8 Edge Functions |
| [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md) | O que cada módulo faz e por quê, extraído do código real |
| [FLUXOS.md](FLUXOS.md) | Fluxogramas dos processos centrais (esteira, produção→esteira, backup) |
| [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md) | Passo a passo para migrar tudo para outra organização |
| [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md) | Como funciona o backup diário e como restaurar |
| [PENDENCIAS.md](PENDENCIAS.md) | Toda fragilidade, risco e TODO encontrado, com localização exata |
| [CHANGELOG.md](CHANGELOG.md) | Histórico do projeto, do commit inicial até hoje |

## Como esta documentação foi produzida (método e limites)

- **Código-fonte**: leitura completa de `app.js` (8.197 linhas) e `index.html`, dividida em 6
  blocos analisados em paralelo, mais leitura direta dos arquivos de configuração
  (`netlify.toml`, `_headers`, `_redirects`, `config.js`, `server.ps1`, `.gitignore`).
- **Banco de dados**: consultado diretamente via SQL no projeto Supabase real — não é uma cópia
  de migração antiga. Todas as tabelas, colunas, chaves estrangeiras, índices, policies de RLS,
  funções (com o código-fonte completo de cada uma), triggers, views, extensões, buckets de
  Storage e o agendador `pg_cron` foram lidos ao vivo em 2026-08-08.
- **Edge Functions**: código-fonte completo das 8 funções obtido diretamente do Supabase.
- **Netlify/GitHub**: configuração do site lida via API do Netlify; branches e histórico via
  `git`.
- **Histórico**: `git log` completo (172 commits, de 2026-07-25 a 2026-08-08).

**O que este pacote não cobre / não pôde confirmar** — listado em detalhe em
[PENDENCIAS.md](PENDENCIAS.md) e sinalizado em cada documento onde aparece, mas resumindo:
- Configurações que só existem no **dashboard** do Supabase/Netlify e não em SQL/arquivo (ex.:
  se "confirmação de e-mail" está ligada no Supabase Auth, plano de billing exato, política de
  backup automático do próprio Supabase) — precisam ser conferidas por quem tiver acesso ao
  painel.
  Não há CLI/ferramenta de terminal disponível no ambiente em que isso foi auditado.

Nenhuma informação foi inventada. Onde não foi possível confirmar algo com o acesso disponível,
o documento correspondente diz isso explicitamente e explica onde procurar.
