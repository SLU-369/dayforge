# 10 — Roadmap e Fluxo de Implementação

## 1. Estado

- Etapa B/B3 visual concluída e aprovada.
- Etapa 0.1 documental concluída.
- Etapa 0.2/B4 de taxonomia, baseline técnica e proteção do v1 concluída.
- Etapa 1.1 de modelo temporal e contratos do domínio concluída.
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

Branch futura: `feature/v1-v2-migration`, somente após aprovação e merge da 1.2A.

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

#### 1.2C — Backup e restauração v2

Branch futura: `feature/backup-v2`, somente após aprovação e merge da 1.2B.

- implementar formato lógico v2 desacoplado das tabelas Dexie;
- separar versão do backup, geração da persistência e schema interno;
- validar envelope, dados, referências, fingerprints e procedência;
- restaurar atomicamente com rollback integral;
- aceitar backup v1 pela migração validada;
- manter a UI visível de backup v1 funcionalmente intacta enquanto v1 for a
  fonte principal.

#### 1.2D — Bootstrap e cutover para v2

Branch futura: `feature/persistence-v2-cutover`, somente após aprovação e merge da 1.2C.

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
→ commit(s) coerentes
→ apresentar resultados
→ parar
```

Não fazer push, merge ou avançar de etapa sem autorização explícita. Silêncio não é aprovação.

## 7. Closeout obrigatório

Ao concluir qualquer etapa, apresentar resumo/comportamento, arquivos alterados, testes/resultados, riscos/pendências, documentação impactada, commits/branch e status da working tree.

## 8. Fonte de verdade

- Chat: discussão e aprovação.
- Arquivos numerados em `/docs`: contratos canônicos.
- `DAYFORGE_MASTER_SPEC.md`: compilação derivada, nunca fonte manual.
- Git: histórico de evolução.
