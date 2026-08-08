# Banco de dados

Projeto Supabase `dbhqgxdsbploioujmqrs` (região `sa-east-1`, Postgres 17). Levantado ao vivo em
2026-08-08 via SQL direto no banco — não é uma reconstrução a partir de migrações antigas.

- **52 tabelas base**, **19 views**, **25 funções próprias** (fora as de extensão), **37
  triggers**, **8 buckets de Storage**, **RLS ativo em 100% das tabelas do schema `public`**.
- Dois schemas com a mesma estrutura: **`public`** (produção) e **`staging`** (teste, espelhado
  1x/dia — ver [Staging vs. public](#staging-vs-public) para as diferenças reais que existem
  hoje entre os dois).
- Todas as tabelas usam `id uuid primary key default gen_random_uuid()`, salvo onde indicado.
  Datas usam `timestamp with time zone`, abreviado aqui como `timestamptz`.

## Índice

- [Identidade e acesso](#identidade-e-acesso)
- [Auditoria e logs](#auditoria-e-logs)
- [Cadastros operacionais](#cadastros-operacionais)
- [Produção (demandas)](#produção-demandas)
- [Escala de plantão](#escala-de-plantão)
- [Suporte / Chamados entre áreas](#suporte--chamados-entre-áreas)
- [Qualidade / Retrabalho](#qualidade--retrabalho)
- [Metas & Indicadores](#metas--indicadores)
- [Implantação](#implantação)
- [Esteira (Análise de Crédito / Emissão de Contrato / Repasse)](#esteira)
- [Laudo de Crédito](#laudo-de-crédito)
- [Repasse — cadastro financeiro do cliente](#repasse--cadastro-financeiro-do-cliente)
- [Biblioteca do Repasse (referência)](#biblioteca-do-repasse-referência)
- [Portal do Cliente — documentos](#portal-do-cliente--documentos)
- [WhatsApp](#whatsapp)
- [Configuração do sistema](#configuração-do-sistema)
- [Views](#views)
- [Funções](#funções)
- [Triggers](#triggers-matriz-completa)
- [RLS (Row Level Security)](#rls-row-level-security)
- [Índices](#índices)
- [Extensões](#extensões)
- [Storage (buckets)](#storage-buckets)
- [Staging vs. public](#staging-vs-public)

---

## Identidade e acesso

### `perfis` — 1 linha por usuário do Supabase Auth (PK real é `user_id`, não `id`)
| Coluna | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `user_id` | uuid | sim | PK, `= auth.users.id` |
| `email` | text | sim | |
| `nome` | text | não | apelido curto |
| `role` | text | sim | `admin` \| `analista` \| `leitura` \| `cliente` — default `analista` |
| `ativo` | boolean | sim | default `true`; `false` bloqueia login |
| `analista_id` | uuid | não | → `analistas.id` — liga o usuário ao colaborador (define de quem são os apontamentos que ele vê) |
| `nome_completo` | text | não | preenchido no primeiro acesso |
| `funcao` | text | não | cargo, só para equipe interna |
| `cadastro_completo` | boolean | sim | default `false` — controla se cai na tela de "completar cadastro" |
| `empreendedora_id` | uuid | não | → `empreendedoras.id` — obrigatório para `role='cliente'`, define o escopo do Portal |
| `criado_em` | timestamptz | sim | |

### `analistas` — colaboradores da equipe
`id, nome (único), status (Ativo/Em licença/Desligado/Inativo), criado_em, cargo (default 'analista'), entra_no_painel (boolean, default true — só quem tem cargo analista + status Ativo/Em licença entra em ranking/escala/metas, mesmo com este campo true)`.

### `login_rate_limit` — bloqueio de força bruta, independente do Supabase Auth
`email (PK, text), tentativas (int), bloqueado_ate (timestamptz), ultima_tentativa (timestamptz)`. Ver [AUTENTICACAO.md](AUTENTICACAO.md).

---

## Auditoria e logs

### `audit_log` — quem mudou o quê em qualquer tabela auditada
`id, tabela, registro_id, acao (INSERT/UPDATE/DELETE), dados_antes (jsonb), dados_depois (jsonb), autor_user_id, autor_email, criado_em`. Alimentada pelo trigger genérico `fn_audit_log()`, plugado em 22 tabelas (ver [Triggers](#triggers-matriz-completa)).

### `acessos_log` — login/logout
`id, user_id, email, nome, role, ambiente ('equipe'|'portal'), evento ('login'|'logout'), criado_em`. Alimentada pela RPC `registrar_acesso()`, chamada pelo front-end no login e no logout.

### `alerta_teams_log` — histórico de disparos do alerta de plantão
`id, disparado_em, tipo ('automatico'|'manual'), usuario_email, mensagem, status_code`. Só é preenchida quando `enviar_alerta_teams(disparado_por)` é chamada com o parâmetro (a versão sem parâmetro, usada pelo `pg_cron`, não grava aqui — ver [Funções](#funções)).

---

## Cadastros operacionais

### `empreendedoras` — incorporadoras/loteadoras (clientes da Neo Service)
`id, nome (único), criado_em, logo_path, capa_path, cor_secundaria, slug (único, usado em /portal/<slug>), site`.

### `empreendimentos`
`id, empreendedora_id → empreendedoras.id, nome, criado_em, portal_ativo (boolean, controla se aparece no Portal), logo_path`. Único por `(empreendedora_id, nome)`.

### `empreendimento_documentos` — arquivos/links publicados no Portal do Cliente
`id, empreendimento_id → empreendimentos.id (cascade), categoria, titulo, descricao, tipo ('arquivo'|'link'), storage_path, url, visivel_portal (boolean, default true), criado_por, criado_em`.

### `atividades` — tipos de serviço prestado
`id, nome (único), ativa (boolean), sla_horas (int, default 24)`.

### `canais` — canal de entrada da demanda
`id, nome (único)`.

---

## Produção (demandas)

### `demandas` — processo de produção (a "planilha de controle" original)
| Coluna | Tipo | Notas |
|---|---|---|
| `numero` | bigint | gerado por trigger (`proximo_numero_demanda`, `max(numero)+1` — ver risco de concorrência em [PENDENCIAS.md](PENDENCIAS.md)) |
| `numero_processo` | text | livre |
| `recebido_em` | timestamptz | obrigatório, único campo realmente bloqueante no formulário |
| `proponente1_nome/cpf`, `proponente2_nome/cpf` | text | CPF ou CNPJ, campo único para os dois tipos |
| `empreendedora_id`, `empreendimento_id`, `atividade_id`, `canal_id`, `analista_id` | uuid | FKs |
| `status` | text | `RECEBIDO` (default) e outros valores livres (não há CHECK constraint fixando a lista) |
| `concluido_em` | timestamptz | preenchido automaticamente pelo front quando status vira `CONCLUIDO` sem data manual |
| `fat_mensal` | boolean | marca para entrar no Fechamento; propagado automaticamente por trigger da Esteira quando o contrato conclui com faturamento |
| `valor_proposta` | numeric | |
| `imobiliaria`, `corretor` | text | |
| `obs` | text | |
| `criado_em`, `atualizado_em` | timestamptz | |

### `validacao_itens` — checklist livre por demanda
`id, demanda_id → demandas.id (cascade), item, ok (boolean)`.

### `fups` — follow-ups (anotações datadas por demanda)
`id, demanda_id → demandas.id (cascade), criado_em, autor, texto`. **Vínculo a `clientes` é por casamento de nome (melhor esforço), não por FK** — ver [PENDENCIAS.md](PENDENCIAS.md).

### `eventos_especiais` — dias atípicos (lançamento de empreendimento)
`id, data, tipo (default 'lancamento'), descricao, criado_por → perfis.user_id, criado_em`. Único por `(data, tipo)`. Usado para excluir picos de volume das médias/metas nos dashboards.

---

## Escala de plantão

### `escala_plantao`
`id, analista_id → analistas.id (cascade), data`. Único por `(analista_id, data)`. Alimenta a view `alerta_hoje`.

---

## Suporte / Chamados entre áreas

### `chamados`
`id, titulo, descricao, solicitante (e-mail — define o "dono"), area, prioridade (BAIXA/NORMAL/ALTA/CRITICA), status (ABERTO default / RESOLVIDO), criado_em, resolvido_em, email_destino, email_remetente, email_copia, processo_ref, enviado_em, enviado_por`.

### `chamados_anexos`
`id, chamado_id → chamados.id (cascade), nome, storage_path, criado_por, criado_em`. Bucket: `chamados-anexos`.

### `areas_contato` — cadastro de áreas e e-mail de destino para chamados
`id, area (único), email, ativo (boolean), criado_em`.

---

## Qualidade / Retrabalho

### `apontamentos_erro`
`id, demanda_id → demandas.id, analista_id → analistas.id, origem ('validacao_interna'|'cliente'|'esteira_regressao'), categoria, subcategoria, descricao, registrado_por → perfis.user_id, resolvido (boolean, default false), criado_em, indicador_id → indicadores_kpi.id`. O campo `indicador_id` é o que liga um apontamento à contagem automática de erro em [Metas & Indicadores](#metas--indicadores).

### `apontamento_exclusao_solicitacoes` — fluxo de aprovação para excluir um apontamento
`id, apontamento_id → apontamentos_erro.id (cascade), solicitado_por_email, motivo, status ('pendente' default, 'aprovado', 'rejeitado'), decidido_por_email, decidido_em, criado_em`. Analista não apaga direto; abre solicitação, admin aprova (e só aí o `apontamentos_erro` é de fato deletado) ou rejeita.

---

## Metas & Indicadores

### `indicadores_kpi` — os KPIs configurados (6 fixos hoje + os que forem criados pela tela)
`id, nome, meta_percentual (numeric), ordem (int), ativo (boolean), esteira_tipo (text, opcional)`. Quando `esteira_tipo` está preenchido (hoje só `'emissao_contrato'`), a quantidade de processos daquele indicador é calculada automaticamente a partir de `esteira_processos` concluídos — nos demais indicadores, é lançamento manual.

### `indicador_mensal` — resultado agregado da equipe, por indicador/mês
`id, indicador_id → indicadores_kpi.id, mes (date), quantidade_processos, quantidade_erros, observacoes, atualizado_por → perfis.user_id, atualizado_em`. Único por `(indicador_id, mes)`. **Lançado manualmente pela tela "Lançar dados do mês" — não é automático, mesmo quando o indicador correspondente tem `esteira_tipo`** (ver achado do agente em [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md)).

### `indicador_analista_mensal` — parece não estar em uso pela UI atual
`id, indicador_id, analista_id, mes, quantidade_processos, quantidade_erros, atualizado_em`. Único por `(indicador_id, analista_id, mes)`. Nenhum dos 6 agentes que leram o `app.js` inteiro encontrou uma tela que leia ou escreva nesta tabela — **possível tabela órfã**, listada em [PENDENCIAS.md](PENDENCIAS.md).

### `meta_colaborador_indicador` — peso e alvo por colaborador/indicador/trimestre
`id, analista_id → analistas.id (cascade), indicador_id → indicadores_kpi.id (cascade), ano (int), trimestre (int 1-4), alvo (numeric), peso (numeric)`. Único por `(analista_id, indicador_id, ano, trimestre)`. Reescrita por **substituição total** a cada salvamento (delete + insert do trimestre inteiro).

### `meta_colaborador_mensal` — resultado real do colaborador, por indicador/mês
`id, analista_id → analistas.id (cascade), indicador_id → indicadores_kpi.id (cascade), mes (date), quantidade_processos (auto via trigger quando o indicador tem esteira_tipo), quantidade_erros (**sempre automático**, via trigger em `apontamentos_erro`), descricao, atualizado_em`. Único por `(analista_id, indicador_id, mes)`.

---

## Implantação

### `implantacoes` — carteira de produtos em implantação de sistema
`id, empreendedora (text livre, não FK), empreendimento (text livre, não FK), tipo, sistemas, fase, link_sistema, unidades (int), previsao_lancamento (date), observacoes, documentacao_recebida_em (date), sla_dias_uteis (int, default 15), criado_em, atualizado_em`.

### `implantacao_checklist`
`id, implantacao_id → implantacoes.id (cascade), grupo, item, formato, concluido (boolean — **derivado por trigger, não gravável direto**: só vira `true` quando `status_validacao='Aprovado'`), ordem (int), status_validacao (default 'Documentação pendente'; valores: Documentação pendente/recebida/em validação, Aprovado, Reprovado)`.

### `implantacao_pendencias`
`id, implantacao_id → implantacoes.id (cascade), pendencia, area, resolvida (boolean), criado_em, status_validacao (default 'Pendente'; valores: Pendente/Em validação/Recebido)`.

---

## Esteira

Motor de workflow compartilhado por 3 processos diferentes (`esteira_tipo`): `analise_credito`,
`emissao_contrato` e `repasse`. Etapas e transições são **dados**, não código.

### `etapas_esteira`
`id, nome, ordem (int), ativa (boolean, default true), esteira_tipo`.

### `esteira_transicoes` — os botões de avanço entre etapas
`id, etapa_origem_id → etapas_esteira.id, rotulo (texto do botão), etapa_destino_id → etapas_esteira.id (null = conclui o processo), ordem_botao (int)`.

### `esteira_processos` — o processo em si
| Coluna | Tipo | Notas |
|---|---|---|
| `titulo` | text | obrigatório |
| `cliente_id` | uuid | → `clientes.id` |
| `etapa_atual_id` | uuid | → `etapas_esteira.id`, obrigatório |
| `analista_atual_id` | uuid | → `analistas.id` — null = fila |
| `status` | text | `AGUARDANDO` (default) / `EM_ANDAMENTO` / `CONCLUIDO` / `DESISTENCIA` |
| `empreendimento_id`, `unidade` | | |
| `prioridade` | text | `NORMAL` (default) / `ALTA` / `URGENTE` |
| `esteira_tipo` | text | `analise_credito` / `emissao_contrato` (default) / `repasse` |
| `processo_origem_id` | uuid | → `esteira_processos.id` — encadeia crédito→contrato→repasse |
| `origem_demanda_id` | uuid | → `demandas.id` — único junto com `esteira_tipo` |
| `bloco` | text | sub-filtro visual (`analise`/`reanalise`, `geracao`/`reemissao`) |
| `sera_faturado` | boolean | se `true` e conclui, propaga `fat_mensal=true` para a demanda de origem |
| `parecer_credito` | text | dispara a automação de roteamento — ver [Funções](#funções) |
| `devolvido_para`, `motivo_devolucao` | text | preenchidos na devolução ao incorporador |
| `observacoes` | text | acompanha o processo do início ao fim |

### `esteira_historico` — linha do tempo (append-only)
`id, processo_id → esteira_processos.id (cascade), evento, autor, criado_em, motivo_categoria`.

### `esteira_anexos`
`id, processo_id → esteira_processos.id (cascade), tipo, nome, url, criado_por, criado_em, storage_path`. Bucket: `esteira-documentos`.

### `esteira_validacoes` — quem validou cada etapa (alimenta a atribuição automática de erro em regressão)
`id, processo_id → esteira_processos.id (cascade), etapa_id → etapas_esteira.id, validado_por_analista_id → analistas.id, validado_por_email, criado_em`.

### `processo_mensagens` — chat entre equipe e cliente do Portal, por processo
`id, processo_id → esteira_processos.id (cascade), autor_tipo ('equipe'|'cliente'), autor_email, mensagem, lida (boolean), criado_em`.

### `repasse_checklist` — checklist documental dentro de um processo de repasse
`id, processo_id → esteira_processos.id (cascade), item, ok (boolean), storage_path, validade (date), responsavel, obs, criado_em`. Semeado automaticamente com 12 itens padrão (`CHECKLIST_REPASSE_PADRAO`) na primeira abertura do processo.

---

## Laudo de Crédito

Adicionado em 2026-08-07/08. Cada incorporadora define seu próprio modelo de campos (não há
colunas fixas), porque incorporadoras diferentes usam laudos com layout diferente.

### `laudos_credito_modelos` — 1 por incorporadora
`id, empreendedora_id → empreendedoras.id (cascade, único), nome (default 'Modelo padrão'), tem_fluxo_pagamento (boolean, default true), criado_em`.

### `laudos_credito_campos` — campos dinâmicos do modelo
`id, modelo_id → laudos_credito_modelos.id (cascade), ordem, rotulo, tipo ('texto'|'numero'|'area'|'data'), obrigatorio (boolean)`.

### `laudos_credito` — 1 por processo de análise de crédito
`id, processo_id → esteira_processos.id (cascade, único), modelo_id → laudos_credito_modelos.id, criado_por, criado_em, atualizado_em`.

### `laudos_credito_valores` — valor de cada campo, por laudo
`id, laudo_id → laudos_credito.id (cascade), campo_id → laudos_credito_campos.id (cascade), valor (text)`. Único por `(laudo_id, campo_id)`.

### `laudos_credito_fluxo` — linhas do fluxo de pagamento (parcelas)
`id, laudo_id → laudos_credito.id (cascade), ordem, tipo_parcela (text), quantidade_parcela (int), valor_parcela (numeric), comprometimento (numeric, %)`.

---

## Repasse — cadastro financeiro do cliente

### `clientes` — cadastro único do cliente em repasse bancário (45 colunas — tabela mais larga do banco)
Dados pessoais (nome, cpf, rg + órgão emissor, estado civil, nascimento, nacionalidade, profissão,
telefones, e-mail, endereço completo, PEP), dados da operação (`empreendimento_id →
empreendimentos.id`, unidade, imobiliária, corretor, `status`: PROPOSTA/CREDITO/PENDENCIA/
CONTRATO/ASSINATURA/REPASSE_CONCLUIDO, `responsavel_id → analistas.id`, banco, correspondente,
`incorporadora_id → empreendedoras.id`) e valores financeiros (compra/venda, entrada, FGTS,
financiado, subsídio, recursos próprios, % e valor de comissão previsto/recebido, nº de
proposta/contrato bancário/operação, datas de entrada/previsão/conclusão).

### `clientes_coobrigados` — cônjuge, composição de renda, fiador, procurador
`id, cliente_id → clientes.id (cascade), tipo, nome, cpf, rg, telefone, email, renda, criado_em`.

### `eventos_repasse` — anotações datadas por cliente (equivalente ao `fups` da Produção)
`id, cliente_id → clientes.id (cascade), data (default now), evento, autor`. Alimentada também
automaticamente pelo trigger `log_evento_cliente()` a cada criação/mudança de `status` do
cliente.

---

## Biblioteca do Repasse (referência)

Bases de consulta institucional, **sem vínculo (FK) a processo/cliente específico**:

- **`cartorios_registro`**: nome, cidade, estado, endereço, telefone, site, email, horário,
  requisitos, observações, documentos_exigidos, tempo_medio, aceita_digital (boolean),
  forma_protocolo, criado_em.
- **`prefeituras_repasse`**: municipio, estado, link_itbi, link_certidao_valor_venal,
  link_cnd_municipal, observacoes, criado_em.
- **`atalhos_uteis`**: categoria (default 'Receita Federal'), nome, url, criado_em.
- **`conhecimento_artigos`**: categoria, tipo ('artigo' default/pdf/link/modelo/video), titulo,
  conteudo, url, criado_por, criado_em, `empreendimento_id` (null = artigo global),
  `visivel_portal` (boolean) — também usada pelo Portal do Cliente (Base de Conhecimento),
  reaproveitando a mesma tabela.

---

## Portal do Cliente — documentos

Já coberto em [Cadastros operacionais](#cadastros-operacionais) (`empreendimento_documentos`) e
acima (`conhecimento_artigos`). Sem tabela adicional própria.

---

## WhatsApp

### `whatsapp_mensagens`
`id, telefone, direcao ('entrada'|'saida' — só 'entrada' é gravado hoje, ver
[INTEGRACOES.md](INTEGRACOES.md)), texto, tipo (default 'text'), wa_message_id, cliente_id →
clientes.id, demanda_id → demandas.id, recebido_em`. Alimentada pela Edge Function
`whatsapp-webhook`. **Não identifiquei nenhuma tela em `app.js` que leia esta tabela** — os 6
agentes que leram o arquivo inteiro não encontraram nenhum `sb.from('whatsapp_mensagens')` de
leitura, só o insert feito pela Edge Function. Ver [PENDENCIAS.md](PENDENCIAS.md).

---

## Configuração do sistema

### `config_sistema` — chave/valor genérico
`id (text, PK), valor (text), atualizado_em`. Chave conhecida em uso: `email_remetente_padrao`.

### `metas_config` — chave/valor numérico para metas de produtividade
`id (text, PK), valor (numeric), atualizado_em`. Chaves: `diaria, semanal, mensal, fds_minima, fds_esperada, fds_excelente`.

---

## Views

Todas com `security_invoker = true` (rodam com o privilégio de quem consulta, respeitando RLS —
exceto onde indicado) e, salvo `empreendedoras_marca`, **sem** acesso ao papel `anon`.

| View | Base | Para quê |
|---|---|---|
| `alerta_hoje` | `escala_plantao` + `analistas` + `demandas` (contagem do dia) | Quem está de plantão hoje e ainda não registrou nenhuma atividade — fonte do alerta do Teams |
| `demandas_sla` | `demandas` | `demandas.*` + `sla_horas` calculado (`concluido_em ou now() − recebido_em`) |
| `empreendedora_mes` | `demandas` × `empreendedoras` | Volume mensal por incorporadora |
| `empreendedoras_marca` | `empreendedoras` (`slug is not null`) | **Única view liberada para `anon`** — 4 colunas não sensíveis (slug, nome, logo, cor), usada na tela de login do Portal antes de autenticar |
| `evolucao_analista_mes` | `demandas` × `analistas` (`entra_no_painel`) | Série mensal por analista |
| `fds_solo` | `demandas` × `analistas` | Dias de fim de semana em que só 1 analista produziu (base do cálculo de meta de FDS) |
| `implantacao_painel` | `implantacoes` + `implantacao_checklist` + `implantacao_pendencias` | Avanço ponderado (Aprovado=1.0 / em validação=0.66 / recebido=0.33), status automático, criticidade por prazo |
| `insights_sla` | `demandas` (abertas) | Horas em aberto, para o painel de alertas |
| `meta_colaborador_resultado` | `meta_colaborador_mensal` × `analistas` × `indicadores_kpi` × `meta_colaborador_indicador` | Atingimento por indicador/mês: `1 − erros/processos`, dividido pelo alvo trimestral, com teto ≈ `1.0204` |
| `metas_fds` | `fds_solo` | Sugestão estatística de meta de fim de semana (média ±15%) |
| `mix_atividade_analista` | `demandas` × `analistas` × `atividades` | Contagem cruzada |
| `producao_analista_dia` | `demandas` × `analistas` | Produção diária por analista + dia da semana |
| `producao_diaria` | `demandas` | Produção diária total (fuso America/Sao_Paulo) + dia da semana |
| `ranking_analistas` | `demandas` × `analistas` | Ranking mensal: conclusão %, produção/dia útil, % de participação, `score = 100×(0.4×conclusão% + 0.6×volume relativo ao melhor do mês)` |
| `retrabalho_mensal` | `apontamentos_erro` × `analistas` | Contagem por mês/analista/categoria |
| `tempo_por_atividade` | `demandas` × `atividades` | Tempo médio/mediano de conclusão, só atividades com 5+ casos |
| `top_empreendedoras` | `demandas` × `empreendedoras` | Ranking de volume |
| `volume_atividades` | `demandas` × `atividades` | Contagem por tipo de serviço |
| `volume_mensal` | `demandas` | Total e concluídas por mês |

## Funções

Só as próprias do projeto (fora `unaccent`/`uuid-ossp`/etc., que são de extensão).

### Segurança / RLS (usadas dentro das próprias policies — ver [SEGURANCA.md](SEGURANCA.md))
| Função | Retorna | O que faz |
|---|---|---|
| `is_write_role()` | boolean | `true` se o usuário logado tem `role in ('admin','analista')` — é o "pode escrever" |
| `nao_eh_cliente()` | boolean | `true` se `role <> 'cliente'` — é o "não é usuário do Portal" |
| `meu_analista_id()` | uuid | Resolve o usuário logado para um `analistas.id`: primeiro por `perfis.analista_id`, senão por **casamento de nome** (`unaccent`, case-insensitive) — fallback frágil, ver [PENDENCIAS.md](PENDENCIAS.md) |
| `perfil_role_default()` | trigger | No insert de `perfis`: primeiro usuário do sistema vira `admin` automaticamente; qualquer outro é forçado a `analista`, **ignorando** o que o client mandar — promoção só existe via `UPDATE` feito por um admin |
| `perfil_update_guard()` | trigger | Em `UPDATE` de `perfis`: se quem está alterando não é admin, reverte `role`/`ativo`/`analista_id` para o valor antigo — impede autopromoção mesmo via chamada direta à API |

### Automação de negócio
| Função | Trigger em | O que faz |
|---|---|---|
| `avancar_automacao_esteira()` | `esteira_processos` (BEFORE) | Quando `parecer_credito` muda: `reprovado`→etapa "Reprovado"; `aprovado_pendencia`→etapa "Com pendência"; `aprovado`→`CONCLUIDO` sem gerar contrato; `aprovado_contrato`/`aprovado_pendencia_contrato`→`CONCLUIDO` **e cria automaticamente** um novo processo em `emissao_contrato` (primeira etapa ativa daquele tipo) |
| `criar_card_esteira_de_demanda()` | `demandas` (AFTER insert/update) | Se `atividades.nome` for "Análise de Crédito"/"Análise de Crédito-Cessão"/"Reanalise de crédito"/"Emissão de Contrato"/"Reemissão de contrato", cria o card correspondente na Esteira (evita duplicar se já existe um para aquela `origem_demanda_id` + tipo) |
| `propaga_faturamento_esteira()` | `esteira_processos` (AFTER) | Ao concluir com `sera_faturado=true`, marca `demandas.fat_mensal=true` na demanda de origem |
| `proximo_numero_demanda()` | `demandas` (BEFORE insert) | `numero = max(numero)+1` se não informado — ver risco de concorrência em [PENDENCIAS.md](PENDENCIAS.md) |
| `recalcular_meta_colaborador_mensal(analista, indicador, mês)` | chamada pelos 2 triggers abaixo | Recalcula `quantidade_erros` (sempre, contando `apontamentos_erro`) e `quantidade_processos` (só se o indicador tiver `esteira_tipo`, contando `esteira_processos` concluídos daquele tipo/analista/mês — senão preserva o valor já lançado manualmente) e grava (`upsert`) em `meta_colaborador_mensal` |
| `trg_apontamento_erro_sync_meta()` | `apontamentos_erro` (AFTER insert/update/delete) | Chama a função acima para o mês afetado (e o mês antigo, se analista/indicador/data mudaram) |
| `trg_esteira_processo_sync_meta()` | `esteira_processos` (AFTER insert/update) | Chama a função acima para todo indicador ligado ao `esteira_tipo` do processo, quando ele conclui |
| `fn_implantacao_checklist_concluido()` / `fn_implantacao_checklist_sync()` | `implantacao_checklist` (BEFORE) | Força `concluido = (status_validacao = 'Aprovado')` — não pode ser setado manualmente pela API |
| `log_esteira_evento()` | `esteira_processos` (AFTER) | Gera as linhas automáticas de `esteira_historico` (criado / transferido / responsável definido / concluído) |
| `log_evento_cliente()` | `clientes` (AFTER) | Gera linhas automáticas em `eventos_repasse` (cadastro criado / mudança de status) |
| `set_atualizado_em()` | `demandas` (BEFORE update) | `atualizado_em = now()` |

### Login / rate limiting (RPC chamada pelo front — ver [AUTENTICACAO.md](AUTENTICACAO.md))
`login_esta_bloqueado(email)`, `registrar_falha_login(email)`, `limpar_tentativas_login(email)`.

### Alerta Teams
`enviar_alerta_teams()` **e** `enviar_alerta_teams(disparado_por text default null)` — duas
sobrecargas. A sem parâmetro é a chamada pelo `pg_cron` (não grava em `alerta_teams_log`); a com
parâmetro é chamada pela Edge Function `disparar-lembrete-manual` e grava o log. **A URL do
webhook do Power Automate está hardcoded dentro do corpo de ambas** — ver
[SEGURANCA.md](SEGURANCA.md), é o achado de segurança mais importante deste handover.

### Outras
- `registrar_acesso(evento, ambiente)` — grava em `acessos_log`, chamada no login/logout do front.
- `corrige_doc(v text)` — normaliza CPF/CNPJ substituindo `-` por `0` em certas posições
  (função de correção de dado legado, usada em migração de importação, não em fluxo corrente
  identificado no `app.js`).

### Só em `staging`
`atualizar_espelho()` — trunca e reinsere 37 tabelas em `staging` a partir de `public`. **Nunca
deve ser replicada para `public`** (apagaria dados reais).

## Triggers (matriz completa)

`fn_audit_log()` (auditoria genérica) está plugada, via trigger `trg_audit_log` (AFTER), em: `analistas, apontamentos_erro, atividades, chamados, clientes, config_sistema, conhecimento_artigos, demandas, empreendedoras, empreendimento_documentos, empreendimentos, escala_plantao, esteira_processos, esteira_transicoes, etapas_esteira, eventos_repasse, implantacao_checklist, implantacao_pendencias, implantacoes, indicador_mensal, indicadores_kpi, metas_config, perfis`.

Triggers de automação específica (além do genérico acima):

| Tabela | Trigger | Quando | Função |
|---|---|---|---|
| `apontamentos_erro` | `apontamento_erro_sync_meta` | AFTER | `trg_apontamento_erro_sync_meta` |
| `clientes` | `trg_cliente_evento` | AFTER | `log_evento_cliente` |
| `demandas` | `trg_criar_card_esteira_insert` / `trg_criar_card_esteira_update` | AFTER | `criar_card_esteira_de_demanda` |
| `demandas` | `trg_demandas_upd` | BEFORE | `set_atualizado_em` |
| `demandas` | `trg_numero_demanda` | BEFORE | `proximo_numero_demanda` |
| `esteira_processos` | `esteira_processo_sync_meta` | AFTER | `trg_esteira_processo_sync_meta` |
| `esteira_processos` | `trg_avancar_automacao_esteira` | **BEFORE** | `avancar_automacao_esteira` |
| `esteira_processos` | `trg_esteira_evento` | AFTER | `log_esteira_evento` |
| `esteira_processos` | `trg_propaga_faturamento` | AFTER | `propaga_faturamento_esteira` |
| `implantacao_checklist` | `trg_impl_ck_concluido` | BEFORE | `fn_implantacao_checklist_concluido` |
| `implantacao_checklist` | `trg_implantacao_checklist_sync` | BEFORE | `fn_implantacao_checklist_sync` (redundante com a de cima — mesmo efeito, ver [PENDENCIAS.md](PENDENCIAS.md)) |
| `perfis` | `trg_perfil_admin` | BEFORE | `perfil_role_default` |
| `perfis` | `trg_perfil_update_guard` | BEFORE | `perfil_update_guard` |

`esteira_processos` é a tabela com mais automação simultânea (5 triggers) — qualquer mudança
nela precisa considerar todos os 5 efeitos colaterais, não só o campo que está sendo alterado.

## RLS (Row Level Security)

RLS está ativo em 100% das 52 tabelas de `public`. O padrão dominante é: **SELECT** liberado a
quem `nao_eh_cliente()` (equipe interna) mais uma policy adicional para `role='cliente'` nas
tabelas que o Portal precisa ler (sempre restrita por `perfis.empreendedora_id`); **INSERT/
UPDATE/DELETE** exigem `is_write_role()` (admin ou analista — `leitura` nunca escreve). Exceções
notáveis e a lista completa de policies estão em [SEGURANCA.md](SEGURANCA.md) — inclui um achado
real (RLS de `staging` mais permissivo que o de `public`) que qualquer novo desenvolvedor precisa
conhecer antes de testar controle de acesso em staging.

## Índices

Todo relacionamento (FK) tem índice B-tree correspondente. Unicidades relevantes fora das já
citadas: `analistas.nome`, `areas_contato.area`, `atividades.nome`, `canais.nome`,
`empreendedoras.nome`, `empreendedoras.slug`, `empreendimentos(empreendedora_id, nome)`,
`esteira_processos(origem_demanda_id, esteira_tipo)` (parcial, só quando `origem_demanda_id`
não é nulo). Sem índices full-text (busca por nome é sempre `ilike`, sem índice trigram).

## Extensões

`pg_cron` 1.6.4, `pg_net` 0.20.4, `pg_stat_statements` 1.11, `pgcrypto` 1.3, `plpgsql` 1.0,
`supabase_vault` 0.3.1 (instalada, sem uso identificado no schema `public`), `unaccent` 1.1,
`uuid-ossp` 1.1.

## Storage (buckets)

| Bucket | Público | Quem escreve | Conteúdo |
|---|---|---|---|
| `apresentacoes-ppt` | não | admin | PPT de apresentações (Administração → Arquivos) |
| `chamados-anexos` | não | admin/analista | anexos de chamados — download via signed URL (60s) |
| `empreendimentos-identidade` | **sim** | admin/analista | logo/capa de incorporadora — público por design (é a marca exibida na tela de login do Portal, antes do login) |
| `esteira-documentos` | não | `is_write_role()` (policies granulares próprias, incluindo leitura de boleto pelo cliente do Portal) | anexos de processos da Esteira |
| `fechamentos-arquivo` | não | admin | Excel de fechamento mensal |
| `fluxogramas-uploads` | **sim** | admin | fluxogramas enviados (`.drawio`/PDF/imagem) — **público, ao contrário de `chamados-anexos`**, ver [SEGURANCA.md](SEGURANCA.md) |
| `portal-documentos` | não | equipe (`nao_eh_cliente()` lê tudo, escreve só `is_write_role()`) / cliente lê só o do próprio empreendimento | documentos publicados no Portal do Cliente |
| `repasse-formularios` | não | admin/analista | formulários por banco |

## Staging vs. public

Schemas estruturalmente idênticos hoje (conferido campo a campo em 2026-08-08: nenhuma tabela,
coluna, view ou função presente em um schema e ausente no outro). **Duas diferenças reais de
comportamento continuam existindo**, e quem for testar em staging precisa saber disso:

1. **RLS de `staging` é mais permissivo que o de `public`.** Em `public`, várias tabelas têm 4
   policies granulares (`sel_x`/`ins_x`/`upd_x`/`del_x`) usando `is_write_role()` para escrita —
   ou seja, o papel `leitura` não escreve. Em `staging`, várias dessas mesmas tabelas foram
   recriadas com **uma única policy `staging_equipe_all` cobrindo todos os comandos**, usando só
   `nao_eh_cliente()` — que não distingue `leitura` de `analista`/`admin`. Na prática, **hoje um
   usuário `leitura` consegue escrever em `staging` em tabelas onde não conseguiria em
   `public`**. Não é um bug de dado (staging é descartável), mas é uma armadilha real para quem
   for validar regra de permissão: **teste de controle de acesso por papel só é confiável em
   `public`.**
2. **Nem toda função de `public` tem equivalente em `staging`.** Confirmado por comparação
   direta: `corrige_doc`, `enviar_alerta_teams` (as 2 sobrecargas), `is_write_role`,
   `limpar_tentativas_login`, `log_esteira_evento`, `log_evento_cliente`, `login_esta_bloqueado`,
   `meu_analista_id`, `perfil_role_default`, `perfil_update_guard`, `proximo_numero_demanda`,
   `registrar_falha_login`, `set_atualizado_em` **não existem em `staging`**. As policies de
   `staging` foram reescritas para não depender delas (usam `staging.nao_eh_cliente()`, que
   existe), mas isso significa que **automações que dependem dessas funções (numeração
   automática de demanda, rate limit de login, log de eventos, guarda de autopromoção) não
   funcionam em `staging`** — o comportamento correspondente simplesmente não dispara lá.

Ambos os pontos vêm de uma correção histórica (`migrations/corrigir_ambiente_staging_v2.sql`,
2026-08-02) que reescreveu as views e policies de `staging` com nomes de tabela qualificados
explicitamente, em vez de depender de `search_path` — o que resolveu o bug original (views de
staging lendo dado de produção por engano) mas resultou num conjunto de policies/funções
independente do de `public`, não uma cópia fiel.
