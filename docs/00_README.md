# Dayforge 2.0 — Documentação oficial de produto

**Status:** baseline inicial pós-Etapa B3, antes da reconstrução funcional do produto  
**Data:** 10/09/2026  
**Objetivo:** transformar as decisões de produto, UX, domínio e arquitetura discutidas até aqui em uma fonte oficial de verdade para o repositório e para o Codex.

## Como usar esta documentação

1. O Codex deve ler **todos os arquivos desta pasta** antes de propor qualquer novo plano de implementação.
2. A documentação é normativa para produto e UX. Quando código e documentação entrarem em conflito, o conflito deve ser explicitado antes de implementar.
3. Ideias antigas que foram refinadas posteriormente foram consolidadas na forma mais atual.
4. Decisões ainda não fechadas aparecem em `11_DECISIONS_AND_OPEN_QUESTIONS.md`.
5. Toda mudança relevante de produto deve atualizar a documentação e o registro de decisões.

## Visão em uma frase

> **Dayforge é um sistema operacional pessoal para planejar, executar, acompanhar e evoluir as diferentes áreas da vida com o mínimo de atrito.**

Ele não deve parecer um SaaS administrativo nem um checklist infinito. A profundidade existe por trás; a superfície deve ser simples, contextual e rápida.

## Princípios centrais

- **Complexidade por trás, simplicidade na frente.**
- **Poucos cliques para registrar; profundidade apenas quando desejada.**
- **Nenhuma tela principal deve parecer uma lista interminável de obrigações.**
- **Todo dado solicitado ao usuário deve produzir consequência útil.**
- **Planejamento sustentável vence preenchimento máximo de agenda.**
- **Conclusão gera histórico, não exclusão.**
- **O sistema deve acompanhar a pessoa do ponto em que ela começa a usar o Dayforge, sem exigir reconstrução artificial do passado.**

## Documentos

- `01_PRODUCT_VISION_AND_REQUIREMENTS.md` — visão, escopo, requisitos funcionais e não funcionais.
- `02_INFORMATION_ARCHITECTURE.md` — navegação global, hierarquia e rotas conceituais.
- `03_UX_UI_SPECIFICATION.md` — regras de UX/UI, temas, interação, responsividade e visual.
- `04_FORMATION_ACADEMIC_REQUIREMENTS.md` — ensino superior, cursos, leituras, trabalhos, certificados e estudos complementares.
- `05_PLANNING_ENGINE_AND_CONSISTENCY.md` — motor determinístico, capacidade saudável, streak, metas, buffer e replanejamento.
- `06_HEALTH_FITNESS_NUTRITION_SLEEP.md` — academia, Nutri e Sono.
- `07_PROGRESS_GOALS_ANALYTICS.md` — metas, métricas, gráficos e comparações temporais.
- `08_DATA_FILES_SECURITY_RETENTION.md` — retenção, anexos, backup, exclusão, autenticação e futuro cloud/PWA.
- `09_TECHNICAL_ARCHITECTURE.md` — decisões técnicas conhecidas e itens pendentes de auditoria do repositório.
- `10_ROADMAP_AND_CODEX_WORKFLOW.md` — processo de planejamento e implementação por etapas.
- `11_DECISIONS_AND_OPEN_QUESTIONS.md` — decisões congeladas e pontos que dependem de validação futura.
- `12_ACCEPTANCE_SCENARIOS.md` — cenários de aceitação de produto usados para revisar planos do Codex.
- `13_DOMAIN_MODEL.md` — entidades conceituais e relações de domínio.
- `14_CURRENT_TO_TARGET_AUDIT.md` — mapa explícito do estado atual para o estado alvo.
- `15_FUTURE_PRODUCTIZATION_AND_PWA.md` — visão de cloud, PWA, multiusuário e comercialização futura.
- `16_REFERENCE_CONFIGURATION.md` — cenário pessoal de referência para testes, sem hardcode.

## Estado atual do projeto

A Etapa B/B3 concluiu a fundação visual inicial do App Shell:

- sidebar vertical removida;
- navbar horizontal principal criada;
- mega menus criados;
- tema claro, escuro e comportamento de tema refinados;
- fundo 2D preservado após tentativa 3D que foi descartada;
- navegação principal atual: **Hoje, Planejamento, Formação, Academia, Nutri, Progresso**;
- o conteúdo funcional antigo da página Hoje ainda é legado e será reformulado posteriormente.

Antes da próxima grande etapa funcional, recomenda-se apenas um possível **B4 curto de congelamento de taxonomia**, principalmente para consolidar `Cursos rápidos` dentro de Formação e revisar nomes de itens como `Rotina-base` → `Rotina`.
