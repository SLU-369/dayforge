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
