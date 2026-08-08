# HANDOVER — Resumo executivo

**Sistema:** Gestão Setor de Vendas — Neo Service
**Data deste handover:** 2026-08-08
**Autoria original:** Ana Patrícia da Silva (ver `AUTHORS.md` na raiz do repositório)

## Visão geral do sistema

Sistema interno de gestão da Secretaria de Vendas da Neo Service, que substitui um conjunto de
planilhas dispersas e comunicação informal por e-mail/WhatsApp. Cobre: produção (entrada de
processos), esteira de análise de crédito e emissão de contrato (com automação de roteamento),
metas e indicadores ponderados por colaborador, qualidade/retrabalho, fechamento mensal, escala
de plantão, repasse bancário, chamados entre áreas, cadastros operacionais, e um **Portal do
Incorporador/Cliente** onde as incorporadoras parceiras acompanham em tempo real os próprios
processos, com identidade visual própria.

Contexto de negócio completo (o que existia antes, o que o sistema substitui, por que importa):
`RESUMO-EXECUTIVO.md` na raiz do repositório.

## Arquitetura

Front-end estático (HTML/CSS/JS puro, sem framework, sem build) + Supabase (Postgres, Auth,
Storage, Edge Functions, `pg_cron`) + Netlify (hospedagem). Sem servidor de aplicação próprio —
toda regra de negócio ou vive em triggers do Postgres, ou no `app.js` rodando no navegador,
protegida por RLS no banco. Diagrama completo e decisões de design em
[ARQUITETURA.md](ARQUITETURA.md).

## Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Front-end | HTML + CSS + JavaScript puro (ES Modules), sem TypeScript, sem framework, sem bundler |
| Bibliotecas de terceiro | `@supabase/supabase-js@2` (CDN, não fixada em versão exata), `xlsx@0.18.5`/SheetJS (CDN, fixada) |
| Banco de dados | PostgreSQL 17 (via Supabase), 2 schemas (`public`/produção, `staging`/teste) |
| Autenticação | Supabase Auth, e-mail/senha |
| Armazenamento de arquivo | Supabase Storage, 8 buckets |
| Backend sob demanda | 8 Supabase Edge Functions (Deno) |
| Automação agendada | `pg_cron` + `pg_net`, dentro do próprio Postgres (4 jobs) |
| Hospedagem | Netlify (deploy automático a partir do GitHub) |
| Controle de versão | Git/GitHub (`ANAP88/gestao-setor-vendas`), branches `main`/`staging` |

## Dependências

- **Supabase** — dependência crítica única. Todo dado, autenticação, arquivo e automação
  server-side vivem lá. Sem lock-in de fato (é Postgres padrão), mas migrar para fora do Supabase
  exige substituir Auth/Storage/Edge Functions por equivalentes.
- **Netlify** — substituível por qualquer host de arquivo estático (ver
  [DEPLOY.md](DEPLOY.md)), sem lock-in.
- **jsDelivr (CDN)** — 2 bibliotecas JS carregadas em runtime, sem cópia local. Se o CDN cair, o
  sistema perde a conexão com o Supabase (a própria lib do cliente vem de lá) e a
  importação/exportação de planilha.
- **Power Automate** — recebe o webhook de alerta do Teams; se o fluxo do Power Automate for
  desligado ou o webhook expirar, o alerta simplesmente para de chegar (sem erro visível no
  sistema).
- Lista completa: [INTEGRACOES.md](INTEGRACOES.md).

## Status atual do projeto

Sistema **em produção e em uso ativo** pela equipe (8 usuários ativos, 7 analistas cadastrados
em 2026-08-04, conforme `RESUMO-EXECUTIVO.md`). O banco de produção teve os dados
**operacionais** (processos, esteira, chamados, apontamentos) zerados intencionalmente em
2026-08-04 para um recomeço — cadastros (usuários, analistas, incorporadoras) foram mantidos.
Desenvolvimento ativo e contínuo: 172 commits entre 2026-07-25 e 2026-08-08 (ver
[CHANGELOG.md](CHANGELOG.md)).

## Funcionalidades prontas

- Produção (cadastro/importação de processos, validação de CPF/CNPJ)
- Escala de plantão + alerta automático (Teams, 2x/dia)
- Esteira de Análise de Crédito e Emissão de Contrato, com automação de roteamento por trigger
- Módulo de Repasse Imobiliário (28 etapas) + Biblioteca de referência
- Qualidade/Retrabalho, com atribuição automática por regressão de etapa e fluxo de aprovação de
  exclusão
- Metas & Indicadores (pesos/alvos trimestrais por colaborador, cálculo ponderado)
- Fechamento mensal (com exportação no layout da planilha histórica)
- Implantação de sistemas (checklist com trava de conclusão, criticidade automática)
- Chamados entre áreas
- Cadastros operacionais completos + Administração de usuários
- Auditoria (log de alterações e de acessos)
- Portal do Incorporador/Cliente (dashboard, processos, pendências, boletos, chat em tempo real,
  documentos, base de conhecimento, relatórios) com identidade visual própria por incorporadora
- Laudo de Crédito com modelo de campos dinâmico por incorporadora (mais novo, ver abaixo)
- Backup diário próprio (17 tabelas) + espelhamento diário para o ambiente de teste

## Funcionalidades em andamento

- **Laudo de Crédito** — schema e UI completos, publicado em produção em 2026-08-07/08, mas
  **ainda não validado em uso real pela equipe** (é a mudança mais recente do projeto). Tem uma
  lacuna conhecida: limpar um campo já preenchido não apaga o valor salvo (ver
  [PENDENCIAS.md](PENDENCIAS.md), item 15).
- **Base do Dashboard Executivo** — funcional, mas com 3 fórmulas de desempenho de analista
  coexistindo sem uma definição "oficial" única (ver [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md)).

## Funcionalidades planejadas (lacunas assumidas explicitamente no próprio código)

- SLA por etapa no Portal do Cliente (comentário no código confirma: ainda não configurado).
- Controle de acesso por empreendimento no Portal, granular por usuário (hoje é só liga/desliga
  por empreendimento inteiro — botão "Configurar" existe na tela mas é um placeholder).
- Envio de WhatsApp (hoje só recebe mensagens inbound via webhook; não há tela para ler nem
  responder).

## Bugs conhecidos e pontos frágeis

Lista completa, com localização exata, em [PENDENCIAS.md](PENDENCIAS.md). Resumo dos mais
importantes:
- 3 segredos hardcoded no código-fonte (webhook do Teams, token do WhatsApp, secret de um
  endpoint) — precisam ser trocados na transferência.
- Numeração automática de demanda (`max+1`) sem proteção explícita contra concorrência.
- RLS de `staging` mais permissivo que o de `public` — não confiar em staging para testar
  permissão por papel.
- Vários pontos de exclusão que não limpam registro/arquivo relacionado (ficam órfãos).
- Duas Edge Functions (`criar-usuario`) e uma tabela (`indicador_analista_mensal`) parecem não
  estar em uso por nenhuma tela.

## Pendências

Ver lista completa e categorizada em [PENDENCIAS.md](PENDENCIAS.md) — segurança, concorrência,
lógica duplicada, funcionalidades incompletas, código órfão, e o que esta auditoria não
conseguiu confirmar (acesso de dashboard, não de código/SQL).

## Próximos passos recomendados

1. Trocar os 3 segredos hardcoded (prioridade de segurança, independente de qualquer migração).
2. Validar o módulo de Laudo de Crédito em uso real e corrigir a lacuna de valor não-apagado.
3. Decidir, com quem faz a gestão da equipe, qual das fórmulas de desempenho de analista é a
   "oficial", e consolidar as outras (ou documentar explicitamente por que coexistem).
4. Versionar o código das Edge Functions no próprio repositório Git (hoje só existe no
   Supabase).
5. Avaliar mover as Edge Functions para usar variável de ambiente em vez de segredo hardcoded.
6. Se for continuar crescendo, observar o tamanho de `app.js` (8.197 linhas hoje) como um limite
   a acompanhar — ver a discussão de complexidade/manutenibilidade que motivou parte deste
   trabalho de documentação.

## Checklist para transferência

Ver checklist completo e executável em [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md). Resumo:

- [ ] Transferir posse do repositório GitHub
- [ ] Transferir posse do projeto Supabase (recomendado, em vez de recriar)
- [ ] Trocar os 3 segredos hardcoded
- [ ] Atualizar `config.js` se o projeto Supabase mudou de URL/chave
- [ ] Reconectar/reconfigurar o Netlify (ou migrar de host, se for o caso)
- [ ] Rodar o checklist de validação pós-migração completo (banco, aplicação, segurança)

## Checklist para entrada de um novo desenvolvedor

- [ ] Ler este arquivo, depois [ARQUITETURA.md](ARQUITETURA.md).
- [ ] Rodar `./server.ps1` (ou `npx serve`) e abrir o sistema localmente — lembrar que qualquer
      host diferente do domínio de produção usa automaticamente o schema `staging`.
- [ ] Ler [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md) antes de mexer em qualquer tabela — muita regra
      de negócio vive em trigger, não no `app.js`.
- [ ] Ler [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md) do módulo específico que for tocar.
- [ ] Ler [SEGURANCA.md](SEGURANCA.md), principalmente a seção sobre `staging` ser mais
      permissivo que `public`, antes de testar qualquer coisa relacionada a permissão.
- [ ] Seguir a disciplina do projeto: **toda mudança primeiro em `staging`, validada, só depois
      mesclada em `main`** — ver [DEPLOY.md](DEPLOY.md).
- [ ] Antes de qualquer migração de banco em produção, ler
      [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md) e fazer um backup manual.
- [ ] Consultar [PENDENCIAS.md](PENDENCIAS.md) antes de "corrigir" algo que pareça estranho —
      pode já ser um comportamento conhecido e intencional (ou um problema já mapeado, com
      contexto do porquê ainda não foi resolvido).
