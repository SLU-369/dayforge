# 11 — Decisões e Questões Abertas

## Decisões congeladas até nova revisão

### D-001 — Dayforge é life-management first
Não posicionar o produto apenas como planner de estudante.

### D-002 — Navbar principal
`Hoje | Planejamento | Formação | Academia | Nutri | Progresso`.

### D-003 — Sono é transversal
Sono não entra na navbar nesta fase; aparece em Rotina, Hoje e Progresso.

### D-004 — Finanças é futuro
Não implementar no ciclo atual nem bloquear expansão futura.

### D-005 — Sem sidebar administrativa no desktop
Navegação principal horizontal com mega menus.

### D-006 — Formação inclui Cursos rápidos
Formação distingue Acadêmico, Cursos técnicos, Cursos rápidos e Leituras & Exploração.

### D-007 — Ensino Superior é genérico
Graduação, pós, MBA, mestrado e doutorado compartilham uma base de formação/ciclos.

### D-008 — Cursos compartilham estrutura
Curso técnico e rápido podem usar níveis, conteúdos, atividades, questionários, provas e projetos.

### D-009 — Histórico é preservado
Conclusão não apaga dados.

### D-010 — Planner local em TypeScript
O motor v1 é determinístico, puro, testável e isolado da UI. Python permanece candidato para prototipagem, simulação, otimização ou execução server-side justificada.

### D-011 — Backend futuro em Go
Go entra somente quando API, autenticação, multiusuário, cloud, sincronização, armazenamento remoto ou segurança server-side forem necessários. Começar como monólito modular.

### D-012 — Planejamento sustentável
Não preencher automaticamente toda hora livre.

### D-013 — Streak não é perfeição
Suportar mínimo, alvo e tolerância; metas semanais usam consistência semanal quando apropriado.

### D-014 — Deadline e meta são diferentes
Deadline é obrigatório; meta é desejada e replanejável.

### D-015 — 3D descartado
Preservar a solução visual 2D aprovada.

### D-016 — Modos de aparência
Os modos oficiais são Claro, Escuro e Solar. Não existe modo Sistema nesta fase.

### D-017 — Estados temporais v1
Usar `planned`, `completed`, `completed_rescheduled`, `not_completed` e `cancelled`. Não usar `skipped` como sinônimo.

### D-018 — Histórico temporal
Preservar planejamento original, reagendamentos, execução real, origem da ocorrência e motivo quando aplicável. Tolerância pertence à regra de consistência, não ao estado temporal.

### D-019 — Fonte documental
Arquivos numerados em `docs/` são canônicos. O master é gerado e não recebe edição independente.

### D-020 — Persistência local v2
Usar IndexedDB com Dexie. Preservar `rotina-369:data:v1` durante migração validada, idempotente, reversível e testada.

### D-021 — Proteção imediata do v1
A Etapa 0.2 impede autosave de defaults após falha de leitura e mantém o conteúdo original intacto.

### D-022 — Risco de entrega
Considerar ao menos dias restantes, progresso, ritmo necessário e última atualização por regra determinística, explicável e testável.

### D-023 — Ordem de Nutri
Plano e metas; revisão das fórmulas/linguagem; calculadoras; hidratação somente se aprovada.

### D-024 — Arquivos locais possuem gates
Certificados locais exigem store v2, backup, restauração e política de quota estáveis.

### D-025 — Curso rápido é escolha do usuário
Não impor limite universal de horas.

### D-026 — Taxonomia de Progresso
Domínios principais: Formação, Academia, Nutri, Sono e Exploração. Faculdade, Cursos e Leituras são filtros internos de Formação. Analytics deriva de fatos reais.

### D-027 — Ordem da persistência v2
Executar fundação, migração, backup/restauração e somente então cutover. IndexedDB não se torna principal antes do backup v2 validado.

### D-028 — Migração preserva semântica legada
Persistir snapshot v1 tipado sem inventar timezone, estado temporal, execução real, `OriginKind` ou relações ausentes. Identidade crua usa os bytes da origem; identidade semântica controla idempotência.

### D-029 — Autoridade após cutover
Metadata ativa e válida no IndexedDB é autoridade principal. O marker `dayforge:persistence:v2` impede fallback silencioso. V1 permanece somente leitura, sem dual-write ou promessa de rollback sem perda depois do cutover.

### D-030 — Schema mínimo
O schema Dexie interno 1 contém somente `metadata` e `plannerDocuments`. Tipos temporais não geram tabelas sem produtor e consumidor reais.

### D-031 — Fundação de execução da 2B
Ponte externa versionada na persistência v2, com identidade alocada uma vez,
vínculo validado ao item diário, ExecutionRecord existente e recuperação
integral. Não converter planner/current nem inferir semânticas temporais
ausentes. Não habilitar ação de conclusão na UI, reagendamento ou 2C nesta fase.

### D-032 — Planejamento auditado da 2C e recuperação local

2C divide-se obrigatoriamente em 2C-A (contrato/persistência/recuperação) e
2C-B (comando/experiência de reagendamento em Hoje), com autorizações próprias.
2C-A evolui somente a versão lógica da ponte para 2. `planningAudit` opcional
preserva baseline explicitamente confirmado e cadeia append-only dos
RescheduleEvents existentes do domínio, separada do ExecutionRecord. Upgrade
nunca infere confirmação, fuso, origem ou planejamento auditado do legado.
Regras puras compartilhadas validam continuidade, no-op, IDs e cronologia,
derivam planejamento vigente e permitem completed_rescheduled posteriormente.

`authorityEpoch` local inicia deterministicamente em 0, é persistido na adoção
2 e incrementa atomicamente por restore/import/reset, sem integrar o backup.
Comandos futuros comparam a época capturada dentro da transação. Bootstrap e
operações normais não incrementam. Restaurar conteúdo idêntico preserva dados
lógicos, mas representa nova autoridade local. Ponte 1/hash original são
validados antes da conversão; recuperação aceita ponte 2, ponte 1, ausência
de ponte e v1. Versões desconhecidas falham fechadas, sem downgrade. Formato
do planner, backup público, geração, schema, marker e v1 não mudam. Não há
produtor/UI de reagendamento na 2C-A; D-031 permanece registro histórico.

### D-033 — Intenção, revisão e projeção do reagendamento explícito

Na 2C-B, `rescheduleOccurrencePlanning` exige occurrenceId, authorityEpoch,
revisão dos fatos do vínculo, quantidade de eventos esperada, destino, changedAt
e baseline confirmada quando ausente. A revisão inclui item/original/auditoria/
execução e origem, mas ignora posição no array e a estimativa compatível de
actualMinutes do item atual: nenhum dos dois identifica o planejamento. Isso
permite reordenação inequívoca e replay de auditorias recuperadas da 2C-A que
podem ter estimativas diferentes do baselineItem. Os guards 2C-B continuam
bloqueando alteração legada desses minutos após auditoria. Cada intenção ocupa
`reschedule:<occurrenceId>:<posição>`; replay
exige a revisão anterior e o mesmo conteúdo confirmado, inclusive changedAt e
motivo. Requests equivalentes em andamento compartilham Promise na fila única;
conflitos falham, hashes são preparados fora da transação, CAS e epoch são
comparados dentro dela. Retry inalterado conserva o instante vencedor.

A primeira confirmação cria baselineItem e baselineSchedule explicitamente,
sem afirmar origem, flexibilidade, criação ou fuso histórico inexistentes. O
produtor desta etapa aceita somente intervalos timed e destino com fim posterior
à decisão, inclusive intervalo já iniciado ainda não encerrado. Não aceita
reagendamento inteiramente retrospectivo, rollover implícito, DST inexistente/
ambíguo ou offset numérico em lugar de identificador IANA. Duração é a diferença
dos instantes confirmados. Motivo opcional é texto com código estável user_note.

O item legado fica fisicamente na origem. Hoje deriva o intervalo vigente da
cadeia, com índice efêmero de vínculos e limites ordenados em memória por
snapshot validado, busca binária e filtro de interseção; nenhuma tabela/geração
ou backup novo. Dia completo reutiliza essa visão; a compatibilidade mensal
atribui cada intervalo ao dia de início efetivo uma única vez. Virtuais têm
identidade distinta, sem deduplicação por aparência nem materialização.

Concluir captura também epoch/revisão na abertura e rejeita planejamento mudado.
Execução real permanece independente, actualMinutes vem do intervalo real e
completed_rescheduled deriva da cadeia. Controles legados não podem editar,
apagar, reabrir ou mudar minutos do vínculo auditado. Notas/energia do registro
continuam permitidas. Mudança de conjunto atualiza a UI e exige uma nova ação;
um diálogo antigo nunca é reanexado por coincidência de occurrenceId.

Aplicações anteriores à 2C-B que leem bridge 2 preservam a auditoria, porém não
projetam o horário vigente; use a versão 2C-B para operar dados reagendados.
D-031 e D-032 permanecem decisões históricas sem reescrita retrospectiva.

### D-034 — Fencing do conjunto editável na 3A-1

`datasetRevision` e `writeFenceVersion: 1` pertencem à metadata local validada.
A época identifica substituições; a revisão identifica mutações autoritativas
normais. Ambas são capturadas junto ao snapshot e comparadas na transação.
Autosave amplo exige a base explícita da edição, sem atualização automática do
fence. O repositório avança revisão uma vez por mudança líquida transacional;
leituras/no-op/replay não avançam. Overflow e falhas revertem integralmente.

Metadata anterior sem os dois campos parte de zero e é adotada idempotentemente;
versões/campos inválidos bloqueiam. Restore/import/reset incrementam época e
revisão do destino inclusive com conteúdo igual, sem importar contadores locais.
Conclusão e reagendamento preservam replay exato por prova do fato e da época,
sem duplicar execução/evento por divergência de revisão causada pelo próprio
sucesso. Comando ainda não aplicado exige o conjunto esperado.

Invalidação local entre abas apenas sinaliza releitura. Aba limpa pode atualizar;
rascunho/editor aberto é preservado e exige resolução explícita. Download do
rascunho é separado do backup, não é um arquivo de recuperação. Sem merge
automático, sucesso falso ou bloqueio estrutural por conflito normal. Formatos
planner 1, ponte 2, backup 2, geração 2 e schema 1 permanecem; v1 é somente leitura.
D-031, D-032 e D-033 permanecem registros históricos. A 3A-2 e funcionalidades
posteriores continuam sem autorização de implementação.

### D-035 — Evolução lógica temporal e recuperação na 3A-2

Após integração da 3A-1 pela PR #16, autoriza-se envelope planner lógico 2,
ponte/registro discriminado 3 e backup público 3, preservando geração 2/schema 1.
Legado parcial continua parcial; completas independem de records e usam o domínio
existente, com uma única execução/história autoritativa e alocador compartilhado.
Não existem novos produtores nem comandos públicos para completas nesta unidade.
Referências a templates/domínios sem entidade recuperável são rejeitadas até sua
evolução autorizada, sem inventar contratos ou procedência histórica.

Upgrade valida snapshot/hash antigo antes de transformar, prepara hashes fora do
commit e faz CAS época/revisão/base, escrita e readback numa única transação.
Época preservada; uma revisão por mutação; no-op/replay estáveis. Ponte 3 exige
metadata de revisão adotada. Recuperação aceita 3/2/1 e substitui conjunto completo,
incluindo fontes/procedência, usando contadores locais do destino. Não há downgrade
silencioso, export 2 de conjunto novo ou sobrevivência de entidades temporais órfãs.

Consulta comum não cria fatos; capacidades distinguem parciais/completas. Hoje
preserva leitura legada e admite completas timed sem comandos, categoria inferida
ou tempo realizado fabricado. Schedules sem horário permanecem na consulta/backup;
uma UX horária não os transforma em intervalos. Agenda, Rotina canônica, Semana,
Metas, Consistência e 3B-1 continuam sujeitos a aprovação própria.
D-031, D-032, D-033 e D-034 permanecem históricos sem reescrita.

### D-036 — Fusos novos estritos e compatibilidade de fatos históricos

A correção pré-merge da 3A-2 exige IANA nomeado em toda criação nova, incluindo
UTC, sem depender da aceitação de offsets pelo Intl. Factories e codecs de criação
usam parseIanaTimeZone; offsets isolados e zonas inexistentes são rejeitados.

Por escolha humana explícita, leitura e recuperação preservam offsets históricos
canônicos também em completas v3 anteriormente aceitas. O arquivo não contém a
versão da aplicação que aceitou o fato; não se tenta inferir sua idade. Backups
são fronteiras de recuperação, não produtores de novos fatos: usam validação
histórica explícita, mantêm literal, UTC, IDs e cadeias, e a UI exibe aviso.
Um offset histórico possui tipo próprio, não é afirmado como IANA nem convertido
em localização. Sintaxe/campos/hashes/referências/cronologia continuam estritos.
Replays exatos podem conservar a execução histórica; novos comandos exigem IANA.

Não há novo campo persistido, produtor, versão de backup ou migração semântica.
D-031 a D-035 permanecem registros históricos. Qualquer produtor futuro deve usar
a fronteira estrita, nunca o parser de leitura histórica.

### D-037 — Primeiro produtor de eventos independentes na Agenda (3B-1)

Após integração da 3A-2, a 3B-1 autoriza exclusivamente criar compromissos timed
canônicos independentes e consultar eventos. O domínio cria ScheduleOccurrence planned, sem template,
com origem event e planejamento/flexibilidade explicitamente confirmados.
Timed exige início/fim completos e inequívocos. date_only/all_day não possuem
produtor nesta unidade, mas continuam recuperáveis e consultáveis: date_only não
adquire horário/duração e all_day usa fim exclusivo. Toda criação nova exige IANA nomeado (D-036).
Datas planejadas não produzem execução real ou estados terminais.

Época, revisão e posição do alocador são capturadas antes da preparação. O
comando compara a base dentro da transação e aloca occ:sequência no registro 3.
Replay exige identidade e fato integral, inclusive createdAt, na mesma autoridade;
não deduplica por título/horário, não atualiza automaticamente um formulário antigo
e não avança revisão. Um retry inalterado conserva o instante confirmado.
As versões e limites de recuperação da D-035 permanecem.

A Agenda consulta o snapshot comum em memória, apresenta calendário mensal e
detalhes por data, e distingue fatos canônicos de candidatos legados parciais.
Novos comandos de execução, edição/exclusão, recorrência e demais subetapas
permanecem gated. PR e merge não são consequência da autorização de implementar.
D-031 a D-036 permanecem históricos, sem reescrita retrospectiva.

### D-038 — Prova persistida de intenção e confirmação da criação (correções da 3B-1)

A correção autorizada de F1–F5 distingue a intenção de criação da identidade
occ:n e dos campos visíveis. Cada abertura explícita de formulário gera um UUID
v4 opaco, fornecido ao comando como creationIntentId. Retry conserva esse valor;
outro formulário recebe outro valor mesmo com todos os fatos e relógio iguais.
O produtor recebe a identidade, não gera aleatoriedade dentro do domínio/migração.

Entradas canonical do registro 3 admitem creationIntentId opcional, imutável
nas operações normais, junto à ocorrência e coberto pelo mesmo fingerprint.
Quando presente, exige UUID v4 canônico, origem event e unicidade no registro.
Novas criações sempre o escrevem; leitura/upgrade/export/restore de fatos antigos
sem prova conservam a ausência. Não existe token retroativo nem replay novo
legitimado somente pela igualdade de um fato histórico. Não há store de recibos
paralelo, campo semântico reutilizado ou segunda fonte de verdade.

Replay exige prova, identidade, ocorrência integral e época original, com
verificação readonly do snapshot autoritativo. Nova mutação continua exigindo
CAS estrito de época/revisão/base/alocador. Outra intenção na mesma posição
recebe conflito recuperável. Reutilizar uma prova em outra posição é rejeitado.
Restore/reset conservam as regras de autoridade local e invalidam tentativas antigas.

Após qualquer resposta do comando, a aplicação relê e valida a autoridade.
Somente a prova e o fato próprios permitem anunciar sucesso, inclusive após
commit cuja resposta se perdeu. Rejeição é um estado explícito, independente
do valor lançado; ausência de prova conserva formulário e erro/conflito.
Não se removem os guards globais de rascunho ou autoridade substituída.

Preservados planner 2, registro 3, backup 3/recovery 3/2/1, geração 2/schema 1.
A extensão é opcional e compatível com a leitura dos formatos/dados anteriores
na aplicação corrigida, sem migração estrutural. Leitores anteriores com codec
estrito que desconhece o campo rejeitam o registro novo, sem descarte/downgrade;
não se promete leitura futura por binários antigos. D-031 a D-037 ficam históricos.

As bordas da consulta pura podem usar ISO UTC expandido para representar o
fim exclusivo de dezembro de 9999. Isso não amplia LocalDate, instantes
persistidos, criação ou validação histórica. Navegação para ano 10000 continua
fora do intervalo de datas e informa o limite sem ocultar o último mês válido.

## Questões abertas antes das etapas correspondentes

1. Quais limiares e pesos formam a primeira regra de risco de Entregas?
2. Quais fórmulas e textos de Nutri serão aprovados após revisão específica?
3. Quais limites de tamanho, quota e recuperação serão usados para arquivos locais?
4. Qual gate de estabilidade/portabilidade do frontend será exigido antes do backend/cloud?

Essas questões não bloqueiam a Etapa 0.2. Cada uma bloqueia apenas a funcionalidade correspondente.
