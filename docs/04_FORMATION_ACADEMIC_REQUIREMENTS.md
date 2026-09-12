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
