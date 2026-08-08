# Changelog

Resumo temático do histórico real do projeto, a partir de `git log` (172 commits,
2026-07-25 a 2026-08-08, branches `main`/`staging`). Commits de merge ("Merge branch 'main' into
staging", ~43 ao todo) foram omitidos por não terem conteúdo próprio. Ordem: mais recente
primeiro. Hashes curtos entre parênteses para localizar o commit exato com `git show <hash>`.

## 2026-08-07 a 2026-08-08 — Laudo de Crédito, vínculo Qualidade↔Metas, identidade visual do Portal, publicação em produção

- Laudo de Crédito com modelo de campos dinâmicos por incorporadora, ajustado depois para bater
  com uma planilha real de referência (`f7de142`, `2497d46`).
- Importação de "Produtos em Implantação" via planilha em lote (`b4c5290`).
- Correção de cor-padrão gravada por engano na extração automática de identidade visual + opção
  de cadastrar indicador direto em Metas (`1b08516`).
- Identidade visual do Portal passa a ler logo/cor automaticamente do site da incorporadora
  (`6e763c0`), com link exclusivo por `/portal/<slug>` (`69e9765`), correção do fluxo (pull
  automático em vez de botão separado) (`0ecbc47`) e barra lateral do portal usando a cor real da
  incorporadora em vez do teal fixo da Neo (`cfbc1d7`).
- Vínculo automático de Qualidade/Retrabalho e Produção com Metas & Indicadores por analista
  (`cf12ae2`), com contagem de erro automática para todos os 6 indicadores, não só 2 (`ecb7c58`).
- Troca de todos os emojis da interface por ícones SVG (`bc4a720`) e diversos ajustes visuais de
  profissionalização (login, Início, Portal — `280277d` até `4ef4dbb`).
- Documentação da replicação de todas as migrações de `staging` para `public` e publicação final
  em produção (`f9ecd8e`, merge `7a43cbc`).

## 2026-08-06 — Organização de documentação
- Reorganização do guia de transferência (`f659de7`).

## 2026-08-02 a 2026-08-04 — Dashboard Executivo, auditoria, correção de staging
- Telas reais do Portal do Incorporador no lugar de placeholders (`0fb5e02`).
- Correção de perda de sessão ao usar Portal e sistema interno na mesma máquina (`e199fd1`).
- Auditoria (log de acessos e de alterações), cadastro em massa, vínculo Produção→Esteira
  (`8b90b63`).
- Dashboard Executivo de produtividade e performance — IGP, eficiência por analista, matriz de
  portfólio (`fe372af`).
- Correção de gaps reais no ambiente de staging: 51 FKs, 12 chaves únicas e 18 views recriadas,
  porque o espelhamento diário copiava dado mas não recriava constraints/views (`73bbb7d`).
- Ampliação dos status de checklist de Implantação + trava de conclusão via trigger (`1a0b003`),
  documentação da migração de status/avanço (`44ce982`).
- Admin passa a escolher quem entra no ranking/produtividade (`ab71c63`, `2ac1e83`).
- Atualização do resumo executivo com números reais (`48096c5`) — nota: banco de produção foi
  **zerado intencionalmente** nessa data para recomeço (dados operacionais, não cadastros).

## 2026-07-31 — Hardening de segurança
- Hardening contra reconhecimento/inspeção externa (`d6a0095`).
- Correção de CSP bloqueando o CDN do Supabase, mais rate limiting, injeção via PostgREST e
  senha em texto puro (`783fd60`).
- Correção de CSP bloqueando Google Fonts, iframe de fluxograma e imagens do Storage (`f395539`).
- **Rate limiting de login movido para o servidor** (as funções `login_esta_bloqueado`/
  `registrar_falha_login`/`limpar_tentativas_login` datam desta janela) e remoção do último
  resíduo de senha em texto puro (`8267dec`).

## 2026-07-29 a 2026-07-30 — Portal do Incorporador (fases 1-3), Repasse Imobiliário, Central de Interações
- Portal do Cliente Fase 1: login próprio, papel `cliente`, dashboard somente-leitura em tempo
  real via Realtime, RLS por `empreendedora_id` (`c8fafdd`).
- Módulo de Repasse Imobiliário Fase 1: cadastro completo do cliente, coobrigados, workflow das
  28 etapas reaproveitando o motor da Esteira (`b74c786`).
- Repasse Fase 2: Biblioteca do Repasse (formulários por banco, base de conhecimento, cartórios,
  prefeituras) (`431db63`).
- Convite/reset de usuário passa a montar e-mail de acesso pronto em vez de mostrar senha num
  prompt (`d1084d5`).
- Central de Interações: chat em tempo real entre cliente do Portal e equipe, por processo
  (`f41fc13`).
- Identidade visual passa a ser da incorporadora (não do empreendimento), exibida no cabeçalho do
  Portal; exclusão de apontamento de Qualidade passa a exigir aprovação de admin (`08fce2e`).
- Reorganização de menu: Administração e Portal do Cliente como grupos próprios, sem misturar
  usuários da equipe com usuários do portal (`690ef80`).
- Automação completa do fluxo Crédito→Contrato: 5 status de parecer, criação automática do card
  de contrato via trigger, campo "será faturado?" propagando para o Fechamento (`31b14aa`) — é a
  base da automação de banco documentada em [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md).
- Redesign do Portal seguindo referência visual real; correção de 3 bugs que impediam o Portal de
  funcionar (e-mail não carregava, incorporadora sem permissão de leitura, detalhe do processo
  quebrando) (`95eac27`).
- Varredura de bugs: Biblioteca do Repasse quebrava por completo por uma constante nunca criada
  (`154eb6e`) — 26 telas testadas manualmente após a correção.
- Análise de Crédito reorganizada em 3 blocos com parecer via lista suspensa e roteamento
  automático (`f25ad0a`).
- Separação do Portal do Cliente da Administração interna, redesenho da visão geral do portal
  (funil, donut de status, menu completo) (`36621bb` até `1bd4eaa`).

## 2026-07-28 — Correções de importação/exportação, anexos, primeiro acesso
- Botão de reset de senha pelo admin via Edge Function nova, corrigindo bloqueio real de usuário
  por limite de envio de e-mail do Supabase (`f62f211`).
- Esteira passa a rastrear quem validou cada etapa (`esteira_validacoes`) e gera automaticamente
  apontamento de erro em regressão, exceto pedido do vendedor (`203bdb1`) — base do fluxo
  documentado em [FLUXOS.md](FLUXOS.md#2-regressão-de-etapa--erro-automático-de-retrabalho).
  Correção crítica de segurança: view `demandas_sla` era `SECURITY DEFINER` (ignorava RLS) e a
  função de alerta do Teams podia ser disparada sem login via API (`bba6761`, referenciado no
  mesmo dia).
- Tela de Arquivos (Excel de Fechamento, PPT), Fluxos da Esteira editável pelo admin sem
  depender de migração, importação de planilha direto para Produção/Fechamento (`e76fbcb`).
- Handoff documental: README com diagrama e decisões de design, `AUTHORS.md`, resumo executivo
  com números reais, confirmação por clone limpo de que nada ficou de fora (`2052ba0`).
- Upload de outros fluxogramas (imagem/PDF/`.drawio`) direto pela tela, sem depender de código
  (`c3832f9`).
- Blindagem de criação/edição de processo na Esteira contra falha silenciosa (`83b9922`).
- Correção da importação de planilha: a planilha real tem aba de referência oculta antes dos
  dados — o importador lia a aba errada (vazia) (`2c74dec`).
- Validador de CPF/CNPJ com dígito verificador real, sem OCR, avisando de duplicidade (`1aa1f72`)
  — a mesma correção de fundo que motivou a correção em massa de 7.234 CPFs corrompidos na
  importação antiga (`0-` virando `-` na digitação, `81b8f84`).
- Correção da fórmula de atingimento em Metas para bater com a planilha de referência:
  `Esperado = Processos × Meta`, `Atingimento = (Processos−Erros)/Esperado` (`4612c82`).
- Convite de usuário para de depender do serviço de e-mail do Supabase (que atingia limite de
  envio) — cria conta com senha temporária mostrada ao admin (`0f41440`).
- Correção de policy de RLS que bloqueava silenciosamente o próprio usuário de completar o
  cadastro (só havia policy de admin para `UPDATE` em `perfis`) (`eb20863`).
- Anexo em Chamados entre Áreas, com link de download assinado de 7 dias no corpo do e-mail
  montado (`d286ffb`).

## 2026-07-26 a 2026-07-27 — Metas & Indicadores, Qualidade, Implantação, ambiente de staging
- Ambiente de teste: detecção automática por domínio, schema `staging` isolado (`d6a0095`,
  primeira aparição em `d6d0ab7`) — base do que hoje é `EH_STAGING` em `app.js`.
- Preparação para transferência de organização: credenciais extraídas para `config.js`,
  `TRANSFERENCIA.md` criado (`11fb507`).
- Metas & Indicadores (6 KPIs com acompanhamento mensal/trimestral, histórico importado),
  Qualidade/Retrabalho (7 categorias), Produtos em Implantação (18 produtos, checklist,
  criticidade por prazo) — mais correção de 2 falhas de segurança reais: view `demandas_sla`
  como `SECURITY DEFINER` e `enviar_alerta_teams` disparável sem login (`bba6761`).
- Fluxo BPMN completo de Emissão de Contrato (Geração→Verificação→Envio→Assinaturas→ERP), com
  desvios de revisão e pagamento pendente; transições passam a vir do banco em vez de escolha
  livre (`e98c88b`).
- Diversos ajustes de correção encontrados ao reler as planilhas-fonte originais: status real de
  colaboradores, checklist de implantação usando modelo errado (Loteamento em vez de
  Incorporação) (`80f326d`).
- Redesign visual: tema escuro com neon trocado por tema claro corporativo (`4f7ea08`), depois
  ajustado com gradiente teal na sidebar/login (`136fc16`, `0a43328`).

## 2026-07-25 — Fundação do sistema
- Versão inicial (`32d26ed`).
- Login redesenhado, correção crítica de segurança logo em seguida: vazamento de dado em views
  públicas, escalonamento de privilégio em `perfis`, RLS por nível de acesso em todas as tabelas
  (`e8da33d`) — este é o commit que estabeleceu o modelo de RLS que o sistema usa até hoje.
- Score de produtividade replicando a fórmula original da planilha, Modo Apresentação
  (`d95ec65`, `5c47389`).
- Módulo Esteira de Produção criado pela primeira vez (fila por etapa, histórico automático,
  anexos, etapas configuráveis) (`8d80e78`).
- Correção de 57 datas com erro de digitação, fusão Dashboard+Produção numa tela só (`8cf9f81`).
- Unificação de analistas/empreendimentos/atividades duplicados por grafia (`f83f73b`, `e0574cb`).

---

Para o estado atual (não histórico) de cada módulo, ver [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md).
Para os dois achados de segurança mais recentes (não corrigidos ainda), ver [SEGURANCA.md](SEGURANCA.md).
