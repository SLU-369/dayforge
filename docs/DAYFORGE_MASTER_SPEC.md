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

`Rotina-base` pode ser renomeado visualmente para `Rotina`.

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
# 03 — Especificação de UX/UI

## 1. Objetivo de experiência

O Dayforge deve transmitir controle, não cobrança. A interface deve ser rápida, elegante, contextual e visualmente respirável.

## 2. Identidade visual a preservar

Preservar e refinar:

- tema dark;
- tema light;
- modo de acompanhar preferência do sistema;
- atmosfera do fundo atual;
- estética azulada/escura;
- laranja como accent principal;
- transparências, superfícies e bordas discretas;
- sensação premium e pessoal.

O experimento 3D foi descartado. O fundo 2D permanece como base visual.

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
# 05 — Motor de Planejamento, Capacidade Saudável e Consistência

## 1. Natureza do motor

O assistente de planejamento não depende de IA generativa na primeira versão.

Ele será um motor determinístico, orientado por perguntas, regras, datas e capacidade configurada.

Python é a linguagem desejada para esse motor, enquanto Go permanece a linguagem principal do sistema/backend.

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

## 17. Aplicação da proposta

O assistente deve ser acionável:

```text
[ Aplicar proposta ]
[ Ajustar ]
[ Manter como está ]
```

Ele não apenas conversa; ele altera o planejamento após confirmação.
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

### 2.2 Mega menu

```text
Visão geral
Plano alimentar
Calculadoras
```

### 2.3 Calculadoras de estimativa

Apresentar explicitamente como estimativas gerais.

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

Deve preservar:

- dados estruturados;
- configurações;
- histórico;
- anexos/certificados quando backend permitir.

## 5. Certificados e anexos

Arquivos aceitos inicialmente:

- PDF;
- JPG;
- JPEG;
- PNG.

Backend futuro deve isolar anexos por usuário e impedir acesso cruzado.

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

IndexedDB é uma opção possível para fila/cache local, mas não está congelada como tecnologia.

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
# 09 — Arquitetura Técnica — Baseline e Pendências

## 1. Status deste documento

Este arquivo registra decisões técnicas já expressas e separa claramente o que ainda precisa ser auditado pelo Codex no repositório real.

Não inventar stack para preencher lacunas.

## 2. Decisões conhecidas

### Frontend
Manter o stack atual criado/refinado nas Etapas B/B3, sujeito a auditoria formal de framework, bibliotecas, estado, roteamento, animações e testes.

### Backend principal
**Go** é a linguagem principal desejada para backend e regras de domínio gerais.

### Motor de planejamento
**Python** é a linguagem desejada para o assistente determinístico/question-answer e algoritmos de planejamento.

### Estado legado
Existe histórico de persistência local (`localStorage`) e payload legado preservado durante o App Shell. A futura estratégia de persistência deve ser reavaliada antes do backend 2.0.

## 3. Responsabilidade proposta por camada

```text
Frontend
- UX/UI
- navegação
- formulários/wizards
- visualização
- feedback imediato

Go backend
- API
- autenticação futura
- regras de domínio
- persistência
- autorização
- arquivos/metadados
- coordenação geral

Python planner
- cálculo de capacidade
- geração/regeração de plano
- validação de viabilidade
- heurísticas determinísticas
```

A integração Go ↔ Python ainda deve ser desenhada após auditoria. Possibilidades como serviço separado, processo interno ou outra abordagem não estão congeladas.

## 4. Banco de dados

Ainda não escolher definitivamente antes do plano técnico do Codex.

Para evolução multiusuário e relacional, um banco relacional como PostgreSQL é candidato natural, mas a decisão precisa ser fundamentada após modelagem de domínio.

## 5. Armazenamento de arquivos

Certificados e anexos futuros devem usar armazenamento apropriado e privado. Object storage é candidato provável no modo cloud, sem fornecedor definido.

## 6. PWA

O frontend deve ser compatível com futura evolução PWA.

Requisitos futuros:

- instalável;
- responsivo;
- cache apropriado;
- offline parcial;
- sincronização;
- notificações somente se o produto decidir adotá-las.

## 7. Observabilidade futura

Em ambiente comercial, planejar:

- logs estruturados;
- métricas;
- tracing quando necessário;
- erros frontend/backend;
- auditoria de ações sensíveis.

## 8. Testes

Planejar camadas:

- unitários de regras;
- unitários do planner;
- componentes frontend;
- integração de API;
- E2E dos fluxos essenciais;
- acessibilidade;
- responsividade.

## 9. Auditoria técnica obrigatória pelo Codex

Após documentação aprovada, pedir ao Codex para identificar:

- framework frontend e versão;
- gerenciador de pacotes;
- estrutura de pastas;
- roteamento;
- estado global/local;
- persistência atual;
- biblioteca de ícones;
- biblioteca de gráficos;
- animações;
- CSS/Tailwind/CSS modules/etc.;
- design tokens;
- testes;
- lint/format;
- build;
- PWA atual ou ausente;
- dependências obsoletas;
- segurança atual;
- acoplamentos com localStorage;
- pontos de migração para API.

Somente depois dessa auditoria este documento deve ser atualizado com a ficha técnica definitiva.
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

Usuário alterna Progresso entre Faculdade, Cursos, Academia, Nutri, Sono e Exploração. O gráfico muda de métrica sem recarregar toda a página.

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
# 14 — Estado Atual → Estado Alvo

## 1. App Shell

### Atual pós-B3
- navbar horizontal;
- mega menus;
- tema claro/escuro/sistema;
- fundo 2D;
- botão Adicionar;
- Perfil/Configuração no topo.

### Alvo
Manter fundação. Fazer apenas ajustes pequenos de taxonomia antes do freeze, se ainda faltarem.

## 2. Hoje

### Atual
- cabeçalho `Seu dia, em uma visão`;
- cards Progresso, Tempo concluído, Foco AI/LLM e Energia do dia;
- linha do tempo vertical extensa;
- fechamento/nota do dia;
- atividades antigas em sequência.

### Alvo
Substituir experiência principal por:

```text
Agora
Próximo
Depois
Atenção
Resumo
```

Timeline completa continua acessível sob demanda.

`Energia do dia` sai da experiência principal. `Foco AI/LLM` deixa de ser métrica fixa. Progresso deixa de ser um número genérico sem contexto.

`Nota do dia` pode sobreviver apenas se for transformada em reflexão opcional e útil ao histórico, nunca como obrigação diária.

## 3. Planejamento

### Atual
- Semana;
- Agenda;
- Rotina-base;
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

### Atual pós-B3
- Visão geral;
- Acadêmico;
- Cursos técnicos;
- Leituras & Exploração.

### Alvo
Adicionar `Cursos rápidos` e implementar páginas profundas sem inflar o mega menu.

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
