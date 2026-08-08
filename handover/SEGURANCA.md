# Segurança

## Resumo da postura de segurança

O modelo do projeto é consistente e foi levado a sério: **a permissão real vive no banco (RLS),
não na interface**. Isso foi verificado nesta auditoria lendo as policies de RLS diretamente no
Postgres, não apenas confiando no que o `app.js` sugere. Onde um dos agentes que leu o código
ficou em dúvida se um controle era "só de tela", a policy correspondente foi conferida
separadamente — ver [Esclarecimentos](#esclarecimentos-de-controles-que-pareciam-só-de-tela)
abaixo.

Os dois achados de maior severidade são **segredos hardcoded no código-fonte** (não expõem dado
de cliente diretamente, mas dão acesso de escrita a um canal do Teams e a um endpoint interno) —
ver [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md#segredos-hardcoded-no-código-fonte-não-são-variáveis-de-ambiente-mas-deveriam-ser)
para o detalhe completo; resumido também aqui por ser achado de segurança.

## Row Level Security (RLS)

- **Ativo em 100% das 52 tabelas** do schema `public` (confirmado via
  `pg_class.relrowsecurity`).
- Padrão dominante: leitura liberada à equipe interna via `nao_eh_cliente()`; escrita restrita a
  `admin`/`analista` via `is_write_role()` (papel `leitura` nunca escreve); tabelas que o Portal
  precisa ler têm uma policy adicional restringindo por `perfis.empreendedora_id`.
- Lista completa de tabelas, policies e funções auxiliares (`is_write_role`, `nao_eh_cliente`,
  `meu_analista_id`) em [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#rls-row-level-security) e
  [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#funções).
- **Exceção deliberada e documentada no próprio SQL**: a view `empreendedoras_marca` é a única
  liberada para o papel `anon` (usuário não autenticado) — expõe só 4 colunas não sensíveis
  (slug, nome, logo, cor) de incorporadoras com `slug` cadastrado, necessária para a tela de
  login do Portal mostrar a marca certa **antes** do login.
- **Exceção não-deliberada, real, para saber antes de testar**: as tabelas `laudos_credito*`
  (criadas em 2026-08-07/08, a funcionalidade mais nova do sistema) usam policies `using (true)`
  — qualquer usuário `authenticated` lê e escreve, sem checar `is_write_role()`/`nao_eh_cliente()`
  como o resto do banco faz. Não é um vazamento para o público (ainda exige estar logado), mas
  quebra o padrão do restante do sistema (um usuário `leitura` ou até `cliente`, se
  `authenticated`, tecnicamente conseguiria escrever ali via chamada direta à API, embora nenhuma
  tela do Portal exponha isso). Recomendação: alinhar essas policies ao padrão
  `is_write_role()`/`nao_eh_cliente()` do resto do banco.
- **`staging` tem RLS mais permissivo que `public`** — ver
  [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#staging-vs-public) para o detalhe; resumindo, o papel
  `leitura` escreve em várias tabelas de `staging` onde não conseguiria em `public`. Não teste
  controle de acesso por papel em staging.

## Esclarecimentos de controles que pareciam "só de tela"

Durante a leitura do `app.js`, dois pontos ficaram sinalizados como incerteza ("será que isso é
só front-end?"). Ambos foram conferidos direto na policy de RLS e **estão, sim, protegidos no
banco**:

- **Qualidade/Retrabalho — analista só vê os próprios apontamentos**: a tela filtra em JS, mas a
  policy `select_apontamentos_escopo` em `apontamentos_erro` já restringe no banco a `admin` OU
  `analista_id = meu_analista_id()` — um `leitura` de chamada direta à API não vê apontamento de
  outro analista mesmo contornando a tela.
- **Chamados — botão "Resolver" na listagem não checa se é o dono**: é uma inconsistência real
  de UX (o botão aparece para qualquer um, diferente do modal de edição, que respeita a regra),
  mas a policy `upd_chamados` já restringe o `UPDATE` de fato a `admin` OU
  `solicitante = e-mail de quem está logado` — clicar em "Resolver" um chamado alheio falha
  silenciosamente no banco (RLS nega), não é uma falha de segurança, só uma UI que promete algo
  que o banco não permite. Vale corrigir a UI para não confundir o usuário, mas não é urgente.

## Segredos hardcoded (achado de maior severidade)

| Segredo | Onde | Risco |
|---|---|---|
| URL completa do webhook do Power Automate (assinatura embutida na própria URL) | corpo das 2 sobrecargas de `enviar_alerta_teams()` no Postgres | quem tiver acesso de leitura ao banco consegue postar no canal do Teams sem autenticação adicional |
| `VERIFY_TOKEN` do webhook do WhatsApp | Edge Function `whatsapp-webhook` | baixo risco isolado (só serve para o handshake da Meta) |
| `SECRET` do endpoint `alerta-plantao` | Edge Function `alerta-plantao` | protege um endpoint que expõe quem não bateu ponto — dado interno de baixo risco, mas é a única barreira desse endpoint público |

Detalhe completo e recomendação de correção em
[VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md). **Trocar os três ao transferir o projeto
para outra organização** — item já incluído em
[CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md).

## Webhook do WhatsApp sem verificação de assinatura

A Edge Function `whatsapp-webhook` aceita qualquer `POST` no seu endpoint e insere o conteúdo em
`whatsapp_mensagens`, sem validar o cabeçalho `X-Hub-Signature-256` que a Meta envia para provar
que a mensagem realmente veio da plataforma deles. Na prática, hoje qualquer pessoa que descubra
a URL do endpoint consegue inserir linhas falsas em `whatsapp_mensagens` fazendo um POST
formatado do jeito certo — impacto limitado porque, como documentado em
[INTEGRACOES.md](INTEGRACOES.md), **nenhuma tela do sistema lê essa tabela hoje**, mas é uma
lacuna a fechar se a leitura de WhatsApp for implementada.

## Storage — bucket público que talvez não devesse ser

`fluxogramas-uploads` é público (`getPublicUrl`, sem expiração) e aceita upload de qualquer
arquivo enviado pelo admin na tela de Fluxogramas — diferente de `chamados-anexos` e
`esteira-documentos`, que usam URLs assinadas com expiração curta (60-120 segundos). Um
fluxograma vazado por engano (ou a URL compartilhada fora do time) fica acessível
indefinidamente a quem tiver o link. `empreendimentos-identidade` também é público, mas isso é
intencional (é a marca visual exibida antes do login).

## Content Security Policy e cabeçalhos

Cobertos em [INFRAESTRUTURA.md](INFRAESTRUTURA.md#cabeçalhos--definidos-duas-vezes-de-forma-redundante).
CSP restritiva (`default-src 'self'`, `frame-ancestors 'none'`), HSTS de 1 ano, `X-Frame-Options:
DENY`. Ponto de manutenção: definida em dois arquivos (`netlify.toml` e `_headers`)
simultaneamente — risco de divergência silenciosa se só um for atualizado no futuro.

## Injeção / sanitização

- Buscas textuais que viram filtro PostgREST (`ilike`) passam por
  `escaparBuscaPostgREST(termo)`, que remove `, ; . ( )` e limita a 100 caracteres — mitigação
  específica contra o padrão de injeção de operador do PostgREST (comentário no código rotula
  isso como item "P0-1" de uma varredura de segurança anterior).
- Não há SQL dinâmico montado por concatenação de string vindo do client em nenhum ponto
  identificado — todo acesso a dado é via client Supabase (PostgREST/RPC), que parametriza.

## LGPD / dados sensíveis

- O sistema armazena CPF, RG, data de nascimento, renda e endereço completo de clientes
  (tabelas `clientes`, `demandas`) — dado pessoal sensível conforme a LGPD.
- "Modo Apresentação" anonimiza nome de analista na tela (`Colaborador N`) para uso em TV/painel
  compartilhado — **só na exibição**, o dado exportado/consultado continua real; e o estado não
  é persistido (reseta ao recarregar a página).
- Sem rotina de anonimização de dado em `staging` — o espelho diário copia CPF/RG/renda reais
  para o ambiente de teste todo dia. Se `staging` algum dia tiver acesso mais amplo (ex.:
  estagiário, ambiente de demonstração), isso é exposição de dado real de cliente sob o
  pretexto de "é só teste".
- Sem política de retenção/expurgo de dado configurada (nenhuma rotina encontrada que apague
  registro antigo).

## Auditoria

`audit_log` (mudança de dado, 22 tabelas cobertas pelo trigger genérico — lista completa em
[BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#triggers-matriz-completa)) e `acessos_log`
(login/logout) — ambas só legíveis por `admin`, ambas estritamente somente-leitura na interface
(não existe "desfazer" a partir da tela de Auditoria).

## Recomendações priorizadas

1. **Trocar os 3 segredos hardcoded** antes de dar acesso ao código a qualquer pessoa fora da
   Neo Service atual (ver [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md)).
2. Alinhar as policies de `laudos_credito*` ao padrão `is_write_role()`/`nao_eh_cliente()`.
3. Adicionar verificação de assinatura (`X-Hub-Signature-256`) no `whatsapp-webhook`, ou
   restringir por outro meio, antes de usar essa tabela de fato.
4. Trocar `fluxogramas-uploads` para URL assinada com expiração, como os outros buckets
   sensíveis.
5. Consolidar CSP/cabeçalhos em um único arquivo (`netlify.toml` **ou** `_headers`, não os dois).
