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
