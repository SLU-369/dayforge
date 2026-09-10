# 13 — Modelo Conceitual de Domínio

> Este arquivo descreve conceitos, não tabelas definitivas. O Codex deve propor o modelo técnico depois de auditar o repositório.

## 1. Núcleo temporal

### RoutineTemplate
Molde recorrente semanal. Define padrões futuros sem reescrever histórico.

### RoutineOccurrence
Ocorrência concreta em uma data. Pode divergir do template sem alterar outras semanas.

### ScheduleItem
Conceito temporal genérico para compor o dia. Pode referenciar evento, treino, estudo, compromisso ou outra entidade.

### Event / Commitment
Item pontual com data/horário, usado para aniversário, consulta, reunião e compromissos futuros.

### AvailabilityWindow
Janela em que algo **pode** ser realizado sem ser compromisso rígido. Importante para estudo oportunístico durante o trabalho.

Estados temporais desejados:

- planned;
- completed;
- completed_rescheduled;
- skipped/not_completed;
- cancelled.

Flexibilidade:

- fixed;
- preferred;
- flexible;
- opportunistic.

## 2. Metas e consistência

### Goal
Meta mensurável ligada a um domínio.

### GoalThreshold
Suporta mínimo, alvo e eventualmente extra.

### ConsistencyRule
Define frequência, dias válidos, tolerância e critério de streak.

### StreakState
Estado atual, maior sequência e calendário de dias válidos.

### WeeklyConsistency
Para metas não diárias, registra semanas consecutivas cumpridas.

## 3. Formação acadêmica

### HigherEducationProgram
Graduação, pós, MBA, mestrado, doutorado ou outro.

### AcademicCycle
Período/semestre/trimestre/ano/módulo acadêmico. Rótulo configurável.

Estados possíveis:

- previous_untracked (`concluído antes do Dayforge`);
- current;
- planned/not_started;
- completed.

### Subject
Disciplina pertencente a um ciclo.

### SubjectModule
Módulo editável de uma disciplina.

### LearningContent
Unidade genérica de conteúdo:

- lesson;
- activity;
- exam;
- reading;
- project;
- quiz;
- other.

### AcademicDelivery
Entrega com prazo: trabalho, extensão, PIM/equivalente, prova, atividade adicional etc.

### DeliveryStep
Etapa usada para progresso calculado.

### Grade
Nota de disciplina, atividade, período ou formação, quando aplicável.

### AcademicHistoryEntry
Registro imutável/consultável de conclusão, nota e contexto.

## 4. Cursos

### Course
Curso técnico ou rápido.

### CourseLevel
Nível conhecido de antemão quando a plataforma oferece trilha completa.

### CourseContent
Aula, atividade, questionário, prova, projeto ou outro conteúdo dentro do nível.

### CourseSession
Execução real de estudo com tempo, conteúdo, aprendizado, dúvida e necessidade de revisão.

### Certificate
Arquivo e metadados de conclusão.

## 5. Leituras e exploração

### Book
Título, autor, páginas totais, página atual, progresso e meta.

### ReadingSession
Páginas inicial/final, duração opcional e aprendizado.

### MediaItem
Filme/documentário com duração, data, categoria, considerações e aprendizados.

### Article
Artigo/referência consumida.

### FreeStudy
Estudo livre/avulso com tema, fonte, tempo e reflexão.

### SupplementalStudy
Material usado para complementar um conteúdo principal.

### LearningRelation
Relaciona estudo livre/complementar a disciplina, aula, curso ou tema **sem duplicar métricas de tempo**.

## 6. Academia

### WorkoutPlan
Plano semanal/preferências de treino.

### WorkoutTemplate
Ficha como Peito, Costas, Ombro etc.

### Exercise
Exercício configurável.

### ExercisePrescription
Séries, faixa de repetições, carga alvo e observações.

### WorkoutSession
Treino realizado em data/hora.

### ExerciseSet
Carga e repetições reais por série.

## 7. Nutri

### NutritionProfile
Entradas usadas para estimativas e metas.

### NutritionGoal
Calorias, proteína, fibras, água ou outras métricas futuramente.

### MealPlan
Estrutura configurável de refeições.

### Meal
Café, almoço, lanche, jantar ou outro.

### HydrationEntry
Registro rápido de volume de água, se o acompanhamento for implementado.

## 8. Sono

### SleepTarget
Horários-alvo e duração-alvo.

### SleepEntry
Dormiu, acordou, duração real e fonte manual/integrada.

## 9. Analytics

### ProgressMetric
Métrica agregável por domínio e período.

### ProgressSnapshot
Snapshot/derivação histórica quando necessário.

### RiskState
Estado calculado para prazo/entrega: neutral, attention, critical, on_track, almost_done.

## 10. Arquivos e histórico

### Attachment
Abstração para arquivos, incluindo certificados.

### Audit/History Event
Mudanças importantes de estado devem poder ser reconstruídas futuramente, principalmente planejamento/replanejamento.

## 11. Relação entre plano e execução

A arquitetura deve preservar a diferença entre:

```text
Modelo recorrente
↓
Ocorrência planejada
↓
Execução real
↓
Histórico
```

Editar uma ocorrência de terça-feira não deve necessariamente editar o template de todas as terças.

A UI deve oferecer, quando aplicável:

- editar somente este dia;
- editar recorrência;
- editar esta e futuras ocorrências;
- reagendar;
- pular somente hoje.
