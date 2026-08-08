# Fluxos

Diagramas dos processos centrais do sistema, montados a partir do código real (triggers +
`app.js`), não de uma especificação teórica.

## 1. Produção → Esteira → Contrato → Repasse (a cadeia completa)

```mermaid
flowchart TD
    A["Analista cadastra/importa\numa demanda em Produção"] -->|"trigger criar_card_esteira_de_demanda\n(se atividade = Análise de Crédito\nou Emissão de Contrato)"| B["Card criado\nautomaticamente na Esteira"]
    B --> C{"Analista da Esteira\nregistra o Parecer\nde Análise de Crédito"}
    C -->|"Reprovado"| D["Etapa: Reprovado\n(processo permanece aberto\nnesse bloco)"]
    C -->|"Aprovado com pendência"| E["Etapa: Com pendência"]
    C -->|"Aprovado (sem contrato)"| F["CONCLUÍDO\n(fim do fluxo de crédito)"]
    C -->|"Aprovado + enviar contrato\nou Aprovado c/ pendência + contrato"| G["CONCLUÍDO\n+ trigger avancar_automacao_esteira\ncria automaticamente um novo\nprocesso em Emissão de Contrato"]
    G --> H["Equipe avança o contrato\npelas transições configuradas\n(Geração → Verificação → Envio →\nAssinaturas → Cadastro no ERP)"]
    H -->|"conclui sem devolução\n(client-side, não trigger)"| I["Novo processo criado\nautomaticamente em Repasse"]
    H -->|"conclui com\nsera_faturado = true"| J["trigger propaga_faturamento_esteira\nmarca demandas.fat_mensal = true\nna demanda de origem"]
    J --> K["Aparece no Fechamento mensal"]
    I --> L["Equipe conduz o checklist\ndocumental de Repasse\n(28 etapas configuráveis)"]
```

**Pontos de atenção**: o passo G (trigger de banco) e um caminho alternativo client-side que
dispara quando o **texto** de um botão de transição contém "enviar para Emissão de Contrato"
fazem, na prática, a mesma coisa por dois caminhos independentes — ver
[REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md#esteira-análise-de-crédito-emissão-de-contrato-repasse).
O passo I (Esteira→Repasse) é 100% client-side, sem trigger correspondente.

## 2. Regressão de etapa → erro automático de retrabalho

```mermaid
flowchart TD
    A["Processo está na etapa X\n(alguém já validou X, registrado\nem esteira_validacoes)"] --> B["Responsável clica um botão\nde transição que volta\npara uma etapa anterior"]
    B --> C["Sistema pede o motivo\n(categoria + descrição livre,\nvia prompt())"]
    C --> D{"Motivo =\n'pedido do vendedor'?"}
    D -->|"Sim — mudança de escopo,\nnão é falha de análise"| E["Move para a etapa anterior.\nNenhum apontamento de erro gerado."]
    D -->|"Não"| F["Move para a etapa anterior"]
    F --> G["Busca em esteira_validacoes\nquem validou a etapa\nque está sendo reaberta"]
    G -->|"Achou"| H["Insere apontamento_erro\nautomático para essa pessoa\n(categoria: Retrabalho —\nregressão de etapa)"]
    G -->|"Não achou registro\nde validação"| I["Grava no histórico:\n'Não foi possível atribuir\nerro automático'\n(degrada sem quebrar)"]
```

## 3. Metas & Indicadores — o que é automático e o que é manual

```mermaid
flowchart LR
    subgraph Sempre["Sempre automático"]
        A1["apontamentos_erro\n(com indicador_id)"] -->|"trigger\ntrg_apontamento_erro_sync_meta"| M["meta_colaborador_mensal\n.quantidade_erros"]
    end
    subgraph Condicional["Automático só se o indicador\ntiver esteira_tipo configurado"]
        A2["esteira_processos\nconcluído"] -->|"trigger\ntrg_esteira_processo_sync_meta"| N["meta_colaborador_mensal\n.quantidade_processos"]
    end
    subgraph Manual["Sempre manual (os 2 acima\nnão têm fonte automática)"]
        A3["Tela 'Lançar resultado\nindividual' (admin)"] --> M
        A4["Tela 'Lançar dados do mês'\n(nível equipe, admin)"] --> O["indicador_mensal\n(NUNCA automático,\nmesmo com esteira_tipo)"]
    end
```

## 4. Alerta de plantão (Teams)

```mermaid
flowchart LR
    Cron["pg_cron\n15:00 e 20:00 UTC\n(12h e 17h Brasília)"] -->|"SELECT enviar_alerta_teams()"| Fn["função enviar_alerta_teams()"]
    Manual["Admin clica\n'Enviar lembrete agora'\n(tela Automações)"] -->|"Edge Function\ndisparar-lembrete-manual"| Fn2["enviar_alerta_teams(disparado_por)"]
    Fn --> View["consulta a view alerta_hoje\n(quem está de plantão hoje\ne não lançou nenhuma demanda)"]
    Fn2 --> View
    View --> Card["monta Adaptive Card\n(verde se ninguém pendente,\nlaranja se houver)"]
    Card -->|"pg_net.http_post\nURL hardcoded"| Teams["Power Automate\n→ posta no canal do Teams"]
    Fn2 -.->|"só esta grava"| Log["alerta_teams_log"]
```

## 5. Login e roteamento inicial (`init()`)

```mermaid
flowchart TD
    Start["Página carrega"] --> Hash{"URL tem\ntype=invite/recovery\ne há sessão?"}
    Hash -->|Sim| DefSenha["renderDefinirSenha\n(fim)"]
    Hash -->|Não| Sess{"Tem sessão\nativa (sb.auth.getSession)?"}
    Sess -->|Não| Rota{"Rota é /portal\nou /portal/slug?"}
    Rota -->|Sim| LoginPortal["renderLoginPortal"]
    Rota -->|Não| LoginInterno["renderLogin"]
    Sess -->|Sim| Perfil["upsert + busca perfis\n(role, ativo, empreendedora_id...)"]
    Perfil --> Ativo{"perfil.ativo\n=== false?"}
    Ativo -->|Sim| SignOut1["signOut() + 'conta desativada'"]
    Ativo -->|Não| Cruz{"Rota /portal mas\nrole ≠ cliente?\n— ou —\nRota interna mas\nrole = cliente?"}
    Cruz -->|Sim, algum dos dois| SignOut2["signOut() + mensagem\n'use o outro link'"]
    Cruz -->|Não| Cadastro{"perfil.cadastro_completo\n=== false?"}
    Cadastro -->|Sim| Completar["renderCompletarCadastro"]
    Cadastro -->|Não, e role=cliente| Portal["renderPortalCliente"]
    Cadastro -->|Não, e role≠cliente| Interno["loadLookups() + render()\n(sistema interno)"]
```

## 6. Backup e espelhamento diário (dentro do próprio Postgres)

```mermaid
flowchart LR
    Cron1["pg_cron 06:00 UTC\nbackup-diario-interno"] -->|"SELECT backup.rodar_snapshot_diario()"| Snap["Para cada uma de 17 tabelas:\nINSERT INTO backup.snapshots\n(tabela, dados = JSONB de todas as linhas)"]
    Snap --> Purge["DELETE snapshots\ncom mais de 35 dias"]
    Cron2["pg_cron 06:30 UTC\nespelho-staging-diario"] -->|"SELECT staging.atualizar_espelho()"| Mirror["Para cada uma de 37 tabelas:\nTRUNCATE staging.<tabela>\nINSERT ... SELECT * FROM public.<tabela>"]
```

Detalhe de cada um, incluindo como restaurar, em [BACKUP-E-ROLLBACK.md](BACKUP-E-ROLLBACK.md).

## 7. Ciclo de vida de um usuário

```mermaid
flowchart TD
    A["Admin abre 'Usuários'\n(equipe ou Portal)"] --> B["Edge Function convidar-usuario\ncria conta com senha\naleatória descartável"]
    B --> C["Front-end chama\nsb.auth.resetPasswordForEmail"]
    C --> D["Admin envia o link\n(mailto/Gmail/Outlook/copiar)"]
    D --> E["Usuário clica no link\n→ renderDefinirSenha\n→ define a própria senha"]
    E --> F{"cadastro_completo\n=== false?"}
    F -->|Sim| G["renderCompletarCadastro\n(nome + função, se equipe)"]
    G --> H["Acesso normal ao sistema"]
    F -->|Não| H
```

## 8. Publicação de uma mudança (staging → produção)

Ver passo a passo textual em [DEPLOY.md](DEPLOY.md#fluxo-normal-de-publicação-de-uma-mudança).

```mermaid
flowchart LR
    Dev["Editar em branch staging"] --> Push1["git push origin staging"]
    Push1 -->|webhook| Deploy1["Netlify publica\nstaging--....netlify.app"]
    Deploy1 --> Valida["Validar manualmente\nno ambiente de teste"]
    Valida -->|ok| Merge["git checkout main\ngit merge staging\ngit push origin main"]
    Merge -->|webhook| Deploy2["Netlify publica\nsecretaria-vendas-gestao.netlify.app"]
    Merge -.->|"se a mudança tocou o banco"| SQL["Replicar o mesmo SQL\nmanualmente em public\n(não é automático)"]
```
