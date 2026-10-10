# 10 — Roadmap e Fluxo de Implementação

## 1. Estado

- Etapa B/B3 visual concluída e aprovada.
- Etapa 0.1 documental concluída.
- Etapa 0.2/B4 de taxonomia, baseline técnica e proteção do v1 concluída.
- Etapa 1.1 de modelo temporal e contratos do domínio concluída.
- Etapas 1.2A–1.2D implementadas; v2 é o store principal e v1 permanece somente leitura.
- Etapa 2A concluída; fundação da 2B, conclusão 2B-A, contrato/recuperação 2C-A e comando/UI 2C-B implementados. PR/integração da 2C-B aguardam autorização própria.
- Plano da Etapa 1.2 aprovado; cada subetapa exige branch, validação, revisão e autorização próprias.
- Nenhuma etapa funcional pode começar por consequência automática desta documentação.

## 2. Etapa 0.1 — Decisões e documentação

Escopo:

- fechar decisões humanas pós-auditoria;
- tornar os documentos numerados a fonte canônica;
- gerar `DAYFORGE_MASTER_SPEC.md` a partir deles;
- atualizar contratos DOX;
- registrar o roadmap revisado.

Fora de escopo: qualquer mudança funcional, persistência, UI, backend ou banco.

## 3. Etapa 0.2/B4 — Taxonomia, baseline e proteção do v1

Escopo restrito:

- adicionar `Cursos rápidos` à taxonomia de Formação;
- renomear `Rotina-base` para `Rotina`;
- ajustar apenas textos necessários à taxonomia;
- corrigir o typecheck existente;
- estabelecer CI mínima;
- verificar automaticamente que o master corresponde aos documentos canônicos;
- proteger o payload v1 contra sobrescrita destrutiva após falha de leitura.

Contrato mínimo de proteção:

1. detectar falha ao ler `rotina-369:data:v1`;
2. manter o conteúdo original intacto;
3. impedir autosave de defaults enquanto a falha não for resolvida explicitamente;
4. permitir experiência temporária em memória com aviso claro;
5. cobrir o caso com teste de regressão.

Fora de escopo:

- nova Home/Hoje;
- novos domínios;
- IndexedDB/Dexie;
- Formação funcional;
- motor de planejamento;
- Academia, Nutri ou Progresso funcional.

## 4. Roadmap funcional aprovado

```text
0.1 Decisões e documentação
↓
0.2 Taxonomia, baseline e proteção do v1
↓
1 Núcleo temporal e persistência local v2
↓
2 Hoje contextual e execução/reagendamento
↓
3 Rotina, Agenda, Semana, Metas e consistência
↓
4 Formação, Acadêmico, Cursos e Exploração
↓
5 Motor determinístico TypeScript
↓
6 Academia
↓
7 Sono e Nutri
↓
8 Progresso e Analytics
↓
9 Arquivos e certificados locais
↓
10 PWA local
↓
11 Backend Go, PostgreSQL, autenticação, cloud e sincronização
↓
12 Finanças, em ciclo futuro próprio
```

Cada etapa ampla deve ser subdividida em branches revisáveis antes de sua implementação. Python permanece candidato futuro e não possui etapa automática.

### Etapa 1.1 — Modelo temporal e contratos do domínio

Status: concluída em 14/09/2026.

Escopo restrito:

- núcleo TypeScript puro e independente de React, browser e persistência;
- IDs opacos fornecidos pelo chamador, valores temporais e intervalos semiabertos;
- recorrência semanal e `RoutineTemplate`;
- `ScheduleOccurrence`, `ExecutionRecord` e histórico append-only de reagendamentos;
- estados `planned`, `completed`, `completed_rescheduled`, `not_completed` e `cancelled`;
- flexibilidade `fixed`, `preferred` e `flexible`;
- origem desacoplada dos módulos futuros;
- contratos mínimos de disponibilidade e testes unitários.

`completed_rescheduled` é derivado pelo domínio quando uma conclusão possui
histórico de reagendamento. Estados concluídos, não realizados e cancelados
são terminais nesta etapa.

Fora de escopo:

- IndexedDB, Dexie, schemas de persistência e migração v1 para v2;
- materialização automática de recorrências, resolução manual de DST ou motor
  de planejamento;
- integração com UI, novos domínios, backend, autenticação, PWA ou cloud.

Resultado implementado: `domain/temporal/` expõe contratos e funções puras para
valores temporais, recorrência semanal, templates, ocorrências, execução,
reagendamento, transições e disponibilidade mínima. Os testes cobrem estados,
imutabilidade, intervalos e casos de borda. O payload v1 e seus adapters não
foram alterados.

### Etapa 1.2 — Persistência local v2 e migração

Plano aprovado em 21/09/2026. A implementação é dividida nesta ordem:

#### 1.2A — Fundação da persistência v2

Branch: `feature/persistence-v2-base`.

- adicionar Dexie e `fake-indexeddb`;
- criar `persistence/` independente de React e do domínio puro;
- schema Dexie interno 1 apenas com `metadata` e `plannerDocuments`;
- contratos, codecs, repository interfaces e transações explícitas;
- testar schema, índices, reabertura, persistência, validação e rollback;
- não ler nem alterar v1, não migrar e não integrar o planner.

#### 1.2B — Migração validada v1 → v2

Branch: `feature/v1-v2-migration`.

- preservar `LegacyPlannerSnapshotV1` tipado, sem inventar timezone, estados,
  horários reais, origem temporal ou vínculos ausentes;
- identificar cada fonte por SHA-256 dos bytes crus e cada migração operacional
  pela SHA-256 do conteúdo canônico validado;
- usar `legacy-v1/source/<rawFingerprint>` e
  `migration/v1/<contentFingerprint>`;
- permitir fontes cruas distintas semanticamente equivalentes sem duplicar a
  migração operacional;
- manter v1 principal e intacto; transação v2 integralmente reversível antes
  do cutover.

Implementada de forma isolada do bootstrap e da UI: a metadata da migração fica
em `validated`, enquanto `metadata/database.activeDocumentId` permanece `null`.
Assim, os documentos v2 preparados não se tornam autoridade nesta subetapa.

#### 1.2C — Backup e restauração v2

Branch de implementação: `feature/backup-v2`.

- implementar formato lógico v2 desacoplado das tabelas Dexie;
- separar versão do backup, geração da persistência e schema interno;
- validar envelope, dados, referências, fingerprints e procedência;
- restaurar atomicamente com rollback integral;
- aceitar backup v1 pela migração validada;
- manter a UI visível de backup v1 funcionalmente intacta enquanto v1 for a
  fonte principal.

Implementada como mecanismo interno: exportação usa snapshot lógico consistente,
restauração substitui atomicamente apenas o conjunto preparado e importação v1
reutiliza a pipeline 1.2B com provenance `backup-v1`. Database metadata continua
inativa, a UI não importa o módulo e não existe marker ou cutover.

#### 1.2D — Bootstrap e cutover para v2

Branch de implementação: `feature/persistence-v2-cutover`, após o merge da 1.2C.

- integrar backup/restauração v2 à UI existente;
- preservar o first-run atual com `createDefaultState()`;
- tornar v2 principal somente com metadata `active` validada;
- manter v1 somente leitura e encerrar escrita contínua nele;
- usar `dayforge:persistence:v2` como sentinel fail-safe;
- reparar marker ausente ou inválido quando o banco ativo for autoridade válida;
- bloquear persistência, sem fallback para v1, quando marker ativo/inválido não
  tiver IndexedDB ativo validável;
- manter sessão temporária em memória com aviso persistente em falha;
- não incluir mudanças da Etapa 2.

Não existem tabelas temporais no schema inicial: os tipos de domínio não são
persistidos até haver fluxos reais que os produzam e consumam. Depois do
cutover, recuperação usa backup/restauração v2; não existe promessa de rollback
sem perda para v1 após dados exclusivos surgirem no v2.

Implementada com migração e validação antes da ativação, marker fail-safe,
metadata ativa como autoridade, gravação serializada do planner no v2 e UI de
backup v2 com importação v1 compatível. Falha de bootstrap ou escrita mantém
sessão em memória com aviso persistente; recuperação explícita pode importar
backup ou restaurar o padrão quando o banco compatível estiver acessível.
O payload v1 permanece intacto, sem dual-write. A 1.2D não incluiu mudanças da
Etapa 2.

### Etapa 2A — Hoje contextual e read model temporal

Status: concluída em 28/09/2026; execução e reagendamento não iniciados.
Branch: `feature/today-context`, a partir do checkpoint validado da 1.2D.

Escopo: derivar em memória, com instante de referência controlável, uma visão
diária determinística com Agora, Próximo, Depois, Atenção e Resumo; integrar a
visão à página Hoje com estados de carregamento, vazio, erro e dados válidos.
O `planner/current` v2 ainda possui formato legado v1; a 2A pode projetar seus
horários locais apenas para leitura no fuso IANA do dispositivo, passado
explicitamente ao read model. Horário final igual ou anterior ao inicial
atravessa a meia-noite. Uma entrada seguinte cujo início coincide exatamente
com o fim desse intervalo segue para o próximo dia civil na ordem original da
lista; sem essa evidência, permanece no dia de origem. A data Hoje acompanha
a virada de dia quando não há seleção explícita e preserva uma data escolhida
pelo usuário. Não persistir timezone, status temporal inferido nem
`ScheduleOccurrence` a partir dessa projeção. Em transições de horário de
verão, escolher a primeira ocorrência de um horário ambíguo e avançar um
horário inexistente; intervalos não representáveis bloqueiam a projeção.
Agora usa uma ocorrência elegível cujo intervalo contém o instante; Próximo
contém no máximo uma ocorrência futura do dia; Depois contém as demais futuras
em ordem determinística. Atenção usa somente decisões já fundamentadas no
domínio: um item legado cujo intervalo terminou sem registro de conclusão é
mostrado como `Aguardando decisão`, sem inferir atraso, falha ou estado terminal.
Resumo apresenta fatos, sem pontuação ou julgamento.

Aceite: cobrir dia vazio, itens futuros e ativos, Atenção fundamentada, bordas
semiabertas, virada de dia, ordenação, determinismo e leitura sem escrita.
Preservar autoridade v2, payload v1 somente leitura, marker fail-safe, bloqueio
de persistência em falha e integridade de backup/restauração.

Fora de escopo: conclusão, execução, timer, adiamento, reagendamento, edição de
templates, histórico novo, notificações, IA, scoring, sincronização, cloud e
mudanças de schema ou geração de persistência sem necessidade demonstrada.
Execução e reagendamento pertencem a uma subdivisão futura ainda não iniciada.

### Etapa 2B — Execução explícita de ocorrências

Fundação: identidade canônica e persistência auditável, em
`feature/today-execution`. A fundação foi entregue separadamente da ação na UI,
implementada depois na unidade autorizada 2B-A.

- Ponte externa `execution/bridge` em `plannerDocuments`, sem alterar o formato
  de `planner/current`, o schema Dexie 1 ou a geração de persistência 2.
- Identidades `occ:<sequência>` alocadas uma vez e preservadas; o contador
  persistido não reutiliza identidades removidas. Datas, posições e snapshots
  validam o vínculo ao item diário, mas não são sua identidade.
- Registros diários existentes ganham vínculos no bootstrap ativo v2. Projeções
  virtuais de rotina não ganham fatos canônicos. Não se infere timezone,
  flexibilidade, origem temporal nem horário real do legado.
- `ExecutionRecord` do domínio permanece o único fato de execução; seu ID é
  `execution:<occurrenceId>`. A presença desse fato representa conclusão
  canônica terminal; sem ele há apenas vínculo de planejamento legado. Um
  booleano legado concluído permanece factual, sem criar execução retroativa.
- O comando interno recebe timing real e `recordedAt` explícitos, preserva o
  snapshot original e grava ponte/conclusão legada/procedência atomicamente.
  Não há estado de início. Não existe segunda tabela de histórico: snapshot
  original, vínculo e ExecutionRecord terminal compõem o histórico desta fase.
- Repetição idêntica é idempotente; execução conflitante é rejeitada. Comparação
  do snapshot dentro da transação impede perda por escrita concorrente antiga.
- Backup v2 inclui ponte e SHA-256 canônico; restore substitui a ponte no mesmo
  conjunto transacional, com validação prévia, releitura e rollback. Backup
  antigo sem ponte não contém fatos de execução; restore ativo prepara vínculos
  novos e substitui os anteriores. Importação v1 e reset são substituições
  explícitas do conjunto, nunca fontes de execuções inferidas.
- Hoje recebe a ponte validada e usa a identidade persistente dos registros
  diários, conservando ordenação, intervalos e seções derivadas da 2A.
- Edições de IDs únicos preservam o vínculo e o snapshot original. Mudanças
  ambíguas em dias com IDs repetidos bloqueiam a gravação. Um registro com
  execução não pode ser removido, reaberto ou alterado por controles legados.

Limites: a ponte é referência canônica de identidade sobre planejamento
legado, não uma conversão para `ScheduleOccurrence` completo. Essa conversão
exigiria semânticas ausentes que esta fase não inventa. Não foram adicionados
botão Concluir, início, reagendamento, timers, notificações, IA ou cloud.
Não iniciar 2C por consequência desta fundação.

#### Etapa 2B-A — Ação canônica de conclusão

Status: implementada em 07/10/2026. Branch: `feature/today-completion`, a partir
de `dbe3e732ae87a035019dc5b223e3cb80f5e90a25` (PRs #10 e #11 integradas).

- Concluir está disponível apenas para ocorrência canônica pendente em Hoje.
  A única transição exposta é `planned -> completed`; não há ação de início.
- Início/fim reais completos são informados pelo usuário, sem prefill planejado.
  Fuso IANA é visível, editável e confirmado; horários ambíguos/inexistentes são
  rejeitados. Observação é opcional. Factories temporais produzem o único
  ExecutionRecord; `recordedAt` vem do instante da confirmação explícita.
- ID é `execution:<occurrenceId>`. Retry com campos inalterados reutiliza o fato,
  incluindo recordedAt; submit duplicado é bloqueado e requests equivalentes
  compartilham a operação. Fato conflitante é rejeitado.
- PlannerContext usa a mesma fila para autosave, comando e backup/recovery;
  publica state/bridge do snapshot v2 validado juntos. Revisão em memória impede
  autosave obsoleto de reabrir conclusão ou causar bloqueio por estado antigo.
- O comando existente grava conclusão, execução e procedência atomicamente.
  Na primeira execução timed deriva `actualMinutes` exatamente do intervalo UTC
  real, como compatibilidade. Não altera template nem snapshot original; eles,
  vínculo e fato terminal continuam formando o histórico auditável da etapa.
- Hoje recalcula Agora/Próximo/Depois/Atenção/Resumo sem reload; conclusão deixa
  de ser pendência e sai de Atenção. Reload e backup/restore preservam o fato.
- Erro isolado com snapshot validável mantém diálogo/inputs e permite retry.
  Falha estrutural mantém fail-closed. Toggle legado permanece bloqueado;
  edição/exclusão legada de execução terminal fica desabilitada.
- Projeções virtuais continuam sem ação ou materialização automática.
  Conclusões históricas sem execution continuam compatíveis e sem backfill.
- Backup formato 2, geração 2, Dexie schema 1 e ponte lógica 1 permanecem iguais.

Aceite comprovado: 27 testes direcionados, 199 Node, 106 persistência (incluindo
44 de foundation), 13 Hoje e 31 Edge (oito novos), além de lint, TypeScript,
build, master check e diff check. Cobertura inclui UTC/IANA/DST, instante
controlado, concorrência/autosave obsoleto, requests equivalentes, rollback,
reload, backup/restore, v1 intacto, históricos, virtuais, teclado e madrugada.

Limites: sem ScheduleOccurrence completo, backfill histórico, início, undo,
correção terminal, reagendamento ou avanço para 2C. Horários ambíguos exigem
entradas inequívocas; não há escolha de offset nesta UX mínima.

### Etapa 2C — Planejamento auditado e reagendamento

Aprovação com subdivisão obrigatória e gates humanos independentes:

- **2C-A — Contrato e recuperação:** ponte lógica 2, `planningAudit` opcional,
  regras puras compartilhadas, upgrade 1 → 2, backup/restore compatível,
  `authorityEpoch` local e provas de integridade/rollback. Implementada na
  branch `feat/reschedule-foundation` sobre a main após PR #12.
- **2C-B — Comando e experiência em Hoje:** produtor explícito, projeção do
  planejamento vigente e UX de reagendamento implementados em `feat/today-rescheduling`,
  sobre `cfaad03881956ab1d3d26cd2d86d2b98e049db3c` após merge da PR #13.

2C-A não gera auditoria na migração, não reagenda, inicia ou corrige execução,
não cria UI nem muda templates/minutos por conta própria. A conclusão existente
continua funcional; o contrato aceita conclusão posterior a uma cadeia válida.
Backup público 2, geração 2, schema Dexie 1 e planner/current permanecem iguais.
Época local protege operações de conjuntos substituídos e não integra o backup.

Gates: master consistente, lint, typecheck, suíte Node incluindo build,
domínio/ponte/metadata/rollback, persistência e regressões 2A/2B/2B-A no Edge,
diff check e revisão de recuperação contra perda silenciosa. Commit/push da
branch validada seguem a autorização permanente. Abrir PR, merge e iniciar
2C-B exigem suas próprias autorizações, sem avanço automático.

Validação da 2C-A: 46 novos testes de contrato/recuperação, 245/245 Node
incluindo persistência e regressões, build, lint, typecheck, master e diff check.
Edge: 22/22 cenários aplicáveis sobre build de produção, sem retries automáticos,
incluindo upgrade instalado, backup antigo, auditoria recuperada, conclusão,
audit guard, Hoje, backup/cutover e layout compacto. Testes de importação e
navegação aguardam a prontidão real do bootstrap antes de interagir.

### Etapa 2C-B — Reagendamento explícito e auditável

Reagendar atua somente em ocorrência canônica pendente inequívoca: confirma a
baseline temporal no primeiro evento e anexa eventos seguintes, sem mover o
item físico da origem, alterar template, concluir, falhar ou criar ocorrência.
Destino precisa terminar depois do instante explícito da decisão. Datas finais
de madrugada são explícitas; horários DST inexistentes/ambíguos são rejeitados.
Motivo livre opcional usa `TemporalReason { code: "user_note", note }`.

Hoje, dia completo e compatibilidade mensal consomem a projeção efetiva; o
histórico diferencia original legado sem fuso histórico, baseline confirmada,
eventos, vigente e execução. A conclusão continua separada e detecta mudanças
de planejamento desde a abertura do diálogo. Epoch e revisão capturados,
CAS transacional, fila única e replay do evento protegem concorrência e retry.
Guards preservam auditorias, impedem edição/exclusão/toggle/minutos e permitem
nota/energia e edição inequívoca de outros itens.

Validação em 10/10/2026: lint, typecheck, build, 297/297 testes Node (52 novos de
reagendamento), 34/34 cenários Edge sobre build estável, incluindo duas páginas
independentes, recuperação e regressões 2A/2B/2B-A/2C-A. Revisão visual desktop
e 390 px confirmou diálogo e timeline sem scroll horizontal. A primeira rodada
Edge identificou uma expectativa incorreta do teste sobre Tab nos segmentos
nativos de datetime-local; o teste passou a verificar a navegação real mantendo
o foco no diálogo, sem retries automáticos ou redução dos cenários.
Documentação gerada, diff e varredura de segredos também foram verificados.
Commit e push da branch validada estão autorizados; abertura de PR, merge,
deploy e qualquer etapa posterior dependem de autorização humana específica.

## 5. Ordem de dependências

- Hoje depende do núcleo temporal e não deve defini-lo dentro de componentes.
- Rotina, Agenda e Metas fornecem restrições ao motor.
- O motor precisa de conteúdo real para validação, por isso vem após a base de Formação.
- Analytics depende de fatos reais de execução.
- Arquivos dependem de store v2, backup, restauração e quota.
- PWA depende de fluxos e persistência local estáveis.
- Go/cloud entram apenas após necessidade concreta e aprovação própria.

## 6. Fluxo obrigatório por etapa

```text
Planejar
→ aprovação humana
→ partir da main atualizada
→ criar branch específica
→ implementar somente o escopo aprovado
→ lint, typecheck, build e testes aplicáveis
→ revisão funcional/visual
→ correções
→ commit(s) coerentes e push automático da branch validada
→ apresentar resultados
→ aguardar autorização para abrir PR e iniciar a próxima etapa
```

Commit e push da branch de trabalho são automáticos após conclusão e validação
do escopo, conforme autorização permanente em AGENTS.md. Não fazer push direto
para main nem force-push. Abertura de cada PR, merge, deploy e avanço de etapa
exigem autorização explícita própria e respeitam o momento solicitado pelo
usuário. Silêncio não é aprovação.

## 7. Closeout obrigatório

Ao concluir qualquer etapa, apresentar resumo/comportamento, arquivos alterados, testes/resultados, riscos/pendências, documentação impactada, commits/branch e status da working tree.

## 8. Fonte de verdade

- Chat: discussão e aprovação.
- Arquivos numerados em `/docs`: contratos canônicos.
- `DAYFORGE_MASTER_SPEC.md`: compilação derivada, nunca fonte manual.
- Git: histórico de evolução.
