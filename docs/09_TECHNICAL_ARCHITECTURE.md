# 09 — Arquitetura Técnica — Baseline e Pendências

## 1. Status deste documento

Este arquivo registra decisões técnicas já expressas e separa claramente o que ainda precisa ser auditado pelo Codex no repositório real.

Não inventar stack para preencher lacunas.

## 2. Decisões conhecidas

### Frontend
Manter o stack atual criado/refinado nas Etapas B/B3, sujeito a auditoria formal de framework, bibliotecas, estado, roteamento, animações e testes.

### Backend principal
**Go** é a linguagem principal desejada para backend e regras de domínio gerais.

### Motor de planejamento
**Python** é a linguagem desejada para o assistente determinístico/question-answer e algoritmos de planejamento.

### Estado legado
Existe histórico de persistência local (`localStorage`) e payload legado preservado durante o App Shell. A futura estratégia de persistência deve ser reavaliada antes do backend 2.0.

## 3. Responsabilidade proposta por camada

```text
Frontend
- UX/UI
- navegação
- formulários/wizards
- visualização
- feedback imediato

Go backend
- API
- autenticação futura
- regras de domínio
- persistência
- autorização
- arquivos/metadados
- coordenação geral

Python planner
- cálculo de capacidade
- geração/regeração de plano
- validação de viabilidade
- heurísticas determinísticas
```

A integração Go ↔ Python ainda deve ser desenhada após auditoria. Possibilidades como serviço separado, processo interno ou outra abordagem não estão congeladas.

## 4. Banco de dados

Ainda não escolher definitivamente antes do plano técnico do Codex.

Para evolução multiusuário e relacional, um banco relacional como PostgreSQL é candidato natural, mas a decisão precisa ser fundamentada após modelagem de domínio.

## 5. Armazenamento de arquivos

Certificados e anexos futuros devem usar armazenamento apropriado e privado. Object storage é candidato provável no modo cloud, sem fornecedor definido.

## 6. PWA

O frontend deve ser compatível com futura evolução PWA.

Requisitos futuros:

- instalável;
- responsivo;
- cache apropriado;
- offline parcial;
- sincronização;
- notificações somente se o produto decidir adotá-las.

## 7. Observabilidade futura

Em ambiente comercial, planejar:

- logs estruturados;
- métricas;
- tracing quando necessário;
- erros frontend/backend;
- auditoria de ações sensíveis.

## 8. Testes

Planejar camadas:

- unitários de regras;
- unitários do planner;
- componentes frontend;
- integração de API;
- E2E dos fluxos essenciais;
- acessibilidade;
- responsividade.

## 9. Auditoria técnica obrigatória pelo Codex

Após documentação aprovada, pedir ao Codex para identificar:

- framework frontend e versão;
- gerenciador de pacotes;
- estrutura de pastas;
- roteamento;
- estado global/local;
- persistência atual;
- biblioteca de ícones;
- biblioteca de gráficos;
- animações;
- CSS/Tailwind/CSS modules/etc.;
- design tokens;
- testes;
- lint/format;
- build;
- PWA atual ou ausente;
- dependências obsoletas;
- segurança atual;
- acoplamentos com localStorage;
- pontos de migração para API.

Somente depois dessa auditoria este documento deve ser atualizado com a ficha técnica definitiva.
