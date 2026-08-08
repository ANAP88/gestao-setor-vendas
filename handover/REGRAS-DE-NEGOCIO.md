# Regras de negócio

Extraído de leitura completa do `app.js` (8.197 linhas, lido integralmente, em blocos) e
cruzado com as funções/triggers do banco. Organizado por módulo, na mesma ordem do menu do
sistema. Fluxos com mais de um passo (diagramas) estão em [FLUXOS.md](FLUXOS.md); aqui é regra
de negócio: fórmulas, validações, quem pode o quê.

## Controle de acesso por tela

`podeVer(view)` é binário: `admin` vê tudo; qualquer outro papel não vê a lista `VIEWS_GESTAO`
(telas de gestão/configuração). Não há distinção de menu entre `analista` e `leitura` — a
diferença entre eles é só no que cada um pode escrever (RLS). Detalhe em
[AUTENTICACAO.md](AUTENTICACAO.md).

## Início e Dashboard

- **Início**: hub de atalhos = `PILARES` (estrutura fixa de grupos) filtrados por `podeVer`.
  Saudação por horário do relógio do navegador do usuário (não do servidor).
- **Modo Apresentação**: alterna nomes de analista para `Colaborador N` na tela — só exibição,
  não persistido (reseta ao recarregar), não afeta dado exportado.
- **Filtro de período**: presets fixos (hoje/ontem/7-90 dias/mês atual-anterior/3-12 meses/ano
  atual-anterior/personalizado), default 12 meses. Agrupamento automático do gráfico de volume:
  ≤31 dias→dia, ≤180→semana, ≤1095→mês, senão→ano.
- **Meta diária/semanal/fim de semana**: valores em `metas_config` (editável só por admin);
  meta de fim de semana definida pelo admin tem prioridade sobre a sugestão estatística
  (`metas_fds`, média histórica ±15%). Farol: ≥100% verde, ≥70% amarelo, <70% vermelho.
- **Dias de lançamento** (`eventos_especiais`) podem ser excluídos das médias via toggle, para
  não distorcer capacidade normal da equipe.
- **Ranking de produtividade** (`ranking_analistas`): `score = 100 × (0.4 × taxa_conclusão +
  0.6 × volume/maior_volume_do_mês)`. Classificação: ≥90 Alta, ≥78 Média, <78 Baixa. Todo
  colaborador elegível (`entra_no_painel !== false`, status Ativo/Em licença) aparece mesmo sem
  produção no período (zerado).
- **"Quem entra no painel"**: toggle admin por colaborador, persistido em
  `analistas.entra_no_painel`, afeta ranking/escala/metas de todo mundo que abrir essas telas.

### Dashboard Executivo — 3 fórmulas de desempenho diferentes convivendo no sistema

Achado relevante para quem for mexer aqui: **não existe uma única definição de "quão bem um
analista está indo"** — há três, mais a da view de Metas:

| Onde | Fórmula |
|---|---|
| Dashboard (Visão Geral) → ranking | `100 × (0.4×conclusão% + 0.6×volume relativo ao melhor do mês)` |
| Executivo → Índice Geral de Performance (IGP) | 30% SLA + 20% Produtividade + 15% Retrabalho + 15% Tempo médio + 10% Concluídos + 10% Metas atingidas — **"Produtividade" e "Metas atingidas" usam o mesmo insumo (`pctMeta`), então esse fator pesa 30% do total sob dois rótulos** (não confirmado com a área de negócio se é proposital) |
| Executivo → seção Equipe | `eficiência = 0.45×conclusão% + 0.40×SLA% − 2×retrabalho% + 15` |
| `meta_colaborador_resultado` (view, usada em Metas & Indicadores) | `atingimento = 1 − erros/processos`, dividido pelo alvo trimestral, teto ≈1.0204 |

Antes de mudar qualquer uma, confirmar com quem faz a gestão qual delas é a "oficial" hoje.

- **`execCarregar`**: sempre traz o período atual **e** o período anterior de mesma duração, para
  comparação. `SLA_PADRAO_H = 24` horas quando a atividade não define `sla_horas` próprio.
  "Atrasado" só se aplica a processo **ainda aberto**; concluído fora do prazo não conta como
  atrasado (só reduz a taxa de dentro-do-SLA).
- **Alertas automáticos do Executivo**: SLA a 80% do prazo consumido; meta do período <80%;
  retrabalho >10%; analista com carga aberta >1.5× a média da equipe; processo parado há mais de
  7 dias — todos limiares fixos no código, não configuráveis pela interface.
- **Inconsistência de premissa**: a seção Equipe do Executivo calcula "dias úteis" como 5/7 da
  semana (ignora fim de semana), enquanto o resto do sistema trata produção de sábado/domingo
  como normal (tem inclusive meta própria de FDS).
- **KPIs "produtividade do dia/semana/mês/ano"** na seção Geral do Executivo **não seguem o
  filtro de período escolhido** — são sempre relativos à data real de hoje.

## Produção (`renderDemandas`, `openForm`)

- Único campo realmente obrigatório: `recebido_em`.
- **Numeração automática** (`demandas.numero`): trigger `max(numero)+1` — sem lock explícito
  identificado, risco de duplicidade sob inserts concorrentes (ex.: importação em lote rodando
  junto com cadastro manual). Ver [PENDENCIAS.md](PENDENCIAS.md).
- **Validação de CPF/CNPJ**: dígito verificador real (módulo 11) calculado em JS
  (`cpfValido`/`cnpjValido`); campo aceita os dois tipos de documento na mesma coluna (comentário
  explícito no código: "o cadastro não distingue os dois campos"). Documento inválido **não
  bloqueia** o salvamento — só pede confirmação extra. Ao sair do campo, avisa (sem bloquear) se
  o mesmo documento já existe em outra demanda.
- **Importação de planilha** (SheetJS): varre todas as abas até achar a que tem a coluna do 1º
  proponente preenchida (a planilha-modelo real tem uma aba de referência oculta antes dos
  dados). Resolve analista/empreendedora/empreendimento/atividade por **nome exato**
  (case-insensitive) contra os cadastros — sem correspondência, o campo fica vazio, sem aviso
  individual. Datas malformadas caem silenciosamente para "hoje". Toda linha importada nasce
  **já `CONCLUIDO`** (diferente do cadastro manual, que nasce `RECEBIDO`) — reflexo de como a
  equipe realmente usa a importação (lançamento retroativo em lote).
- **Exclusão de demanda**: remove em cascata manual (`fups`, `validacao_itens`,
  `apontamentos_erro`) antes de excluir a demanda — chamadas HTTP sequenciais, sem transação.
- **Vínculo automático com a Esteira**: se a `atividade` da demanda for "Análise de Crédito",
  "Análise de Crédito-Cessão", "Reanalise de crédito", "Emissão de Contrato" ou "Reemissão de
  contrato", um trigger cria automaticamente o card correspondente na Esteira. Ver
  [FLUXOS.md](FLUXOS.md).

## Escala de plantão

- Fonte de verdade: `escala_plantao` (analista × data). Só analistas `status` ≠ Inativo/Desligado
  aparecem como opção.
- Alerta de "7 dias seguidos de plantão" é um aviso visual (não bloqueia o cadastro).
- Coluna "Cobertura" no rodapé destaca em vermelho dias sem nenhum analista escalado.
- Alimenta a view `alerta_hoje`, que compara quem está escalado hoje contra quem já lançou
  alguma `demanda` no dia — é a base do alerta automático de plantão (ver
  [FLUXOS.md](FLUXOS.md)).

## Suporte / Chamados entre áreas

- Transparência: todo mundo vê todos os chamados. Edição: só o "dono" (quem abriu, por e-mail)
  ou admin — reforçado por RLS (`upd_chamados`/`del_chamados`), não só pela tela.
- Prioridades fixas (BAIXA/NORMAL/ALTA/CRITICA); área de destino vem de `areas_contato` (com
  opção de digitar uma área livre não cadastrada).
- Não envia e-mail de verdade — monta assunto/corpo e oferece mailto/Gmail web/Outlook
  web/copiar. `enviado_em`/`enviado_por` são gravados **assim que o usuário clica "Registrar e
  enviar"**, antes de qualquer confirmação real de envio — é uma marcação de intenção, não de
  entrega.
- Anexos: bucket privado, download por signed URL de 60s; exclusão de chamado **não limpa** os
  anexos associados (ficam órfãos no bucket e na tabela `chamados_anexos`).

## Qualidade / Retrabalho

- 8 categorias fixas (`CATEGORIAS_ERRO`) com opção de digitar categoria/subcategoria manual.
- Visibilidade: admin vê tudo; qualquer outro papel só os próprios apontamentos — **reforçado por
  RLS** (`select_apontamentos_escopo`), não só filtro de tela.
- **Exclusão exige aprovação**: analista abre solicitação com motivo obrigatório
  (`apontamento_exclusao_solicitacoes`); só admin aprova (e só aí o registro é de fato apagado)
  ou rejeita. "Resolver" um apontamento (fechar sem excluir) é livre, sem aprovação — são fluxos
  de governança diferentes.
- **Classificação por indicador**: campo opcional `indicador_id`; quando marcado, o apontamento
  entra automaticamente na contagem de erro daquele indicador em Metas (ver trigger
  `trg_apontamento_erro_sync_meta` em [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md)). Admin pode criar
  indicador novo direto do formulário — mesma lógica de criação existe **duplicada** de forma
  independente em `openApontamento` e em `openCadastrarIndicador` (Metas), sem reuso de código.
- **Origem automática por regressão de etapa**: quando um processo da Esteira regride, o sistema
  atribui erro automaticamente a quem validou a etapa reaberta (`origem: 'esteira_regressao'`),
  exceto quando o motivo é "pedido do vendedor" — ver [FLUXOS.md](FLUXOS.md).

## Metas & Indicadores

- 6 indicadores fixos hoje (mais os que forem criados pela tela): Emissão de contrato sem erro,
  SLA de respostas, Pós-assinatura, Emissão no prazo, Mapeamento de processos, Reclamações — e
  agora o Laudo de Crédito não entra como indicador, é um módulo à parte.
- **Fórmula por indicador/mês**: `Esperado = Processos × Meta%`; `Atingimento = (Processos −
  Erros) / Esperado` — pode passar de 100% (time errou menos que o esperado para aquele volume).
  Agregação trimestral soma processos/erros primeiro, depois aplica a fórmula (não faz média de
  percentuais mensais).
- **Automação parcial**: `quantidade_erros` de `meta_colaborador_mensal` é **sempre** automática
  (via `apontamentos_erro.indicador_id`). `quantidade_processos` só é automática quando o
  indicador tem `esteira_tipo` configurado (hoje só "Emissão de contrato sem erro" e "Emissão no
  prazo") — os outros 4 indicadores continuam 100% manuais, lançados em "Lançar resultado
  individual". **A tabela de nível equipe (`indicador_mensal`) é sempre manual, mesmo para os
  indicadores com `esteira_tipo`** — a automação do trigger só grava em `meta_colaborador_mensal`
  (nível individual), não em `indicador_mensal`.
- **Peso e alvo por colaborador/trimestre** (`meta_colaborador_indicador`): tela mostra a soma
  dos pesos em tempo real (verde se =100%, laranja senão) mas **não bloqueia** salvar com soma
  diferente de 100%. Salvar **substitui todo o trimestre** (delete + insert), sem versionamento.
- **Nota ponderada do colaborador**: para cada mês, soma `atingimento_final × peso` só dos
  indicadores com lançamento naquele mês, dividido pela soma dos pesos **efetivamente presentes**
  (recalibra automaticamente se faltar lançamento — não trata ausência como zero).
- **Status do colaborador no ranking**: ⚫ Desligado, 🔵 Em licença (zerado, sem cobrança), 🟢
  Excelente (≥1.02) / Ótimo (≥0.95), 🟡 Atenção (≥0.90), 🔴 Abaixo da meta (<0.90) — limiares
  fixos no código.
- Campo "Erros" do lançamento individual é **sempre desabilitado** (é automático,
  incondicionalmente); "Processos" só é desabilitado quando o indicador tem `esteira_tipo`.

## Fechamento mensal

- Lista `demandas` com `fat_mensal=true` no mês, agrupadas por analista.
- Exportação replica o layout exato da planilha histórica da equipe, incluindo coluna calculada
  "Consulta Serasa" = `SIM` se o nome da atividade contém "serasa" (regex, só no export, não
  persistido).
- `fat_mensal` pode ser marcado manualmente ou propagado automaticamente quando um processo da
  Esteira conclui com "será faturado? = SIM" (ver `propaga_faturamento_esteira` em
  [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md)).

## Implantação

- Consome a view `implantacao_painel` (avanço já calculado no banco: Aprovado=1.0, em
  validação=0.66, recebido=0.33, ponderado sobre o total de itens do checklist) — a tela não
  recalcula nada, só exibe.
- **Checklist com 5 status** e trava de conclusão: `concluido` só vira `true` via trigger, quando
  `status_validacao='Aprovado'` — não é gravável direto pela API.
- Criação de novo produto **clona os primeiros 12 itens de checklist de qualquer implantação já
  cadastrada** como modelo (sem filtro explícito de "isto é um template", sem `order`
  determinístico) — ponto frágil, ver [PENDENCIAS.md](PENDENCIAS.md).
- Pendências têm status próprio (Pendente/Em validação/Recebido), independente do checklist.
- Importação em lote por planilha: exige Empreendedora + Empreendimento; não cria checklist
  automaticamente para os itens importados (diferente da criação manual).

## Esteira (Análise de Crédito, Emissão de Contrato, Repasse)

Módulo mais complexo do sistema — a maior parte da automação de negócio real está em **triggers
do banco**, não no `app.js`. Ver os 5 triggers de `esteira_processos` em
[BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#triggers-matriz-completa) e o passo a passo completo em
[FLUXOS.md](FLUXOS.md).

- Etapas e transições (`etapas_esteira`, `esteira_transicoes`) são **dados configuráveis pela
  interface** (Administração → Fluxos da Esteira), não hardcoded — regra de negócio central do
  produto, repetida em toda a documentação existente do projeto.
- **Parecer de Análise de Crédito** (5 opções: aprovado / aprovado+contrato / aprovado com
  pendência / aprovado com pendência+contrato / reprovado): o client só grava o campo
  `parecer_credito`; **todo o roteamento (mudar etapa, encerrar, criar processo de contrato) é
  feito pelo trigger `avancar_automacao_esteira`**, não pelo front-end.
- **Regressão de etapa**: exige motivo categorizado (`pedido_vendedor` / `erro_analise` /
  `erro_documental` / `erro_proposta` / `outro`) + descrição livre. Se o motivo não for "pedido
  do vendedor", gera automaticamente um apontamento de erro/retrabalho para quem validou a etapa
  reaberta (via `esteira_validacoes`) — degrada graciosamente (só avisa no histórico) se não
  achar quem validou.
- **Dois caminhos paralelos e independentes para "enviar para Emissão de Contrato"**: (1) o
  trigger de banco, reagindo a `parecer_credito`; (2) lógica client-side que dispara quando o
  **texto** do botão de transição contém literalmente "enviar para Emissão de Contrato" — se o
  rótulo configurável dessa transição for editado sem manter esse texto exato, a criação
  automática do processo de contrato por esse segundo caminho para de funcionar, silenciosamente.
  Mesma fragilidade para o texto "devolver ao Incorporador".
- **Esteira→Repasse**: ao concluir um processo de `emissao_contrato` (sem ser devolução), o
  client cria automaticamente um processo em `repasse` — isso é lógica 100% client-side, sem
  trigger de banco.
- **Checklist de repasse**: semeado automaticamente (12 itens padrão) na primeira abertura de um
  processo `repasse`; nenhuma regra identificada de "checklist completo libera algo".
- Uso extensivo de `prompt()`/`confirm()` nativos do navegador para dado de negócio (motivo de
  regressão/devolução/desistência) — texto livre, sem validação de formato.
- Exclusão de processo remove `esteira_anexos`/`esteira_historico` mas **não**
  `esteira_validacoes`, `laudos_credito*`, `processo_mensagens`, `repasse_checklist`, nem os
  arquivos no bucket — ficam órfãos.

## Laudo de Crédito (novo, 2026-08-07/08)

- Cada incorporadora tem **um modelo** de campos (não colunas fixas) — porque incorporadoras
  diferentes usam laudos com layout diferente. Configurado em Cadastros → Identidade visual da
  incorporadora.
- Campo dinâmico = rótulo + tipo (texto/número/data/área) + obrigatório. Existe um conjunto de
  ~26 campos de referência (baseado num modelo real de incorporadora) que o admin pode usar como
  ponto de partida ("Usar modelo de referência"), só disponível se a incorporadora ainda não tem
  nenhum campo.
- Fluxo de pagamento (parcelas) é opcional por modelo (`tem_fluxo_pagamento`) e **não é um campo
  dinâmico** — é uma tabela própria de linhas (tipo de parcela, quantidade, valor,
  comprometimento %).
- A seção só aparece no processo da Esteira quando: é `analise_credito`, tem `empreendimento_id`,
  e a incorporadora daquele empreendimento tem modelo configurado — **silenciosamente ausente**
  se qualquer uma dessas condições faltar (sem mensagem de erro).
- **Salvar campo em branco não apaga valor anterior**: o `upsert` de valores só grava campos
  preenchidos (`filter(v => v.valor)`); limpar um campo que já tinha valor não gera exclusão no
  banco — na próxima abertura, o valor "fantasma" antigo reaparece. O fluxo de pagamento, ao
  contrário, é sempre "apaga tudo e reinsere" a cada salvamento.
- PDF gerado no navegador (sem lib de PDF): monta um HTML e chama `window.print()`, deixando o
  usuário escolher "Salvar como PDF" — não fica anexado automaticamente ao processo.

## Repasse — cadastro financeiro do cliente

- Cadastro único do cliente (`clientes`, 45 colunas) reaproveitado pelo workflow da Esteira
  (`esteira_tipo='repasse'`, criado ao clicar "Abrir workflow e checklist").
- `status` do cliente: PROPOSTA/CREDITO/PENDENCIA/CONTRATO/ASSINATURA/REPASSE_CONCLUIDO — toda
  mudança gera automaticamente uma linha em `eventos_repasse` (trigger `log_evento_cliente`).
- Coobrigados (cônjuge, composição de renda, fiador, procurador) em tabela filha própria.
- Busca/listagem limitada a 500 registros (`limit(500)`), exibição sem busca limitada a 100 —
  sem paginação real; em volume alto de clientes pode ocultar registros mais antigos.

## Biblioteca do Repasse

Cartórios, prefeituras, atalhos úteis e base de conhecimento — bases de referência
institucionais, **sem vínculo (FK) a processo/cliente específico**. Formulários por banco com
"versionamento" simples (agrupa arquivos pelo nome-base após o timestamp, mostra o mais recente
como "vigente"). Base de conhecimento é a mesma tabela usada no Portal do Cliente.

## Portal do Incorporador / Cliente

- Acesso via `/portal` (genérico) ou `/portal/<slug>` (com identidade visual da incorporadora
  pré-carregada, via view pública `empreendedoras_marca`). `perfis.role='cliente'`, vinculado a
  `empreendedora_id` — RLS restringe tudo à incorporadora do usuário.
- Sessão separada da equipe interna (`localStorage` diferente), com validação cruzada de rota vs.
  papel em `init()` (ver [AUTENTICACAO.md](AUTENTICACAO.md)).
- **Mistura de marca**: logo + `cor_secundaria` da incorporadora aplicados como variáveis CSS
  sobre o layout padrão da Neo Service (não é whitelabel completo — tipografia/componentes
  continuam os mesmos).
- **Somente leitura em quase tudo** — a única escrita de dado de negócio no Portal é o chat por
  processo (`processo_mensagens`, tempo real via Supabase Realtime). Não há confirmação de
  boleto, não há upload de documento pelo cliente.
- **Pendência é derivada automaticamente**, não cadastrada manualmente: um processo aparece como
  pendência se está aberto e (nome da etapa contém "pend", ou tem `devolvido_para` preenchido, ou
  `parecer_credito` é uma das variantes "com pendência").
- Identificação de "etapa de boleto" e "etapa de assinatura" é feita **por regex no nome da
  etapa** (`/boleto|pagamento/i`, `/assinatura/i`), não por um identificador fixo — renomear uma
  etapa na Administração sem manter essas palavras-chave quebra essas telas silenciosamente
  (ficam vazias, sem erro).
- SLA por etapa **ainda não implementado** — comentário explícito no código confirma que é uma
  lacuna conhecida, não um bug.
- Menu "Repasse" só aparece se o incorporador tiver algum processo `esteira_tipo='repasse'`.

## Cadastros operacionais e Administração

- Tela central (`renderCadastroOperacional`) para Colaboradores, Empreendedoras, Empreendimentos,
  Atividades — busca, criar, editar, cadastro em massa (colar lista de nomes, um por linha;
  não disponível para Colaboradores, que exigem cargo).
- Exclusão sempre confere vínculos antes; se houver, oferece "Inativar" (analistas/atividades) em
  vez de excluir de fato.
- **Só cargo "analista" com status Ativo/Em licença entra em ranking, escala e metas** — regra
  central repetida em várias telas.
- Usuários (equipe e Portal) só são criados via Edge Function `convidar-usuario` — nunca
  `criar-usuario` (não referenciada). Domínio corporativo (`@neoservice.com.br`) exigido para
  completar cadastro da equipe interna; não exigido para `cliente`.
