<!-- GENERATED FILE: edit the numbered documents in docs/ and run npm.cmd run docs:master. -->
# Dayforge 2.0 — Master Spec derivado

> Este arquivo é uma compilação gerada. Os arquivos numerados em `docs/` são a fonte canônica.

# Dayforge 2.0 — Documentação oficial de produto

**Status:** Etapas 0.1, 0.2, 1.1 e 1.2A–1.2D implementadas; 2A, fundação da 2B, 2B-A, 2C-A e 2C-B concluídas e integradas; macroetapa 2 encerrada
**Data:** 12/10/2026
**Etapa atual:** 3A-1 e 3A-2 concluídas, auditadas e integradas à main; baseline `40ed9f425b419b4ce25b20bc2e44023ea88e5b18`. 3B-1 — criação exclusivamente timed e consulta de eventos canônicos na Agenda — na PR #18, sem integração. Correções autorizadas F1–F5/D-038: Node 466/466, Agenda Edge 19/19, global 96/96 sem retries. Falhas históricas 87/88 e causa solar indeterminada permanecem registradas; o resultado atual não prova sua origem. Nova avaliação independente e merge aguardam gates humanos próprios; outras subetapas permanecem futuras.
**Objetivo:** transformar as decisões de produto, UX, domínio e arquitetura discutidas até aqui em uma fonte oficial de verdade para o repositório e para o Codex.

## Como usar esta documentação

1. Os arquivos numerados `00_*.md` a `16_*.md` são a fonte canônica de produto, UX, arquitetura e roadmap.
2. `DAYFORGE_MASTER_SPEC.md` é um artefato derivado desses arquivos; nunca deve ser editado como fonte independente.
3. O Codex deve ler **todos os arquivos canônicos** antes de propor qualquer novo plano de implementação.
4. Quando código e documentação entrarem em conflito, o conflito deve ser explicitado antes de implementar.
5. Ideias antigas que foram refinadas posteriormente foram consolidadas na forma mais atual.
6. Decisões ainda não fechadas aparecem em `11_DECISIONS_AND_OPEN_QUESTIONS.md`.
7. Toda mudança relevante de produto deve atualizar a documentação e o registro de decisões.

## Master derivado

Execute `npm.cmd run docs:master` após alterar qualquer documento canônico. O comando recompõe o master em ordem numérica, sem timestamp ou conteúdo autoral próprio. `npm.cmd run docs:master:check` verifica divergência sem modificar arquivos e integra a CI desde a Etapa 0.2.

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
- `09_TECHNICAL_ARCHITECTURE.md` — arquitetura técnica consolidada atual, incluindo decisões aprovadas e elementos futuros ainda sujeitos aos respectivos gates.
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
- Formação distingue Acadêmico, Cursos técnicos, Cursos rápidos e Leituras & Exploração;
- `Rotina` é o nome exibido para o molde semanal;
- lint, typecheck, build, testes e sincronização do master integram a baseline de CI;
- falhas de leitura do payload v1 preservam o conteúdo original e bloqueiam autosave até recuperação explícita;
- o núcleo TypeScript puro em `domain/temporal/` define templates, ocorrências,
  execução, reagendamento, estados terminais e disponibilidade mínima sem
  depender de React, browser ou persistência;
- a página Hoje apresenta contexto derivado em memória e permite conclusão canônica explícita na 2B-A; seus controles legados permanecem na visão secundária do dia completo, com toggle de conclusão bloqueado.

A Etapa 1.1 não integrou o novo domínio temporal ao planner legado. A Etapa 1.2
foi implementada em quatro subetapas: fundação Dexie, migração validada,
backup/restauração lógica v2 e bootstrap/cutover. O planner atual usa
`planner/current` no IndexedDB com metadata ativa; `rotina-369:data:v1`
permanece intacto e somente leitura. A tela de Dados e backup exporta v2 e
aceita arquivos v2 e v1. A Etapa 2A adiciona somente o read model contextual;
a fundação da 2B inclui identidade, execução auditável e recuperação.
A 2B-A adiciona Concluir para ocorrências canônicas, com intervalo real e fuso
informados explicitamente pelo usuário. Itens virtuais e conclusões históricas
não recebem fatos retroativos. A 2C-A evolui a ponte lógica para 2, aceita
planejamento auditado em recuperação e introduz `authorityEpoch` local, sem
inferir confirmação temporal nem criar produtor de reagendamento. A 2C-B foi
autorizada e implementa confirmação, comando atômico e projeção efetiva de
reagendamentos em Hoje, com histórico e detecção de diálogos obsoletos.

A 2C-A foi integrada pela PR #13 e a 2C-B pela PR #14, cujo merge é
`52a77de3eac6e3740204ae64a5318cb790b5e7e8`. Com 2A, fundação da 2B, 2B-A,
2C-A e 2C-B concluídas e integradas, a macroetapa 2 está formalmente encerrada.
Os gates humanos de implementação e integração permanecem no histórico.
A Etapa 3 exige planejamento, subdivisão e aprovação próprios; este encerramento
documental não inicia seu planejamento detalhado nem autoriza sua implementação.

A 3A-1 implementa revisão persistida local e CAS para o conjunto editável,
preservando formatos e contratos da Etapa 2. Conflitos mantêm rascunhos e
formulários; recuperação mantém epoch e revisão do destino. D-034 e os documentos
09/10/12 registram o contrato e seus limites. A macroetapa 3 não está concluída.

A 3A-1 foi integrada pelo merge `733bc3037e5143a1f67adfec8909268d9f736702`.
A 3A-2 evolui planner lógico 2, ponte 3 e backup público 3; mantém geração 2,
Dexie schema 1 e v1 somente leitura. Os relatos de formatos anteriores acima
descrevem seus escopos históricos; D-035 registra o contrato atual.

---

# 01 — Visão do Produto e Levantamento de Requisitos

## 1. Problema que o Dayforge resolve

O Dayforge nasceu de uma dor concreta: organizar rotina, estudos, compromissos e evolução pessoal sem depender de listas intermináveis, dashboards decorativos ou dezenas de sistemas desconectados.

O produto deve permitir que uma pessoa responda rapidamente:

- O que importa agora?
- O que vem depois?
- O que é fixo e o que pode ser movido?
- O que eu realmente fiz?
- Estou mantendo consistência?
- Estou avançando em direção às minhas metas?
- Estou me sobrecarregando?
- Como evoluí ao longo das semanas, meses e anos?

## 2. Posicionamento

O Dayforge não é apenas agenda, planner acadêmico, app fitness ou tracker de hábitos. Ele é um **sistema operacional pessoal de vida** composto por domínios que convergem no dia atual.

Domínios atuais:

- Hoje;
- Planejamento;
- Formação;
- Academia;
- Nutri;
- Progresso;
- Sono como domínio transversal.

Domínio futuro reservado:

- Finanças.

## 3. Resultado desejado

O sistema deve organizar a vida com rapidez e poucos cliques. A pessoa pode possuir centenas de registros no banco, mas não deve sentir essa complexidade na tela principal.

O Dayforge deve priorizar:

- execução contextual;
- planejamento sustentável;
- histórico confiável;
- progresso mensurável;
- replanejamento fácil;
- consistência em vez de perfeição.

## 4. Requisitos funcionais globais

### RF-G01 — Página Hoje
A página Hoje deve apresentar apenas o que importa no momento, seguindo a ideia de informação progressiva:

- Agora;
- Próximo;
- Depois;
- Atenção;
- Resumo do dia.

A timeline completa do dia deve existir como visão secundária, não como conteúdo dominante.

### RF-G02 — Planejado x realizado
Qualquer item temporal relevante deve poder assumir pelo menos os estados:

- planejado;
- realizado;
- realizado com reagendamento;
- não realizado;
- cancelado, quando aplicável.

### RF-G03 — Reagendamento
Atividades flexíveis e preferenciais devem poder ser movidas sem serem automaticamente consideradas falhas.

### RF-G04 — Eventos futuros
O usuário deve poder cadastrar compromissos e eventos em qualquer data futura navegável no calendário.

### RF-G05 — Botão Adicionar contextual
O botão global `Adicionar` deve evoluir para apresentar ações de acordo com o contexto atual, reduzindo decisões desnecessárias.

### RF-G06 — Histórico
Itens concluídos devem permanecer consultáveis. Concluir curso, período, livro ou graduação nunca deve significar apagar dados.

### RF-G07 — Busca/associação futura
Registros livres devem poder ser associados posteriormente a domínios existentes sem duplicar tempo ou métricas.

### RF-G08 — Edição
Estruturas do usuário devem ser editáveis: nomes, quantidades, datas, escopos, módulos, níveis, atividades, metas, prazos e outros campos relevantes.

## 5. Requisitos não funcionais de produto

### RNF-P01 — Baixo atrito
Registrar uma ação simples deve exigir o mínimo possível de interação.

### RNF-P02 — Sem sobrecarga visual
Nenhuma página principal deve apresentar todas as tarefas e domínios ao mesmo tempo.

### RNF-P03 — Sem inputs decorativos
Qualquer input precisa impactar planejamento, histórico, progresso, meta, replanejamento ou análise. Caso contrário, deve ser removido.

### RNF-P04 — Sustentabilidade
O sistema não deve tentar preencher toda disponibilidade livre. Deve considerar capacidade configurada e limites saudáveis.

### RNF-P05 — Editabilidade
Valores típicos podem ser sugeridos, mas nunca hardcoded como universais.

### RNF-P06 — Evolução longa
A arquitetura deve suportar anos de histórico, múltiplas formações e expansão modular.

## 6. Elementos legados a remover ou reformular

- Energia do dia 1–5: remover da experiência principal, pois não gera consequência útil no modelo atual.
- Meta mensal em textarea: substituir por metas estruturadas e mensuráveis.
- Gráficos estáticos/decorativos: substituir por visualizações ligadas a dados reais.
- Backup na navegação principal: mover para Configurações → Dados e backup.
- Painel de perfil com informações administrativas: simplificar para Perfil, Preferências, Configurações e Sair.
- Linha do tempo vertical como tela principal: mover para uma visão detalhada secundária.
- Foco AI/LLM como métrica fixa: generalizar para domínios e métricas configuráveis.

## 7. Escopo futuro explícito

O produto deve ser desenhado para poder evoluir a:

- multiusuário;
- autenticação;
- sincronização cloud;
- PWA mobile;
- modo offline;
- anexos seguros;
- planos comerciais;
- Finanças.

Esses itens não devem dominar a primeira reconstrução funcional, mas a arquitetura não deve bloquear sua futura adoção.

## 8. Requisitos adicionais consolidados

### RF-G09 — Janelas oportunísticas
O usuário pode possuir janelas em que uma atividade é permitida, mas não obrigatória, por exemplo estudo durante uma pausa ou período ocioso no trabalho. Essas janelas não devem gerar falha quando não utilizadas.

### RF-G10 — Estado visual de consistência
O produto pode possuir um indicador visual/expressão do “estado do Dayforge”, derivado apenas de metas relevantes e consistência configurada. Ele não deve ficar negativo por qualquer tarefa perdida, nem tratar imprevistos reais como falha moral. A forma visual exata será definida em UX posterior.

### RF-G11 — Reflexão opcional do dia
Uma nota/reflexão de fechamento pode existir se alimentar histórico ou revisão futura. Não deve ser obrigatória nem ocupar espaço central quando não utilizada.

---

# 02 — Arquitetura da Informação e Navegação

## 1. Navbar global congelada por enquanto

```text
Hoje | Planejamento | Formação | Academia | Nutri | Progresso
```

Não adicionar Sono à navbar nesta fase. Sono é transversal e aparece em Rotina, Hoje e Progresso.

Finanças permanece reservado para futuro.

## 2. Regras da navegação

- `Hoje` não possui mega menu.
- Somente uma área pode estar visualmente `ACTIVE`.
- `OPEN` de mega menu e `HOVER` devem ter aparência distinta de `ACTIVE`.
- Mega menus devem abrir contexto, não virar listas infinitas.
- Tabs locais representam navegação dentro de uma entidade, não novas áreas globais.
- Evitar profundidade do tipo menu → submenu → página → accordion → subaccordion.

## 3. Planejamento

Mega menu:

```text
Planejamento
├── Semana
├── Agenda
├── Rotina
└── Metas
```

`Rotina` é o nome visual oficial do molde semanal reutilizável.

### Rotina

```text
Rotina
├── Âncoras
├── Não negociáveis
└── Flexíveis
```

Âncoras: acordar, dormir, entrada/saída do trabalho, refeições, deslocamentos.  
Não negociáveis: itens que possuem meta de consistência e maior prioridade.  
Flexíveis: estudos, cursos, leituras e outras ações movíveis.

## 4. Formação

Mega menu recomendado:

```text
Formação
├── Visão geral
├── Acadêmico
├── Cursos técnicos
├── Cursos rápidos
└── Leituras & Exploração
```

### Visão geral
Mostra formações em andamento, itens para continuar e resumo de progresso sem abrir todos os detalhes.

### Acadêmico

```text
Acadêmico
└── Ensino Superior
    └── Formação
        ├── Visão geral
        ├── Períodos/Ciclos
        ├── Disciplinas
        ├── Entregas
        ├── Planejamento
        ├── Calendário
        └── Histórico
```

### Cursos técnicos

```text
Curso técnico
├── Visão geral
├── Níveis
├── Conteúdo
├── Planejamento
├── Streak/Consistência
├── Histórico
└── Certificado
```

### Cursos rápidos
Usam a mesma base estrutural dos cursos técnicos, mas representam formações menores/mais curtas.

### Leituras & Exploração

```text
Leituras & Exploração
├── Livros
├── Filmes
├── Documentários
├── Artigos
└── Estudos livres/avulsos
```

## 5. Academia

Mega menu atual aprovado:

```text
Academia
├── Visão geral
├── Semana
├── Fichas
├── Exercícios
└── Evolução
```

## 6. Nutri

Mega menu atual aprovado:

```text
Nutri
├── Visão geral
├── Plano alimentar
└── Calculadoras
```

## 7. Progresso

Clicar em Progresso abre a página diretamente. A filtragem acontece dentro da página:

```text
Domínio:
Formação | Academia | Nutri | Sono | Exploração

Período:
Semana | Mês | Ano | Tudo (futuro)
```

`Formação` é o domínio principal. Faculdade, Cursos e Leituras são subdomínios/filtros internos, nunca novas áreas globais. Métricas adicionais aparecem somente quando derivadas de fatos reais de execução.

## 8. Hoje

A Home deve convergir dados dos outros domínios sem expor sua estrutura interna.

Blocos conceituais:

```text
AGORA
PRÓXIMO
DEPOIS
ATENÇÃO
RESUMO
```

Ação secundária: `Ver dia completo`.

## 9. Navegação interna de ensino superior

Página `Ensino Superior` mostra cards/balões de formações.

Exemplo:

```text
ADS
Tecnólogo
Em andamento
2º de 5 períodos
```

Ao clicar:

```text
[ 1º ] [ 2º ] [ 3º ] [ 4º ] [ 5º ]
          ↑ atual
```

Dentro do período atual:

```text
Visão geral | Disciplinas | Entregas | Planejamento | Calendário
```

Histórico pode ser agregado no nível da formação.

## 10. Navegação interna de cursos

Evitar accordions profundos. Preferir seletor horizontal/grade de níveis com conteúdo principal substituído no mesmo painel.

Exemplo:

```text
Níveis: 01 02 03 04 05 ... 11

Nível 02
Visão geral | Conteúdo | Atividades | Progresso
```

Todos os níveis podem estar disponíveis desde o início quando a plataforma de curso fornecer a trilha completa.

---

# 03 — Especificação de UX/UI

## 1. Objetivo de experiência

O Dayforge deve transmitir controle, não cobrança. A interface deve ser rápida, elegante, contextual e visualmente respirável.

## 2. Identidade visual a preservar

Preservar e refinar:

- tema Escuro;
- tema Claro;
- modo Solar, com mudança automática baseada no comportamento solar já existente;
- atmosfera do fundo atual;
- estética azulada/escura;
- laranja como accent principal;
- transparências, superfícies e bordas discretas;
- sensação premium e pessoal.

O experimento 3D foi descartado. O fundo 2D permanece como base visual.

Os três modos oficiais desta fase são `Claro`, `Escuro` e `Solar`. Não existe uma quarta opção `Sistema` nesta fase; seguir explicitamente o tema do sistema operacional permanece uma possibilidade futura.

## 3. O que evitar

- aparência de dashboard corporativo;
- sidebar administrativa em desktop;
- menus verticais extensos;
- cards demais na mesma tela;
- scroll infinito;
- accordions aninhados em cascata;
- gráficos decorativos;
- controles sem consequência;
- animação gratuita;
- formulários gigantes em uma única tela.

## 4. Informação progressiva

A complexidade deve aparecer sob demanda.

Exemplo Hoje:

```text
Agora → Próximo → Depois → Atenção → Resumo
```

Exemplo Formação:

```text
card da formação → período → contexto do período
```

Exemplo Curso:

```text
curso → nível selecionado → conteúdo local
```

## 5. Onboarding conversacional

Formações e planejamentos complexos devem ser configurados por uma sequência de perguntas curtas, uma por vez, em vez de formulários longos.

O visual pode lembrar um assistente, mas a lógica é determinística.

## 6. Estados de componentes

Todo elemento interativo relevante deve prever:

- default;
- hover;
- pressed;
- selected;
- open;
- disabled;
- loading;
- success;
- warning;
- error/critical quando aplicável.

## 7. Microinterações

- underline/indicador de tab pode deslizar suavemente;
- cards clicáveis devem reagir ao hover;
- botões devem dar feedback de pressão;
- mega menus entram/saem com transição curta;
- gráficos devem interpolar quando o conjunto de dados muda;
- tooltips devem aparecer em pontos de gráfico;
- animações devem comunicar estado, não enfeitar.

## 8. Gráficos

Gráfico principal deve ser vivo e contextual.

Exemplo academia:

```text
Carga
80kg ┤                    ●
75kg ┤               ●
70kg ┤          ●
65kg ┤     ●
60kg ┤ ●
     └─────────────────────
      Mai Jun Jul Ago Set
```

Ao trocar domínio ou período, linhas/pontos devem transicionar suavemente.

## 9. Mobile/PWA

Desktop usa navbar horizontal. Em telas menores, usar navegação compacta/drawer adaptado, sem reintroduzir o modelo de sidebar desktop antiga.

A UI deve ser pensada para ações rápidas no celular:

- concluir aula;
- registrar páginas;
- registrar água;
- marcar treino;
- reagendar;
- registrar estudo complementar.

## 10. Princípio de poucos cliques

Meta de UX:

- 1 clique para ações simples quando possível;
- 2 cliques para ajustar/reagendar;
- detalhes e reflexão somente quando o usuário desejar.

## 11. Botão global Adicionar

Deve evoluir de `Nova atividade` para uma ação global/contextual.

Exemplo geral:

```text
Evento
Tarefa
Estudo
Estudo avulso
Leitura
Filme
Treino
Entrega
Formação
Outro
```

Exemplo em Academia:

```text
Exercício
Ficha
Treino
```

Exemplo dentro de ADS:

```text
Disciplina
Entrega
Atividade
```

## 12. Estados visuais de prazo

Cor deve representar risco, não apenas proximidade temporal.

- neutro: prazo confortável;
- atenção: risco moderado;
- crítico: pouco progresso para o tempo restante;
- positivo/quase pronto: prazo próximo, mas progresso alto.

## 13. Linguagem

Preferir linguagem simples e humana. Evitar jargões de SaaS ou gestão corporativa.

Exemplos bons:

- `O que importa agora`;
- `Revisar semana`;
- `Continuar estudando`;
- `Dentro do ritmo`;
- `Acima do seu padrão`;
- `Quase pronto`.

## 14. Reagendamento explícito em Hoje — 2C-B

Somente ocorrências canônicas pendentes inequívocas recebem Reagendar; virtuais
não são materializados por interação. O diálogo `Reagendar [atividade]` informa:
`Altere o planejamento desta ocorrência. A execução será registrada separadamente.`
No primeiro evento, apresenta datas/horas anteriores editáveis e fuso IANA
sugerido visível, com confirmação explícita que inicia o histórico auditável.
Nos seguintes, mostra o planejamento vigente canônico sem reinterpretá-lo.

Novo início/fim são datas e horas completas; fuso IANA editável, duração UTC
resultante e motivo livre opcional. Prefill é sugestão de planejamento sem
persistência. Não há rollover de madrugada implícito nem entrada de horário
ambíguo/inexistente em DST. Destino totalmente passado e no-op são rejeitados.
Cancelar/Escape funcionam antes da escrita. Durante commit, campos e ações
ficam indisponíveis e Escape não simula cancelamento de uma transação iniciada.
Erro preserva entradas; retry inalterado preserva changedAt e intenção.

Após sucesso, Agora/Próximo/Depois/Atenção/Resumo e dia completo recalculam sem
reload. A data selecionada permanece; confirmação oferece Ver dia reagendado.
Foco retorna ao acionador conectado ou ao título de Hoje quando ele desaparece.
O dialog tem labels, foco inicial previsível, percurso nativo dos campos de data
via Tab, Enter, layout de 390 px e somente scroll vertical quando necessário.

Histórico progressivo distingue original legado (sem inventar fuso histórico),
baseline confirmada, mudanças ordenadas/motivo/instante, vigente e execução real.
Continua acessível após conclusão. Edição/exclusão/toggle legados do vínculo
auditado são bloqueados; notas/energia do registro continuam independentes.

---

# 04 — Formação, Acadêmico, Cursos e Exploração

## 1. Objetivo

Formação deve acompanhar aprendizado formal e informal ao longo de anos, preservando estrutura, progresso, histórico e evidências de conclusão.

## 2. Categorias

```text
Formação
├── Acadêmico / Ensino Superior
├── Cursos técnicos
├── Cursos rápidos
└── Leituras & Exploração
```

## 3. Ensino Superior

### 3.1 Tipos de formação

Ao criar nova formação superior, oferecer:

- Graduação;
- Pós-graduação;
- MBA;
- Mestrado;
- Doutorado;
- Outro.

Se Graduação:

- Tecnólogo;
- Bacharelado;
- Licenciatura;
- Outro.

### 3.2 Dados básicos

- nome;
- instituição;
- tipo;
- subtipo;
- data de início;
- data final prevista ou obrigatória, se houver;
- quantidade de ciclos/períodos;
- período atual;
- status.

### 3.3 Ciclo acadêmico flexível

Internamente, o conceito deve ser genérico. A UI pode chamar de:

- Período;
- Semestre;
- Trimestre;
- Ano;
- Módulo;
- Etapa;
- outro rótulo configurável.

### 3.4 Entrada no meio do curso

Se a pessoa começar o Dayforge no 2º período de um curso de 5, o sistema não exige reconstrução do 1º.

Estado sugerido:

```text
1º — concluído antes do acompanhamento
2º — cursando
3º — não iniciado
4º — não iniciado
5º — não iniciado
```

## 4. Disciplinas

Cada período pode possuir disciplinas próprias.

Campos editáveis:

- nome;
- descrição/escopo;
- professor opcional;
- datas;
- progresso;
- quantidade de módulos;
- meta de sessões;
- notas finais, quando concluída.

Nenhuma regra fixa deve presumir 4 módulos ou 4 aulas. Isso é apenas um padrão possível.

## 5. Módulos e conteúdos

Hierarquia conceitual:

```text
Formação → Período → Disciplina → Módulo → Conteúdo
```

Conteúdo pode ser:

- Aula;
- Atividade;
- Prova;
- Leitura;
- Projeto;
- Questionário;
- Outro.

Cada módulo pode possuir estrutura diferente.

## 6. Entregas acadêmicas

A camada `Entregas` deve suportar:

- atividades de módulo;
- trabalhos;
- trabalhos de extensão;
- projetos integrados multidisciplinares (PIM ou equivalente);
- provas;
- projetos;
- atividades adicionais;
- outros tipos editáveis.

Campos:

- nome;
- tipo;
- período;
- disciplina associada opcional;
- escopo;
- prazo;
- status;
- progresso manual ou calculado;
- etapas;
- próxima ação;
- observações;
- última atualização.

## 7. Progresso de entregas

Dois modos:

### Manual
Usuário informa percentual.

### Por etapas
Exemplo:

```text
Pesquisa          100%
Estrutura         100%
Implementação      70%
Testes               0%
Relatório            0%
```

O sistema calcula progresso geral de acordo com pesos simples ou configuráveis futuramente.

## 8. Notas e fechamento de período

Ao finalizar período:

- confirmar disciplinas concluídas;
- registrar notas finais quando desejado;
- verificar entregas pendentes;
- permitir observação do período;
- marcar período concluído;
- oferecer configuração do próximo período.

## 9. Cursos técnicos

Estrutura conceitual:

```text
Curso → Nível → Conteúdo → Aula/Atividade/Prova/Projeto/Questionário
```

Requisitos:

- quantidade de níveis editável;
- todos os níveis podem ser conhecidos de antemão;
- nível atual configurável;
- conteúdo de cada nível editável;
- progresso por nível e geral;
- planejamento;
- streak/consistência;
- histórico;
- certificado.

Exemplos pessoais atuais podem incluir Go, Machine Learning e outras trilhas técnicas, mas o produto não deve hardcodar provedores ou nomes específicos.

## 10. Cursos rápidos

Cursos rápidos compartilham a mesma base dos técnicos:

- níveis;
- módulos;
- aulas;
- atividades;
- questionários;
- provas;
- projetos;
- progresso;
- certificado.

A diferença é classificatória/carga/duração, não estrutural.

`Curso rápido` é uma categoria selecionada pelo usuário. Quantidade de horas, inclusive a referência histórica de aproximadamente 30 horas, não é regra universal nem critério automático do produto.

## 11. Importação de estrutura por texto

Fluxo futuro desejado:

1. usuário copia a grade de uma plataforma;
2. cola texto no Dayforge;
3. sistema tenta extrair níveis, módulos, aulas, atividades e projetos;
4. usuário revisa antes de salvar.

Primeira versão pode ser manual. Importação por print não é prioridade; texto é preferido.

## 12. Certificados

Formatos aceitos:

- PDF;
- JPG;
- JPEG;
- PNG.

Metadados:

- formação/curso associado;
- instituição/emissor;
- data de emissão;
- carga horária;
- código da credencial opcional;
- URL opcional;
- arquivo.

Ao concluir formação/curso:

```text
Registrar conclusão → carga horária → certificado → histórico
```

Certificados devem permanecer acessíveis no histórico.

Arquivos locais só entram depois que IndexedDB v2 estiver estável, o backup v2 estiver funcional, a restauração estiver testada e limites/quota tiverem comportamento definido. Até lá, o domínio pode evoluir sem persistir binários.

## 13. Leituras

Livro deve suportar:

- título;
- autor;
- páginas totais;
- página atual;
- percentual automático;
- mínimo diário;
- alvo diário;
- sessões de leitura;
- comentários do que foi aprendido;
- categoria/relação com formação.

Exemplo:

```text
143 / 304 páginas
47%
Mínimo: 5 páginas
Alvo: 10 páginas
```

## 14. Filmes e documentários

Registrar:

- título;
- data;
- duração;
- categoria;
- avaliação opcional;
- considerações;
- aprendizados;
- relação opcional com formação.

Objetivo: preservar consumo + reflexão, não reproduzir um catálogo social de cinema.

## 15. Artigos e estudos livres

Estudo livre pode registrar:

- tema;
- data;
- tempo;
- fonte;
- link opcional;
- notas;
- aprendizados;
- relação opcional com formação.

## 16. Estudo complementar

Dentro de uma aula, o usuário pode registrar compreensão:

- Sim;
- Parcialmente;
- Não.

Se parcial/não, oferecer `Complementar estudo` com:

- vídeo;
- livro;
- artigo;
- documentação;
- outro.

Registrar motivo:

- não entendi;
- aprofundamento;
- revisão;
- curiosidade;
- necessário para atividade;
- necessário para trabalho.

O material complementar mantém relação com a aula original, permitindo reconstruir a trilha de entendimento.

## 17. Estudo avulso

Pode nascer sem relação e depois ser associado a:

- disciplina;
- curso;
- tema;
- formação;
- nenhuma categoria.

Horas não devem ser duplicadas em analytics: um estudo de 50 min relacionado a Banco de Dados continua valendo 50 min no total.

---

# 05 — Motor de Planejamento, Capacidade Saudável e Consistência

## 1. Natureza do motor

O assistente de planejamento não depende de IA generativa na primeira versão.

Ele será um motor determinístico, orientado por perguntas, regras, datas e capacidade configurada. Na primeira versão local, o núcleo será implementado em TypeScript puro, isolado da UI e sem regras acopladas a componentes React.

Python não está descartado. Permanece candidato para prototipagem, simulações, análise, otimização ou futura execução server-side quando existir justificativa técnica concreta. Não deve entrar na runtime local apenas por preferência tecnológica. Go permanece a linguagem desejada para o backend principal futuro, introduzido somente quando API, autenticação, multiusuário, cloud, sincronização, armazenamento remoto ou segurança server-side o exigirem.

## 2. Perguntas do assistente

Exemplos:

- Existe prazo obrigatório?
- Quando começa?
- Quando termina?
- Quantas disciplinas?
- Quantos módulos?
- Quantas aulas por módulo?
- Quantas atividades?
- Há provas ou projetos?
- Quantas aulas prefere por sessão?
- Qual o máximo aceitável?
- Quantos dias por semana deseja estudar?
- Quais dias prefere?
- Em qual período do dia?
- Qual margem/buffer antes do prazo?
- Quais itens são obrigatórios?
- Quais podem ser reduzidos ou movidos?

## 3. Cálculo de capacidade

O motor calcula:

```text
conteúdo necessário
÷
janela temporal
÷
capacidade configurada
=
plano possível
```

Mas não deve parar em “cabe matematicamente”. Deve verificar se o plano cabe dentro do padrão sustentável do usuário.

## 4. Capacidade saudável

Cada domínio pode ter:

- frequência preferida;
- máximo habitual;
- carga preferida por sessão;
- carga máxima por sessão;
- período preferido;
- dias preferidos;
- itens flexíveis e fixos.

Exemplo Faculdade:

```text
Preferido: 3 sessões/semana
Máximo habitual: 4
Aulas/sessão: preferido 1, máximo 2
Faixa preferida: tarde, até 19h
```

Exemplo Machine Learning:

```text
Frequência: diária
Período preferido: manhã
```

Exemplo Go:

```text
Frequência: diária
Período preferido: noite
```

## 5. Regra central

> **O Dayforge deve otimizar para consistência sustentável, não para ocupar toda disponibilidade encontrada.**

## 6. Plano inviável

Se a capacidade configurada for menor que a demanda antes do deadline:

```text
PLANO INVIÁVEL
Conteúdo: 70 aulas
Capacidade: 56
Déficit: 14
```

O sistema oferece opções:

- aumentar carga em dias úteis;
- aumentar fim de semana;
- adicionar dias extras;
- reduzir objetivo;
- estender meta pessoal, quando possível;
- editar estrutura;
- priorizar itens com deadline.

## 7. Buffer

Prazos obrigatórios devem considerar margem de segurança.

Exemplo:

```text
Deadline: 30/09
Conclusão planejada: 26/09
Buffer: 27–29/09
```

Buffer pode ser configurado por percentual ou dias no futuro.

## 8. Replanejamento

A ação `Replanejar restante` deve preservar histórico e recalcular somente o que não foi concluído.

Entradas:

- data atual;
- prazo;
- conteúdo concluído;
- conteúdo restante;
- novas disponibilidades;
- bloqueios.

## 9. Bloqueios e flexibilidade

Itens podem ter:

- Fixo;
- Preferencial;
- Flexível.

Ao replanejar, fixos não movem; preferenciais tentam manter faixa; flexíveis podem ser realocados.

## 10. Acúmulo saudável

Se o número de sessões exceder o máximo habitual, o sistema sinaliza:

```text
SEMANA ACIMA DO SEU PADRÃO
5 sessões planejadas
Máximo habitual: 4
```

Ação: `Revisar semana`.

Assistente pergunta o que tem prazo e o que pode ser movido antes de propor ajuste.

## 11. Mínimo, alvo e extra

Metas diárias não devem ser sempre binárias.

Exemplo leitura:

```text
Mínimo: 5 páginas
Alvo: 10 páginas
Extra: >10 páginas
```

Resultados:

- 10+: alvo atingido;
- 5–9: continuidade mantida;
- 1–4: houve ação, mas mínimo não atingido;
- 0: dia não cumprido.

## 12. Streak diário

Ideal para comportamentos realmente diários, como determinados cursos ou leitura.

Configuração:

- critério mínimo;
- critério alvo;
- dias válidos;
- tolerância de pausa;
- maior streak histórica.

Exemplo Go:

```text
Mínimo: 1 aula
Alvo: 2 aulas
Tolerância: 2 dias
```

## 13. Consistência semanal

Para Faculdade, quando a meta é 3x/semana, usar consistência semanal em vez de forçar streak diário.

```text
Meta: 3 sessões
SEG ✓
QUA ✓
SEX ○
```

Pode existir sequência de semanas cumpridas.

## 14. Mini calendário de streak

Cada curso/formação aplicável deve poder exibir calendário compacto de consistência.

Tooltip/click mostra:

- meta do dia;
- realizado;
- status;
- observações.

## 15. Deadline x meta

Diferenciar:

- **Deadline:** não deve ser ultrapassado sem alerta crítico.
- **Meta:** data desejada e replanejável.

## 16. Estado de risco de entrega

O risco considera:

```text
dias restantes
+ progresso
+ ritmo necessário
+ última atualização
```

Não usar apenas “faltam X dias”.

A regra v1 deve ser determinística, explicável e testável. Limiares e pesos específicos precisam ser formalizados e aprovados antes da etapa de Entregas; os exemplos de aceitação não constituem sozinhos uma fórmula.

## 17. Aplicação da proposta

O assistente deve ser acionável:

```text
[ Aplicar proposta ]
[ Ajustar ]
[ Manter como está ]
```

Ele não apenas conversa; ele altera o planejamento após confirmação.

---

# 06 — Academia, Nutri e Sono

## 1. Academia

### 1.1 Plano semanal

O usuário define dias preferenciais e grupos de treino.

Exemplo:

```text
TER — Peito
QUA — Costas
QUI — Ombro
SEX — Bíceps
SÁB — Perna
```

Esses dias são preferenciais, não absolutamente rígidos.

### 1.2 Reagendamento

Se um treino matinal não acontecer, permitir:

- fazer à noite;
- mover para outro dia;
- reorganizar semana;
- não realizar.

Se o treino ocorrer depois, status = realizado com reagendamento.

### 1.3 Motivos de não realização

Quando não realizado:

- imprevisto real;
- indisposição;
- trabalho;
- compromisso;
- escolhi não fazer;
- procrastinei;
- outro.

Esses motivos alimentam histórico e análise, sem discursos moralizantes.

### 1.4 Fichas e exercícios

Ficha agrupa exercícios por treino.

Exercício deve suportar:

- nome;
- séries;
- faixa de repetições;
- carga;
- observações.

Execução por série:

```text
70 kg × 10
70 kg × 10
70 kg × 9
70 kg × 8
```

### 1.5 Métricas de academia

- frequência;
- carga;
- repetições;
- volume;
- duração;
- evolução por exercício.

## 2. Nutri

### 2.1 Posicionamento

Nutri é um módulo de organização e estimativas, não uma ferramenta de prescrição clínica.

Ordem de implementação aprovada:

1. plano e metas;
2. revisão das fórmulas e da linguagem;
3. calculadoras;
4. hidratação/acompanhamento, somente se aprovado.

Nenhuma fórmula deve ser apresentada como prescrição médica ou nutricional individual.

### 2.2 Mega menu

```text
Visão geral
Plano alimentar
Calculadoras
```

### 2.3 Calculadoras de estimativa

Apresentar explicitamente como estimativas gerais.

As fórmulas abaixo são candidatas históricas e ainda dependem da revisão específica prevista na ordem de implementação. Sua presença neste documento não autoriza implementação automática.

#### IMC

```text
peso_kg / altura_m²
```

#### Calorias

- emagrecimento rápido estimado: peso atual × 20;
- manutenção estimada: peso atual × 30;
- hipertrofia estimada: peso atual × 35.

#### Proteína

```text
peso de referência × 1,8 g
```

#### Fibras

```text
(calorias / 1000) × 14 g
```

#### Água

```text
peso atual × 35 ml
```

Exemplo 80 kg → 2.800 ml → 2,8 L.

### 2.4 Plano alimentar

Estrutura inicial:

- meta diária;
- café da manhã;
- almoço;
- lanche;
- jantar;
- outras refeições configuráveis.

Metas possíveis:

- calorias;
- proteína;
- fibras;
- água.

Não implementar automaticamente um “cardápio ideal” sem dados/escopo apropriados.

### 2.5 Hidratação

Acompanhamento futuro deve permitir ações rápidas, por exemplo `+250 ml`.

## 3. Sono

### 3.1 Papel no produto

Sono é transversal, não uma aba global nesta fase.

Aparece em:

- Planejamento → Rotina;
- Hoje;
- Progresso.

### 3.2 Dados de sono

- horário-alvo de dormir;
- horário-alvo de acordar;
- horário real de dormir;
- horário real de acordar;
- duração;
- média 7 dias;
- média mensal;
- evolução anual.

### 3.3 Exemplo

```text
Meta: 23:00 → 06:30
Dormiu: 23:42
Acordou: 06:37
Total: 6h55
Média 7 dias: 7h12
```

### 3.4 Futuro

Considerar integrações com dispositivos/serviços de saúde no futuro para reduzir entrada manual, sem tornar isso requisito da primeira versão.

---

# 07 — Progresso, Metas e Analytics

## 1. Separação conceitual

**Metas** respondem: `para onde quero ir?`  
**Progresso** responde: `o que aconteceu?`

Exemplo:

```text
Meta: Faculdade 6h/semana
Progresso: 4h42 realizadas
```

## 2. Página Progresso

Página única com seletores de domínio e período.

Domínios:

- Formação;
- Academia;
- Nutri;
- Sono;
- Exploração.

Dentro de Formação, Faculdade, Cursos e Leituras funcionam como subdomínios/filtros. Métrica é um terceiro eixo contextual e não deve fragmentar a navegação global.

Períodos:

- Semana;
- Mês;
- Ano;
- Tudo, futuramente.

## 3. Gráfico dinâmico principal

Um grande componente de gráfico muda de métrica conforme o contexto.

### Academia

Filtros:

- exercício;
- carga;
- volume;
- frequência.

### Faculdade

- horas estudadas;
- sessões;
- aulas concluídas;
- disciplinas;
- progresso de período.

### Cursos

- Go / Machine Learning / outros;
- horas;
- aulas;
- níveis;
- progresso.

### Leituras

- páginas lidas;
- tempo de leitura;
- livros concluídos.

### Filmes/documentários

- quantidade;
- horas;
- categorias.

### Nutri

- água;
- peso;
- calorias registradas;
- proteína, caso o acompanhamento seja implementado.

### Sono

- duração;
- média semanal;
- média mensal;
- horário médio de dormir/acordar.

## 4. Comparação temporal

Permitir comparações como:

- semana atual x anterior;
- mês atual x anterior;
- ano atual x anterior.

Exibir variação percentual ou absoluta quando fizer sentido.

## 5. Linha de referência futura

Gráficos de estudo podem sobrepor:

- realizado;
- ritmo necessário para meta/deadline.

## 6. Metas estruturadas

Exemplos:

```text
Academia — 4 treinos/semana
Faculdade — 3 sessões/semana
Go — 1 aula mínima, 2 alvo/dia
Livro — 5 páginas mínimas, 10 alvo/dia
Concluir livro até 30/11
```

## 7. Meta de leitura

Calcular:

- páginas restantes;
- ritmo necessário por dia;
- comparação com alvo atual.

Exemplo:

```text
Restam 161 páginas
Ritmo necessário: 2,2 páginas/dia
Seu alvo: 10 páginas/dia
Status: acima do ritmo necessário
```

## 8. Meta acadêmica

Exemplo:

```text
Meta semanal: 6h
Realizado: 4h10
Restante: 1h50
```

O planejador pode sugerir sessões disponíveis, respeitando limites saudáveis.

## 9. Insight sem excesso

Analytics devem responder perguntas concretas:

- Qual mês estudei mais?
- Em que período li mais?
- Minha frequência de academia aumentou?
- Quanto meu sono melhorou?
- Qual disciplina exigiu mais estudo complementar?

Evitar dezenas de gráficos simultâneos.

Toda visualização deve ser derivada de fatos reais de execução. Não criar gráficos decorativos, séries demonstrativas apresentadas como dados do usuário ou contagens duplicadas por relações entre conteúdos.

---

# 08 — Dados, Arquivos, Segurança, Backup e Retenção

## 1. Princípio de retenção

> **Conclusão não é exclusão.**

Fluxo padrão:

```text
ativo → concluído → histórico
```

Não:

```text
ativo → apagado
```

## 2. Arquivamento

Formações, cursos, períodos e outros domínios concluídos podem ser arquivados para reduzir ruído sem perder histórico.

## 3. Exclusão permanente

Local:

```text
Configurações → Avançado → Zona de perigo
```

Deve possuir múltiplos passos e confirmação explícita.

Fluxo recomendado:

1. explicar o que será apagado;
2. oferecer backup/arquivamento;
3. segunda confirmação;
4. exigir digitação de frase, por exemplo `EXCLUIR DAYFORGE`;
5. só então executar.

Pode haver humor leve, mas o risco precisa permanecer claro.

## 4. Backup

Backup sai da navegação principal e fica em Configurações → Dados e backup.

Na 2C-A, o backup público continua com formato 2, geração 2 e schema interno 1.
Sua extensão `executionBridge` preserva identidade, snapshots, execução e
eventual `planningAudit` da ponte lógica 2. A época local `authorityEpoch` não
é conteúdo de backup: cada restore/import/reset incrementa a época do banco
de destino atomicamente, inclusive ao recuperar conteúdo idêntico. Assim, IDs
reutilizados não legitimam comandos capturados sobre o conjunto anterior.
Uma restauração é substituição do conjunto recuperável, sem merge de execuções
ou auditorias. O conteúdo v1 preservado continua somente leitura.

Na 3A-1, `datasetRevision` também é metadata exclusiva da autoridade local e não
integra backup. Restore/import/reset avançam revisão e época do destino na mesma
transação. Um rascunho baixado para resolver conflito contém alterações locais
não confirmadas e é explicitamente separado do backup lógico; não deve ser
importado como arquivo de recuperação.

Na 3A-2, o backup público principal passa a 3 após o upgrade: inclui envelope
planner 2, registro temporal 3, completas/parciais, execução, auditoria, cadeias,
contador e fontes/procedência. Recuperação aceita 3/2/1; aplicações antigas
rejeitam o novo formato. Não há export de compatibilidade com perda de entidades.
Contadores locais, aparência e stores alheios continuam excluídos. Restore/import/
reset substituem integralmente o conjunto, com CAS/readback/rollback; import v1
não mantém procedência do conjunto anterior. D-035 detalha os limites atuais.

Deve preservar:

- dados estruturados;
- configurações;
- histórico;
- anexos/certificados quando o armazenamento local de arquivos estiver habilitado.

A persistência local v2 aprovada será IndexedDB com Dexie. Arquivos locais só podem ser habilitados depois que o IndexedDB v2 estiver estável, o backup v2 estiver funcional, a restauração estiver validada e a política de quota estiver definida. Quando habilitados, backup e restauração devem contemplar os arquivos e seus metadados.

## 5. Certificados e anexos

Arquivos aceitos inicialmente:

- PDF;
- JPG;
- JPEG;
- PNG.

No modo local, os arquivos permanecem no armazenamento local e integram a exportação e a restauração locais. Backend e object storage privado são evoluções futuras para armazenamento remoto; quando existirem, devem isolar anexos por usuário e impedir acesso cruzado.

No modo local, os formatos PDF, JPG, JPEG e PNG seguem os mesmos gates definidos para arquivos locais nesta especificação.

## 6. Evolução para cloud

Destino arquitetural:

```text
Conta
↓
API
↓
Banco central
↓
Desktop/PWA
```

## 7. Autenticação futura

Prever:

- criar conta;
- login;
- recuperação de acesso;
- alteração de senha;
- encerramento de sessões;
- exclusão de conta;
- provedores externos opcionais.

Senhas nunca em texto puro. Preferência futura: Argon2id ou mecanismo equivalente revisado no momento da implementação.

## 8. Sessões

Preferir mecanismos seguros adequados ao stack futuro, por exemplo cookies `HttpOnly`, `Secure` e `SameSite`, se a arquitetura web adotada recomendar isso.

Não fixar implementação antes da auditoria técnica.

## 9. PWA e offline

Visão futura:

- leitura e registro no celular;
- funcionamento parcial offline;
- fila local de eventos;
- sincronização ao recuperar conexão;
- política clara de conflitos.

IndexedDB com Dexie é a tecnologia aprovada para a persistência local v2. A futura fila de sincronização pode reutilizar essa base, mas outbox, conflitos e sincronização não entram antes de existir uma necessidade cloud concreta.

O payload `rotina-369:data:v1` deve permanecer intacto durante e depois da migração. A migração será validada, idempotente e testada; nunca removerá ou sobrescreverá o original. Reversibilidade significa que, antes do cutover, falha ou aborto mantém v1 como fonte principal e faz rollback integral da transação v2. Depois do cutover, v1 é somente leitura, não existe dual-write e dados exclusivos do v2 não precisam ser traduzidos de volta; recuperação depende de backup/restauração v2, sem promessa de retorno ao v1 sem perda.

Backup/restauração v2 é um contrato lógico desacoplado das tabelas Dexie. O formato separa versão pública do backup, geração da persistência e versão interna do schema; exportação recalcula fingerprints e restauração valida envelope, conteúdo, referências e procedência antes de substituir atomicamente somente o conjunto preparado. A tela de Dados e backup exporta v2 e aceita arquivos v2 e v1. Importação v1 registra origem `backup-v1`; nenhuma importação escreve em `rotina-369:data:v1`. Após uma edição do planner ativo, a procedência da versão anterior deixa de descrever o conteúdo atual e é removida do conjunto preparado; os bytes legados originais permanecem no localStorage.

No bootstrap, o marker `dayforge:persistence:v2` é escrito antes da ativação transacional da metadata. Metadata ativa e validada é autoridade mesmo se o marker estiver ausente ou inválido; nesse caso o marker é reparado quando o navegador permitir. Marker presente sem banco ativo validável bloqueia escrita e fallback ao v1, mantém apenas uma sessão em memória e mostra aviso persistente. Importação de backup ou restauração explícita do padrão pode recuperar um banco compatível; banco inacessível ou metadata inválida não é reparado silenciosamente.

Desde a Etapa 0.2, uma proteção mínima impede que defaults sejam gravados sobre um payload v1 cuja leitura falhou; importação de backup ou restauração do padrão são as recuperações explícitas disponíveis.

## 10. Multiusuário

Quando cloud/multiusuário existir:

- autorização por usuário;
- isolamento de registros;
- rate limiting;
- logs de segurança;
- proteção de uploads;
- URLs temporárias/autorizadas para anexos;
- backups;
- recuperação;
- auditoria de ações sensíveis.

## 11. Privacidade por domínio

O Dayforge pode armazenar informações pessoais de rotina, estudo, fitness, nutrição, sono, agenda e futuramente finanças. Segurança e privacidade devem ser requisitos de primeira classe antes de qualquer comercialização pública.

---

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

### Etapa 2C-B — Comando, revisão e planejamento efetivo

`persistence/execution/rescheduling.ts` produz explicitamente planningAudit e
append de RescheduleEvent mediante epoch/revisão/intenção capturados na abertura.
O comando reutiliza appendRescheduleEvent e o codec estrito, preservando item,
original, identidade e execução. IDs de eventos usam ocorrência e posição de
append. Conteúdo confirmado e changedAt distinguem retry equivalente de conflito.
Hashes são calculados fora da transação; savePlannerWithBridge compara o snapshot
e authorityEpoch antes de persistir atomicamente a ponte, com readback e rollback.

`readPlannerAuthoritySnapshot` captura payload e epoch em uma única transação
readonly e valida hashes fora dela. Epoch permanece apenas local; o export
público continua formato 2/geração 2/schema 1. UI publica planner/bridge/epoch
coerentes após comando, falha recuperável e substituição. Erro estrutural aciona
o bloqueio existente; conflitos com snapshot íntegro preservam o diálogo. Restore,
import e reset invalidam ações antigas mesmo se reutilizarem occurrenceId.

PlannerWriteQueue serializa autosave, execução, reagendamento e recuperação/
exportação, coalescendo intenções equivalentes e invalidando autosaves antigos
pela revisão React. Concluir recebe também epoch e revisão dos fatos esperados
para detectar planejamento alterado durante a confirmação. Não há fila paralela.

`app/temporal-input.ts` mantém o conversor estrito compartilhado de horários
inequívocos. `rescheduling-input.ts` exige início/fim completos e IANA, calcula
duração real e rejeita offsets sem nome. A política permissiva de leitura legada
da 2A nunca gera fatos automaticamente. O produtor 2C-B é timed; os contratos
date_only/all_day existentes continuam recuperáveis, sem nova UX produtora.
A visão horária de Hoje falha fechada se receber uma auditoria vigente não
timed; não converte data sem horário em intervalo horário artificial.

`today-context.ts` centraliza planejamento efetivo e índices efêmeros por snapshot:
vínculos físicos por data/posição e auditorias ordenadas por início/fim. Consulta
interseções via busca binária no menor conjunto candidato; não varre todos os
registros para localizar origens distantes nem materializa dias. Sem auditoria,
mantém leitura 2A. Com auditoria, usa somente o último to/baseline, sem duplicar
o horário original. Hoje/dia completo/compatibilidade mensal usam essa projeção;
o mês conta uma vez no dia de início efetivo, preservando o item físico de origem.
Virtuais mantêm IDs próprios; títulos/horários não são chaves de deduplicação.

Guards de reconciliação bloqueiam mudança de minutos, plano, identidade ou
remoção de item/registro auditado. A execução pode alterar completed/actualMinutes
somente pelo comando canônico e mantém a cadeia. UI bloqueia controles desses
itens, permitindo nota/energia e edição/reordenação inequívoca de outros itens.
Nenhuma correção terminal, motor de sobreposição, template, backend ou etapa
posterior é ativada. A descrição de ausência de produtor na 2C-A acima registra
o limite histórico daquela etapa; D-033 registra a evolução 2C-B.

### Etapa 3A-1 — Revisão persistida e conflitos de escrita

A 3A-1 protege edições do planner legado contra snapshots obsoletos. Metadata
local admite `writeFenceVersion: 1` e `datasetRevision`, inteiro seguro não
negativo. Metadata anterior sem ambos representa revisão zero; adoção validada
persiste zero idempotentemente. Campo ausente após adoção parcial, valor inválido
ou versão desconhecida falham fechados. Não mudam planner/current formato 1,
ponte lógica 2, backup público 2, geração 2, schema Dexie 1, tabelas ou marker.

O snapshot validado captura planner, ponte, authorityEpoch e datasetRevision
juntos. Autosave exige a época e revisão da base utilizada pela edição. Comandos
canônicos capturam também a revisão do conjunto ao abrir o diálogo, preservando
a revisão própria da ocorrência. CAS compara dentro da transação antes de
qualquer mutação; preparação de hashes não permite adotar uma base mais recente.

O repositório incrementa uma vez a revisão por transação com mudança líquida no
conjunto autoritativo: planner, ponte, fontes/procedência da migração ou metadata
de autoridade. Comparação do conteúdo antes/depois evita avanço em leituras,
no-op, reconciliação equivalente ou replay. Falha/overflow reverte documentos,
metadata e revisão. Restore/import/reset incrementam a época e a revisão local
do destino, inclusive para conteúdo idêntico; nenhum contador vem do backup.
Bootstrap e adoção podem avançar revisão quando realmente mudam o conjunto,
mas não incrementam a época. Reabertura íntegra é estável.

Conclusão/reagendamento novos não se rebaseiam automaticamente sobre outra
revisão. Replay comprovadamente igual ao fato persistido continua idempotente:
valida conteúdo e snapshot numa transação readonly, conserva instante/história
e verifica a época, sem exigir que a revisão original ainda seja atual.

PlannerContext conserva base validada e rascunho separadamente. Invalidação entre
abas por BroadcastChannel, foco/visibilidade e releitura periódica atualiza uma
aba sem alterações/formulários; com rascunho ou editor aberto preserva conteúdo
e apresenta conflito acessível. Mensagens não garantem consistência: CAS no banco
é a garantia. O usuário pode baixar um rascunho separado, carregar explicitamente
a versão salva com confirmação e reaplicar a alteração. Não existe merge
automático. Rascunho não é backup de recuperação; export público inclui somente
fatos persistidos. Conflito íntegro não bloqueia storage; falha de integridade
continua fail-closed. Falha isolada de escrita preserva rascunho e oferece retry.

Limites: sem migração estrutural 3A-2, novos produtores, Agenda/Metas/Rotina
canônicas, Semana, Consistência, correção terminal, cloud ou avanço automático.

### Etapa 3A-2 — Envelope lógico e registro temporal comum

`planner/current` passa a formato `dayforge/planning-state`, versão lógica 2,
payload estrito `{version:2,legacy,temporalRegistry:{documentId:"execution/bridge",version:3}}`.
`legacy` é o snapshot v1 normalizado integralmente preservado; a referência liga
o envelope ao único registro de identidade/plano/execução/história. Não existem
templates ou metas estruturadas derivados automaticamente do legado.

`execution/bridge` mantém formato `dayforge/execution-bridge` e usa versão
lógica 3 no documento e payload `{version:3,nextSequence,entries}`. Entradas:

- `legacy_partial`: os campos anteriores de vínculo, data física, posição,
  originalItem, item, execution e planningAudit opcional, sem origem/fuso/
  flexibilidade/criação inferidos. `itemIndex` localiza, não identifica.
- `canonical`: `{kind:"canonical",occurrence:ScheduleOccurrence}`, independente
  de planner.records; somente a ocorrência guarda plano, execução e história.

IDs `occ:n` são únicos na união e menores que nextSequence. O contador é
compartilhado, monotônico por linhagem; exclusões legadas não o reduzem. Vínculos
parciais ficam ordenados por data/posição; completas vêm depois, por sequência.
Referências de template ou entidade de domínio ainda inexistentes são rejeitadas,
inclusive em backup: esta unidade não inventa cadastros futuros. OriginReference
sem referência externa pode carregar kind/label explícitos. Factories e transições
puras existentes reconstruem e validam ocorrência, estados terminais, resolução,
ExecutionRecord e cadeia com IDs owner-bound e posições append-only. Schedules
timed/date_only/all_day seguem o domínio; campos extras e conteúdo não canônico
falham fechados. Comandos existentes continuam restritos aos vínculos parciais.

Backup público 3 mantém o envelope público, mas payload.planner é o envelope 2,
payload.plannerFingerprint cobre esse envelope, executionBridge é obrigatório
com registro 3 e hash próprio. provenance.contentFingerprint continua sendo o
hash semântico do legado, separado do hash do envelope; legacySources/provenance
preservam bytes/fontes/relações anteriores. exportedAt não identifica conteúdo;
epoch/revisão são exclusivamente locais e não aparecem no backup. Aparência e
dados de outros stores não fazem parte deste conjunto recuperável.

Export principal usa o formato correspondente ao snapshot instalado: após upgrade
exporta 3. A API explícita exportDayforgeBackupV2 rejeita conjunto novo, inclusive
sem completas; não oferece downgrade. Codec 2 permanece como entrada compatível.
Ponte 1/hash original é validada antes da conversão. Backup 2 sem ponte e v1
geram somente vínculos parciais, sem backfill. Versões desconhecidas bloqueiam.
Aplicações antigas rejeitam envelope/metadata/ponte/backup novos, sem fallback
ao v1 e sem promessa de downgrade ou retorno à aplicação antiga sem perda.

Upgrade captura metadata/planner/ponte/fontes numa transação consistente, valida
hashes e referências e prepara envelope/registro/fingerprints fora da transação.
CAS compara época/revisão e documentos de base dentro da transação que grava
planner, ponte e metadata, com readback. Época não muda; revisão avança uma vez.
Metadata antiga sem revisão começa em zero; adoção 3 persiste par validado e
exige-o nas leituras seguintes. Bootstrap repetido é no-op. Uma migração concorrente
somente reconhece replay se o vencedor for exatamente a transformação esperada,
na mesma época e com um incremento; não rebaseia uma operação conflitante.
Falha/overflow/quota/readback abortam tudo. Não há hash Web Crypto dentro do commit.

Restore/import/reset preparam entrada convertida antes da escrita e substituem
planner/current, execution/bridge, legacy-v1/source/* e migration/v1/* juntos.
Namespaces planner/ e execution/ desconhecidos falham fechados; registros alheios
preservados. Import v1 substitui também fontes/procedência anteriores pelo input
recuperável apresentado; não faz merge de procedência de conjuntos diferentes.
V1 local permanece intacto. Época e revisão do destino avançam atomicamente,
mesmo em conteúdo idêntico; IDs coincidentes não legitimam diálogos antigos.
Releitura compara documentos, fontes, metadata e referências; rollback integral.

`legacyPlanner` e `legacyBindings` são adapters explícitos de leitura;
autosave reconcilia parciais e retém completas sem alteração. A consulta pura
`queryTemporalSnapshot` recebe envelope/registro validados, janela UTC semiaberta,
referência e fuso de exibição. Retorna identidade/natureza/procedência/schedule,
execução/história/capacidades. Sem schedule confirmado, o legado retorna
`legacy_candidate` (inclui data anterior para madrugada); a projeção horária
existente interpreta esses candidatos em memória. Nunca confirma plano ou
materializa rotina ao navegar. `temporalPlanning` centraliza vigente para Hoje
e consulta comum. Date-only/all-day usam datas no próprio fuso, sem horas inventadas.

Hoje admite completas timed como leitura, sem novos botões de comando/edição;
categoria é desconhecida, apresentada genericamente e não atribuída às métricas
legadas. Execução sem duração conhecida não usa duração planejada como realizado.
Cancelada/não realizada continuam terminais, fora das pendências. A visão horária
continua rejeitando schedules sem horário quando intersectam o dia, em vez de
inventar um intervalo; consulta comum/backup os preservam integralmente. UI própria
de Agenda/Semana e produtores são etapas futuras. Não há novo read model persistido.

Geração 2, schema Dexie 1, tabelas metadata/plannerDocuments e marker não mudam.
Conflito com armazenamento validável não é corrupção; rascunhos/formulários e
fila única da 3A-1 permanecem. Migração interrompida não sobrescreve defaults.

### Correções pré-merge da 3A-2

`deriveMonthlyDayContext` separa schedules sem horário das entradas representáveis
na projeção mensal, retorna os IDs não representados e preserva os cálculos das
demais atividades. A UI informa a quantidade única no mês e a exclusão desses
registros dos indicadores horários; navegação/meta mensal/backup continuam
disponíveis. Não há catch genérico, intervalo inventado ou alteração do registro.
Hoje mantém sua rejeição controlada; outros erros de projeção continuam erros.

`occurrenceRevision` ignora exclusivamente o novo discriminador estrutural kind,
além das exclusões históricas de posição/estimativa. Upgrade não muda a revisão
semântica dos fatos. Replay conserva a prova integral do evento/append/época;
nova operação continua sujeita ao CAS de datasetRevision, sem rebase automático.

Intenções da representação inicial do registro 3 (`a1d379d`) podem conter kind na
revisão capturada. Somente quando o evento já existe, o replay reconstrói também
essa revisão histórica a partir dos fatos persistidos validados, sem interpretar
ou limpar a string do chamador. Exige igualdade integral da revisão reconstruída,
evento, posição e história anterior; mantém a verificação transacional do snapshot
e da época. Eventos posteriores/conclusão não invalidam um replay comprovado nem
avançam datasetRevision. Comandos novos continuam exigindo a revisão semântica
atual e CAS; o formato histórico nunca autoriza um novo append.

D-036 separa criação de leitura: parseIanaTimeZone rejeita offsets isolados;
parseStoredTimeZone é usado explicitamente por codecs de fatos recuperados e
aceita somente offsets históricos canônicos ±HH:mm, com faixa validada. Não usa
Intl para inventar equivalência geográfica; não normaliza -00:00 como um fato
canônico. StoredTimeZone distingue IANA de HistoricalUtcOffset no tipo, mantendo
o mesmo campo string serializado. Factories estritas são o padrão; reconstrução
histórica injeta o parser compatível. Backup 2/3 e upgrade conservam os valores,
inclusive em completas v3, com aviso derivado do registro validado. O formato
não prova a idade de um arquivo; aceitar offsets em recovery é escolha explícita,
nunca autorização para novos fatos com offsets. A fonte autoritativa permanece
única. Backup v1 não contém fatos de fuso para converter.

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

## 11. Produtor de eventos da Agenda — 3B-1

`persistence/execution/event-creation.ts` recebe intenção explícita com título,
flexibilidade, schedule, createdAt e fence/posição do alocador capturados. Usa
factories e codecs estritos de criação, origem event e templateId null. O snapshot
validado precede a preparação do hash; a transação exige metadata ativa, CAS de
época/revisão/base e readback. Escreve somente execution/bridge e o repositório
avança a revisão uma vez por mudança líquida. Não toca planner/current, fontes,
procedência, geração, schema ou v1. Replay exige o fato integral e a mesma época
em snapshot novamente verificado; não rebaseia uma intenção nova após conflito.

`event-input.ts` converte apenas campos confirmados de compromissos timed, com
datas completas e DST inequívoco. O comando também rejeita criação date_only/all_day;
esses tipos permanecem somente na consulta e recuperação, sem horários inventados.
`event-dialog.tsx` conserva a intenção e createdAt em retry inalterado. Contexto
serializa criação, autosave e recuperação na fila existente; publica snapshot
validado após sucesso ou erro. Editor aberto conserva sua base e seus campos em
invalidações externas, enquanto sucesso próprio publica a autoridade comprovada.

`agenda-view.tsx` consulta queryTemporalSnapshot, calcula o calendário em memória
e distingue ocorrências completas de candidatos legados sem confirmação. As
bordas civis compartilham a política de leitura DST de Hoje; a fronteira de
criação continua estrita. Consulta nunca materializa rotina nem escreve fatos.
Timed é apresentado no fuso de consulta; sem horário/dia inteiro preservam suas
datas e fuso originais. Não há edição, exclusão ou transição completa nesta unidade.

## 12. Correções pré-merge da 3B-1 — prova de intenção e fronteiras de leitura

D-038 adiciona creationIntentId opcional à entrada canonical do registro 3,
fora dos campos semânticos de ScheduleOccurrence. O comando exige o UUID v4
injetado; o codec exige formato canônico, origem event e unicidade quando presente.
O mesmo documento/fingerprint contém ocorrência e prova atomicamente. Ausência
em fatos antigos é preservada, sem migração/backfill ou novo store. Export/restore
carregam a extensão pelo codec estrito; recuperação 3/2/1 e contadores locais permanecem.
Aplicações antigas que desconhecem a extensão falham fechadas; a aplicação
corrigida continua lendo os fatos anteriores. Não há nova versão pública/schema.

isEventCreationConfirmed compara prova, occ:n, ocorrência integral e época.
Na primeira correção, verifyPlanningReplay verificava novamente o snapshot em
transação readonly. A reconciliação específica atual segue D-039 abaixo.
O adapter usa a prova autoritativa para publicar sucesso mesmo após resposta perdida,
sem nova escrita/revisão. Erros falsy continuam erros quando não existe fato próprio.
Outro token ou fato divergente conserva conflito/formulário; guards de sessão
e CAS permanecem. Provas antigas recuperadas não sobrevivem à troca de época do destino.

readCivilDayWindow calcula a próxima borda por aritmética civil, inclusive
ano 10000 como limite exclusivo de leitura. queryTemporalSnapshot compara
instantes/datas numericamente e aceita bordas ISO reais expandidas somente na
janela efêmera. Codecs de fatos/backup/referência permanecem estritos. A Agenda
usa o último dia do mês para sua borda final, sem truncamento de milissegundos
nem janeiro de 10000 como data selecionável. O teste de recuperação aguarda
o controle de importação habilitado e verifica o conjunto novamente após reload.

## 13. Reconciliação de criação sob concorrência — D-039

reconcileCanonicalEvent separa comprovação de um fato da autorização de uma
mutação. Reaproveita readBackupSnapshot e a materialização/hash compartilhados
com exportação, sem outra autoridade. Após a validação inicial, uma recaptura
readonly consistente fornece planner, registro, proveniência e fence da testemunha.
Valida fora da transação, prova UUID/fato/época exatos e verifica a época atual
antes de retornar. A revisão pode avançar; a confirmação nunca incrementa nada.
O ponto de linearização é a captura da testemunha. Alterações posteriores a essa
captura chegam pela fila de refresh; não há perseguição ilimitada de revisões.

EventCommand sempre comprova o resultado antes de publicar sucesso, mesmo que
a resposta do commit tenha se perdido. Na sessão dirty/remote, PlannerContext
permite apenas esse caminho readonly, mantendo os guards dos demais comandos.
Sem prova, a intenção obsoleta não chega ao produtor. confirmedEvent preserva
rascunhos, outros editores e bases mais recentes já observadas. Novas escritas
mantêm o CAS original e verifyPlanningReplay global permanece inalterado.

---

# 10 — Roadmap e Fluxo de Implementação

## 1. Estado

- Etapa B/B3 visual concluída e aprovada.
- Etapa 0.1 documental concluída.
- Etapa 0.2/B4 de taxonomia, baseline técnica e proteção do v1 concluída.
- Etapa 1.1 de modelo temporal e contratos do domínio concluída.
- Etapas 1.2A–1.2D implementadas; v2 é o store principal e v1 permanece somente leitura.
- Etapa 2A — Hoje contextual: concluída e integrada.
- Fundação da 2B — execução canônica: concluída e integrada.
- Etapa 2B-A — conclusão explícita e auditável: concluída e integrada.
- Etapa 2C-A — contrato/recuperação do planejamento auditado: concluída e integrada pela PR #13.
- Etapa 2C-B — reagendamento explícito e auditável em Hoje: concluída e integrada pela PR #14.
- Macroetapa 2 encerrada; os escopos, validações e gates de suas unidades permanecem registrados abaixo.
- Etapa 3 em andamento: 3A-1 e 3A-2 concluídas, auditadas e integradas à main na baseline `40ed9f425b419b4ce25b20bc2e44023ea88e5b18`. 3B-1 autorizada apenas para criação e consulta de eventos canônicos na Agenda; PR e merge possuem gates próprios.
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

Branch: `feature/v1-v2-migration`.

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

Implementada de forma isolada do bootstrap e da UI: a metadata da migração fica
em `validated`, enquanto `metadata/database.activeDocumentId` permanece `null`.
Assim, os documentos v2 preparados não se tornam autoridade nesta subetapa.

#### 1.2C — Backup e restauração v2

Branch de implementação: `feature/backup-v2`.

- implementar formato lógico v2 desacoplado das tabelas Dexie;
- separar versão do backup, geração da persistência e schema interno;
- validar envelope, dados, referências, fingerprints e procedência;
- restaurar atomicamente com rollback integral;
- aceitar backup v1 pela migração validada;
- manter a UI visível de backup v1 funcionalmente intacta enquanto v1 for a
  fonte principal.

Implementada como mecanismo interno: exportação usa snapshot lógico consistente,
restauração substitui atomicamente apenas o conjunto preparado e importação v1
reutiliza a pipeline 1.2B com provenance `backup-v1`. Database metadata continua
inativa, a UI não importa o módulo e não existe marker ou cutover.

#### 1.2D — Bootstrap e cutover para v2

Branch de implementação: `feature/persistence-v2-cutover`, após o merge da 1.2C.

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

Implementada com migração e validação antes da ativação, marker fail-safe,
metadata ativa como autoridade, gravação serializada do planner no v2 e UI de
backup v2 com importação v1 compatível. Falha de bootstrap ou escrita mantém
sessão em memória com aviso persistente; recuperação explícita pode importar
backup ou restaurar o padrão quando o banco compatível estiver acessível.
O payload v1 permanece intacto, sem dual-write. A 1.2D não incluiu mudanças da
Etapa 2.

### Etapa 2A — Hoje contextual e read model temporal

Status: concluída em 28/09/2026 e integrada; execução e reagendamento ainda não
haviam sido iniciados no fechamento desta subetapa.
Branch: `feature/today-context`, a partir do checkpoint validado da 1.2D.

Escopo: derivar em memória, com instante de referência controlável, uma visão
diária determinística com Agora, Próximo, Depois, Atenção e Resumo; integrar a
visão à página Hoje com estados de carregamento, vazio, erro e dados válidos.
O `planner/current` v2 ainda possui formato legado v1; a 2A pode projetar seus
horários locais apenas para leitura no fuso IANA do dispositivo, passado
explicitamente ao read model. Horário final igual ou anterior ao inicial
atravessa a meia-noite. Uma entrada seguinte cujo início coincide exatamente
com o fim desse intervalo segue para o próximo dia civil na ordem original da
lista; sem essa evidência, permanece no dia de origem. A data Hoje acompanha
a virada de dia quando não há seleção explícita e preserva uma data escolhida
pelo usuário. Não persistir timezone, status temporal inferido nem
`ScheduleOccurrence` a partir dessa projeção. Em transições de horário de
verão, escolher a primeira ocorrência de um horário ambíguo e avançar um
horário inexistente; intervalos não representáveis bloqueiam a projeção.
Agora usa uma ocorrência elegível cujo intervalo contém o instante; Próximo
contém no máximo uma ocorrência futura do dia; Depois contém as demais futuras
em ordem determinística. Atenção usa somente decisões já fundamentadas no
domínio: um item legado cujo intervalo terminou sem registro de conclusão é
mostrado como `Aguardando decisão`, sem inferir atraso, falha ou estado terminal.
Resumo apresenta fatos, sem pontuação ou julgamento.

Aceite: cobrir dia vazio, itens futuros e ativos, Atenção fundamentada, bordas
semiabertas, virada de dia, ordenação, determinismo e leitura sem escrita.
Preservar autoridade v2, payload v1 somente leitura, marker fail-safe, bloqueio
de persistência em falha e integridade de backup/restauração.

Fora de escopo: conclusão, execução, timer, adiamento, reagendamento, edição de
templates, histórico novo, notificações, IA, scoring, sincronização, cloud e
mudanças de schema ou geração de persistência sem necessidade demonstrada.
No fechamento da 2A, execução e reagendamento pertenciam a subdivisões futuras
ainda não iniciadas; suas entregas posteriores estão registradas abaixo.

### Etapa 2B — Execução explícita de ocorrências

Status da fundação: concluída e integrada pelas PRs #10 e #11.

Fundação: identidade canônica e persistência auditável, em
`feature/today-execution`. A fundação foi entregue separadamente da ação na UI,
implementada depois na unidade autorizada 2B-A.

- Ponte externa `execution/bridge` em `plannerDocuments`, sem alterar o formato
  de `planner/current`, o schema Dexie 1 ou a geração de persistência 2.
- Identidades `occ:<sequência>` alocadas uma vez e preservadas; o contador
  persistido não reutiliza identidades removidas. Datas, posições e snapshots
  validam o vínculo ao item diário, mas não são sua identidade.
- Registros diários existentes ganham vínculos no bootstrap ativo v2. Projeções
  virtuais de rotina não ganham fatos canônicos. Não se infere timezone,
  flexibilidade, origem temporal nem horário real do legado.
- `ExecutionRecord` do domínio permanece o único fato de execução; seu ID é
  `execution:<occurrenceId>`. A presença desse fato representa conclusão
  canônica terminal; sem ele há apenas vínculo de planejamento legado. Um
  booleano legado concluído permanece factual, sem criar execução retroativa.
- O comando interno recebe timing real e `recordedAt` explícitos, preserva o
  snapshot original e grava ponte/conclusão legada/procedência atomicamente.
  Não há estado de início. Não existe segunda tabela de histórico: snapshot
  original, vínculo e ExecutionRecord terminal compõem o histórico desta fase.
- Repetição idêntica é idempotente; execução conflitante é rejeitada. Comparação
  do snapshot dentro da transação impede perda por escrita concorrente antiga.
- Backup v2 inclui ponte e SHA-256 canônico; restore substitui a ponte no mesmo
  conjunto transacional, com validação prévia, releitura e rollback. Backup
  antigo sem ponte não contém fatos de execução; restore ativo prepara vínculos
  novos e substitui os anteriores. Importação v1 e reset são substituições
  explícitas do conjunto, nunca fontes de execuções inferidas.
- Hoje recebe a ponte validada e usa a identidade persistente dos registros
  diários, conservando ordenação, intervalos e seções derivadas da 2A.
- Edições de IDs únicos preservam o vínculo e o snapshot original. Mudanças
  ambíguas em dias com IDs repetidos bloqueiam a gravação. Um registro com
  execução não pode ser removido, reaberto ou alterado por controles legados.

Limites: a ponte é referência canônica de identidade sobre planejamento
legado, não uma conversão para `ScheduleOccurrence` completo. Essa conversão
exigiria semânticas ausentes que esta fase não inventa. Não foram adicionados
botão Concluir, início, reagendamento, timers, notificações, IA ou cloud.
Não iniciar 2C por consequência desta fundação.

#### Etapa 2B-A — Ação canônica de conclusão

Status: implementada em 07/10/2026 e integrada pela PR #12. Branch: `feature/today-completion`, a partir
de `dbe3e732ae87a035019dc5b223e3cb80f5e90a25` (PRs #10 e #11 integradas).

- Concluir está disponível apenas para ocorrência canônica pendente em Hoje.
  A única transição exposta é `planned -> completed`; não há ação de início.
- Início/fim reais completos são informados pelo usuário, sem prefill planejado.
  Fuso IANA é visível, editável e confirmado; horários ambíguos/inexistentes são
  rejeitados. Observação é opcional. Factories temporais produzem o único
  ExecutionRecord; `recordedAt` vem do instante da confirmação explícita.
- ID é `execution:<occurrenceId>`. Retry com campos inalterados reutiliza o fato,
  incluindo recordedAt; submit duplicado é bloqueado e requests equivalentes
  compartilham a operação. Fato conflitante é rejeitado.
- PlannerContext usa a mesma fila para autosave, comando e backup/recovery;
  publica state/bridge do snapshot v2 validado juntos. Revisão em memória impede
  autosave obsoleto de reabrir conclusão ou causar bloqueio por estado antigo.
- O comando existente grava conclusão, execução e procedência atomicamente.
  Na primeira execução timed deriva `actualMinutes` exatamente do intervalo UTC
  real, como compatibilidade. Não altera template nem snapshot original; eles,
  vínculo e fato terminal continuam formando o histórico auditável da etapa.
- Hoje recalcula Agora/Próximo/Depois/Atenção/Resumo sem reload; conclusão deixa
  de ser pendência e sai de Atenção. Reload e backup/restore preservam o fato.
- Erro isolado com snapshot validável mantém diálogo/inputs e permite retry.
  Falha estrutural mantém fail-closed. Toggle legado permanece bloqueado;
  edição/exclusão legada de execução terminal fica desabilitada.
- Projeções virtuais continuam sem ação ou materialização automática.
  Conclusões históricas sem execution continuam compatíveis e sem backfill.
- Backup formato 2, geração 2, Dexie schema 1 e ponte lógica 1 permanecem iguais.

Aceite comprovado: 27 testes direcionados, 199 Node, 106 persistência (incluindo
44 de foundation), 13 Hoje e 31 Edge (oito novos), além de lint, TypeScript,
build, master check e diff check. Cobertura inclui UTC/IANA/DST, instante
controlado, concorrência/autosave obsoleto, requests equivalentes, rollback,
reload, backup/restore, v1 intacto, históricos, virtuais, teclado e madrugada.

Limites: sem ScheduleOccurrence completo, backfill histórico, início, undo,
correção terminal, reagendamento ou avanço para 2C. Horários ambíguos exigem
entradas inequívocas; não há escolha de offset nesta UX mínima.

### Etapa 2C — Planejamento auditado e reagendamento

Aprovação histórica com subdivisão obrigatória e gates humanos independentes,
cumpridos nas integrações de cada unidade:

- **2C-A — Contrato e recuperação:** ponte lógica 2, `planningAudit` opcional,
  regras puras compartilhadas, upgrade 1 → 2, backup/restore compatível,
  `authorityEpoch` local e provas de integridade/rollback. Implementada na
  branch `feat/reschedule-foundation` sobre a main após PR #12 e integrada pela PR #13.
- **2C-B — Comando e experiência em Hoje:** produtor explícito, projeção do
  planejamento vigente e UX de reagendamento implementados em `feat/today-rescheduling`,
  sobre `cfaad03881956ab1d3d26cd2d86d2b98e049db3c` após merge da PR #13,
  e integrada pela PR #14.

2C-A não gera auditoria na migração, não reagenda, inicia ou corrige execução,
não cria UI nem muda templates/minutos por conta própria. A conclusão existente
continua funcional; o contrato aceita conclusão posterior a uma cadeia válida.
Backup público 2, geração 2, schema Dexie 1 e planner/current permanecem iguais.
Época local protege operações de conjuntos substituídos e não integra o backup.

Gates utilizados na 2C-A: master consistente, lint, typecheck, suíte Node incluindo build,
domínio/ponte/metadata/rollback, persistência e regressões 2A/2B/2B-A no Edge,
diff check e revisão de recuperação contra perda silenciosa. Commit/push da
branch validada seguiram a autorização permanente. Abrir PR, realizar merge e
iniciar 2C-B exigiram suas próprias autorizações, sem avanço automático.

Validação da 2C-A: 46 novos testes de contrato/recuperação, 245/245 Node
incluindo persistência e regressões, build, lint, typecheck, master e diff check.
Edge: 22/22 cenários aplicáveis sobre build de produção, sem retries automáticos,
incluindo upgrade instalado, backup antigo, auditoria recuperada, conclusão,
audit guard, Hoje, backup/cutover e layout compacto. Testes de importação e
navegação aguardam a prontidão real do bootstrap antes de interagir.

### Etapa 2C-B — Reagendamento explícito e auditável

Status: concluída e integrada pela PR #14 em 10/10/2026, com merge
`52a77de3eac6e3740204ae64a5318cb790b5e7e8`. A branch de implementação
`feat/today-rescheduling` foi excluída após a integração.

Reagendar atua somente em ocorrência canônica pendente inequívoca: confirma a
baseline temporal no primeiro evento e anexa eventos seguintes, sem mover o
item físico da origem, alterar template, concluir, falhar ou criar ocorrência.
Destino precisa terminar depois do instante explícito da decisão. Datas finais
de madrugada são explícitas; horários DST inexistentes/ambíguos são rejeitados.
Motivo livre opcional usa `TemporalReason { code: "user_note", note }`.

Hoje, dia completo e compatibilidade mensal consomem a projeção efetiva; o
histórico diferencia original legado sem fuso histórico, baseline confirmada,
eventos, vigente e execução. A conclusão continua separada e detecta mudanças
de planejamento desde a abertura do diálogo. Epoch e revisão capturados,
CAS transacional, fila única e replay do evento protegem concorrência e retry.
Guards preservam auditorias, impedem edição/exclusão/toggle/minutos e permitem
nota/energia e edição inequívoca de outros itens.

Validação em 10/10/2026: lint, typecheck, build, 297/297 testes Node (52 novos de
reagendamento), 34/34 cenários Edge sobre build estável, incluindo duas páginas
independentes, recuperação e regressões 2A/2B/2B-A/2C-A. Revisão visual desktop
e 390 px confirmou diálogo e timeline sem scroll horizontal. A primeira rodada
Edge identificou uma expectativa incorreta do teste sobre Tab nos segmentos
nativos de datetime-local; o teste passou a verificar a navegação real mantendo
o foco no diálogo, sem retries automáticos ou redução dos cenários.
Documentação gerada, diff e varredura de segredos também foram verificados.
No fechamento da implementação, commit e push da branch validada estavam
autorizados; abertura de PR e merge ainda dependiam de autorização humana
específica. Esses gates foram cumpridos com a integração pela PR #14.
Deploy e qualquer etapa posterior continuam sujeitos a autorização própria.

### Encerramento da macroetapa 2 e próxima macroetapa

2A, fundação da 2B, 2B-A, 2C-A (PR #13) e 2C-B (PR #14) estão concluídas e
integradas. A macroetapa 2 — Hoje contextual e execução/reagendamento está
formalmente encerrada. Os limites de cada entrega e seus gates históricos
permanecem válidos; este registro não amplia o escopo funcional entregue.

A próxima macroetapa prevista é a Etapa 3 — Rotina, Agenda, Semana, Metas e
consistência. Está não iniciada, sem planejamento detalhado ou subdivisão
oficial realizados neste encerramento e sem autorização de implementação.
Planejamento, subdivisão e aprovação próprios são necessários antes de iniciar
seu desenvolvimento. O motor determinístico permanece na Etapa 5 do roadmap.

### Etapa 3A-1 — Proteção contra snapshots obsoletos

Implementada em `fix/planning-write-fences` sobre
`c4d3557711e987cf0748fbc6b7c378ca7194ab72`. Integrada pela PR #16 em
12/10/2026 (horário local), merge `733bc3037e5143a1f67adfec8909268d9f736702`,
preservando os dois commits e com verify aprovado na PR e na main. Branch
removida depois de verificar ancestralidade e ausência de commits exclusivos.
O planejamento global foi realizado em conversa; a autorização daquela entrega
foi exclusiva da 3A-1.

Escopo: datasetRevision local validada, CAS transacional com authorityEpoch,
cobertura de autosave/comandos/recovery/adopção, replay idempotente, invalidação
entre abas, preservação de rascunho/formulários e resolução explícita. D-034
registra a decisão; a seção 3A-1 da arquitetura descreve o contrato.

Validação desta entrega: lint e typecheck aprovados; `npm.cmd test` executou
build de produção e 325/325 testes Node, incluindo 28 novos cenários de revisão,
duas conexões, hash em preparação, rollback/quota, versões, recuperação,
replays e rascunhos. Edge sobre build final: 42/42 cenários aplicáveis, incluindo
oito novos, regressões 2A/2B/2B-A/2C-A/2C-B, audit guard e cutover. Revisão visual
desktop/390 px, master check, diff check e varredura de segredos aprovados.

Falhas iniciais de lançamento/conexão do Edge foram de ambiente. A primeira
rodada funcional revelou um seletor que tratava Adicionar como botão em vez de
link. Na rodada ampla, a expectativa de revisão após conclusão/restore foi
atualizada; a regressão de autosave passou a exigir preservação do rascunho, e
a mensagem existente de backup inválido foi restaurada. Assertions mantêm a
cobertura integral, com retries desabilitados. Rascunhos permanecem na sessão;
download separado permite guardá-los antes do descarte explícito. Não existe
merge automático nem restauração desse rascunho como backup lógico.

Fora de escopo: 3A-2, mudanças dos formatos atuais, novos produtores, Agenda,
Metas estruturadas, Rotina canônica, Semana, Consistência e motor. A macroetapa 3
não está concluída. O encerramento da macroetapa 2 acima permanece histórico.

### Etapa 3A-2 — Modelo temporal versionado e recuperação

Branch: `feat/planning-model-recovery`, baseline
`733bc3037e5143a1f67adfec8909268d9f736702` após PR #16. Autorização explícita
para implementar e publicar somente a fundação, sem abrir PR ou realizar merge.

Entrega: envelope planner 2, registro temporal discriminado 3, backup público 3,
upgrade lógico atômico e compatibilidade 3/2/1. A geração continua 2 e o schema
Dexie 1, nas tabelas atuais. Fontes legadas, IDs, contador, fatos reais e auditoria
são preservados; não se transformam Rotina e monthlyGoals em entidades canônicas.
Consulta pura comum e consumidores existentes reconhecem o modelo. CAS da 3A-1
continua transacional; substituição incrementa autoridade do destino e remove o
conjunto anterior. D-035 e a arquitetura especificam os contratos exatos.

Implementada e validada em 12/10/2026, ainda sem PR ou integração. Lint, typecheck
e build aprovados; suíte Node atual 389/389 (64 novos); Edge 49/49 (sete novos),
com retries desabilitados. Inclui domínio/codecs, instalações antigas, migração
simultânea, autosave/comandos concorrentes, hash em preparação, quota, rollback,
metadata, round-trip 3/2/1, integridade e regressões 1.2/2A/2B/2B-A/2C-A/2C-B/3A-1.
Master/diff check, revisão de recuperação, visual desktop/390 px e varredura dos
55 arquivos alterados/novos sem segredos ou UTF-8 inválido aprovados.

A primeira rodada Edge teve 45/49: três helpers/expectativas ainda usavam formato
antigo; outra abria Concluir antes da publicação do autosave local da nota e foi
corretamente rejeitada pelo CAS. A regressão agora verifica nota persistida e
publicação antes de abrir o diálogo. Cenários de estado obsoleto continuam exigindo
rejeição e preservação do rascunho/formulário; nenhum retry automático foi usado.
Na suíte Node, um import de módulo puro precisou de fronteira type-only/ extensão
explícita para execução direta; as provas anteriores foram mantidas e adaptadas
ao envelope. Import v1 verifica agora substituição integral da procedência.

Metas, Agenda, templates/recorrências, Semana, Consistência, motor, backend e cloud
permanecem fora de escopo. Ocorrências completas são comprovadas em fixtures,
sem novo produtor ou comando público. Macroetapa 3 continua em andamento.

#### Correções pré-merge — PR #17

Sobre o HEAD auditado a1d379df489f31f0e33afa96a422f3f9cdc886d9, foram corrigidos:
projeção mensal de schedules sem horário, replay semântico após upgrade, criação
com fuso IANA estrito e fixture de backup antigo malformado. D-036 registra a
escolha humana de preservar offsets em leitura/restore históricos, inclusive
completas v3, com aviso explícito e sem inferência geográfica. Formatos, CAS,
autoridade/revisão, IDs, fontes e recuperação permanecem. Sem merge ou 3B-1.

Validação inicial dessas correções: lint/typecheck/build aprovados; Node 408/408
(19 novos), Edge de planejamento/persistência/shell 66/66 (17 novos), sem retries.
Master/diff check, varredura de segredos/UTF-8, integridade/recuperação e revisão
visual desktop/390px aprovados nas superfícies afetadas.

A execução Edge global teve 76/77: solar-review, máscara parcial em 1007px,
falhou na comparação de pixels. A mesma assertion falhou no snapshot isolado
do HEAD auditado, sem estas correções. Cenário/solar/teste não foram alterados;
não se declara o gate Edge global aprovado. A falha preexistente permanece
registrada para avaliação humana, sem retry automático nem assertion reduzida.

#### Correção restrita de replay histórico — PR #17

Replays já aplicados no registro 3 inicial podem conservar a revisão capturada
com kind. A compatibilidade reconstrói essa representação somente a partir de
fatos persistidos validados no ramo de replay; não altera revisões atuais nem
autoriza comandos novos. CAS, época, payload integral e história permanecem.

Validação local desta correção: Node 423/423 (15 novos), suíte dirigida 84/84,
Edge global 77/77 sem retries, lint/typecheck/build, master/diff check e varredura
de segredos aprovados. A reprodução isolada usa o código real de a1d379d e a
implementação corrigida, sem modificar a intenção original. O teste solar 1007px
passou nesta execução; a instabilidade preexistente permanece registrada, sem
alteração visual ou do teste. D-031 a D-036 e formatos permanecem intactos.
Correção publicada na branch da PR; integração/merge e 3B-1 aguardam aprovação.

### Etapa 3B-1 — Criação e consulta de eventos canônicos na Agenda

A integração da 3A-2 foi confirmada pelo usuário em 12/10/2026, na baseline
`40ed9f425b419b4ce25b20bc2e44023ea88e5b18`. Os registros anteriores descrevem
os gates e validações históricos antes dessa integração.

Unidade autorizada na branch `feat/agenda-canonical-events`: criação explícita de
eventos independentes e consulta em `/planejamento/agenda`, com calendário mensal,
seleção de data e fuso de consulta. O formulário confirma título, flexibilidade,
planejamento com início/fim completos e fuso IANA nomeado. O complemento obrigatório
da autorização limita a criação exclusivamente a timed. Consulta e recuperação
exibem também date_only e all_day; dia inteiro mantém fim exclusivo visível.
O instante de criação é capturado na confirmação;
planejamento nunca cria execução, categoria legada ou vínculo com template.

A intenção captura época/revisão/posição do alocador na abertura. IDs usam o
alocador monotônico compartilhado com vínculos legados. Retry inalterado conserva
os fatos e o instante; replay só reconhece o fato integral na mesma autoridade.
Intenções diferentes com título/horário iguais permanecem eventos independentes.
CAS, hash preparado fora da transação, readback e revisão única protegem a escrita.
A criação altera somente o registro temporal; planner legado e fontes permanecem.

Consulta reutiliza queryTemporalSnapshot e não grava fatos. Datas sem horário
mantêm sua semântica e fuso, inclusive fim exclusivo; itens legados parciais são
identificados como candidatos quando seu planejamento não foi confirmado.
Conflitos preservam campos e base do formulário, exigindo resolução explícita.
Em erro, o formulário permite baixar seus campos como rascunho separado, sem
semântica de backup/importação, antes de fechar e revisar os dados salvos.
Falha isolada permite retry; falha estrutural bloqueia a persistência.
O resumo mensal e o editor legado de meta permanecem acessíveis por
`Ver resumo mensal`, preservando métricas, avisos de itens sem horário e fencing.

Mantidos planner lógico 2, registro 3, backup público 3, recuperação 3/2/1,
geração 2/schema 1, fila única, v1 somente leitura e shell aprovado.
Fora de escopo: edição/exclusão/transições de eventos completos, recorrências,
templates, Rotina canônica, Semana, Metas, Consistência, motor, backend e cloud.
Commit/push seguem a autorização permanente após validação; PR, merge, deploy e
qualquer outra subetapa exigem suas próprias autorizações.

Implementação e validação local em 12/10/2026: lint/typecheck/build aprovados,
Node 452/452 (29 novos) e Agenda Edge 11/11. A primeira rodada global Edge foi
87/88 por helper que não reabria o resumo mensal após reload, corrigido sem
reduzir assertions. A rodada global final foi 87/88: somente solar-review 1007px,
`partial: center covered`, falhou. O mesmo cenário passou na primeira rodada e
na verificação isolada da baseline 40ed9f (1/1); não houve reprodução da falha nessa
tentativa. A instabilidade anterior continua registrada; não se declara causa
confirmada nem gate Edge global aprovado. Cena/assertion solar não foram alteradas.
Master/diff check, revisão de integridade, segredos/UTF-8 e visual desktop/390px
aprovados. O relatório `3B-1_IMPLEMENTATION_REPORT.md` registra as evidências e a
pendência para avaliação humana antes da integração. PR/merge seguem não autorizados.

#### Correções pré-merge — PR #18 / F1–F5

A PR #18 foi aberta mediante autorização própria no HEAD a2eea6239a03bc8d14f4a8cc29376f4f9d8933e1.
A auditoria adversarial encontrou confusão entre intenções independentes (P1),
sucesso falso com rejeição falsy, retry bloqueado após resposta perdida,
dezembro de 9999 não consultável (P2) e guard de readiness insuficiente (P3).
Seu veredito foi NÃO APTO PARA MERGE. A global dessa auditoria foi 87/88 por
recuperação; solar passou nela, mas falhou em ensaios controlados, sem causa
confirmada. O relatório ignorado outputs/audit-pr18/REPORT.md conserva as evidências.

F1–F5 foram autorizados separadamente e corrigidos sem reiniciar a unidade.
D-038 define UUID de intenção distinto de occ:n, prova opcional no mesmo registro
e confirmação autoritativa após qualquer resposta. Campos iguais não provam
intenção; fatos antigos não recebem token retroativo. Calendário usa bordas reais
de consulta no ano 10000 sem ampliar codecs históricos; recuperação aguarda
controle de importação habilitado e compara o conjunto após reload.

Validação corrigida: Node 466/466 (14 novos), recuperação Edge dirigida 1/1,
Agenda Edge 19/19 (oito novos) e global 96/96 sem retries. Build, lint/typecheck,
master/diff check, segredos/UTF-8 e revisão desktop/390px aprovados. A primeira
Agenda dirigida foi 18/19 por hook que não interceptou a resposta perdida;
foi corrigido mantendo a assertion do commit. Lint também identificou alias de
this nesse hook; corrigido sem mudar assertions, com cenário dirigido reexecutado.
Logs e capturas de cada execução ficam em outputs/. Não houve mudança solar.
O 96/96 é aprovação da execução atual, não diagnóstico da falha histórica.

Publicação limitada a novos commits na branch da PR existente. Nova auditoria,
merge/exclusão de branch e 3B-2 continuam aguardando autorização humana.

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
→ commit(s) coerentes e push automático da branch validada
→ apresentar resultados
→ aguardar autorização para abrir PR e iniciar a próxima etapa
```

Commit e push da branch de trabalho são automáticos após conclusão e validação
do escopo, conforme autorização permanente em AGENTS.md. Não fazer push direto
para main nem force-push. Abertura de cada PR, merge, deploy e avanço de etapa
exigem autorização explícita própria e respeitam o momento solicitado pelo
usuário. Silêncio não é aprovação.

## 7. Closeout obrigatório

Ao concluir qualquer etapa, apresentar resumo/comportamento, arquivos alterados, testes/resultados, riscos/pendências, documentação impactada, commits/branch e status da working tree.

## 8. Fonte de verdade

- Chat: discussão e aprovação.
- Arquivos numerados em `/docs`: contratos canônicos.
- `DAYFORGE_MASTER_SPEC.md`: compilação derivada, nunca fonte manual.
- Git: histórico de evolução.

---

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

### D-039 — Confirmação de fato distinta de autorização de escrita (estabilização 3B-1)

A2-01 revelou que confirmar o recibo de criação com um fence de revisão global
confundia a integridade do fato imutável com a disponibilidade da antiga base para
uma nova escrita. Uma mutação posterior legítima não revoga uma criação aplicada.
Os contratos e decisões D-031 a D-038 permanecem, sem novo campo ou formato.

Nova escrita continua exigindo época/revisão/alocador/base capturados, CAS, hash
fora da transação, commit e readback. verifyPlanningReplay dos comandos anteriores
permanece intacto. A criação tem reconciliação específica somente de leitura:
valida a primeira captura, recaptura uma vez todo o conjunto em uma transação
readonly e valida essa testemunha integralmente, incluindo hashes e unicidade.
O recibo exato e a ocorrência integral na mesma época comprovam o fato nessa
captura. Um guard final somente de época rejeita restore/reset durante a validação.
Não há loop que persiga revisões, rebase ou novo commit para confirmar.

A captura da testemunha é o ponto de linearização da confirmação do fato. Ela
inclui os fatos concorrentes observados até esse ponto. Mutações que se linearizem
depois dela seguem a invalidação/refresh normal; não invalidam o recibo anterior.
Substituição depois do guard final é uma operação posterior à confirmação, nunca
autorização para escrever sob a época antiga. Nenhuma leitura promete imobilizar
outras abas depois de sua transação. Falha estrutural de validação não é ocultada;
ausência/divergência de prova mantém erro recuperável e formulário.

A fila continua única. Só criação admite confirmação readonly quando dirty/remote;
nessa condição o produtor de nova escrita nem é chamado. Outros comandos conservam
os guards. Confirmar o próprio evento pode liberar seu editor limpo; outro editor,
rascunho local ou snapshot já observado mais recente não é descartado nem rebaseado.
Recibos permanecem no registro 3, sem fonte paralela ou alteração de backup/schema.

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

---

# 12 — Cenários de Aceitação de Produto

Estes cenários devem ser usados para revisar qualquer plano do Codex. Se a arquitetura proposta não consegue suportá-los, o plano está incompleto.

## Cenário 1 — Abrir o Dayforge sem sentir sobrecarga

Ao abrir Hoje, o usuário vê Agora, Próximo, Depois, Atenção e Resumo. Não vê uma lista de 20 blocos verticais por padrão.

## Cenário 2 — Reagendar academia sem “falhar”

Treino planejado para 06:30 não aconteceu. Usuário move para 20:00 e realiza. Histórico mostra realizado com reagendamento.

## Cenário 3 — Leitura mínima x alvo

Meta diária: mínimo 5, alvo 10 páginas. Usuário lê 7. Continuidade é mantida, mas alvo não é marcado como completo.

## Cenário 4 — Faculdade com ritmo saudável

Usuário configura 3 sessões preferidas, máximo 4. Um prazo exige 6 sessões. Dayforge sinaliza carga acima do padrão e abre revisão em vez de lotar o calendário silenciosamente.

## Cenário 5 — Planejar duas disciplinas

Disciplina A e B possuem módulos, aulas e atividades editáveis. Usuário informa janela temporal, aulas por dia e frequência de atividades. O motor calcula viabilidade, buffer e calendário.

## Cenário 6 — Plano inviável

Demanda excede capacidade. Sistema mostra déficit e oferece alternativas antes de aplicar qualquer agenda.

## Cenário 7 — Replanejar após atraso

Usuário perde dois dias. `Replanejar restante` mantém o que foi concluído e redistribui apenas o conteúdo pendente.

## Cenário 8 — Entrar no 2º período

Usuário cria ADS com 5 períodos e informa estar no 2º. 1º aparece como `concluído antes do acompanhamento`, sem exigir dados retroativos.

## Cenário 9 — Próximo período

Ao concluir 2º período, Dayforge preserva histórico e oferece configurar 3º sem apagar o anterior.

## Cenário 10 — Curso técnico com níveis conhecidos

Usuário cadastra curso com 11 níveis. Pode visualizar conteúdo dos níveis futuros sem precisar “desbloqueá-los” no Dayforge.

## Cenário 11 — Estudo complementar

Usuário assiste uma aula de Redes, marca `não entendi`, adiciona vídeo complementar e registra o que esclareceu. Meses depois, a trilha continua ligada à aula original.

## Cenário 12 — Estudo avulso relacionado

Usuário estuda PostgreSQL por 50 min e associa a Banco de Dados. Analytics totalizam 50 min, não 100 min.

## Cenário 13 — Certificado

Ao concluir Go, usuário anexa PDF ou imagem, registra emissor/data/carga horária e move curso para histórico. Certificado permanece acessível.

## Cenário 14 — Trabalho com risco

Entrega em 10 dias e 8% concluída, sem atualização recente: crítico. Entrega em 4 dias e 96% concluída: quase pronta, não vermelho automático.

## Cenário 15 — Academia e gráfico

Usuário registra cargas de Supino ao longo dos meses e visualiza linha de evolução com Semana/Mês/Ano.

## Cenário 16 — Progresso acadêmico

Usuário alterna Progresso entre os domínios principais Formação, Academia, Nutri, Sono e Exploração. Dentro de Formação, seleciona filtros como Faculdade, Cursos e Leituras. O gráfico muda de métrica sem recarregar toda a página.

## Cenário 17 — Livro

Livro possui páginas totais, página atual, percentual, meta mínima/alvo e diário do que foi aprendido.

## Cenário 18 — Filme/documentário

Usuário registra conteúdo assistido, duração, considerações e relação opcional com uma formação.

## Cenário 19 — Nutri calculadoras

Usuário informa dados e recebe estimativas de IMC, calorias, proteína, fibras e água com aviso claro de que são estimativas gerais.

## Cenário 20 — Sono

Usuário registra/recebe horários de dormir/acordar e visualiza duração e médias em Progresso, sem precisar de uma aba global própria.

## Cenário 21 — Exclusão protegida

Usuário tenta apagar todos os dados. Sistema oferece backup, confirma repetidamente e exige frase explícita antes de excluir.

## Cenário 22 — Futuro PWA

Usuário conclui aula pelo celular e o mesmo histórico aparece no desktop após sincronização, sem duplicar registros.

## Cenário 23 — Migração local não destrutiva

O mesmo conteúdo v1 com formatações JSON diferentes registra origens cruas distintas, mas produz uma única migração operacional. Falha em qualquer escrita v2 aborta a transação e mantém os bytes v1 intactos.

## Cenário 24 — Primeiro uso no v2

Sem IndexedDB, marker ou payload v1, o Dayforge preserva a rotina inicial atual de `createDefaultState()` e, após o cutover, persiste-a somente no v2.

## Cenário 25 — Cutover sem fallback destrutivo

Com metadata v2 ativa e marker ausente, o Dayforge usa v2 e repara o marker. Com marker ativo ou inválido e IndexedDB ausente, inacessível ou inválido, bloqueia persistência e mantém a sessão em memória sem usar o v1 preservado.

## Cenário 26 — Backup antes do cutover

O mecanismo v2 passa por round-trip e rollback. Após o cutover, a tela exporta backup v2 e aceita restauração v2 ou importação compatível de arquivos v1, sem escrever no payload legado preservado.

## Cenário 27 — Fundação de execução da 2B

Dois itens diários com ID legado igual recebem identidades persistentes
distintas, preservadas em reload e backup/restore. Execução interna recebe
timing real explícito e preserva o snapshot original. Retry e requisições
equivalentes concorrentes não duplicam execução; escrita antiga não perde
o fato terminal. Execução órfã, identidade duplicada, vínculo ambíguo e
fingerprint inválido bloqueiam gravação/restauração sem mutação parcial.
Backup antigo substitui o conjunto sem inventar execuções; rollback cobre
ponte, planner, metadata e procedência. Nenhuma UI nova de conclusão é exigida.

## Cenário 28 — Conclusão canônica explícita da 2B-A

Uma ocorrência canônica pendente em Hoje oferece Concluir. Usuário informa
início/fim reais, confirma fuso IANA e registra observação opcional. Horários
planejados não viram execução. ExecutionRecord usa ID da ocorrência e instante
explícito de confirmação; minutos legados derivam do intervalo real UTC.
Concluir atualiza state/bridge juntos e recalcula todas as seções sem reload,
inclusive retirando o item de Atenção. Reload e export/restore mantêm o fato.
Clique duplicado e requests equivalentes não duplicam execução. Autosave
obsoleto não reabre terminal; falha no meio reverte o conjunto inteiro, mantém
o formulário aberto e permite retry sem storageBlocked quando a integridade
permanece válida. Snapshot inválido continua fail-closed, sem fallback/escrita
em v1. Template e histórico original permanecem intactos. Item virtual não
recebe ação nem identidade; histórico concluído não recebe backfill. Toggle
legado e edição/exclusão de terminal canônico permanecem bloqueados. Teclado,
Escape/Cancelar, loading e foco funcionam, incluindo layout compacto.

## Cenário 29 — Recuperação do planejamento auditado da 2C-A

Instalação/backup com ponte 1 válida converte para 2 preservando contador, IDs,
snapshots e ExecutionRecords sem criar planningAudit. O hash 1 deve ser válido
antes da conversão; reabertura da ponte 2 não altera dados. Auditoria fornecida
em backup 2 válido percorre export/restore/reload integralmente. Cadeia vazia,
primeiro/múltiplos eventos e retorno ao baseline são aceitos sem apagar eventos;
duplicatas, no-op, descontinuidade, cronologia, schedules e referências inválidos
são rejeitados mesmo com hash recalculado. Execução posterior é compatível e
permite completed_rescheduled; execução anterior à história é inválida.

Backup sem ponte e import v1 preservam adoção sem fatos inventados. Epoch local
é estável em boot/autosave/conclusão e incrementa a cada restore/import/reset,
inclusive de conteúdo idêntico; nunca vem do backup. Comando com epoch antigo
é rejeitado antes da escrita. Falha em cada mutação crítica ou releitura reverte
ponte, planner, metadata e provenance. V1 permanece intacto e somente leitura.
UI existente permanece funcional no Edge, com conclusão e backup disponíveis,
sem botão/diálogo/produtor de reagendamento nem projeção do novo horário nesta
etapa. Aplicação antiga pode rejeitar a versão 2, sem downgrade ou fallback.

## Cenário 30 — Reagendamento explícito em Hoje — 2C-B

Treino de 06:30 já passou sem execução. Usuário abre Reagendar, verifica e
confirma a baseline anterior, informa 20:00–21:00 na data/fuso completos e
confirma. Um evento é anexado; occ:sequência, original, template e item físico
de origem permanecem intactos. Nenhuma execução/falha/not_completed é criada.
Hoje troca Atenção pelo planejamento vigente, sem duplicação e sem reload.
Concluir depois exige horários reais, conserva histórico, deriva
completed_rescheduled e actualMinutes pelo intervalo real. Reload e
export/restore mantêm vigente e história idênticos no backup 2/geração 2/schema 1.

Mesmo dia, amanhã, meses adiante, origem antiga para Hoje, madrugada com data
final explícita, múltiplos eventos e volta ao baseline futuro são cobertos.
Virtuais coexistem como entidades distintas e não recebem botão nem identidade.
No-op, fim inválido, DST inexistente/ambíguo, offset sem IANA e destino terminado
antes/na decisão são rejeitados sem escrita. Duração pode mudar; sobreposições
não alteram automaticamente outras atividades.

Duplo submit/intenção equivalente, retry após rollback/publicação React falha,
requests conflitantes, duas conexões e autosave antigo preservam a cadeia. Uma
conclusão iniciada antes de outro planejamento é rejeitada. Restore/import/reset
durante diálogo invalidam epoch e atualizam snapshot; ação antiga nunca se liga
silenciosamente a um ID reutilizado. Erro de integridade bloqueia sem fallback.

Editar horário/minutos/identidade, excluir item/registro e toggle legado são
bloqueados na UI e persistência. Nota/energia e reordenação inequívoca de outros
itens continuam válidas; ambiguidades falham fechadas. Histórico fica disponível
após conclusão. Dialog cobre confirmação inicial, inputs preservados, loading,
Tab pelos segmentos nativos, Enter, Escape/Cancelar, foco restaurado e 390 px
sem scroll horizontal; fechamento é impedido durante escrita.

## Cenário 31 — Escritas protegidas por revisão persistida — 3A-1

Duas abas partem da mesma época/revisão. A edita Rotina e salva; B edita meta
mensal sobre a base antiga. CAS rejeita B antes de alterar documentos. A permanece
persistida; B conserva rascunho, recebe conflito acessível e mantém armazenamento
íntegro. Após baixar o rascunho, carregar explicitamente a versão salva e reaplicar
sua meta, ambas as alterações sobrevivem a reload. Não há merge automático.

Notas, energia e itens diários usam o mesmo fence. Conclusão e reagendamento
incrementam revisão atomicamente e impedem autosave antigo de descartar fatos.
Replay exato preserva identidade, execução, histórico e instante sem incrementar
novamente. Comando aberto antes de outra mutação rejeita estado obsoleto,
preservando campos. Restore com editor aberto invalida época/revisão sem apagar
o formulário. Aba limpa atualiza a partir de snapshot validado; mensagens não
substituem CAS. Hash em preparação, quota, rollback, overflow, metadata inválida,
backup antigo, reabertura e v1 somente leitura possuem provas próprias.

Mensagem, resolução por teclado, foco e 390 px são verificadas no Edge, sem
retries automáticos. Conflito é recuperável; corrupção mantém fail-closed.

## Cenário 32 — Fundação temporal versionada e recuperação — 3A-2

Instalação antiga com planner 1 e ponte 1/2 válida migra atomicamente para
envelope 2 e registro 3, mantendo legado, IDs/contador, execução, auditoria e
eventos. Não atribui origem, fuso, flexibilidade, criação ou execução ausentes.
Reabertura/no-op não avançam revisão; upgrade avança uma vez sem mudar época.
Completas e parciais coexistem em fixtures e usam identidade compartilhada;
autosave mantém completas e nunca duplica execução/história.

Backup 3 round-trip integral; 2 com ponte 2/1 (hash antigo primeiro), 2 sem ponte
e v1 são convertidos sem inferências. Restore de conjunto com completas remove
entidades antigas e troca época/revisão do destino, invalidando formulários mesmo
com IDs iguais. Fontes/ref/hashes/campos desconhecidos inválidos falham antes da
mutação. Falha em cada escrita/readback/quota aborta tudo e permite retry explícito.
Namespaces autoritativos desconhecidos não escapam do recovery; alheios preservados.

Duas conexões/abas migrando convergem uma vez. Autosave, conclusão, reagendamento
e restore concorrentes não são sobrescritos por migração antiga. CAS permanece
no banco. Consultas e Hoje não materializam virtuais, inferem execução nem inventam
horas em date_only/all_day. UI mantém shell, teclado/foco e layout 390px.
Sem novos produtores funcionais, PR/merge automático ou avanço para 3B-1.

## Cenário 33 — Correções da auditoria pré-merge da 3A-2

Backup 3 válido com date_only, all_day, timed e mistura conserva todas as entradas
após import/navegação mensal/reload/export, desktop e 390px. Ocorrências sem horário
são declaradas fora da projeção/indicadores horários; cálculos válidos e edição da
meta mensal permanecem. Erros inesperados/integridade não são ocultados.

Replay original da ponte 2 funciona antes/depois do upgrade e após eventos
posteriores, sem duplicação ou incremento da revisão. Divergência de conteúdo,
época substituída e novo comando com dataset obsoleto continuam rejeitados.

Intenção capturada/aplicada no registro 3 inicial (`a1d379d`), com kind na revisão,
é repetida sem alterar essa string na implementação corrigida. O conjunto físico,
IDs, história, época e revisão permanecem idênticos, inclusive após eventos
posteriores, conclusão e reabertura. Payload, horário, motivo, posição, baseline,
revisão forjada e autoridade substituída são rejeitados sem mutação. Revisão antiga
nunca autoriza novo append, mesmo com a revisão de dataset atual; intenção nova
realmente obsoleta continua rejeitada pelo CAS. A suíte fixa explicitamente o
algoritmo histórico independente do helper atual, além da reprodução isolada
entre as implementações reais.

Novos schedules/execuções/ocorrências rejeitam +03:00/-03:00 e zona inexistente;
UTC e America/Sao_Paulo são aceitos em Node/Edge. Leitura/restore de fatos históricos
com offsets, em backups 2/3 e instalações antigas, conserva valores e divulga a
limitação conforme D-036. Não infere localização nem reescreve histórico.

O teste de backup antigo malformado usa envelope 2 válido, exige o erro de vínculo
esperado e compara o banco integralmente antes/depois da falha e da reabertura.

## 3B-1 — Eventos canônicos na Agenda

- Criar compromisso timed independente com título, flexibilidade e fuso IANA confirmados
  produz uma ocorrência planned, sem execução, resolução, template ou categoria
  inferida; original/current e createdAt/updatedAt coincidem na criação.
- Timed cruza meia-noite com datas completas e consulta em ambos os dias.
  Recuperação de fixtures date_only/all_day comprova consulta sem horário inventado
  e fim exclusivo. Comando/formulário não criam esses dois tipos nesta unidade.
- Consulta de meses/datas futuros é determinística e não altera o banco.
  Candidatos legados são explícitos, sem conversão em fatos novos.
- Alocador é compartilhado com novos vínculos legados; IDs não colidem nem são
  deduplicados por título/horário. Nova intenção idêntica recebe identidade própria.
- Retry inalterado conserva o instante; concorrência equivalente aplica uma vez.
  Outra intenção, autosave ou substituição vencedora rejeita a base antiga.
- Erro de quota/readback reverte integralmente; formulário permanece e retry é
  explícito. Conflito entre abas conserva campos/fence e exige revisão dos dados
  salvos. Falha estrutural bloqueia criação e mantém recuperação disponível.
- Reload e backup 3 preservam o evento. Restore/import/reset substituem todo o
  conjunto com época local nova; recuperação 3/2/1 e v1 somente leitura permanecem.
- Rota direta, teclado/Escape/foco e layout a 390px permanecem acessíveis.
  Sem PR/merge automático, novas transições ou avanço para outra subetapa.

## Correções pré-merge da 3B-1 — F1–F5

- Dois formulários independentes sobre a mesma base, com campos/createdAt iguais
  e uma operação suspensa no hash, possuem provas distintas. Apenas a vencedora
  recebe sucesso; a perdedora conserva todos os campos e conflito recuperável.
  Após carregar explicitamente a base e confirmar outra criação, duas identidades
  sobrevivem a reload e backup. Duplo clique/retry da mesma prova aplica uma vez.
- Replay próprio após eventos posteriores é read-only. Prova divergente/reutilizada,
  payload divergente, época substituída ou fato antigo sem prova não legitimam replay.
  Backups anteriores continuam recuperáveis sem backfill de identidades técnicas.
- Rejeições undefined/null/false/0/string vazia antes do commit conservam campos,
  banco e erro, sem sucesso falso; retry conserva prova e instante. Resposta perdida
  após commit real é reconciliada somente pela prova/fato próprios na autoridade
  validada, sem nova revisão ou conflito remoto falso. Outra intenção não é confirmada.
- Novembro/dezembro de 9999 continuam navegáveis e consultáveis; dia 31 conserva
  intervalo semiaberto e fim exclusivo real. A borda de leitura no ano 10000 não
  altera os codecs históricos nem torna essa data selecionável. Navegação inválida
  informa o limite mantendo o mês válido visível.
- Recuperação estrutural aguarda seleção de arquivo habilitada, verifica sucesso,
  metadata/conjunto após reload e v1 intacto. Não usa sleeps/retries nem reduz
  assertions; importação não realizada continua causando falha do cenário.

## Estabilização da confirmação da 3B-1 — A2-01/A2-02

- C1–C7: commit normal ou resposta perdida, com outra criação/autosave/conclusão
  antes da releitura, entre captura/verificação ou durante a reconciliação,
  confirma somente o recibo próprio. Uma revisão por mutação, nenhuma por replay.
  A testemunha inclui os fatos observados; mudanças posteriores chegam via refresh.
- C8: restore/reset durante validação invalidam a época anterior, mesmo preservando
  fisicamente o mesmo recibo. Campos/erro permanecem e não há sucesso falso.
- C9/C10: outra intenção idêntica, prova ausente/divergente, fato adulterado,
  hash inválido ou UUID duplicado não produzem sucesso nem nova escrita.
- C11/C12: replay depois de outros eventos e sessão já remota alcançam confirmação
  readonly; sem prova própria os guards impedem criação nova. Rascunhos e outros
  editores permanecem, sem merge automático. Reabertura valida o conjunto físico.
- O teste de reagendamento aguarda a nota no banco e a publicação do autosave
  antes de capturar o diálogo. Mantém rejeição de fences obsoletos, história,
  notas, CAS e recuperação; sem sleep/retry ou mudança no comportamento do produto.

---

# 13 — Modelo Conceitual de Domínio

> Este arquivo descreve conceitos, não tabelas definitivas. O Codex deve propor o modelo técnico depois de auditar o repositório.

## 1. Núcleo temporal

### RoutineTemplate
Molde recorrente semanal. Define padrões futuros sem reescrever histórico.

### ScheduleOccurrence
Ocorrência concreta e independente no calendário. Pode nascer de um template
ou de outro domínio e divergir da origem sem alterar outras ocorrências.

### ExecutionRecord
Fato do que realmente aconteceu. Preserva execução com intervalo exato ou
somente data quando o horário real não é conhecido, sem substituir o
planejamento da ocorrência.

### RescheduleEvent
Alteração append-only entre o planejamento anterior e o novo. A cadeia completa
é preservada e o planejamento original nunca é sobrescrito.

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
- not_completed;
- cancelled.

`skipped` não é sinônimo nem estado v1. Uma ocorrência deve preservar, conforme aplicável:

- data/horário originalmente planejados;
- cadeia de reagendamentos;
- data/horário efetivamente realizados;
- origem da ocorrência, como rotina, agenda, domínio ou criação avulsa;
- motivo de não realização, cancelamento ou reagendamento.

Tolerância a dias não realizados pertence a `ConsistencyRule`, não ao estado da ocorrência.

Flexibilidade:

- fixed;
- preferred;
- flexible;

Oportunidade não é uma quarta flexibilidade. Ela é representada separadamente
por `AvailabilityWindow` ou por futuros contextos de disponibilidade. A Etapa
1.1 não identifica oportunidades nem preenche a agenda automaticamente.

Os estados `completed`, `completed_rescheduled`, `not_completed` e `cancelled`
são terminais na Etapa 1.1. `completed_rescheduled` é sempre derivado ao
concluir uma ocorrência que já possui histórico de reagendamento; consumidores
não escolhem esse estado diretamente.

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

Na 2C-A, a ponte parcial do legado admite `planningAudit` sem fabricar
ScheduleOccurrence completo. `baselineItem` ancora o snapshot da confirmação;
`baselineSchedule` e `confirmedAt` registram fatos temporais explícitos;
`rescheduleHistory` é append-only. Planejamento vigente deriva do último `to`,
ou do baseline na cadeia vazia. Regras compartilhadas com ScheduleOccurrence
validam continuidade, IDs, cronologia e no-op; retornar ao baseline mantém
histórico e uma conclusão posterior deriva completed_rescheduled. ExecutionRecord
continua separado e é o único fato de execução. Upgrade/rotina/projeção de Hoje
não constituem confirmação canônica. O futuro comando produtor é gate da 2C-B.

Esse gate foi autorizado e implementado na 2C-B: o comando parcial recebe os
fatos confirmados sem fabricar uma ocorrência completa. Primeiro append cria a
baseline explicitamente; os seguintes usam o último to. Não há execução, falha,
not_completed ou modificação do template ao reagendar. A intenção é identificada
pela posição de append e payload confirmado, com epoch e revisão dos fatos para
detectar conjuntos substituídos e planejamento obsoleto. O destino timed deve
terminar depois de changedAt. Motivo livre opcional adapta-se a TemporalReason
com código user_note; não há julgamento, taxonomia extensa ou motivo obrigatório.
O produtor valida entrada temporal estrita; a leitura legada permissiva não cria
fatos. Planejamento físico de origem, baseline confirmada, vigente e execução
continuam camadas distintas, conforme D-033.

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

## 12. Registro comum recuperável — 3A-2

O envelope planner 2 preserva o snapshot legado e referencia execution/bridge 3.
Entradas legacy_partial conservam vínculo/execução/auditoria sem reivindicar todos
os campos de ScheduleOccurrence. Entradas canonical contêm ScheduleOccurrence
completo validado, independente dos records. A união tem ID único occ:n e contador
compartilhado; o próprio registro é fonte única de plano, execução e cadeia.
Templates e entidades de outros módulos ainda não são persistidos; referências
externas sem entidade recuperável falham fechadas. Não se converte rotina ou
monthlyGoals automaticamente. D-035 e documento 09 definem o contrato técnico.

---

# 14 — Estado Atual → Estado Alvo

Estado pós-merge da PR #14: 2A, fundação da 2B, 2B-A, 2C-A (PR #13) e 2C-B
(PR #14) concluídas e integradas; macroetapa 2 encerrada. A próxima macroetapa
prevista é a Etapa 3 — Rotina, Agenda, Semana, Metas e consistência, não iniciada
e sem autorização de implementação; planejamento, subdivisão e aprovação
próprios permanecem necessários.

## 1. App Shell

### Atual pós-0.2
- navbar horizontal;
- mega menus;
- temas Claro, Escuro e Solar;
- fundo 2D;
- botão Adicionar;
- Perfil/Configuração no topo.
- Cursos rápidos presentes na taxonomia de Formação;
- `Rotina` como nome visual do molde semanal;
- baseline com CI, typecheck e proteção não destrutiva do payload v1.

### Alvo
Manter a fundação visual e a baseline concluída na Etapa 0.2/B4 sem alterar a direção visual aprovada.

## 2. Hoje

### Atual
- contexto somente de leitura com Agora, Próximo, Depois, Atenção e Resumo,
  projetado em memória do planner v2 com referência temporal controlável;
- linha do tempo, controles de execução legados, energia e nota do dia
  acessíveis na visão secundária `Ver dia completo`;
- nenhuma ocorrência temporal completa é persistida pela visão contextual;
- a fundação da 2B fornece identidades persistentes aos registros diários por
  uma ponte externa; rotina virtual continua sendo projeção. Execução interna
  auditável e recuperação estão disponíveis. A 2B-A oferece Concluir para
  ocorrências canônicas pendentes com timing real explícito; toggle legado
  permanece bloqueado. A 2C-A recupera auditoria de planejamento na ponte 2.
  A 2C-B produz reagendamento explícito, projeta intervalo vigente em Hoje/dia
  completo e preserva item físico/original/identidade. Diálogos capturam epoch e
  revisão, histórico continua disponível após execução e controles legados do
  vínculo auditado não podem apagá-lo. Virtuais continuam sem ação/identidade.

### Alvo
Manter a experiência principal contextual:

```text
Agora
Próximo
Depois
Atenção
Resumo
```

Timeline completa permanece acessível sob demanda. Conclusão canônica
e reagendamento explícito já estão implementados e integrados; início e correção terminal permanecem gated.

`Energia do dia` sai da experiência principal. `Foco AI/LLM` deixa de ser métrica fixa. Progresso deixa de ser um número genérico sem contexto.

`Nota do dia` pode sobreviver apenas se for transformada em reflexão opcional e útil ao histórico, nunca como obrigação diária.

## 3. Planejamento

### Atual
- Semana;
- Agenda;
- Rotina;
- Metas.

### Alvo
- Semana;
- Agenda funcional;
- Rotina com Âncoras/Não negociáveis/Flexíveis;
- Metas estruturadas.

## 4. Agenda

### Atual
3B-1 implementa calendário mensal navegável, consulta por data e criação explícita
de compromissos canônicos independentes exclusivamente timed. Consulta exibe também
date_only/all_day recuperados, sem criar horários. Fuso e flexibilidade
são confirmados; persistência e recuperação usam a fundação integrada da 3A-2.
Edição/exclusão, novas transições, recorrências, visão semanal e resolução de
conflitos temporais permanecem fora desta unidade.

### Alvo
Calendário navegável com dia/semana/mês, criação de eventos futuros, conflitos, seleção de data e itens de diferentes domínios.

## 5. Formação

### Atual pós-0.2
- Visão geral;
- Acadêmico;
- Cursos técnicos;
- Cursos rápidos;
- Leituras & Exploração.

### Alvo
Implementar páginas profundas sem inflar o mega menu.

## 6. Academia

### Atual pós-B3
Arquitetura de navegação pronta: Visão geral, Semana, Fichas, Exercícios, Evolução.

### Alvo
Implementar domínio real de treinos, execução e histórico.

## 7. Nutri

### Atual pós-B3
Arquitetura de navegação pronta: Visão geral, Plano alimentar, Calculadoras.

### Alvo
Implementar estimativas, plano e depois acompanhamento, sempre com linguagem de estimativa e não prescrição.

## 8. Progresso

### Atual
Página/placeholder ou métricas antigas pouco dinâmicas.

### Alvo
Componente principal de analytics com filtros de domínio, métrica e período, animações funcionais e comparação temporal.

## 9. Perfil e backup

### Atual antigo
Painel sobreposto e funções técnicas na navegação.

### Alvo
Perfil simples. Backup em Configurações → Dados e backup. Zona de perigo separada.

## 10. Trabalho/profissional

### Atual
Blocos de trabalho fazem parte da rotina.

### Alvo
Trabalho permanece principalmente como Âncora/Rotina e fonte de janelas oportunísticas. O produto deve suportar entrada/saída, almoço, deslocamento e janelas em que estudo pode acontecer se o trabalho permitir.

Não existe decisão atual de criar uma aba `Profissional` separada.

## 11. Elementos de status visual

Existe a ideia de um **estado visual do Dayforge** (por exemplo, expressão/ícone que reflita consistência). Caso implementado:

- não reage a qualquer tarefa perdida;
- considera apenas metas/itens marcados como relevantes;
- não deve punir visualmente imprevistos reais;
- pode representar tendência de consistência geral;
- deve ser opcional e não infantilizar a experiência.

A definição visual exata permanece pendente de UX.

## 12. Persistência local

### Atual

- `rotina-369:data:v1` permanece em `localStorage`, intacto e somente leitura;
- falha de leitura ou validação bloqueia o cutover, preserva os dados existentes
  e mantém uma sessão temporária em memória com aviso persistente;
- fundação 1.2A isolada em `persistence/`, com Dexie schema interno 1,
  `metadata`, `plannerDocuments`, codecs e repositórios transacionais;
- migração 1.2B isolada em `persistence/legacy` e `persistence/migration`, com
  snapshot v1 tipado, fingerprints raw/content, idempotência e rollback;
- backup/restauração 1.2C isolado em `persistence/backup`, com contrato lógico,
  export consistente, validação de provenance/fingerprints, importação v1 pela
  migração existente e restauração atômica com rollback integral;
- bootstrap 1.2D valida o estado preparado, escreve o marker fail-safe e ativa
  `planner/current`; metadata ativa no IndexedDB é a autoridade do planner;
- gravações contínuas usam apenas v2, e o marker ausente ou inválido é reparado
  quando a metadata ativa for válida e o navegador permitir;
- a UI exporta backup v2, restaura v2 e aceita importação de backup v1;
  restaurar o padrão substitui somente dados ativos v2.

### Alvo

- Domínios temporais ganham persistência apenas quando fluxos reais os produzirem
  e consumirem; arquivos locais, PWA e sincronização permanecem em etapas futuras.

## 13. Núcleo temporal

### Atual pós-1.1

- `domain/temporal/` independente de React, browser e persistência;
- IDs opacos e instantes fornecidos pelos chamadores;
- datas civis, horários locais, timezone IANA, instantes UTC e durações
  validados explicitamente;
- templates semanais separados de ocorrências e execuções;
- planejamento original, planejamento atual e reagendamentos append-only;
- cinco estados temporais, com conclusão reagendada derivada e estados finais
  terminais;
- disponibilidade, indisponibilidade, ocupação e âncoras apenas como contratos
  mínimos, sem motor de agenda.

### Próxima evolução autorizável

A Etapa 1.2D encerrou a migração da persistência do planner legado. A 2A
introduziu somente o contexto de leitura de Hoje, sem persistir entidades
temporais canônicas. A fundação da 2B adota uma ponte de identidade e execução
sem converter o planner legado; backup/restore cobre todo o conjunto e rejeita
vínculos ambíguos. A 2B-A implementa Concluir na UI para ocorrências canônicas
pendentes, com timing real e fuso confirmados, recordedAt explícito e operação
serializada com autosave. Histórico legado e itens virtuais não recebem fatos
inventados; planner/current mantém seu formato. A 2C-A adiciona contrato e
recuperação de planningAudit, upgrade lógico 1 → 2 e época local de autoridade
sem inferências. A 2C-B implementa produtor/UX com intenção estável, CAS/epoch,
fila única, projeção efetiva indexada em memória e recuperação sem novo formato.
Aplicações 2C-A preservam a auditoria mas ainda mostram horário legado; use 2C-B
para operar intervalos reagendados. Correção terminal e novos produtores
temporais continuam sujeitos a autorização própria; nenhuma etapa posterior foi
iniciada. A 2C-A foi integrada pela PR #13 e a 2C-B pela PR #14, encerrando a
macroetapa 2. A próxima macroetapa prevista é a Etapa 3, com planejamento,
subdivisão e aprovação próprios ainda necessários.

## 14. Escritas concorrentes — 3A-1

A 3A-1 foi integrada pela PR #16, merge 733bc3037e5143a1f67adfec8909268d9f736702. Corrige
perda silenciosa de edições comuns entre abas com datasetRevision na metadata,
CAS conjunto com authorityEpoch e revisão capturada na UI. Rascunhos/formulários
sobrevivem a invalidações; resolução é explícita. Comandos e recuperação
participam da revisão; replay equivalente não duplica fatos. Formatos e tabelas
atuais permanecem. A 3A-2 e novos módulos não foram implementados.

## 15. Fundação temporal — 3A-2

Implementada e validada na branch feat/planning-model-recovery, ainda não integrada:
planner/current envelope 2, execution/bridge 3 discriminada, backup público 3,
upgrade atômico com CAS e recuperação 3/2/1. Geração 2/schema 1/tabelas e v1 somente
leitura permanecem. Complete occurrences são suportadas por fixtures e consultas;
Hoje admite leitura timed, sem comandos completos ou categoria inferida.
Sem produtores de Agenda/Rotina/Metas, Semana, Consistência ou motor. A macroetapa 3
não está concluída. Descrições anteriores de formatos/escopo são históricas.

---

# 15 — Visão Futura: PWA, Cloud e Produto Comercial

## 1. Visão

O Dayforge deve começar resolvendo profundamente o uso pessoal, mas sua arquitetura pode evoluir para produto vendável e multiusuário.

Posicionamento futuro:

> sistema operacional pessoal para moldar o dia e acompanhar evolução em rotina, formação, saúde, fitness e outros domínios.

## 2. Desktop + PWA

Objetivo futuro:

- visual rico em desktop;
- PWA no celular;
- mesma conta;
- mesmos dados;
- ações rápidas em qualquer lugar.

Exemplos mobile:

- concluir aula;
- registrar 10 páginas;
- adicionar água;
- registrar série do treino;
- reagendar compromisso;
- anexar observação;
- consultar próxima tarefa.

## 3. Cloud

Evolução desejada:

```text
Desktop/PWA
↓
API Dayforge
↓
Banco + arquivos privados
```

## 4. Multiusuário

Antes de comercializar:

- autenticação;
- autorização;
- isolamento de dados;
- segurança de uploads;
- backup/recuperação;
- observabilidade;
- política de privacidade;
- termos e tratamento adequado de dados pessoais.

## 5. Offline

PWA deve poder evoluir para modo offline parcial:

- registrar ação localmente;
- sincronizar depois;
- evitar duplicidade;
- resolver conflitos de maneira previsível.

## 6. Produto comercial

Não definir preço/plano antes de validar uso real.

Hipóteses futuras, não requisitos atuais:

- Free;
- Pro;
- Student ou outro posicionamento.

O produto deve primeiro provar:

- recorrência de uso;
- onboarding compreensível;
- valor do planner;
- baixo atrito;
- utilidade dos analytics;
- capacidade de retenção.

## 7. Maior risco de produto

O Dayforge pode oferecer muitas possibilidades e se tornar cansativo. A UX precisa esconder complexidade com onboarding progressivo e defaults editáveis.

## 8. Expansão futura

Finanças é um domínio futuro previsto, potencialmente com:

- receitas;
- despesas;
- orçamento;
- metas;
- evolução.

Não entra na implementação atual.

---

# 16 — Cenário de Referência Pessoal (não é default do produto)

> Este arquivo existe para testes, protótipos e exemplos. Nenhum valor abaixo deve ser hardcoded como regra universal.

## Leitura

- frequência: diária;
- momento preferido: manhã/chegada ao trabalho;
- mínimo aceitável: 5 páginas;
- alvo: 10 páginas;
- registrar o que foi aprendido.

## Faculdade

- preferência: aproximadamente 3 sessões por semana;
- máximo habitual: 4;
- preferência por carga leve e factível;
- 1 aula por sessão pode ser suficiente; 2 quando necessário;
- preferência por estudar até o início da noite/antes de ~19h;
- conteúdo complementar pode ser buscado quando a aula formal não bastar.

## Cursos técnicos/pessoais

### Machine Learning
- desejado: estudo diário;
- preferência: manhã ou janelas oportunísticas.

### Go
- desejado: estudo diário;
- preferência: noite;
- meta pode ser expressa em quantidade de aulas ou tempo.

## Trabalho

- possui horários de entrada/saída e refeições como âncoras;
- pode existir estudo oportunístico quando houver janela durante o expediente;
- janela oportunística não deve ser tratada como compromisso rígido.

## Estudo avulso

- pode surgir por curiosidade ou necessidade;
- deve permitir descrição livre;
- pode ser ligado a Banco de Dados, Redes, Go, Machine Learning, outro tema ou nenhuma formação;
- se complementar aula não compreendida, deve preservar a trilha até a resolução.

## Academia

Exemplo de divisão possível:

```text
Terça — Peito
Quarta — Costas
Quinta — Ombro
Sexta — Bíceps
Sábado — Perna
```

Dias e quantidade semanal são editáveis e podem mudar com a rotina.

## Formação acadêmica

Exemplo de ADS:

- 5 períodos;
- acompanhamento iniciado no 2º período;
- 1º período marcado como concluído antes do Dayforge;
- disciplinas do período podem ter módulos, aulas e atividades em quantidades variáveis;
- existem entregas como extensão, projetos integrados, provas e atividades adicionais.

## Exemplo de janela intensiva

Ao haver período curto até deadline, o sistema pode perguntar estrutura e capacidade e gerar plano. Mesmo quando matematicamente cabe, deve respeitar limites saudáveis, buffer e prioridades.
