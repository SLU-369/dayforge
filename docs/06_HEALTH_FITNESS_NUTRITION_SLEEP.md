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
