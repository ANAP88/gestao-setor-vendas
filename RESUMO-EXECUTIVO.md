# Resumo executivo

Para quem for herdar, avaliar ou dar continuidade a este sistema — o que ele é, em termos de
negócio, além do código.

## O que existia antes

A gestão da Secretaria de Vendas era feita em planilhas dispersas (controle de produção,
fechamento mensal, escala de plantão, metas por analista) e comunicação informal (e-mail e
mensagens soltas) entre áreas para pedidos, retrabalho e aprovações. Cada uma dessas frentes
vivia separada das outras, sem histórico central e sem controle de acesso.

## O que o sistema substitui e centraliza hoje

> **Nota (04/08/2026):** os dados operacionais de produção (processos, clientes, esteira,
> chamados, apontamentos) foram zerados intencionalmente para recomeço — ver números atualizados
> abaixo. Os cadastros de usuários e analistas foram mantidos.

- **Controle de produção** — substitui a planilha manual de controle, com numeração automática,
  busca e filtro por analista/status/mês. Banco operacional zerado hoje para recomeço.
- **Esteira de análise de crédito e emissão de contrato** — fluxo antes controlado por
  conversa/e-mail entre analistas, agora rastreado etapa a etapa, com responsável e histórico.
  Inclui atribuição automática de erro/retrabalho quando um processo regride de etapa (com
  exceção explícita para pedido do vendedor, que não é falha de análise).
- **Fechamento mensal** — geração automática do fechamento (hoje reflete direto o que está
  marcado como faturado na produção), exportação no layout exato usado pela equipe, e agora
  também importação de planilha para popular produção/fechamento em lote.
- **Metas & indicadores** — substitui a planilha de metas ponderadas por indicador e por
  trimestre; hoje acompanha **7 analistas ativos** (4 deles aparecem na produtividade/ranking —
  a gestão escolhe quem entra), com ranking, dashboard individual e visão consolidada da equipe
  (incluindo acompanhamento mês a mês).
- **Qualidade / Retrabalho** — histórico de origem (cliente vs. validação interna), com geração
  automática a partir de regressões na esteira. Apontamentos zerados hoje junto com a produção.
- **Chamados entre áreas** — dono, e-mail de envio integrado (Outlook Web/Gmail) e controle de
  quem pode editar. Zerado hoje junto com a produção.
- **Escala de plantão, repasse bancário e cadastros operacionais** (colaboradores, empreendedoras,
  empreendimentos, atividades) — cadastro único, sem duplicidade entre telas.
- **Controle de acesso real** — **8 usuários ativos** hoje, com 3 níveis de permissão
  (admin/analista/leitura) aplicados no banco via RLS, não apenas escondidos na interface.
- **Ambiente de teste isolado** — mudanças são validadas em um ambiente espelho antes de ir para
  produção, sem custo adicional de infraestrutura.
- **Portal do Incorporador** — incorporadoras e loteadoras acompanham em tempo real os próprios
  empreendimentos e processos (sem acesso ao restante do sistema interno), com identidade visual
  própria (logo e cor) e conversa direta com a equipe por processo. Antes esse acompanhamento era
  feito por e-mail e WhatsApp avulsos.

## Por que isso importa

- Elimina a dependência de "a planilha certa está com quem" — existe uma fonte única de dados,
  com histórico e auditoria (quem fez o quê e quando).
- Reduz retrabalho de comunicação: o que antes era e-mail solto virou registro estruturado com
  dono e prazo.
- Torna a qualidade mensurável: erro de análise agora gera um número, não uma reclamação verbal.
- Sistema pronto para crescer — fluxo da esteira é editável pela própria coordenação, sem
  depender de programador para adicionar uma etapa ou mudar um texto de botão.

## Números atuais (banco de produção — 04/08/2026)

| Métrica | Valor |
|---|---|
| Processos de produção | 0 (zerado hoje) |
| Usuários ativos | 8 |
| Analistas ativos | 7 (4 entram na produtividade/ranking) |
| Processos na esteira | 0 (zerado hoje) |
| Chamados entre áreas | 0 (zerado hoje) |
| Apontamentos de qualidade | 0 (zerado hoje) |
