# 11 — Decisões e Questões Abertas

## Decisões congeladas até nova revisão

### D-001 — Dayforge é life-management first
Não posicionar o produto apenas como planner de estudante. Formação é um domínio importante, mas o produto organiza rotina, aprendizado, fitness, nutrição, sono e futuramente finanças.

### D-002 — Navbar principal atual
`Hoje | Planejamento | Formação | Academia | Nutri | Progresso`

### D-003 — Sono não entra na navbar agora
Sono é transversal em Rotina, Hoje e Progresso.

### D-004 — Finanças é futuro
Não implementar no ciclo atual, mas não bloquear expansão.

### D-005 — Sem sidebar administrativa no desktop
Navegação principal horizontal com mega menus.

### D-006 — Formação inclui Cursos rápidos
Mega menu Formação deve distinguir Acadêmico, Cursos técnicos, Cursos rápidos e Leituras & Exploração.

### D-007 — Ensino Superior é genérico
Graduação, pós, MBA, mestrado e doutorado compartilham uma base de formação/ciclos.

### D-008 — Curso técnico e curso rápido compartilham motor estrutural
Podem ter níveis, conteúdo, atividades, questionários, provas e projetos.

### D-009 — Histórico é preservado
Conclusão não apaga dados.

### D-010 — Planner sem LLM inicialmente
Motor determinístico/question-answer, desejado em Python.

### D-011 — Backend principal em Go
Go é a linguagem principal desejada para backend.

### D-012 — Planejamento sustentável
Não preencher automaticamente toda hora livre.

### D-013 — Streak não é perfeição
Suportar mínimo, alvo e tolerância; faculdade pode usar consistência semanal.

### D-014 — Deadline e meta são diferentes
Deadline é obrigatório; meta é desejada/replanejável.

### D-015 — 3D descartado
Preservar a solução visual 2D atual como base.

## Questões abertas para o novo Plan Mode

1. Qual o stack frontend exato pós-B3?
2. A B4 de taxonomia já foi aplicada ou ainda falta `Cursos rápidos`/`Rotina`?
3. Qual banco melhor representa o domínio futuro?
4. Como integrar Go e Python no planner?
5. Qual estratégia de migração do localStorage legado?
6. Qual biblioteca de gráficos atual deve ser mantida/substituída?
7. Como implementar PWA/offline sem criar complexidade precoce?
8. Como modelar arquivos/certificados no modo local antes do cloud?
9. Quando introduzir autenticação/multiusuário?
10. Quais métricas de Nutri entram na primeira versão e quais ficam futuras?
11. A classificação de curso rápido por “até ~30h” será regra do produto ou apenas convenção do usuário?
12. Qual o melhor componente visual para níveis/períodos sem accordion excessivo?
13. Quais regras exatas de risco de entrega serão adotadas na v1?
14. Como versionar alterações de planejamento sem perder histórico?
