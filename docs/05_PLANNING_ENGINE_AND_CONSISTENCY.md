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
