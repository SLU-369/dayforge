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
