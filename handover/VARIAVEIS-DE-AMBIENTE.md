# Variáveis de ambiente e segredos

## Regra geral do projeto

Por não ter build step, o sistema **não usa variáveis de ambiente no sentido tradicional**
(`process.env`, `.env` files) no front-end. O único lugar de configuração é `config.js`, e o
único lugar de segredo real de verdade são as Edge Functions (que rodam em Deno, no servidor do
Supabase).

## `config.js` (raiz do repositório) — carregado pelo navegador

```js
export const CONFIG = {
  supabaseUrl: 'https://dbhqgxdsbploioujmqrs.supabase.co',
  supabaseAnonKey: 'sb_publishable_NEGrJ-b5PT0ol3DBwFHn4g_4aGgQBLg',
  organizacao: 'Neo Service',
  sistemaNome: 'Gestão Setor de Secretaria de Vendas',
};
```

| Variável | É segredo? | Notas |
|---|---|---|
| `supabaseUrl` | não | endereço público do projeto |
| `supabaseAnonKey` | **não** | é a chave `anon`/`publishable` — feita para ficar no navegador; a segurança real é o RLS no Postgres, não o sigilo desta chave (ver [SEGURANCA.md](SEGURANCA.md)) |
| `organizacao` / `sistemaNome` | não | só texto de exibição |

Ao migrar para outra organização, **este é o único arquivo que precisa mudar** para apontar o
front-end para um projeto Supabase diferente (ver [CHECKLIST-MIGRACAO.md](CHECKLIST-MIGRACAO.md)).

## Variáveis das Edge Functions (Deno, lado servidor)

Todas as 8 funções usam `Deno.env.get(...)` para ler:

| Variável | Origem | Uso |
|---|---|---|
| `SUPABASE_URL` | **injetada automaticamente pelo Supabase** em toda Edge Function — não precisa configurar | endereço do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | **injetada automaticamente pelo Supabase** | chave privilegiada, usada para bypassar RLS quando a função precisa (criar usuário, etc.) — **nunca é enviada ao navegador** |
| `SUPABASE_ANON_KEY` | injetada automaticamente | usada só em `disparar-lembrete-manual`, para validar o JWT de quem chamou antes de agir como service role |

Nenhuma dessas 3 precisa ser configurada manualmente — o Supabase injeta sozinho em todo
ambiente de Edge Function do projeto. **Não há um arquivo `.env` para Edge Functions neste
repositório** (o código delas foi obtido direto do Supabase para este handover, não está
versionado em `supabase/functions/` no Git — ver observação em [PENDENCIAS.md](PENDENCIAS.md)).

## Segredos hardcoded no código-fonte (não são variáveis de ambiente, mas deveriam ser)

Este é o achado mais importante deste documento — **os dois itens abaixo precisam ser trocados
antes ou imediatamente depois de qualquer transferência de posse do projeto**, porque hoje
qualquer pessoa com acesso de leitura ao código consegue vê-los:

### 1. Webhook do Power Automate (alerta no Teams)

Está **duas vezes**, hardcoded, dentro do corpo das funções SQL `enviar_alerta_teams()` (as duas
sobrecargas, ver [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md#funções)):

```
https://default34913178cc0a4b139ad570c18609f5.4c.environment.api.powerplatform.com:443/
  powerautomate/automations/direct/cu/01/workflows/7638800765454be8b637f25a856ef3f5/
  triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&
  sig=ch5wes7Hknz_R8v-SufEQDNTVb4RS2XPnElGApHzEu0
```

Essa URL **é** o segredo — qualquer pessoa que a tenha consegue postar mensagens no canal do
Teams da Neo Service, sem precisar de login no sistema nem no Power Automate. Quem tiver acesso
de leitura ao banco (ex.: `SELECT pg_get_functiondef('enviar_alerta_teams'::regproc)`, um
comando SQL comum, sem privilégio especial além de conseguir rodar SQL no projeto) vê essa URL
inteira. Ação recomendada: gerar um novo webhook no Power Automate/canal do Teams de destino e
substituir nas duas funções (`create or replace function ...`), e tratar a URL antiga como
comprometida a partir do momento em que outra empresa tiver acesso ao banco.

### 2. Token de verificação do webhook do WhatsApp (Meta)

Hardcoded na Edge Function `whatsapp-webhook`:
```ts
const VERIFY_TOKEN = 'neoservice_wa_verify_2026';
```
Usado só no handshake de verificação que a Meta exige ao cadastrar um webhook (`GET` com
`hub.verify_token`). Sozinho não dá acesso a nada além de completar esse handshake, mas mesmo
assim é um valor que deveria vir de `Deno.env.get('WA_VERIFY_TOKEN')` (variável de ambiente
configurável no dashboard da função) em vez de estar escrito no código-fonte — troca recomendada
se o número de WhatsApp for reconfigurado.

### 3. Secret fixo da função `alerta-plantao`

Também hardcoded, na própria função:
```ts
const SECRET = '5c312f3bd0504baa99e4b8fe3b2eeef92e88b68c11204abe9219c9f16d08b50c';
```
Essa é a **chave que protege um endpoint público** (`verify_jwt: false`) que expõe quem está de
plantão e não registrou atividade — dado interno de baixo risco, mas ainda assim é um segredo de
acesso, hoje só protegido por estar escrito no código em vez de configurável. Mesma recomendação:
mover para variável de ambiente da função e gerar um valor novo ao trocar de organização.

## O que NÃO existe hoje

- Nenhuma chave de API de terceiro paga/limitada (não há OpenAI, Google Maps, SendGrid, Twilio
  etc.).
- Nenhuma variável de ambiente configurada no Netlify (Site settings → Environment variables) —
  não verificado via API do Netlify com detalhe linha a linha nesta auditoria (a leitura feita
  não expõe a lista completa de env vars), mas coerente com o fato de não haver build: **conferir
  diretamente no dashboard do Netlify antes de presumir que está vazio.**
