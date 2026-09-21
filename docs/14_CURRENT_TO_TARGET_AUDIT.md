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

- `rotina-369:data:v1` em `localStorage`;
- validação estrutural superficial;
- falha de leitura preserva o payload original, bloqueia autosave e mantém uma sessão temporária em memória com aviso persistente;
- backup JSON cobre apenas o planner v1.
- fundação 1.2A isolada em `persistence/`, com Dexie schema interno 1,
  `metadata`, `plannerDocuments`, codecs e repositórios transacionais;
- a fundação v2 ainda não é importada pelo planner e não lê o payload v1.

### Alvo

- Etapa 1 adota IndexedDB com Dexie;
- migração v1 validada, semanticamente conservadora, idempotente e não destrutiva;
- backup v2 e restauração completos antes de arquivos locais.
- backup/restauração v2 completos antes do cutover;
- metadata ativa no IndexedDB como autoridade e marker externo como sentinel
  contra fallback para v1 desatualizado.

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

Após revisão e merge da fundação 1.2A, a 1.2B poderá implementar a migração
validada do snapshot legado. O núcleo temporal continua sem conexão automática
com o planner legado ou com a UI.
