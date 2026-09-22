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

## Questões abertas antes das etapas correspondentes

1. Quais limiares e pesos formam a primeira regra de risco de Entregas?
2. Quais fórmulas e textos de Nutri serão aprovados após revisão específica?
3. Quais limites de tamanho, quota e recuperação serão usados para arquivos locais?
4. Qual gate de estabilidade/portabilidade do frontend será exigido antes do backend/cloud?

Essas questões não bloqueiam a Etapa 0.2. Cada uma bloqueia apenas a funcionalidade correspondente.
