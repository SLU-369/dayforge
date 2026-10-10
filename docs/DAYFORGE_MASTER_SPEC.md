<!-- GENERATED FILE: edit the numbered documents in docs/ and run npm.cmd run docs:master. -->
# Dayforge 2.0 — Master Spec derivado

> Este arquivo é uma compilação gerada. Os arquivos numerados em `docs/` são a fonte canônica.

# Dayforge 2.0 — Documentação oficial de produto

**Status:** Etapas 0.1, 0.2, 1.1, 1.2A–1.2D, 2A, fundação da 2B, 2B-A, 2C-A e 2C-B implementadas; integração da 2C-B depende de PR e aprovação humanas
**Data:** 10/10/2026
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
PR, merge e avanço de etapa são gates separados.

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

---

# 10 — Roadmap e Fluxo de Implementação

## 1. Estado

- Etapa B/B3 visual concluída e aprovada.
- Etapa 0.1 documental concluída.
- Etapa 0.2/B4 de taxonomia, baseline técnica e proteção do v1 concluída.
- Etapa 1.1 de modelo temporal e contratos do domínio concluída.
- Etapas 1.2A–1.2D implementadas; v2 é o store principal e v1 permanece somente leitura.
- Etapa 2A concluída; fundação da 2B, conclusão 2B-A, contrato/recuperação 2C-A e comando/UI 2C-B implementados. PR/integração da 2C-B aguardam autorização própria.
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

Status: concluída em 28/09/2026; execução e reagendamento não iniciados.
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
Execução e reagendamento pertencem a uma subdivisão futura ainda não iniciada.

### Etapa 2B — Execução explícita de ocorrências

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

Status: implementada em 07/10/2026. Branch: `feature/today-completion`, a partir
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

Aprovação com subdivisão obrigatória e gates humanos independentes:

- **2C-A — Contrato e recuperação:** ponte lógica 2, `planningAudit` opcional,
  regras puras compartilhadas, upgrade 1 → 2, backup/restore compatível,
  `authorityEpoch` local e provas de integridade/rollback. Implementada na
  branch `feat/reschedule-foundation` sobre a main após PR #12.
- **2C-B — Comando e experiência em Hoje:** produtor explícito, projeção do
  planejamento vigente e UX de reagendamento implementados em `feat/today-rescheduling`,
  sobre `cfaad03881956ab1d3d26cd2d86d2b98e049db3c` após merge da PR #13.

2C-A não gera auditoria na migração, não reagenda, inicia ou corrige execução,
não cria UI nem muda templates/minutos por conta própria. A conclusão existente
continua funcional; o contrato aceita conclusão posterior a uma cadeia válida.
Backup público 2, geração 2, schema Dexie 1 e planner/current permanecem iguais.
Época local protege operações de conjuntos substituídos e não integra o backup.

Gates: master consistente, lint, typecheck, suíte Node incluindo build,
domínio/ponte/metadata/rollback, persistência e regressões 2A/2B/2B-A no Edge,
diff check e revisão de recuperação contra perda silenciosa. Commit/push da
branch validada seguem a autorização permanente. Abrir PR, merge e iniciar
2C-B exigem suas próprias autorizações, sem avanço automático.

Validação da 2C-A: 46 novos testes de contrato/recuperação, 245/245 Node
incluindo persistência e regressões, build, lint, typecheck, master e diff check.
Edge: 22/22 cenários aplicáveis sobre build de produção, sem retries automáticos,
incluindo upgrade instalado, backup antigo, auditoria recuperada, conclusão,
audit guard, Hoje, backup/cutover e layout compacto. Testes de importação e
navegação aguardam a prontidão real do bootstrap antes de interagir.

### Etapa 2C-B — Reagendamento explícito e auditável

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
Commit e push da branch validada estão autorizados; abertura de PR, merge,
deploy e qualquer etapa posterior dependem de autorização humana específica.

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

---

# 14 — Estado Atual → Estado Alvo

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
e reagendamento explícito já estão implementados; início e correção terminal permanecem gated.

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
Calendário com baixo nível de interação/persistência funcional.

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
iniciada. PR/merge da branch 2C-B ainda exigem autorização humana.

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
