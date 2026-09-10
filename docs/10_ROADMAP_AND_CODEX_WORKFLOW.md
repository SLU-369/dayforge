# 10 — Roadmap e Fluxo com Codex

## 1. Situação atual

- Etapa B/B3 concluída.
- App Shell horizontal criado.
- Experimento 3D revertido.
- Repositório migrado para ambiente pessoal do usuário.
- Próxima grande ação: documentação → auditoria do Codex → novo planejamento.

## 2. Possível B4 curto antes do freeze

Apenas se ainda não realizado:

- adicionar `Cursos rápidos` ao mega menu Formação;
- revisar `Rotina-base` → `Rotina`;
- congelar textos/subtítulos dos mega menus;
- não implementar novas regras de negócio;
- não reconstruir Hoje ainda.

## 3. Ordem correta

```text
Documentar
↓
Revisar documentação
↓
Codex lê /docs inteiro
↓
Codex audita repositório
↓
Codex propõe novo roadmap
↓
Revisão humana do roadmap
↓
Implementação por etapas
```

## 4. Prompt-base para novo Plan Mode

O novo chat do Codex deve receber instrução semelhante a:

```text
Leia integralmente todos os arquivos em /docs antes de planejar qualquer alteração.
Inspecione o repositório real pós-B3.
Não implemente nada.
Confronte código atual com requisitos documentados.
Identifique gaps, riscos e dependências.
Proponha novo roadmap técnico em etapas pequenas.
Separe frontend, domínio, backend, planner e migração de dados.
```

## 5. O Codex deve entregar

- inventário do stack;
- mapa de rotas e componentes;
- mapa de persistência;
- pontos reutilizáveis;
- pontos legados a remover;
- nova arquitetura técnica;
- fases de implementação;
- dependências entre fases;
- estratégia de migração;
- riscos;
- testes/aceite de cada fase.

## 6. Não assumir etapas antigas

Nomes como C, D, E etc. eram hipóteses anteriores. Após ler esta documentação, o Codex deve recriar o roadmap com base no estado real do repositório e nos requisitos consolidados.

## 7. Implementação por etapa

Cada etapa deve seguir:

```text
Planejar
→ aprovar
→ criar/usar branch
→ implementar
→ lint/build/testes
→ revisão visual/funcional
→ corrigir
→ commit(s) pequenos
→ parar
```

Sem push, merge ou próxima etapa sem autorização explícita, caso esse continue sendo o fluxo escolhido.

## 8. Documentação viva

Mudança de produto aprovada deve atualizar:

- requisito correspondente;
- UX, se aplicável;
- domínio, se aplicável;
- `DECISIONS`;
- roadmap, se houver impacto.

## 9. Fonte de verdade

- Chat: ideação e discussão.
- `/docs`: decisões oficiais.
- Codex: auditoria, planejamento e implementação.
- Git: histórico de evolução.
