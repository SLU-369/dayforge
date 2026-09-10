# Dayforge

Painel pessoal e local para planejar a rotina semanal, registrar o que realmente aconteceu em cada dia e acompanhar a evolução mensal.

## O que já está incluído

- Rotina-base editável para os sete dias da semana.
- Registro independente de cada dia, sem alterar o histórico.
- Conclusão de atividades e minutos efetivamente realizados.
- Nota e nível de energia do dia.
- Calendário mensal com aproveitamento, sequência e horas por categoria.
- Meta mensal.
- Backup e restauração em arquivo JSON.
- Layout responsivo para computador e celular.
- Dados salvos somente no navegador deste PC.
- Tema manual ou solar automático em **Perfil → Aparência e tema**, também disponível nas Configurações do menu compacto.
- Cenário de castelo com iluminação dia/crepúsculo/noite, nuvens lentas e visitas ocasionais de criaturas, pássaros e alunos em vassouras. O movimento pode ser pausado e respeita a preferência de movimento reduzido do sistema.

O ciclo solar usa a capital escolhida entre as 27 capitais brasileiras, sem geolocalização ou consulta externa. Uma troca manual desativa o modo automático. Essas preferências ficam separadas do histórico e não são incluídas no backup do planejamento. O cenário usa arte gerada e iluminação em CSS; não é uma reprodução do motor visual ou um asset extraído de Hogwarts Legacy.

## Rodar no Windows

Pré-requisito: Node.js 22.13 ou superior.

No PowerShell, dentro desta pasta:

```powershell
npm.cmd install
npm.cmd run dev
```

Abra o endereço local exibido no terminal. Para gerar uma versão otimizada:

```powershell
npm.cmd run build
npm.cmd start
```

Também é possível executar `INICIAR.bat` com dois cliques depois de instalar as dependências uma vez.

## Sobre o backend em Go

Esta primeira versão não precisa de backend: é um sistema pessoal, de um único computador, e os dados ficam no próprio navegador. Uma API em Go passa a fazer sentido quando houver sincronização entre computadores/celular, login, múltiplos usuários ou banco central. A interface e o modelo dos dados foram separados para permitir essa evolução sem reconstruir o produto.

## Segurança dos dados

Use **Exportar backup** periodicamente. Limpar os dados do navegador pode apagar o histórico local; o arquivo JSON permite restaurá-lo.
