# 10 — Roadmap e Fluxo de Implementação

## 1. Estado

- Etapa B/B3 visual concluída e aprovada.
- Etapa 0.1 documental concluída nesta baseline.
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
