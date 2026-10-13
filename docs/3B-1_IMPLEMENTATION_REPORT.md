# 3B-1 — Relatório de implementação e validação

Data: 12/10/2026. Branch: `feat/agenda-canonical-events`.
Baseline: `40ed9f425b419b4ce25b20bc2e44023ea88e5b18`.

Este arquivo registra evidências da unidade. Os documentos numerados, D-037 e
AGENTS.md continuam sendo os contratos canônicos; o master é gerado.

## Escopo final

Criação explícita de compromissos canônicos **exclusivamente timed** e consulta na
Agenda. A consulta também apresenta date_only/all_day recuperados, sem inventar
horários. Não há edição, exclusão, recorrência, template, conclusão/reagendamento
de completas, Metas estruturadas, Semana funcional, motor ou trabalho da 3B-2.

A autorização complementar foi reconciliada com a implementação existente:
retirou-se a criação de date_only/all_day do formulário e da fronteira persistente.
As provas de consulta desses tipos passaram a usar fixtures de recuperação.
O restante do trabalho foi aproveitado, sem reset, descarte ou reinício da etapa.

## Implementação

- `persistence/execution/event-creation.ts`: ScheduleOccurrence planned, factories
  e codecs estritos, origem event, templateId null, sem execução/resolução/categoria
  inferida. Compartilha o alocador monotônico occ:n do registro discriminado 3.
- A intenção captura authorityEpoch, datasetRevision e posição do alocador;
  createdAt é capturado na confirmação e conservado em retry inalterado.
  A transação compara metadata ativa/fence/base, escreve somente execution/bridge
  e faz readback. Uma mutação líquida avança revisão uma vez. Overflow/falha revertem
  evento e alocação. Fato integral idêntico na mesma autoridade prova replay sem
  escrita; outra intenção na identidade ocupada falha. Uma segunda criação
  deliberada, inclusive com conteúdo igual, captura outra posição e recebe outro ID.
- Planner lógico 2, backup 3, recuperação 3/2/1, geração 2/schema Dexie 1 e tabelas
  existentes permanecem. Planner legado, fontes/procedência e v1 somente leitura
  são preservados. Não há nova fonte de verdade, dependência ou backend.
- `event-input.ts`, `event-dialog.tsx` e `event-command.ts`: confirmação de
  título/flexibilidade/início/fim/fuso IANA, sem rollover implícito ou DST ambíguo/
  inexistente. Fila única serializa comandos/autosave/recuperação; submit duplicado
  é bloqueado. Após comando, publica snapshot validado. Falha isolada mantém
  campos e permite retry; conflito mantém base antiga e exige resolução explícita.
  Rascunho de campos pode ser baixado separadamente e não é backup importável.
- `agenda-view.tsx`: calendário mensal, seleção de data/fuso, consulta pura comum
  e detalhes por identidade. Eventos independem de records legados. Timed cruza
  meia-noite e aparece em todos os dias intersectados; tipos sem horário conservam
  datas/fuso e fim exclusivo. Candidatos legados sem confirmação são rotulados.
- Resumo mensal, métricas e meta legada permanecem em `Ver resumo mensal`.
  Regressões anteriores mantêm suas assertions e acessam essa opção explicitamente.
  Hoje continua lendo completas timed sem expor comandos de completa.
- Shell, Light/Dark/Solar e cena aprovada foram preservados. O cabeçalho novo usa
  contraste difuso equivalente ao já aplicado em Aparência, apenas na Agenda.
  Dialog possui foco inicial, Escape e retorno de foco ao acionador; layout 390px
  é verificado sem overflow. Cena e testes solares não foram modificados.

## Levantamento e evidências

| Requisito | Evidência |
| --- | --- |
| Modelo/versões/alocação/CAS | Testes Node de criação, alocador misto, conexões independentes, fence/base e overflow |
| Retry versus nova criação | Replay exato sem escrita, conflito de payload, duas criações deliberadas e duplo clique no Edge |
| Rollback/readback | Quota, falha de releitura e falha após write; banco integral preservado e retry explícito |
| Autosave obsoleto | Autosave parado na preparação de hash perde CAS após criação e não descarta o evento |
| Conflito recuperável | Formulário/base preservados após criação ou restore por outra aba; rascunho baixável |
| Independência do legado/futuro | Criação em 2040-02-29 sem records; consulta e projeção Hoje sem mutação |
| Consulta timed/date_only/all_day | Madrugada, fixtures recuperadas, fim exclusivo, ausência de produtores sem horário |
| Recuperação | Export 3, restore/reload, reset, época nova, rejeição de intenção antiga e v1 intacto |
| Compatibilidade | Suíte Node completa e regressões Edge de 3A-1/3A-2, Hoje, conclusão, reagendamento e replay histórico |
| Datas/fusos | IANA nomeado, offsets/zonas inválidas, DST inexistente/ambíguo, intervalo inválido e dias de 23/25h |
| Acessibilidade/visual | Rota direta, teclado, Escape/foco, desktop e 390px; capturas locais revisadas |

## Validação

- `npm.cmd test`: build e **452/452 Node**, incluindo **29 cenários novos** da
  Agenda. Build final após ajustes visuais também passou.
- `npm.cmd run lint` e `npm.cmd run typecheck`: aprovados.
- `npm.cmd run docs:master` seguido de `docs:master:check`: aprovado.
- Edge dirigido: **11/11 cenários novos passaram dentro da execução global**.
- Edge global, primeira rodada: **87/88**, falha de navegação do teste de fencing
  após reload; faltava reabrir o resumo mensal. Esse passo foi corrigido conservando
  todas as assertions de rascunho/CAS/persistência.
- Edge global, rodada final: **87/88**, com todos os 11 cenários da Agenda e as
  regressões de persistência aprovados. Falhou somente solar-review a 1007px,
  assertion `partial: center covered` (esperado true, recebido false). **O gate
  Edge global permanece não aprovado.** Não houve retry automático ou alteração
  da cena/assertion para obter sucesso.
- O cenário solar passou na primeira rodada desta mesma implementação. Uma
  verificação diagnóstica isolada de **40ed9f**, sobre build próprio/porta 3001,
  também passou **1/1**, sem retries. A falha não foi reproduzida nessa tentativa;
  não se afirma causa confirmada ou prova nova de falha na baseline. A instabilidade
  do mesmo teste já consta do histórico pré-merge da 3A-2 no documento 10.
- `git diff --check`, varredura de padrões de segredo/UTF-8 e revisão do escopo:
  aprovados. São 30 arquivos de entrega; dados/logs/capturas/builds ficam ignorados.
- Publicação restrita à branch de implementação autorizada. O hash e o resultado
  do push são informados no fechamento; publicação não aprova o gate global/PR/merge.

Comando browser: `npx.cmd playwright test --retries=0`, com SCENE_BROWSER=msedge e
SCENE_TEST_URL=http://127.0.0.1:3000, sobre build de produção. Um worker, sem retries.
Servidor e navegador utilizaram autorizações específicas de processo/rede local;
não houve alteração de ACLs, execution policy, configuração de sandbox ou testes
solares. Logs e capturas ficam em outputs/, ignorado pelo Git.

Falhas intermediárias permanecem registradas: lançamento do Edge bloqueado pelo
perfil temporário do sandbox; socket local proibido entre processos; seletor de
flexibilidade sem nome acessível exato; foco não restaurado após Escape. As duas
falhas de produto foram corrigidas, conservando as assertions. A expectativa SSR
da rota foi atualizada para o carregamento da Agenda. A falha de navegação após
reload e a falha solar da rodada final também permanecem documentadas. Nada foi
ocultado por retries. Evidências principais: outputs/agenda-final-node.log,
outputs/agenda-global-edge.log, outputs/agenda-global-edge-final.log e
outputs/agenda-baseline-solar-40ed9f/baseline-solar.log.

## Gates humanos

Nenhuma PR, merge, exclusão de branch, deploy ou avanço para 3B-2 foi executado.
Commit/push da branch seguem a autorização permanente após validação. A abertura
da PR aguarda autorização explícita do usuário; a auditoria pré-merge e o merge
continuam com seus gates próprios. Este relatório registra revisão e validação
locais, sem alegar auditoria independente ou CI de uma PR ainda inexistente.

## Correções pré-merge da PR #18 — F1–F5

Esta seção sucede os checkpoints históricos acima. A PR #18 foi aberta por
autorização própria e a auditoria do HEAD a2eea6239a03bc8d14f4a8cc29376f4f9d8933e1
concluiu NÃO APTO PARA MERGE. Branch e base continuaram iguais às referências
aprovadas, um commit/30 arquivos, working tree limpa, PR OPEN/MERGEABLE e verify
aprovado. Fetch --prune confirmou main 40ed9f e a branch a2eea62 antes das alterações.
Relatório/evidências: outputs/audit-pr18/REPORT.md e seus harnesses/results/logs.

F1/F2/F3 foram reproduzidos antes da correção em duas conexões Dexie; F1/F2 e F4
também no Edge sobre o build auditado. O ensaio conservou dois sucessos/um evento,
sucesso falso sem evento e retry bloqueado após commit. Não se descartou trabalho.

| Achado | Causa e correção | Estado |
| --- | --- | --- |
| F1 P1 | Igualdade de campos/createdAt/alocador confundia intenções. UUID v4 por formulário, injetado ao produtor e persistido como creationIntentId na entrada canonical, prova integral/época e unicidade estritas | Resolvido |
| F2 P2 | Truthiness do catch ignorava rejeições falsy. Estado rejected explícito e sucesso condicionado à prova autoritativa própria | Resolvido |
| F3 P2 | Resposta perdida publicava a própria revisão como conflito externo. Releitura validada e prova própria reconciliam o commit, sem nova escrita/revisão ou remoção de guards globais | Resolvido |
| F4 P2 | Próximo mês era tratado como LocalDate inválida. Último dia define a borda civil exclusiva real; consulta numérica admite ISO expandido só em memória | Resolvido |
| F5 P3 | Export desabilitado também existia antes do ready. Guard positivo Selecionar arquivo habilitado e comparação do conjunto após reload | Resolvido |

### Política de identidade e compatibilidade

D-038 complementa D-037 sem reescrever D-031 a D-037. creationIntentId é UUID v4
opaco gerado uma vez na abertura explícita, controlável por injeção na API/testes.
Retry conserva ID e createdAt; campos alterados não autorizam replay de outro fato.
occ:n continua vindo do alocador monotônico compartilhado. O token não é relógio,
posição, origin.label ou uma nova entidade de domínio. Outra intenção na posição
ocupada conserva erro/formulário. Reutilizar um token em outra posição é rejeitado.

A prova opcional vive junto à ocorrência no execution/bridge 3, coberta pelo
mesmo fingerprint/escrita/readback. O codec continua estrito, valida UUID/origem/
unicidade e rejeita campo extra ou token inválido. Não há tabela/store paralelo,
schema novo, migração estrutural ou segunda fonte de verdade. Sem prova histórica,
leitura/export/upgrade/recovery preservam a ausência e criação nova não reconhece
replay por aparência. Restore/reset usam a época local e invalidam tentativas antigas.

Preservados planner 2, registro 3, backup público 3/recovery 3/2/1, geração 2,
Dexie 1, D-036 e v1 somente leitura. Backups antigos continuam legíveis na versão
corrigida; export/restore novos preservam prova e fatos integralmente. Leitores
antigos estritos que não conhecem a extensão rejeitam o campo, sem descarte ou
downgrade; não se promete compatibilidade de leitura futura por binários antigos.

### Evidências e validação corrigida

- Node dirigido da Agenda: 43 cenários no conjunto final; suíte Node completa
  **466/466**, com 14 novos, incluindo rejeições undefined/null/false/0/string vazia,
  resposta perdida pós-commit, resposta resolvida sem fato, dois produtores,
  recibo divergente/reutilizado/ausente, codec estrito, reopen e backup.
- `npm.cmd test` executou build e 465/465 antes da inclusão do último caso
  de resposta resolvida sem fato. Após essa inclusão somente de teste, a suíte
  completa `node --experimental-strip-types --test tests/*.test.mjs` passou 466/466.
  Código de produção permaneceu igual ao build usado no Edge. Não se reutiliza
  452/452 como resultado corrigido.
- Recuperação Edge dirigida: **1/1**. Agenda final dirigida: **19/19**.
  Duas abas reais/IndexedDB compartilhado/relógio fixo, hash suspenso, campos iguais:
  apenas a vencedora confirma; a perdedora conserva todos os campos. Após resolução
  explícita, occ:2/occ:3 e tokens distintos persistem em reload/export 3.
- Cinco rejeições falsy antes do commit mantêm formulário/erro/banco. O rascunho
  identifica a mesma prova depois do retry; createdAt conserva o instante original.
- Hook de IDBTransaction injeta erro no handler de resposta somente depois de
  complete real do browser. A interface confirma o evento próprio, sem aviso de
  conflito/storage bloqueado; uma revisão/uma ocorrência, preservadas após reload.
  Retry posterior direto é read-only no Node; intenção concorrente diferente
  continua rejeitada em Node e duas abas reais.
- Dezembro de 9999: 31 dias, evento visível, novembro com 30 dias, navegação de
  volta, limite de ano seguinte informado sem apagar o mês, dia 31/reload/backup
  íntegros. Fixtures Node incluem timed atravessando a borda UTC, date_only e all_day
  com fim exclusivo. LocalDate/UTC persistidos continuam rejeitando ano 10000.
- Global Edge: **96/96**, um worker e retries=0. Inclui regressões 3A-1/3A-2,
  Hoje, metas/métricas mensais, conclusão/reagendamento/replay histórico, backup,
  recuperação, D-036, shell e cena. Todos os quatro solares passaram, inclusive
  1007px. Não se alteraram cena, teste, snapshot, tolerância ou assertion solar.
- Lint/typecheck/build, master check/diff check, segredos/UTF-8 e revisão visual
  desktop/390px aprovados. Capturas: outputs/agenda-fixes-desktop.png,
  agenda-fixes-390.png e agenda-fixes-dialog-390.png.

Falhas intermediárias foram preservadas: primeira Agenda 18/19 porque o hook
de IDBDatabase.transaction não interceptou a resposta (assertion do commit
falhou). Dexie captura esse método; o hook final intercepta oncomplete do
IDBTransaction e comprova o commit. Lint rejeitou alias de this; corrigido mantendo
semântica/assertions, seguido de nova verificação dirigida. Não houve retry automático.

Evidências: outputs/agenda-fixes-node-full.log, agenda-fixes-node-final.log,
agenda-fixes-recovery-edge.log, agenda-fixes-directed-edge.log,
agenda-fixes-lost-response-edge.log, agenda-fixes-directed-edge-final.log,
agenda-fixes-global-edge.log e respectivos diretórios de resultados. As falhas
históricas 87/88 da implementação/auditoria continuam no histórico; 96/96 não prova
a origem da instabilidade solar. Se voltar a ocorrer, seu gate deve ser informado.

### Publicação e limites

Correções restritas à PR #18. Commits/hash/estado remoto são informados no fechamento
de publicação. CI remoto é consultado no novo HEAD; só verify concluído pode ser
declarado aprovado e seu workflow não inclui Edge. Nenhum merge, auto-merge,
exclusão de branch, deploy ou avanço para 3B-2 foi autorizado/executado.
Após publicar, aguardar nova avaliação independente e autorização humana.

## Estabilização arquitetural pré-merge — A2-01/A2-02

Checkpoint inicial: HEAD 2dd8af89c6948857dedbe8f8d3007588bdda90d2, branch
feat/agenda-canonical-events limpa/sincronizada, base/main 40ed9f425b419b4ce25b20bc2e44023ea88e5b18.
Fetch --prune confirmou as referências. PR #18 OPEN/MERGEABLE/CLEAN, três commits,
verify SUCCESS no HEAD anterior, sem comentários/reviews/auto-merge. Os três
commits anteriores permanecem. A autorização desta unidade é restrita a
confirmação/reconciliação/retry e ordenação determinística do teste de reagendamento.

O relatório outputs/audit2-pr18/REPORT.md reprovou o aceite completo de F3:
F1/F2/F4/F5 resolvidos, A2-01 reproduzido em Node e Edge e gate global 95/96
com falha no primeiro teste de reagendamento. Esses resultados históricos
permanecem; os números desta seção não apagam execuções anteriores.

### Causa fundamental e pontos de linearização

A verificação global de replay protegia um snapshot inteiro contra mudança de
revisão. Isso era usado para confirmar um fato imutável de criação já aplicado.
A mutação legítima B fazia essa verificação rejeitar a base antiga; a publicação
applied=false criava conflito remoto, e o guard da sessão impedia até confirmação
readonly no retry. Os dados permaneciam íntegros, mas a aplicação não reconhecia
o próprio commit. Rejeitar uma nova escrita obsoleta continua correto.

| Ponto | Contrato atual |
| --- | --- |
| 1. Abertura/captura | Formulário captura época, revisão, posição e UUID independente; confirmação constrói fatos/createdAt, cacheados no retry inalterado |
| 2. Entrada na fila | Uma fila/coalescência; sessão dirty/remote permite somente reconciliação de criação, sem chamar produtor de nova escrita |
| 3. Preparação | Snapshot íntegro e hash fora da transação; não atualiza o fence original |
| 4. Escrita | Transação compara autoridade/revisão/alocador/base, insere documento e faz readback; tudo atômico |
| 5. Commit/resposta | Commit físico lineariza a criação; rejeição/resposta perdida não prova ausência nem sucesso, inclusive valores falsy |
| 6. Leitura inicial | Captura transacional do conjunto completo e validação de codecs/hashes; falha estrutural permanece visível e bloqueante |
| 7. Testemunha | Uma recaptura readonly consistente, com validação fora da transação, lineariza a comprovação de UUID/occ:n/fatos integrais na mesma época |
| 8. Guard final | Verifica somente autoridade atual; restore/reset durante a validação impedem confirmação da época anterior; revisão posterior não revoga o fato |
| 9. Publicação/invalidação | Snapshot da testemunha contém fatos observados na captura; sessão limpa do editor próprio pode avançar, rascunhos/outros editores ficam preservados. Mutações posteriores chegam via fila de refresh |
| 10. Retry explícito | Mesma prova/fatos/época permitem confirmação sem write/revisão/contador; sem prova própria, campos/erro permanecem e nenhuma escrita obsoleta acontece |

D-039 registra a separação durável, sem reescrever D-031 a D-038. A operação
reconcileCanonicalEvent reaproveita readBackupSnapshot/materialização, sem
recibos paralelos. Não modifica verifyPlanningReplay global, CAS, schema ou
formatos. Não há loop/retry automático que persiga datasetRevision. O guard de
época não congela outras abas: substituição após esse guard é posterior à
confirmação; comandos futuros continuam presos à época capturada. Uma alteração
posterior à testemunha pode aparecer no refresh seguinte, sem invalidar sucesso
próprio. Isso é delimitado explicitamente, não uma promessa de snapshot eterno.

### Matriz determinística C1–C12

Todos os casos abaixo passaram nos testes dirigidos. Node usa conexões Dexie
independentes sobre fake-indexeddb e instantes explícitos. Barreiras ficam fora
das transações, preservando seus locks/snapshots reais; não há sleeps arbitrários.
As assertions verificam fatos, revisão, conteúdo físico, ausência de nova escrita,
reabertura e preservação de sessão quando aplicável.

| Caso | Evidência e resultado individual |
| --- | --- |
| C1 | Commit normal, prova própria, uma ocorrência/uma revisão — aprovado |
| C2 | Commit real seguido de rejeição undefined; reconciliado, replay/reopen sem mutação — aprovado |
| C3 | B cria antes da primeira releitura; testemunha/publicação incluem ambas — aprovado em Node e Edge real |
| C4 | B cria entre primeira captura e verificação; testemunha atual comprova A sem conflito — aprovado em Node e Edge, reproduz a corrida original |
| C5 | B cria antes/durante reconciliação; caso antes da testemunha publica ambas, caso depois dela mantém sucesso e refresh/retry readonly observa B — aprovado em Node e Edge |
| C6 | Autosave legítimo da nota após A; nota e evento presentes, duas revisões totais — aprovado |
| C7 | Conclusão canônica legada após A; execução/notas/minutos preservados, evento de A não ganha execução — aprovado |
| C8 | Reset e restore após cada captura, inclusive backup contendo o mesmo recibo; época nova rejeita intenção antiga e preserva banco — quatro variantes Node e reset Edge aprovados |
| C9 | Campos idênticos/UUID diferente; sem sucesso próprio nem escrita no modo readonly — aprovado |
| C10 | Prova ausente/divergente, fato diferente, hash inválido e UUID duplicado; zero sucessos, banco não modificado, reopen — cinco variantes aprovadas |
| C11 | Retry direto após eventos posteriores e outra mutação durante reconciliação; write seria uma assertion fatal; três eventos intactos — aprovado |
| C12 | Sessão já remota confirma apenas própria prova; variante dirty conserva rascunho/fence antigo e outros editores continuam protegidos; sem prova não escreve — aprovado Node e percurso completo UI Edge |

22 testes Node novos: matriz mais variantes de autoridade/recibo e proteção de
outro editor/base já observada. Regressões existentes da Agenda verificam cinco
rejeições falsy, resposta resolvida sem fato, payload divergente, UUID reutilizado,
duplo clique, alocador compartilhado, rollback/readback, F1 original e dezembro9999.

Edge C3/C4/C5 utiliza dois formulários/abas reais, IndexedDB compartilhado, relógio
fixo e interceptação de IDBTransaction.oncomplete depois do commit nativo, antes
de notificar o Dexie. Barreiras na resposta e hashes das capturas controlam B.
A fecha com Evento criado, sem conflito remoto; B também confirma seu fato
independente. occ:2/occ:3, duas provas, duas revisões e ambos os eventos sobrevivem
a reload e backup3. C8 troca autoridade durante materialização da testemunha:
nenhum sucesso, formulário/horários preservados, retry não altera a substituição.

O Edge C12 isola especificamente o guard da UI já remota. Após uma falha antes
do commit, insere uma fixture autoritativa íntegra com o recibo exato do formulário
e usa o produtor real na outra aba para invalidar a sessão. O retry atravessa
EventDialog→PlannerContext→EventCommand→IndexedDB sem nova escrita e fecha com
prova própria. Essa fixture não é alegada como commit do produtor; commits nativos
com resposta perdida são comprovados separadamente em C2/C3/C4/C5/C8.

### A2-02 e preservação dos contratos

O primeiro teste Edge de reagendamento preenchia a nota e abria o diálogo antes
de o autosave terminar/publicar. A comparação da auditoria entre baseline e HEAD
demonstrou rejeição correta do fence antigo nos dois builds. Agora o teste aguarda
a nota física no IndexedDB e a mensagem de publicação Alterações salvas antes de
capturar o diálogo. Nenhum comportamento do produto foi alterado para aceitar
base obsoleta. Todas as assertions de história/CAS/nota/recuperação permanecem.
Outro preenchimento da mesma suíte é um teste deliberado de autosave obsoleto
com barreira controlada; permanece como cenário negativo, sem sincronização extra.

Preservados planner2, registro3, backup3/recovery3/2/1, geração2, Dexie1 e D-036.
Nenhum campo persistido/tabela/schema/dependência foi adicionado. UUID/fatos e
ausência histórica continuam no mesmo documento/hash. Fences de novas escritas
e comandos legados mantêm validação/CAS/readback. Replay readonly não altera
contador/revisão. Conflitos comuns não bloqueiam o armazenamento; falha estrutural
de snapshot continua fail-closed. Não há criação untimed ou comandos completos.

### Validação desta unidade

- Node dirigido: matriz **22/22**, Agenda existente **43/43**.
- `npm.cmd test`: build e Node completo **488/488** (466 anteriores +22).
- Edge dirigido, um worker/retries0: **36/36** — Agenda **24/24**, reagendamento **12/12**.
- Edge global desta unidade: **101/101**, um worker/retries0, incluindo os quatro
  solares. Gate executado/aprovado integralmente; não prova a origem da instabilidade
  histórica nem altera o resultado95/96 da segunda auditoria. 3A-1/3A-2, recovery,
  Hoje, legado, D-036 e shell executados no conjunto. Log reconciliation-edge-global.log
  e artefatos reconciliation-edge-global em outputs.
- Lint/typecheck aprovados; master regenerado pelo mecanismo oficial e check aprovado.
- Diff check e varredura dos arquivos do escopo sem padrões de segredo encontrados.
- Revisão visual desktop/390px de calendário, diálogo/foco e dois eventos confirmados;
  nenhum overflow horizontal. Evidências agenda-390.png, agenda-dialog-390.png e
  reconciliation-C3/C4/C5-desktop.png em outputs.

Logs: outputs/reconciliation-node-full.log, reconciliation-edge-directed.log
e respectivos artefatos browser. Resultado global e publicação são registrados
no fechamento abaixo, após conclusão efetiva. Falha intermediária: lint identificou
um import não usado no novo teste; removido, lint/typecheck subsequentes aprovados.
Nenhum retry automático, mudança solar, snapshot/tolerância/assertion enfraquecidos.

A2-01 e A2-02 resolvidos nos contratos/cenários demonstrados desta unidade.
A falha solar histórica1007 permanece de origem indeterminada; execução verde
não prova sua causa resolvida. Leitores anteriores à D-038 continuam rejeitando
a extensão de recibo de forma fail-closed, limitação já documentada, sem downgrade.
Nenhum merge/auto-merge/exclusão/3B-2. Aguardará auditoria final dirigida e gate humano.
