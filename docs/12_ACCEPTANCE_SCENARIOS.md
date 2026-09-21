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

O mecanismo v2 passa por round-trip e rollback enquanto a tela continua usando backup v1. Somente a subetapa de cutover conecta a UI ao backup v2, mantendo importação compatível de arquivos v1.
