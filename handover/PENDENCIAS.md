# Pendências, riscos e pontos frágeis

Lista consolidada de tudo que foi encontrado nesta auditoria (leitura completa do código +
banco). Cada item tem localização exata. Nada aqui foi inventado — cada linha corresponde a algo
lido diretamente no código-fonte, no schema do banco, ou a uma pergunta que não foi possível
responder com o acesso disponível.

## Segurança (alta prioridade)

| # | Item | Onde | Ação recomendada |
|---|---|---|---|
| 1 | URL do webhook do Power Automate/Teams hardcoded (com assinatura embutida) | função SQL `enviar_alerta_teams()`, 2 sobrecargas | trocar ao migrar — [SEGURANCA.md](SEGURANCA.md) |
| 2 | Token de verificação do WhatsApp hardcoded | Edge Function `whatsapp-webhook` | mover para env var |
| 3 | Secret do endpoint `alerta-plantao` hardcoded | Edge Function `alerta-plantao` | mover para env var |
| 4 | `whatsapp-webhook` não valida assinatura (`X-Hub-Signature-256`) da Meta | Edge Function `whatsapp-webhook` | qualquer um pode inserir mensagem falsa em `whatsapp_mensagens` fazendo POST direto |
| 5 | Policies de `laudos_credito*` usam `using(true)` — fora do padrão do resto do banco | RLS em `laudos_credito`, `laudos_credito_modelos`, `laudos_credito_campos`, `laudos_credito_valores`, `laudos_credito_fluxo` | alinhar a `is_write_role()`/`nao_eh_cliente()` |
| 6 | Bucket `fluxogramas-uploads` é público sem expiração | Storage | trocar para signed URL, como os outros buckets sensíveis |
| 7 | RLS de `staging` é mais permissivo que o de `public` (papel `leitura` escreve em staging onde não escreveria em produção) | policies de `staging` | documentado — não testar controle de acesso em staging |
| 8 | Cabeçalhos de segurança/CSP definidos em 2 arquivos redundantes | `netlify.toml` + `_headers` | consolidar em um só |

Detalhe completo de cada um: [SEGURANCA.md](SEGURANCA.md).

## Concorrência / integridade de dado

| # | Item | Onde | Risco |
|---|---|---|---|
| 9 | Numeração automática de demanda por `max(numero)+1`, sem lock explícito visível | trigger `proximo_numero_demanda` | número duplicado sob inserts concorrentes (ex.: importação em lote + cadastro manual ao mesmo tempo) |
| 10 | `ordem` de indicador/etapa calculada por `max(ordem)+1` no client, sem transação | `openApontamento`, `openCadastrarIndicador` (indicadores), reordenação de etapas da Esteira | colisão de `ordem` sob edição simultânea por 2 admins |
| 11 | Reordenar etapa da Esteira faz 2 `UPDATE` separados (trocar `ordem` entre vizinhas), sem transação | `openGerenciarEtapas`/telas de Fluxos da Esteira | se o segundo falhar após o primeiro, duas etapas ficam com a mesma `ordem` |
| 12 | Exclusão de demanda remove registros relacionados em chamadas HTTP sequenciais, sem transação | `openForm` (exclusão) | se o delete final falhar, dado relacionado já foi perdido mesmo com a demanda ainda existindo |
| 13 | Exclusão de processo da Esteira não remove `esteira_validacoes`, `laudos_credito*`, `processo_mensagens`, `repasse_checklist`, nem arquivos do bucket | `openProcessoEsteira` (excluir) | dado/arquivo órfão no banco/Storage |
| 14 | Exclusão de chamado não remove anexos (bucket nem tabela) | `openChamado` (excluir) | arquivo órfão |
| 15 | Laudo de Crédito: limpar um campo preenchido não apaga o valor no banco (`upsert` só grava campo não-vazio) | `openProcessoEsteira`, salvar laudo | valor "fantasma" reaparece na próxima abertura |

## Lógica duplicada ou inconsistente

| # | Item | Onde |
|---|---|---|
| 16 | Criação de indicador novo implementada 2 vezes, independentemente | `openApontamento` (inline) e `openCadastrarIndicador` |
| 17 | Dois caminhos paralelos para "enviar para Emissão de Contrato" (trigger de banco por `parecer_credito`, e client-side por comparação de **texto** do botão de transição) | `avancar_automacao_esteira` (trigger) vs. `openProcessoEsteira` (busca por substring "enviar para Emissão de Contrato" no rótulo) |
| 18 | Mesmo padrão frágil para "devolver ao Incorporador" (substring no rótulo configurável) | `openProcessoEsteira` |
| 19 | Identificação de etapa de "boleto"/"assinatura" no Portal por regex no **nome** da etapa, não por um id/flag fixo | `portalFaixaBoleto`, `portalMarcosContrato` |
| 20 | 3 fórmulas diferentes de "desempenho do analista" no sistema (ranking do Dashboard, IGP do Executivo, eficiência da seção Equipe), mais a da view `meta_colaborador_resultado` — nenhuma delas é usada pelas outras | ver [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md#dashboard-executivo--3-fórmulas-de-desempenho-diferentes-convivendo-no-sistema) |
| 21 | No IGP do Executivo, "Produtividade" (20%) e "Metas atingidas" (10%) usam exatamente o mesmo insumo (`pctMeta`) — 30% do índice repete o mesmo fator sob dois rótulos | `execIGP` |
| 22 | Checklist de implantação tem 2 triggers fazendo a mesma coisa (`trg_impl_ck_concluido` e `trg_implantacao_checklist_sync`, ambos forçam `concluido = (status_validacao='Aprovado')`) | banco, tabela `implantacao_checklist` |
| 23 | Capacidade operacional do Executivo assume semana de 5 dias úteis, enquanto o resto do sistema trata fim de semana como produção normal (tem meta própria de FDS) | `execSecaoEquipe` |
| 24 | KPIs "produtividade do dia/semana/mês/ano" no Executivo não seguem o filtro de período escolhido pelo usuário | `execCalcular` |

## Funcionalidades incompletas / placeholders

| # | Item | Onde |
|---|---|---|
| 25 | Botão "Configurar" acesso por empreendimento no Portal só mostra `alert("em breve...")` — controle de acesso por empreendimento é só binário (ativo/inativo pro portal inteiro) | `renderPortalEmpreendimentos` |
| 26 | Variável `prodMes` sempre `null` nos dois ramos de uma condicional — código incompleto, não removido | `renderOperacoes` |
| 27 | SLA por etapa no Portal do Cliente — comentário explícito no código confirma que não foi implementado ainda | `renderPortalProcesso` |
| 28 | Nome da aba de exportação `ESCALA-2026` tem o ano fixo no código-fonte | `exportarPlanilhaCompleta` |

## Tabelas / código possivelmente órfãos

| # | Item | Achado |
|---|---|---|
| 29 | Edge Function `criar-usuario` | existe e está publicada (ACTIVE), mas **nenhum ponto de `app.js` a invoca** (confirmado por busca em todo o arquivo) — todo fluxo de criação usa `convidar-usuario` |
| 30 | Tabela `indicador_analista_mensal` | schema completo (colunas, índice único), mas nenhuma tela em `app.js` lê ou escreve nela — não identificado se foi abandonada ou é para um uso futuro |
| 31 | Tabela `whatsapp_mensagens` | recebe insert da Edge Function `whatsapp-webhook`, mas nenhuma tela do sistema lê essa tabela — mensagens chegam e ficam "presas" no banco |
| 32 | Função `corrige_doc(v text)` | existe no banco (normaliza CPF/CNPJ legado), sem chamada identificada em `app.js` — provavelmente usada uma vez, manualmente, numa correção de dado histórica |
| 33 | Vínculo `fups` ↔ `clientes` é por casamento de nome (case-insensitive, sem acento), não por FK | `openPerfilCliente` — comentário no próprio código chama isso de "melhor esforço" |
| 34 | `meu_analista_id()` tem fallback por casamento de nome quando `perfis.analista_id` não está preenchido | função no banco — mesmo padrão frágil do item 33, mas para resolução de identidade de login |

## Informação que esta auditoria não conseguiu confirmar

| # | Item | Como localizar |
|---|---|---|
| 35 | Visibilidade exata do repositório GitHub (público/privado) e lista de colaboradores/times | `github.com/ANAP88/gestao-setor-vendas/settings` — sem `gh` CLI disponível no ambiente desta auditoria |
| 36 | Branch protection rules do GitHub | idem |
| 37 | Plano de billing exato do Supabase e seus limites (linhas, egress, invocações) | Supabase Dashboard → Settings → Billing |
| 38 | Se PITR (point-in-time recovery) da própria Supabase está ativo, e em qual janela | Supabase Dashboard → Database → Backups |
| 39 | Se "confirmação de e-mail obrigatória" e outras configurações de Auth do Supabase estão ligadas | Supabase Dashboard → Authentication → Settings — não é visível via SQL |
| 40 | Variáveis de ambiente configuradas no Netlify (Site settings → Environment variables) | dashboard do Netlify — a leitura via API feita nesta auditoria não lista esse detalhe |
| 41 | Corpo/lógica interna exata das Edge Functions **antes** de mudanças futuras (o código foi obtido direto do Supabase, não está versionado em `supabase/functions/` neste repositório Git) | ver item 42 abaixo |

## Recomendação estrutural (não é bug, é lacuna de processo)

- **Código das Edge Functions não está no Git.** Hoje ele só existe no Supabase (obtido para
  este handover via API). Qualquer alteração feita direto no dashboard do Supabase não fica
  registrada no histórico do repositório, e não há como comparar versões. Recomendação: criar
  `supabase/functions/<nome>/index.ts` no repositório para cada uma das 8 funções (conteúdo em
  [API.md](API.md)) e adotar `supabase functions deploy` como único caminho de publicação delas
  daqui para frente.
- **Não existe um arquivo de schema único e versionado do banco.** Os arquivos em `migrations/`
  documentam mudanças pontuais recentes, não o schema inteiro desde o início — reconstruir o
  banco do zero hoje depende de `pg_dump` do projeto atual, não de rodar os arquivos de
  `migrations/` em sequência (ver [DEPLOY.md](DEPLOY.md)).
- **Sem testes automatizados.** Toda validação é manual em `staging`. Não é uma falha pontual,
  é uma característica do projeto — vale ser dito explicitamente para quem for assumir, para não
  presumir que existe uma suíte de testes escondida em algum lugar.
