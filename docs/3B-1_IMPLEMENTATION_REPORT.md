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
