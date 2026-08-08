# Autenticação

## Provedor

Supabase Auth, **só e-mail/senha** — confirmado por consulta direta (`auth.identities`, 100%
`provider = 'email'`, nenhum OAuth configurado). Sem SSO, sem Magic Link, sem MFA.

## Dois logins diferentes, duas sessões separadas

O mesmo `app.js` serve duas telas de login distintas, dependendo da URL:

- **Sistema interno** (`renderLogin`, qualquer rota fora de `/portal`) — para `admin`,
  `analista`, `leitura`.
- **Portal do Incorporador** (`renderLoginPortal`, rota `/portal` ou `/portal/<slug>`) — só para
  `role='cliente'`.

As duas sessões usam **chaves diferentes no `localStorage`** (`sv-gestao-auth` vs.
`sv-portal-auth`), de propósito — abrir o Portal numa aba não derruba a sessão da equipe em
outra aba do mesmo navegador.

### Validação cruzada de papel (rota errada não deixa entrar)

Nenhuma das duas telas de login em si valida o `role` do usuário no momento do
`signInWithPassword` — a validação acontece depois, em `init()` (chamada logo após obter a
sessão, tanto no primeiro carregamento da página quanto após um login bem-sucedido):

- Se a rota é `/portal` mas `perfis.role !== 'cliente'` → `signOut()` imediato + mensagem "Este
  acesso é exclusivo para clientes do Portal... use o link do sistema interno."
- Se a rota **não** é `/portal` mas `perfis.role === 'cliente'` → `signOut()` imediato +
  mensagem "Este link é exclusivo da equipe interna... use o link do Portal do Incorporador."

Ou seja, é simétrico e reforçado no lado do cliente logo após a autenticação — um usuário
`cliente` que descubra a URL interna e tenha credenciais válidas consegue autenticar no Supabase
Auth (a senha é válida), mas é deslogado no instante seguinte por `init()`, antes de ver
qualquer tela do sistema interno. **Isso não é reforçado por RLS diretamente no login** (é lógica
de `init()`, no client) — mas mesmo que alguém pulasse essa checagem via chamada direta à API, as
policies de RLS (ver [SEGURANCA.md](SEGURANCA.md)) continuam restringindo o que aquele usuário
`cliente` consegue de fato ler/escrever no banco.

## `perfis` — a tabela de identidade de aplicação

Toda sessão do Supabase Auth (`auth.users`) tem uma linha correspondente em `public.perfis`
(`user_id` = `auth.users.id`), criada automaticamente (`upsert` em `init()`, ou via Edge
Function ao convidar alguém). É essa tabela, não `auth.users`, que carrega `role`,
`analista_id`, `empreendedora_id`, `ativo`, `cadastro_completo`.

- **Papéis**: `admin`, `analista`, `leitura` (equipe interna) e `cliente` (Portal). Ver
  [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#identidade-e-acesso) para as colunas completas.
- **Primeiro usuário do sistema vira admin automaticamente** (`perfil_role_default()`, dispara
  se `not exists (select 1 from perfis where role='admin')`). Qualquer usuário seguinte é
  forçado a `analista` no insert, mesmo que o client tente mandar outra coisa — promoção só
  acontece depois, via `UPDATE` feito por um admin.
- **Ninguém se autopromove**: `perfil_update_guard()` reverte silenciosamente `role`/`ativo`/
  `analista_id` para o valor antigo se quem está fazendo o `UPDATE` não for admin — mesmo via
  chamada direta à API com um JWT válido de outro papel.
- **Conta desativada**: `perfis.ativo = false` força logout imediato em `init()`, com mensagem
  "Sua conta foi desativada."
- **Primeiro acesso obrigatório**: se `cadastro_completo = false`, o usuário cai em
  `renderCompletarCadastro` antes de qualquer outra tela — equipe interna preenche nome completo
  + função, cliente do Portal preenche só o nome. Usuário de equipe interna só consegue editar
  esses campos se o e-mail terminar em `@neoservice.com.br`; caso contrário os campos ficam
  bloqueados com aviso para pedir um convite corporativo (essa restrição de domínio **não vale**
  para `role='cliente'`, que pode ter qualquer e-mail).

## Criação de conta

Todo usuário novo é criado pela Edge Function **`convidar-usuario`** (a Edge Function
`criar-usuario`, que também existe e faz algo parecido, **não é chamada em nenhum lugar do
`app.js`** — ver [PENDENCIAS.md](PENDENCIAS.md)):

1. Admin preenche e-mail + papel (+ empreendedora, se `cliente`) na tela de Usuários (equipe) ou
   Usuários do Portal.
2. A Edge Function cria a conta no Supabase Auth com uma **senha aleatória descartável de 24
   caracteres** — ninguém vê nem usa essa senha.
3. O front-end então chama `sb.auth.resetPasswordForEmail(email)` (fluxo nativo do Supabase) e
   monta um e-mail-modelo com o link de "esqueci minha senha" para o admin enviar manualmente
   (mailto/Gmail/Outlook web/copiar — ver [INTEGRACOES.md](INTEGRACOES.md)).
4. O usuário novo define a própria senha ao clicar no link (`renderDefinirSenha`, tela que trata
   o hash `type=invite`/`type=recovery` da URL).

Ou seja, **nenhuma senha em texto puro trafega pela API nem aparece em e-mail** — só o link de
definição de senha do próprio Supabase Auth.

## Troca/reset de senha

- **Autoatendimento**: qualquer usuário logado pode trocar a própria senha a qualquer momento
  (`abrirTrocarSenha`, no menu lateral) — mínimo 6 caracteres, com confirmação.
- **Reset pelo admin**: Edge Function `resetar-senha` invalida a senha atual do usuário-alvo (com
  outra senha aleatória descartável), forçando o mesmo fluxo de "definir senha via e-mail".

## Rate limiting de login — implementação própria, não é o do Supabase

O sistema tem seu **próprio** controle de tentativas, independente de qualquer rate limit nativo
do Supabase Auth, porque um contador só em memória do navegador reseta a cada F5:

- Tabela `login_rate_limit` (`email`, `tentativas`, `bloqueado_ate`, `ultima_tentativa`), RLS
  ativo **sem nenhuma policy** — ou seja, só acessível via as 3 funções `SECURITY DEFINER`
  abaixo, nunca por leitura/escrita direta do client.
- `login_esta_bloqueado(email)` — checado **antes** de tentar `signInWithPassword`.
- `registrar_falha_login(email)` — chamado a cada falha; se passaram mais de 15 minutos desde a
  última tentativa, reinicia a contagem; senão incrementa, e a partir de **5 tentativas** define
  `bloqueado_ate = now() + 15 minutos`.
- `limpar_tentativas_login(email)` — chamado em todo login bem-sucedido.
- A mensagem exibida ("Aguarde 15 minutos") é **texto fixo no front-end** — se a janela real
  mudar no banco, o texto da tela fica desatualizado sem ninguém perceber.

## Sessão expirada

Não há um listener global (`onAuthStateChange`) fazendo isso proativamente — a detecção é
**reativa**: `voltarParaLoginSeSessaoPerdida(erro)` intercepta o código de erro do Postgres
`42501` ("permission denied for table", que é o RLS rejeitando uma chamada com sessão inválida)
em vários pontos do código (principalmente `portalCarregar()`, mas também outras telas), faz
`signOut()` e manda de volta para a tela de login correta.

## Registro de acesso

Todo login e logout, nos dois ambientes (equipe/portal), grava uma linha em `acessos_log` via a
RPC `registrar_acesso(evento, ambiente)` — auditável só por admin, na tela Auditoria → Acessos
(ver [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#auditoria-e-logs)).

## Controle de acesso por tela (autorização, não autenticação)

A função `podeVer(view)` é **binária**: `admin` vê tudo; qualquer outro papel (`analista`,
`leitura`, e — se algum dia acessasse essa parte do sistema — `cliente`) só não vê a lista fixa
`VIEWS_GESTAO` (Dashboard, Executivo, Analytics, Insights, Fechamento, Escala, Arquivos,
Integrações, Automações, Metas, Implantação, Usuários da equipe, Cadastro operacional,
Auditoria, Usuários do Portal, Empreendimentos do Portal, Documentos do Portal, Fluxo do
Portal). **Não há diferenciação entre `analista` e `leitura` no menu** — a diferença real entre
esses dois papéis está inteiramente no RLS do banco (quem pode escrever), não em quais telas
aparecem. Ver granularidade completa em [SEGURANCA.md](SEGURANCA.md).
