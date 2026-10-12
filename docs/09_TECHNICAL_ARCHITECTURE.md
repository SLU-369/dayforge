# 09 — Arquitetura Técnica — Decisões da Etapa 0.1

## 1. Status

Este documento separa arquitetura atual, direção aprovada e tecnologia futura. Nenhuma decisão futura autoriza implementação antecipada.

## 2. Arquitetura atual

- frontend React 19 e TypeScript strict;
- APIs App Router compiladas por Vinext/Vite;
- Tailwind CSS 4, CSS próprio e CSS Modules;
- estado React por Context e hooks;
- IndexedDB/Dexie v2 como autoridade operacional do planner; `rotina-369:data:v1` preservado em `localStorage` somente para leitura legada, sem fallback automático;
- preferências de aparência em chaves locais separadas;
- falha de bootstrap, banco ou metadata v2 bloqueia autosave e mantém alterações temporárias em memória até recuperação explícita;
- Worker apenas para runtime Vinext e otimização de imagens;
- Drizzle/D1 preparado, mas schema e bindings de produção vazios;
- CI executa verificação do master, lint, typecheck, build e testes;
- núcleo temporal puro em `domain/temporal/`, com valores validados, templates
  semanais, ocorrências independentes, execução, reagendamento append-only,
  transições terminais e contratos mínimos de disponibilidade;
- nenhum backend de domínio, API, autenticação, sincronização ou banco servidor ativo.

## 3. Frontend local v2

A reconstrução funcional permanece no frontend atual. O domínio deve ser isolado de React por funções puras, comandos, consultas e interfaces de repositório.

```text
React
- navegação, UX, formulários e feedback

Núcleo TypeScript
- regras de domínio
- motor determinístico
- transições e validação
- agregações testáveis

Repositórios
- persistência e backup
- adaptação do payload legado
```

A Etapa 2A deriva o contexto de Hoje em memória a partir do `planner/current`,
que ainda carrega o snapshot legado v1. O adaptador de leitura recebe instante e
fuso IANA explícitos, interpreta horários locais sem persistir inferências e
não cria registros temporais canônicos nem novas tabelas. Uma entrada contígua
após intervalo que cruza meia-noite continua no dia civil seguinte quando a
fronteira de horários coincide na ordem original da lista; entradas sem essa
evidência permanecem no dia de origem. A UI acompanha a virada de dia enquanto
Hoje não possui seleção explícita e mantém os controles legados na visão
secundária do dia completo.

## 4. Persistência local v2

IndexedDB com Dexie é o store principal desde o cutover da Etapa 1.2D. O payload legado em `localStorage` permanece intacto e somente leitura.

A geração arquitetural da persistência é v2; sua primeira versão interna de schema Dexie é 1. O schema inicial possui apenas `metadata` e `plannerDocuments`. `routineTemplates`, `scheduleOccurrences`, `executionRecords` e disponibilidade não ganham tabelas antes de existir produtor e consumidor reais. O núcleo temporal continua desacoplado da persistência.

A migração de `rotina-369:data:v1` preserva um `LegacyPlannerSnapshotV1` tipado e não reinterpreta ambiguidades como fatos temporais. SHA-256 dos bytes crus identifica cada origem por `legacy-v1/source/<rawFingerprint>`; SHA-256 da representação canônica validada identifica a operação idempotente por `migration/v1/<contentFingerprint>`. Origens byte a byte distintas com o mesmo conteúdo semântico coexistem sem repetir a migração operacional. IDs, fingerprints e transformação não usam relógio, aleatoriedade ou UUID; o instante auditável é fornecido separadamente.

A Etapa 1.2C implementa internamente backup v2 lógico, sem expor o layout Dexie. Uma transação readonly captura `planner/current`, provenance e fontes legadas; todos os fingerprints são recalculados antes da exportação. Restauração valida e materializa o estado antes de abrir uma transação read-write, exige `metadata/database` existente, compatível e inativa, substitui apenas o conjunto preparado e relê os records antes do commit. Importação v1 reutiliza a migração 1.2B e registra origem `backup-v1`. O mecanismo não acessa a UI nem o localStorage v1.

Antes do cutover, v1 permanece principal e qualquer falha aborta a transação v2. Depois do cutover, metadata `active` validada no IndexedDB é a autoridade principal, não existe dual-write e `dayforge:persistence:v2` funciona como sentinel externo contra fallback destrutivo. Marker ativo ou inválido sem banco ativo validável bloqueia persistência e mantém a sessão em memória; banco ativo com marker ausente ou inválido usa v2 e repara o marker quando seguro.

A 1.2D lê metadata em transação, migra o v1 atual quando presente e valida o estado preparado pelo export lógico antes de escrever o marker e ativar `planner/current`. Sem v1 nem registros preparados, cria `createDefaultState()` diretamente no v2. O planner serializa gravações do documento ativo e recalcula o fingerprint canônico; a primeira edição que altera o conteúdo remove procedência legada do conjunto preparado, pois ela identifica somente o snapshot anterior. Exportação e restauração ativas mantêm os mesmos guards de formato e integridade da 1.2C. Importação v1 ativa reutiliza a migração idempotente, preserva origens válidas e registra `backup-v1`. A UI mostra aviso persistente quando a sessão opera apenas em memória.

A baseline da Etapa 0.2 implementa somente uma proteção: falha de leitura do v1 bloqueia o autosave de defaults, preserva o conteúdo original e mantém a sessão em memória até importação de backup ou restauração explícita. IndexedDB e a migração completa permanecem fora da 0.2.

### Fundação da Etapa 2B

`persistence/execution/` mantém `execution/bridge` em `plannerDocuments`.
Seu payload lógico originalmente versionado em 1 contém contador de alocação e vínculos
completos/ordenados dos itens de cada registro diário. Cada vínculo guarda ID
opaco do domínio, data de origem, posição atual, snapshot original imutável,
snapshot atual e `ExecutionRecord | null`. Não se convertem templates nem se
inventam campos ausentes de um `ScheduleOccurrence` completo. Timing real e
`recordedAt` são entradas explícitas validadas pelas factories do domínio.

IDs legados, chave data/ID e hash apenas do conteúdo não distinguem duplicatas
idênticas. Índice isolado não sobrevive a edição/reordenação. UUID não resolve
a ligação ambígua e é desnecessário. Aloca-se `occ:<sequência>` uma vez em v2,
com contador monotônico e snapshot/posição para validar a ligação. Duplicatas
são aceitas na alocação inicial; edição ambígua posterior falha fechada.

O bootstrap adota a ponte de forma idempotente. Metadata
`executionBridgeVersion: 1` registrava a adoção na fundação 2B; a 2C-A adota
versão 2 e época local conforme o contrato abaixo, na mesma transação da ponte.
Ausência da ponte depois da adoção é corrupção, não autorização para recriá-la.
O marker externo e a autoridade ativa permanecem intactos.

Backup `formatVersion: 2` ganha extensão opcional `payload.executionBridge`
com ponte e fingerprint SHA-256 próprio. Ausência significa backup antigo sem
fatos canônicos de execução. Schema Dexie permanece 1, pois tabelas/índices não
mudam; `exportedFrom.schemaVersion` continua descrevendo o schema interno.
A extensão nasceu com versão lógica 1; a 2C-A escreve versão lógica 2.
Geração de persistência permanece 2.
Aplicações antigas rejeitam a extensão desconhecida em vez de perder execução.

Exportação captura planner, ponte e procedência numa transação readonly, depois
recalcula hashes. Restore valida e prepara antes das mutações; substitui
planner, ponte, fontes e migrations numa transação, incluindo metadata de
adoção, releitura e rollback. Restore ativo antigo regenera vínculos sem
execução; restore inativo antigo mantém o conjunto legado preparado, adotado
no cutover. Importação v1 ativa e reset preparam a ponte antes de escrever.
Nenhum caminho escreve no v1 ou mantém execução de um conjunto substituído.

Comando interno e autosave comparam o snapshot dentro da transação read-write.
SHA-256 ocorre fora da transação. Falha reverte o conjunto inteiro; retry
idêntico retorna o fato existente; conflito é rejeitado. O template não muda.
Snapshot original e `ExecutionRecord.recordedAt` preservam auditoria sem
duplicar histórico. Hoje usa a ponte validada somente em memória.

Após a adoção, autosave compara os vínculos persistidos com o novo estado antes
de escrever: nova conclusão sem `ExecutionRecord` é rejeitada, inclusive em item
recém-adicionado. Conclusão histórica já presente permanece válida sem fato
retroativo. O comando interno anexa a execução antes desse guard e mantém a
transição atômica. A UI desabilita o toggle legado com a ponte ativa; editar
`actualMinutes` não conclui uma atividade nem inventa execução.

### Etapa 2B-A — Conclusão canônica pela UI

Hoje oferece Concluir somente para itens diários pendentes com `occurrenceId`
validado. O diálogo pede início e fim reais completos (data e hora), fuso IANA
visível/editável e observação opcional. Horários reais começam vazios. O fuso
do dispositivo é uma sugestão explícita confirmada pelo usuário, nunca um fato
inferido do planejamento. O adapter converte horários locais inequívocos para
UTC; horários inexistentes ou ambíguos são rejeitados. Isso não muda a política
de projeção somente para leitura da 2A.

Factories do domínio constroem `ExecutionRecord` timed com ID
`execution:<occurrenceId>`; `recordedAt` é capturado na confirmação na fronteira
de UI. Retry com os mesmos campos reutiliza exatamente esse fato e instante.
Na primeira conclusão timed, `actualMinutes` é a diferença UTC do intervalo
real em minutos, gravada pelo comando na mesma transação como compatibilidade.
O ExecutionRecord permanece a autoridade; retry não reescreve fatos antigos.
Conclusão histórica sem execução não pode receber backfill pelo comando.

`PlannerContext.completeOccurrence` serializa autosave, conclusão, exportação,
importação e reset em uma única fila. Requisições equivalentes em andamento
compartilham a mesma Promise; conflito é rejeitado sem bloquear a fila.
Após o comando, export validado fornece um snapshot consistente de planner e
ponte, publicados juntos no estado React. Uma revisão em memória invalida
autosaves capturados antes dessa publicação; nenhuma seção Hoje é persistida.
Edições locais ficam bloqueadas durante a conclusão em andamento.

Erro normal de domínio/comando com armazenamento ainda validável mantém o
diálogo aberto e o snapshot anterior coerente, permitindo retry. Falha de
integridade ou indisponibilidade que impede validar o snapshot ativa o bloqueio
persistente; não há fallback para v1. O diálogo nativo, botões semânticos,
loading, Cancelar/Escape e restauração de foco preservam acesso por teclado.
Controles legados de edição/exclusão ficam indisponíveis para execuções
terminais. Templates e snapshots originais permanecem intactos. Projeções
virtuais não são materializadas e históricos concluídos não ganham execução.
Não há início, undo, reagendamento, nova entidade temporal ou schema de storage.

### Etapa 2C-A — Contrato e recuperação do planejamento auditado

`execution/bridge` passa a versão lógica 2 (envelope persistido e payload),
sem alterar `planner/current` formato 1, backup formato 2, geração 2, schema
Dexie 1, tabelas, marker ou v1. O vínculo admite `planningAudit` opcional com
`baselineItem`, `baselineSchedule`, `confirmedAt` e `rescheduleHistory`.
O item legado permanece âncora física; não passa a representar o horário vigente.
O baseline é capturado na futura confirmação explícita, podendo diferir do
snapshot original. A 2C-A não contém comando que produza essa extensão.

O codec valida o baseline pendente e seu vínculo ao item legado, schedules
timed/date_only/all_day canônicos, instantes UTC e fuso IANA explícito. Eventos
usam `reschedule:<occurrenceId>:<posição append-only iniciando em 1>`, sem
duplicatas. `from` deve igualar baseline/último `to`; no-op e cronologia anterior
à confirmação/evento prévio falham fechados. `ExecutionRecord.recordedAt`
não pode anteceder a história. Retornar ao horário original preserva eventos.
`domain/temporal/planning-history.ts` compartilha validação, append e derivação
com `ScheduleOccurrence`; histórico não vazio permite `completed_rescheduled`
em conclusão posterior. Não se fabrica ocorrência completa nem execução.
Autosave preserva auditoria e rejeita edição do planejamento legado ou exclusão
do vínculo auditado. Notas do dia continuam independentes.

Upgrade lê/valida ponte 1 e seu SHA-256 original antes de converter. Preserva
IDs, contador, vínculos, snapshots e ExecutionRecords, sem criar `planningAudit`.
Prepara ponte 2 e novo hash fora da transação; compare-and-swap e gravação de
metadata/ponte são atômicos. Planner e marker não mudam. Bootstrap repetido
de ponte 2 válida não escreve nem incrementa época. Versões desconhecidas,
referências inválidas ou divergência entre metadata/envelope/payload bloqueiam.

`metadata/database.authorityEpoch` é inteiro seguro não negativo. Bancos novos
começam em 0; metadata antiga sem campo significa 0, persistido na adoção 2.
Versão adotada 2 exige o campo. Bootstrap, migração local, autosave e conclusão
não incrementam. Cada restore v2, import v1 explícito ou reset incrementa uma
vez na transação de substituição, inclusive na recuperação inativa e em retry
de conteúdo idêntico. Overflow falha fechado. Rollback cobre época e conjunto.
`assertAuthorityEpoch` compara dentro da transação; o comando de execução
aceita `expectedAuthorityEpoch` e verifica a época capturada antes de escrever,
inclusive no retry equivalente. Futuros diálogos devem capturar a época ao abrir
e enviá-la ao comando; esta etapa não altera a UI ou a fila para criar esse fluxo.

Restore aceita ponte 2 completa, ponte 1 com hash original válido, backup sem
ponte e import v1. Ponte 1 converte antes da escrita; ausência mantém a adoção
existente, sem baseline temporal, eventos ou execução inferidos. Fontes e
provenance seguem o contrato existente; execução/auditoria do conjunto anterior
nunca sobrevivem à substituição. `authorityEpoch` vem exclusivamente do banco
de destino, nunca do backup. Validação e hashes ficam fora das transações,
com releitura de integridade dentro delas.

Compatibilidade: leitores atuais aceitam pontes 1/2 e backups antigos. Aplicações
anteriores podem rejeitar metadata/ponte 2 ou sua extensão em backup; devem
permanecer bloqueadas, sem fallback ao v1 ou downgrade silencioso. Hoje mantém
a projeção existente; recuperar uma auditoria não ativa a projeção do horário
reagendado. Comando persistente e experiência de reagendamento pertencem à 2C-B.

### Etapa 2C-B — Comando, revisão e planejamento efetivo

`persistence/execution/rescheduling.ts` produz explicitamente planningAudit e
append de RescheduleEvent mediante epoch/revisão/intenção capturados na abertura.
O comando reutiliza appendRescheduleEvent e o codec estrito, preservando item,
original, identidade e execução. IDs de eventos usam ocorrência e posição de
append. Conteúdo confirmado e changedAt distinguem retry equivalente de conflito.
Hashes são calculados fora da transação; savePlannerWithBridge compara o snapshot
e authorityEpoch antes de persistir atomicamente a ponte, com readback e rollback.

`readPlannerAuthoritySnapshot` captura payload e epoch em uma única transação
readonly e valida hashes fora dela. Epoch permanece apenas local; o export
público continua formato 2/geração 2/schema 1. UI publica planner/bridge/epoch
coerentes após comando, falha recuperável e substituição. Erro estrutural aciona
o bloqueio existente; conflitos com snapshot íntegro preservam o diálogo. Restore,
import e reset invalidam ações antigas mesmo se reutilizarem occurrenceId.

PlannerWriteQueue serializa autosave, execução, reagendamento e recuperação/
exportação, coalescendo intenções equivalentes e invalidando autosaves antigos
pela revisão React. Concluir recebe também epoch e revisão dos fatos esperados
para detectar planejamento alterado durante a confirmação. Não há fila paralela.

`app/temporal-input.ts` mantém o conversor estrito compartilhado de horários
inequívocos. `rescheduling-input.ts` exige início/fim completos e IANA, calcula
duração real e rejeita offsets sem nome. A política permissiva de leitura legada
da 2A nunca gera fatos automaticamente. O produtor 2C-B é timed; os contratos
date_only/all_day existentes continuam recuperáveis, sem nova UX produtora.
A visão horária de Hoje falha fechada se receber uma auditoria vigente não
timed; não converte data sem horário em intervalo horário artificial.

`today-context.ts` centraliza planejamento efetivo e índices efêmeros por snapshot:
vínculos físicos por data/posição e auditorias ordenadas por início/fim. Consulta
interseções via busca binária no menor conjunto candidato; não varre todos os
registros para localizar origens distantes nem materializa dias. Sem auditoria,
mantém leitura 2A. Com auditoria, usa somente o último to/baseline, sem duplicar
o horário original. Hoje/dia completo/compatibilidade mensal usam essa projeção;
o mês conta uma vez no dia de início efetivo, preservando o item físico de origem.
Virtuais mantêm IDs próprios; títulos/horários não são chaves de deduplicação.

Guards de reconciliação bloqueiam mudança de minutos, plano, identidade ou
remoção de item/registro auditado. A execução pode alterar completed/actualMinutes
somente pelo comando canônico e mantém a cadeia. UI bloqueia controles desses
itens, permitindo nota/energia e edição/reordenação inequívoca de outros itens.
Nenhuma correção terminal, motor de sobreposição, template, backend ou etapa
posterior é ativada. A descrição de ausência de produtor na 2C-A acima registra
o limite histórico daquela etapa; D-033 registra a evolução 2C-B.

### Etapa 3A-1 — Revisão persistida e conflitos de escrita

A 3A-1 protege edições do planner legado contra snapshots obsoletos. Metadata
local admite `writeFenceVersion: 1` e `datasetRevision`, inteiro seguro não
negativo. Metadata anterior sem ambos representa revisão zero; adoção validada
persiste zero idempotentemente. Campo ausente após adoção parcial, valor inválido
ou versão desconhecida falham fechados. Não mudam planner/current formato 1,
ponte lógica 2, backup público 2, geração 2, schema Dexie 1, tabelas ou marker.

O snapshot validado captura planner, ponte, authorityEpoch e datasetRevision
juntos. Autosave exige a época e revisão da base utilizada pela edição. Comandos
canônicos capturam também a revisão do conjunto ao abrir o diálogo, preservando
a revisão própria da ocorrência. CAS compara dentro da transação antes de
qualquer mutação; preparação de hashes não permite adotar uma base mais recente.

O repositório incrementa uma vez a revisão por transação com mudança líquida no
conjunto autoritativo: planner, ponte, fontes/procedência da migração ou metadata
de autoridade. Comparação do conteúdo antes/depois evita avanço em leituras,
no-op, reconciliação equivalente ou replay. Falha/overflow reverte documentos,
metadata e revisão. Restore/import/reset incrementam a época e a revisão local
do destino, inclusive para conteúdo idêntico; nenhum contador vem do backup.
Bootstrap e adoção podem avançar revisão quando realmente mudam o conjunto,
mas não incrementam a época. Reabertura íntegra é estável.

Conclusão/reagendamento novos não se rebaseiam automaticamente sobre outra
revisão. Replay comprovadamente igual ao fato persistido continua idempotente:
valida conteúdo e snapshot numa transação readonly, conserva instante/história
e verifica a época, sem exigir que a revisão original ainda seja atual.

PlannerContext conserva base validada e rascunho separadamente. Invalidação entre
abas por BroadcastChannel, foco/visibilidade e releitura periódica atualiza uma
aba sem alterações/formulários; com rascunho ou editor aberto preserva conteúdo
e apresenta conflito acessível. Mensagens não garantem consistência: CAS no banco
é a garantia. O usuário pode baixar um rascunho separado, carregar explicitamente
a versão salva com confirmação e reaplicar a alteração. Não existe merge
automático. Rascunho não é backup de recuperação; export público inclui somente
fatos persistidos. Conflito íntegro não bloqueia storage; falha de integridade
continua fail-closed. Falha isolada de escrita preserva rascunho e oferece retry.

Limites: sem migração estrutural 3A-2, novos produtores, Agenda/Metas/Rotina
canônicas, Semana, Consistência, correção terminal, cloud ou avanço automático.

### Etapa 3A-2 — Envelope lógico e registro temporal comum

`planner/current` passa a formato `dayforge/planning-state`, versão lógica 2,
payload estrito `{version:2,legacy,temporalRegistry:{documentId:"execution/bridge",version:3}}`.
`legacy` é o snapshot v1 normalizado integralmente preservado; a referência liga
o envelope ao único registro de identidade/plano/execução/história. Não existem
templates ou metas estruturadas derivados automaticamente do legado.

`execution/bridge` mantém formato `dayforge/execution-bridge` e usa versão
lógica 3 no documento e payload `{version:3,nextSequence,entries}`. Entradas:

- `legacy_partial`: os campos anteriores de vínculo, data física, posição,
  originalItem, item, execution e planningAudit opcional, sem origem/fuso/
  flexibilidade/criação inferidos. `itemIndex` localiza, não identifica.
- `canonical`: `{kind:"canonical",occurrence:ScheduleOccurrence}`, independente
  de planner.records; somente a ocorrência guarda plano, execução e história.

IDs `occ:n` são únicos na união e menores que nextSequence. O contador é
compartilhado, monotônico por linhagem; exclusões legadas não o reduzem. Vínculos
parciais ficam ordenados por data/posição; completas vêm depois, por sequência.
Referências de template ou entidade de domínio ainda inexistentes são rejeitadas,
inclusive em backup: esta unidade não inventa cadastros futuros. OriginReference
sem referência externa pode carregar kind/label explícitos. Factories e transições
puras existentes reconstruem e validam ocorrência, estados terminais, resolução,
ExecutionRecord e cadeia com IDs owner-bound e posições append-only. Schedules
timed/date_only/all_day seguem o domínio; campos extras e conteúdo não canônico
falham fechados. Comandos existentes continuam restritos aos vínculos parciais.

Backup público 3 mantém o envelope público, mas payload.planner é o envelope 2,
payload.plannerFingerprint cobre esse envelope, executionBridge é obrigatório
com registro 3 e hash próprio. provenance.contentFingerprint continua sendo o
hash semântico do legado, separado do hash do envelope; legacySources/provenance
preservam bytes/fontes/relações anteriores. exportedAt não identifica conteúdo;
epoch/revisão são exclusivamente locais e não aparecem no backup. Aparência e
dados de outros stores não fazem parte deste conjunto recuperável.

Export principal usa o formato correspondente ao snapshot instalado: após upgrade
exporta 3. A API explícita exportDayforgeBackupV2 rejeita conjunto novo, inclusive
sem completas; não oferece downgrade. Codec 2 permanece como entrada compatível.
Ponte 1/hash original é validada antes da conversão. Backup 2 sem ponte e v1
geram somente vínculos parciais, sem backfill. Versões desconhecidas bloqueiam.
Aplicações antigas rejeitam envelope/metadata/ponte/backup novos, sem fallback
ao v1 e sem promessa de downgrade ou retorno à aplicação antiga sem perda.

Upgrade captura metadata/planner/ponte/fontes numa transação consistente, valida
hashes e referências e prepara envelope/registro/fingerprints fora da transação.
CAS compara época/revisão e documentos de base dentro da transação que grava
planner, ponte e metadata, com readback. Época não muda; revisão avança uma vez.
Metadata antiga sem revisão começa em zero; adoção 3 persiste par validado e
exige-o nas leituras seguintes. Bootstrap repetido é no-op. Uma migração concorrente
somente reconhece replay se o vencedor for exatamente a transformação esperada,
na mesma época e com um incremento; não rebaseia uma operação conflitante.
Falha/overflow/quota/readback abortam tudo. Não há hash Web Crypto dentro do commit.

Restore/import/reset preparam entrada convertida antes da escrita e substituem
planner/current, execution/bridge, legacy-v1/source/* e migration/v1/* juntos.
Namespaces planner/ e execution/ desconhecidos falham fechados; registros alheios
preservados. Import v1 substitui também fontes/procedência anteriores pelo input
recuperável apresentado; não faz merge de procedência de conjuntos diferentes.
V1 local permanece intacto. Época e revisão do destino avançam atomicamente,
mesmo em conteúdo idêntico; IDs coincidentes não legitimam diálogos antigos.
Releitura compara documentos, fontes, metadata e referências; rollback integral.

`legacyPlanner` e `legacyBindings` são adapters explícitos de leitura;
autosave reconcilia parciais e retém completas sem alteração. A consulta pura
`queryTemporalSnapshot` recebe envelope/registro validados, janela UTC semiaberta,
referência e fuso de exibição. Retorna identidade/natureza/procedência/schedule,
execução/história/capacidades. Sem schedule confirmado, o legado retorna
`legacy_candidate` (inclui data anterior para madrugada); a projeção horária
existente interpreta esses candidatos em memória. Nunca confirma plano ou
materializa rotina ao navegar. `temporalPlanning` centraliza vigente para Hoje
e consulta comum. Date-only/all-day usam datas no próprio fuso, sem horas inventadas.

Hoje admite completas timed como leitura, sem novos botões de comando/edição;
categoria é desconhecida, apresentada genericamente e não atribuída às métricas
legadas. Execução sem duração conhecida não usa duração planejada como realizado.
Cancelada/não realizada continuam terminais, fora das pendências. A visão horária
continua rejeitando schedules sem horário quando intersectam o dia, em vez de
inventar um intervalo; consulta comum/backup os preservam integralmente. UI própria
de Agenda/Semana e produtores são etapas futuras. Não há novo read model persistido.

Geração 2, schema Dexie 1, tabelas metadata/plannerDocuments e marker não mudam.
Conflito com armazenamento validável não é corrupção; rascunhos/formulários e
fila única da 3A-1 permanecem. Migração interrompida não sobrescreve defaults.

### Correções pré-merge da 3A-2

`deriveMonthlyDayContext` separa schedules sem horário das entradas representáveis
na projeção mensal, retorna os IDs não representados e preserva os cálculos das
demais atividades. A UI informa a quantidade única no mês e a exclusão desses
registros dos indicadores horários; navegação/meta mensal/backup continuam
disponíveis. Não há catch genérico, intervalo inventado ou alteração do registro.
Hoje mantém sua rejeição controlada; outros erros de projeção continuam erros.

`occurrenceRevision` ignora exclusivamente o novo discriminador estrutural kind,
além das exclusões históricas de posição/estimativa. Upgrade não muda a revisão
semântica dos fatos. Replay conserva a prova integral do evento/append/época;
nova operação continua sujeita ao CAS de datasetRevision, sem rebase automático.

D-036 separa criação de leitura: parseIanaTimeZone rejeita offsets isolados;
parseStoredTimeZone é usado explicitamente por codecs de fatos recuperados e
aceita somente offsets históricos canônicos ±HH:mm, com faixa validada. Não usa
Intl para inventar equivalência geográfica; não normaliza -00:00 como um fato
canônico. StoredTimeZone distingue IANA de HistoricalUtcOffset no tipo, mantendo
o mesmo campo string serializado. Factories estritas são o padrão; reconstrução
histórica injeta o parser compatível. Backup 2/3 e upgrade conservam os valores,
inclusive em completas v3, com aviso derivado do registro validado. O formato
não prova a idade de um arquivo; aceitar offsets em recovery é escolha explícita,
nunca autorização para novos fatos com offsets. A fonte autoritativa permanece
única. Backup v1 não contém fatos de fuso para converter.

## 5. Motor de planejamento

A primeira versão local usa TypeScript puro, determinístico e independente da UI. Os contratos e vetores de teste devem permitir reprodução fora do navegador.

Python permanece candidato para prototipagem, simulações, análise, otimização ou execução server-side futura. Sua entrada na runtime exige evidência de que TypeScript/Go não atende à necessidade; preferência de linguagem não é justificativa suficiente.

## 6. Backend futuro

Go continua sendo a linguagem desejada para o backend principal. Deve entrar apenas quando houver necessidade concreta de API, autenticação, multiusuário, cloud, sincronização, armazenamento remoto ou segurança server-side.

A primeira arquitetura será um monólito modular. Microsserviços, filas, brokers, Redis, Kafka, Kubernetes e infraestrutura distribuída permanecem adiados sem necessidade comprovada.

## 7. Dados e arquivos futuros

PostgreSQL é o candidato principal para o backend relacional multiusuário; a decisão final e a estratégia de migrations pertencem ao ADR do backend. D1/Drizzle atuais não constituem decisão de produto.

Certificados locais dependem de IndexedDB v2, backup/restauração completos e política de quota. No cloud, binários devem usar object storage privado; banco guarda metadados e autorização.

## 8. PWA, offline e sincronização

- PWA e cache só entram depois que os fluxos e o store v2 estiverem estáveis.
- IndexedDB prepara o offline local, mas não antecipa sincronização.
- Sincronização futura exige operações idempotentes, IDs estáveis e política explícita de conflitos.
- Execuções concluídas e histórico nunca podem ser descartados silenciosamente por conflito.

## 9. Segurança e observabilidade

Autenticação, autorização, isolamento por usuário, sessões, proteção de uploads e secrets entram com o backend/cloud. Logs estruturados, métricas, erros e auditoria de ações sensíveis devem acompanhar essa introdução, não o protótipo local.

## 10. Verificação arquitetural

Camadas futuras devem possuir testes unitários de domínio e planner, testes de componente e acessibilidade, integração de persistência/backup/migração, E2E dos fluxos essenciais e contratos de API/segurança quando o backend existir.
