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
