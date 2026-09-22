# 09 — Arquitetura Técnica — Decisões da Etapa 0.1

## 1. Status

Este documento separa arquitetura atual, direção aprovada e tecnologia futura. Nenhuma decisão futura autoriza implementação antecipada.

## 2. Arquitetura atual

- frontend React 19 e TypeScript strict;
- APIs App Router compiladas por Vinext/Vite;
- Tailwind CSS 4, CSS próprio e CSS Modules;
- estado React por Context e hooks;
- persistência principal em `localStorage`, payload `rotina-369:data:v1`;
- preferências de aparência em chaves locais separadas;
- leitura inválida do payload v1 bloqueia autosave e mantém alterações temporárias em memória até recuperação explícita;
- Worker apenas para runtime Vinext e otimização de imagens;
- Drizzle/D1 preparado, mas schema e bindings de produção vazios;
- CI executa verificação do master, lint, typecheck, build e testes;
- núcleo temporal puro em `domain/temporal/`, com valores validados, templates
  semanais, ocorrências independentes, execução, reagendamento append-only,
  transições terminais e contratos mínimos de disponibilidade;
- nenhum backend de domínio, API, autenticação, sincronização ou banco ativo.

## 3. Frontend local v2

A reconstrução funcional permanece no frontend atual. O domínio deve ser isolado de React por funções puras, comandos, consultas e interfaces de repositório.

```text
React
- navegação, UX, formulários e feedback

Núcleo TypeScript
- regras de domínio
- motor determinístico
- transições e validação
- agregações testáveis

Repositórios
- persistência e backup
- adaptação do payload legado
```

## 4. Persistência local v2

IndexedDB com Dexie é a direção aprovada. Ela substituirá `localStorage` como store principal somente no cutover da Etapa 1.2D, depois que backup e restauração v2 estiverem implementados e validados, sem destruir o legado.

A geração arquitetural da persistência é v2; sua primeira versão interna de schema Dexie é 1. O schema inicial possui apenas `metadata` e `plannerDocuments`. `routineTemplates`, `scheduleOccurrences`, `executionRecords` e disponibilidade não ganham tabelas antes de existir produtor e consumidor reais. O núcleo temporal continua desacoplado da persistência.

A migração de `rotina-369:data:v1` preserva um `LegacyPlannerSnapshotV1` tipado e não reinterpreta ambiguidades como fatos temporais. SHA-256 dos bytes crus identifica cada origem por `legacy-v1/source/<rawFingerprint>`; SHA-256 da representação canônica validada identifica a operação idempotente por `migration/v1/<contentFingerprint>`. Origens byte a byte distintas com o mesmo conteúdo semântico coexistem sem repetir a migração operacional. IDs, fingerprints e transformação não usam relógio, aleatoriedade ou UUID; o instante auditável é fornecido separadamente.

Antes do cutover, v1 permanece principal e qualquer falha aborta a transação v2. Depois do cutover, metadata `active` validada no IndexedDB é a autoridade principal, não existe dual-write e `dayforge:persistence:v2` funciona como sentinel externo contra fallback destrutivo. Marker ativo ou inválido sem banco ativo validável bloqueia persistência e mantém a sessão em memória; banco ativo com marker ausente ou inválido usa v2 e repara o marker quando seguro.

A baseline da Etapa 0.2 implementa somente uma proteção: falha de leitura do v1 bloqueia o autosave de defaults, preserva o conteúdo original e mantém a sessão em memória até importação de backup ou restauração explícita. IndexedDB e a migração completa permanecem fora da 0.2.

## 5. Motor de planejamento

A primeira versão local usa TypeScript puro, determinístico e independente da UI. Os contratos e vetores de teste devem permitir reprodução fora do navegador.

Python permanece candidato para prototipagem, simulações, análise, otimização ou execução server-side futura. Sua entrada na runtime exige evidência de que TypeScript/Go não atende à necessidade; preferência de linguagem não é justificativa suficiente.

## 6. Backend futuro

Go continua sendo a linguagem desejada para o backend principal. Deve entrar apenas quando houver necessidade concreta de API, autenticação, multiusuário, cloud, sincronização, armazenamento remoto ou segurança server-side.

A primeira arquitetura será um monólito modular. Microsserviços, filas, brokers, Redis, Kafka, Kubernetes e infraestrutura distribuída permanecem adiados sem necessidade comprovada.

## 7. Dados e arquivos futuros

PostgreSQL é o candidato principal para o backend relacional multiusuário; a decisão final e a estratégia de migrations pertencem ao ADR do backend. D1/Drizzle atuais não constituem decisão de produto.

Certificados locais dependem de IndexedDB v2, backup/restauração completos e política de quota. No cloud, binários devem usar object storage privado; banco guarda metadados e autorização.

## 8. PWA, offline e sincronização

- PWA e cache só entram depois que os fluxos e o store v2 estiverem estáveis.
- IndexedDB prepara o offline local, mas não antecipa sincronização.
- Sincronização futura exige operações idempotentes, IDs estáveis e política explícita de conflitos.
- Execuções concluídas e histórico nunca podem ser descartados silenciosamente por conflito.

## 9. Segurança e observabilidade

Autenticação, autorização, isolamento por usuário, sessões, proteção de uploads e secrets entram com o backend/cloud. Logs estruturados, métricas, erros e auditoria de ações sensíveis devem acompanhar essa introdução, não o protótipo local.

## 10. Verificação arquitetural

Camadas futuras devem possuir testes unitários de domínio e planner, testes de componente e acessibilidade, integração de persistência/backup/migração, E2E dos fluxos essenciais e contratos de API/segurança quando o backend existir.
