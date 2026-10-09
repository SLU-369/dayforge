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
