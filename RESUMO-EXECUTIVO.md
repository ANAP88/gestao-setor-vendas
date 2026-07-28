# Resumo executivo

Para quem for herdar, avaliar ou dar continuidade a este sistema — o que ele é, em termos de
negócio, além do código.

## O que existia antes

A gestão da Secretaria de Vendas era feita em planilhas dispersas (controle de produção,
fechamento mensal, escala de plantão, metas por analista) e comunicação informal (e-mail e
mensagens soltas) entre áreas para pedidos, retrabalho e aprovações. Cada uma dessas frentes
vivia separada das outras, sem histórico central e sem controle de acesso.

## O que o sistema substitui e centraliza hoje

- **Controle de produção** — hoje com **9.975 processos** cadastrados, substituindo a planilha
  manual de controle. Numeração automática, busca, filtro por analista/status/mês.
- **Esteira de análise de crédito e emissão de contrato** — fluxo antes controlado por
  conversa/e-mail entre analistas, agora rastreado etapa a etapa, com responsável e histórico.
  Inclui atribuição automática de erro/retrabalho quando um processo regride de etapa (com
  exceção explícita para pedido do vendedor, que não é falha de análise).
- **Fechamento mensal** — geração automática do fechamento (hoje reflete direto o que está
  marcado como faturado na produção), exportação no layout exato usado pela equipe, e agora
  também importação de planilha para popular produção/fechamento em lote.
- **Metas & indicadores** — substitui a planilha de metas ponderadas por indicador e por
  trimestre; hoje acompanha **5 analistas ativos**, com ranking, dashboard individual e visão
  consolidada da equipe (incluindo acompanhamento mês a mês).
- **Qualidade / Retrabalho** — **5 apontamentos** registrados até agora, com histórico de origem
  (cliente vs. validação interna) e, agora, geração automática a partir de regressões na esteira.
- **Chamados entre áreas** — **4 chamados** registrados, com dono, e-mail de envio integrado
  (Outlook Web/Gmail) e controle de quem pode editar.
- **Escala de plantão, repasse bancário e cadastros operacionais** (colaboradores, empreendedoras,
  empreendimentos, atividades) — cadastro único, sem duplicidade entre telas.
- **Controle de acesso real** — **4 usuários ativos** hoje, com 3 níveis de permissão
  (admin/analista/leitura) aplicados no banco via RLS, não apenas escondidos na interface.
- **Ambiente de teste isolado** — mudanças são validadas em um ambiente espelho antes de ir para
  produção, sem custo adicional de infraestrutura.

## Por que isso importa

- Elimina a dependência de "a planilha certa está com quem" — existe uma fonte única de dados,
  com histórico e auditoria (quem fez o quê e quando).
- Reduz retrabalho de comunicação: o que antes era e-mail solto virou registro estruturado com
  dono e prazo.
- Torna a qualidade mensurável: erro de análise agora gera um número, não uma reclamação verbal.
- Sistema pronto para crescer — fluxo da esteira é editável pela própria coordenação, sem
  depender de programador para adicionar uma etapa ou mudar um texto de botão.

## Números atuais (banco de produção)

| Métrica | Valor |
|---|---|
| Processos de produção | 9.975 |
| Usuários ativos | 4 |
| Analistas ativos | 5 |
| Processos na esteira | 5 |
| Chamados entre áreas | 4 |
| Apontamentos de qualidade | 5 |
