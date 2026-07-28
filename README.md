# Gestão Setor de Vendas — Neo Service

Sistema interno de gestão da equipe da Secretaria de Vendas: produção (esteira de análise de
crédito e emissão de contrato), metas e indicadores ponderados, qualidade/retrabalho, fechamento
mensal, escala de plantão, repasse bancário, chamados entre áreas e cadastros operacionais.

**Autoria:** ver [AUTHORS.md](AUTHORS.md).

## Visão geral da arquitetura

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│      Navegador           │        │           Supabase            │
│  index.html + app.js     │ HTTPS  │  (projeto dbhqgxdsbploioujmqrs)│
│  (HTML/CSS/JS puro,      │───────▶│  ┌──────────────────────────┐ │
│   sem framework,         │◀───────│  │ Postgres (RLS por papel) │ │
│   sem build step)        │        │  ├──────────────────────────┤ │
└─────────────────────────┘        │  │ Auth (login/convite)     │ │
         ▲                          │  ├──────────────────────────┤ │
         │ hospedagem estática      │  │ Storage (anexos, arquivo)│ │
         │ (Netlify hoje)           │  ├──────────────────────────┤ │
         │                          │  │ Edge Functions (Deno)    │ │
   arquivos: index.html,            │  ├──────────────────────────┤ │
   app.js, config.js,                │  │ pg_cron (alertas Teams) │ │
   fluxogramas/*.drawio               │  └──────────────────────────┘ │
                                      └──────────────────────────────┘
```

- **Front-end**: `index.html` + `app.js`, JavaScript puro com ES Modules, sem React/Vue/build
  step. O que está no repositório é exatamente o que roda no navegador — abrir `index.html` num
  servidor estático já é suficiente.
- **Back-end**: [Supabase](https://supabase.com) — Postgres padrão (sem lock-in), Auth, Storage
  e Edge Functions (Deno) para as ações que exigem `service_role` (convidar usuário, resetar
  senha, excluir usuário).
- **Automação**: `pg_cron` + `pg_net`, rodando dentro do próprio Postgres, dispara alertas de
  plantão no Teams às 12h e 17h sem depender de nenhum serviço externo.
- **Hospedagem**: hoje em [Netlify](https://netlify.com), com branch `staging` publicando em
  ambiente de teste separado. Por ser 100% estático, funciona igual em IIS, nginx, Apache,
  S3, Azure Static Web Apps ou GitHub Pages — ver `TRANSFERENCIA.md`.

## Decisões de design que valem a pena conhecer

- **Sem build step, de propósito.** Zero `node_modules`, zero versão de Node para manter
  compatível. Reduz para praticamente zero a chance de "funciona na minha máquina" e permite que
  qualquer pessoa com acesso ao arquivo abra e entenda o código sem ferramentas extras.
- **Permissão de verdade no banco, não só escondida na tela.** RLS (Row Level Security) do
  Postgres controla o que cada papel (`admin`, `analista`, `leitura`) pode ler/escrever — inclusive
  contra chamadas diretas à API, não apenas contra a interface. Ver seção "Controle de acesso"
  no `TRANSFERENCIA.md`.
- **Ambiente de teste (`staging`) dentro do mesmo projeto Supabase.** Em vez de um segundo
  projeto (limite do plano gratuito), o ambiente de teste usa um schema Postgres separado
  (`staging`), espelhado diariamente por `pg_cron` a partir dos dados reais — troca de ambiente
  é automática pelo domínio (`location.hostname`).
- **Esteira com fluxo configurável, não hardcoded.** Etapas e transições (`etapas_esteira`,
  `esteira_transicoes`) são dados no banco, editáveis pela própria interface
  (Administração → Fluxos da Esteira) — não é necessário mexer em código para mudar o fluxo de
  análise de crédito ou emissão de contrato.
- **Erro de retrabalho atribuído automaticamente.** Quando um processo regride de etapa na
  esteira, o sistema sabe quem validou a etapa anterior (`esteira_validacoes`) e gera
  automaticamente um apontamento de erro para essa pessoa — exceto quando o motivo é "pedido do
  vendedor" (mudança de escopo, não falha de análise).
- **Metas com peso por indicador e por trimestre.** O cálculo de atingimento (`meta_colaborador_resultado`)
  replica a lógica da planilha de metas usada pela equipe antes do sistema, com peso configurável
  por colaborador e por trimestre — não é uma média simples.

## Desenvolvimento local

```bash
./server.ps1        # Windows — sobe um servidor estático em http://localhost:8123
# ou
npx serve            # qualquer SO com Node instalado
```

Não há passo de instalação (`npm install`) porque não há dependências de build — as bibliotecas
(Supabase JS, SheetJS) são carregadas via CDN diretamente no navegador.

## Deploy

Publicado via Netlify, conectado a este repositório:
- `main` → produção (`secretaria-vendas-gestao.netlify.app`)
- `staging` → ambiente de teste (`staging--secretaria-vendas-gestao.netlify.app`)

Para transferir a hospedagem para outra infraestrutura (servidor interno, outro provedor), ver
o guia completo em [TRANSFERENCIA.md](TRANSFERENCIA.md).

## Documentos deste repositório

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Este arquivo — visão geral e arquitetura |
| `AUTHORS.md` | Autoria e créditos |
| `TRANSFERENCIA.md` | Guia passo a passo de migração/deploy para o TI |
| `RESUMO-EXECUTIVO.md` | O que o sistema substitui e o valor entregue |
