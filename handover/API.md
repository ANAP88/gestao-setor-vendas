# API

O sistema não tem uma API própria escrita à mão. Existem três superfícies de API, todas
fornecidas pelo Supabase:

1. **PostgREST** — API REST automática, gerada a partir do schema do Postgres.
2. **RPC** — as mesmas funções SQL de [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#funções), chamáveis
   via `sb.rpc(nome, args)`.
3. **Edge Functions** — 8 funções Deno para as ações que exigem `service_role`.

## 1. PostgREST (API REST automática)

Todo `sb.from('tabela').select()/.insert()/.update()/.delete()` do `app.js` vira uma chamada
HTTP para `https://dbhqgxdsbploioujmqrs.supabase.co/rest/v1/<tabela>`, autenticada com o JWT da
sessão (ou a chave `anon`, se deslogado) no cabeçalho. Não há endpoints "de negócio" próprios
(tipo `/api/processos/:id/aprovar`) — toda regra de negócio dispara **por trigger**, reagindo a
um `UPDATE` comum numa coluna (ex.: mudar `parecer_credito` dispara toda a automação de
roteamento da Esteira — ver [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#funções)).

**Qual schema a API expõe** é decidido pelo client no navegador (`db: { schema: 'staging' }` ou
o padrão `public`), não por uma URL diferente — o mesmo endpoint REST atende os dois ambientes,
diferenciado pelo cabeçalho de schema que o SDK do Supabase envia automaticamente.

Documentação de cada tabela/coluna/relacionamento: [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md).
Autorização de cada endpoint: RLS, [SEGURANCA.md](SEGURANCA.md).

## 2. RPC (funções Postgres chamadas pelo front-end)

| Função | Chamada de | Parâmetros | Retorno |
|---|---|---|---|
| `login_esta_bloqueado(p_email)` | tela de login (antes de autenticar) | e-mail | boolean |
| `registrar_falha_login(p_email)` | tela de login (após falha) | e-mail | — |
| `limpar_tentativas_login(p_email)` | tela de login (após sucesso) | e-mail | — |
| `registrar_acesso(p_evento, p_ambiente)` | login e logout, equipe e portal | `'login'/'logout'`, `'equipe'/'portal'` | — |
| `enviar_alerta_teams(disparado_por)` | Edge Function `disparar-lembrete-manual` (via `admin.rpc`, não pelo client do navegador) | e-mail de quem disparou | — |

Todas as funções chamadas diretamente pelo navegador acima são `SECURITY DEFINER` e não
recebem/retornam dado sensível de outro usuário — o próprio parâmetro `p_email` é do usuário
atual (a função não deixa consultar tentativa de login de terceiro, porque não há policy de
leitura na tabela por trás, só as funções).

## 3. Edge Functions

Base: `https://dbhqgxdsbploioujmqrs.supabase.co/functions/v1/<nome>`. Todas em Deno,
`createClient` do `@supabase/supabase-js@2`. CORS liberado (`Access-Control-Allow-Origin: *`)
nas que respondem a `OPTIONS`.

### `criar-usuario`
- **Chamada pelo front-end?** Não — nenhum ponto de `app.js` invoca esta função (confirmado por
  busca em todo o arquivo). Provavelmente superada por `convidar-usuario`. Ver
  [PENDENCIAS.md](PENDENCIAS.md).
- `verify_jwt: true`. Método `POST`. Exige chamador com `role='admin'`.
- Corpo: `{ email, senha, nivel, nome }`. Cria usuário com a senha informada (mínimo 6
  caracteres) e `role` já definida.

### `convidar-usuario`
- **Em uso** — cria usuários da equipe e do Portal.
- `verify_jwt: true`. Método `POST`. Exige chamador `role='admin'`.
- Corpo: `{ email, nivel, nome, empreendedoraId }` (`empreendedoraId` obrigatório se
  `nivel==='cliente'`).
- Cria a conta com senha aleatória descartável (24 caracteres, nunca exposta), grava `perfis`
  (incluindo `cadastro_completo: true` automaticamente para `cliente`). Não envia e-mail — quem
  chama (`app.js`) dispara `resetPasswordForEmail` em seguida.

### `alerta-plantao`
- **Não é chamada pelo `app.js`** — é um endpoint de status pensado para consumo externo (ex.:
  Power Automate consultando, ou checagem manual).
- `verify_jwt: false`. Método `GET`/qualquer. **Protegido por um secret fixo** no cabeçalho
  `x-alert-secret` ou query string `?secret=` — ver [SEGURANCA.md](SEGURANCA.md).
- Retorna JSON com quem está de plantão hoje e não registrou atividade (mesma fonte que a view
  `alerta_hoje`), sem alterar nada no banco.

### `excluir-usuario`
- **Em uso** — tela de Usuários (equipe e Portal), botão excluir.
- `verify_jwt: true`. Método `POST`. Exige `role='admin'`; não permite excluir a própria conta.
- Corpo: `{ user_id }`. Remove do Supabase Auth e deleta a linha em `perfis`.

### `whatsapp-webhook`
- Não é chamada pelo front-end — é o endpoint que a Meta chama.
- `verify_jwt: false` (obrigatório, a Meta não manda JWT do projeto).
- `GET`: handshake de verificação (`hub.mode`, `hub.verify_token`, `hub.challenge`) — token fixo
  no código, ver [VARIAVEIS-DE-AMBIENTE.md](VARIAVEIS-DE-AMBIENTE.md).
- `POST`: recebe payload do WhatsApp Business, extrai mensagens e insere em
  `whatsapp_mensagens` (`direcao: 'entrada'`). Sem verificação de assinatura — ver
  [SEGURANCA.md](SEGURANCA.md).

### `disparar-lembrete-manual`
- **Em uso** — tela Automações, botão "Enviar lembrete agora" (só `admin`).
- `verify_jwt: true` (implícito — a função valida o JWT manualmente via
  `userClient.auth.getUser()`). Método `POST`.
- Sem corpo. Confere `role='admin'` e chama `enviar_alerta_teams(disparado_por: email)` via RPC
  com `service_role` — essa é a via que grava em `alerta_teams_log` com `tipo='manual'`.

### `resetar-senha`
- **Em uso** — tela de Usuários, botão "Resetar senha" (só `admin`).
- `verify_jwt: true`. Método `POST`. Exige `role='admin'`.
- Corpo: `{ userId }`. Invalida a senha atual (troca por outra aleatória descartável) — o usuário
  só recupera acesso pelo link de "esqueci minha senha".

### `extrair-identidade-site`
- **Em uso** — tela de identidade visual da incorporadora (Cadastros), ao salvar um site novo.
- `verify_jwt: true`. Método `POST`. Exige `role='admin'`.
- Corpo: `{ url, empreendedoraId, schema }` (`schema`: `'staging'` ou omitido para `public` —
  única Edge Function do projeto que é *schema-aware* por parâmetro, em vez de fixa em `public`).
- Faz `fetch` no site informado (timeout 10s), extrai `<meta name="theme-color">` e um candidato
  a logo (`apple-touch-icon`, `og:image`, ou `icon`/`shortcut icon`, nessa ordem), baixa a imagem
  e sobe para o bucket `empreendimentos-identidade`, atualiza `empreendedoras.cor_secundaria`/
  `logo_path`. Se nada for encontrado, retorna sucesso mesmo assim com `encontrado: {cor: null,
  logo: false}` — não é tratado como erro, o admin ajusta manualmente depois.

## Testando a API manualmente

Sem Postman/Insomnia coletado neste repositório. Exemplo de chamada REST direta (leitura, com a
chave pública — só retorna o que RLS permitir para o papel `anon`, ou seja, quase nada):

```bash
curl "https://dbhqgxdsbploioujmqrs.supabase.co/rest/v1/indicadores_kpi?select=nome" \
  -H "apikey: <supabaseAnonKey de config.js>"
```

Para chamar como usuário autenticado, é preciso primeiro obter um JWT via
`POST /auth/v1/token?grant_type=password` com e-mail/senha, e usar esse token no cabeçalho
`Authorization: Bearer <token>` das chamadas seguintes.
