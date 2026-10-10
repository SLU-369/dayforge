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

## Questões abertas antes das etapas correspondentes

1. Quais limiares e pesos formam a primeira regra de risco de Entregas?
2. Quais fórmulas e textos de Nutri serão aprovados após revisão específica?
3. Quais limites de tamanho, quota e recuperação serão usados para arquivos locais?
4. Qual gate de estabilidade/portabilidade do frontend será exigido antes do backend/cloud?

Essas questões não bloqueiam a Etapa 0.2. Cada uma bloqueia apenas a funcionalidade correspondente.
