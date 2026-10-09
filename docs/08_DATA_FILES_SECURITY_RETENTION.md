# 08 — Dados, Arquivos, Segurança, Backup e Retenção

## 1. Princípio de retenção

> **Conclusão não é exclusão.**

Fluxo padrão:

```text
ativo → concluído → histórico
```

Não:

```text
ativo → apagado
```

## 2. Arquivamento

Formações, cursos, períodos e outros domínios concluídos podem ser arquivados para reduzir ruído sem perder histórico.

## 3. Exclusão permanente

Local:

```text
Configurações → Avançado → Zona de perigo
```

Deve possuir múltiplos passos e confirmação explícita.

Fluxo recomendado:

1. explicar o que será apagado;
2. oferecer backup/arquivamento;
3. segunda confirmação;
4. exigir digitação de frase, por exemplo `EXCLUIR DAYFORGE`;
5. só então executar.

Pode haver humor leve, mas o risco precisa permanecer claro.

## 4. Backup

Backup sai da navegação principal e fica em Configurações → Dados e backup.

Na 2C-A, o backup público continua com formato 2, geração 2 e schema interno 1.
Sua extensão `executionBridge` preserva identidade, snapshots, execução e
eventual `planningAudit` da ponte lógica 2. A época local `authorityEpoch` não
é conteúdo de backup: cada restore/import/reset incrementa a época do banco
de destino atomicamente, inclusive ao recuperar conteúdo idêntico. Assim, IDs
reutilizados não legitimam comandos capturados sobre o conjunto anterior.
Uma restauração é substituição do conjunto recuperável, sem merge de execuções
ou auditorias. O conteúdo v1 preservado continua somente leitura.

Deve preservar:

- dados estruturados;
- configurações;
- histórico;
- anexos/certificados quando o armazenamento local de arquivos estiver habilitado.

A persistência local v2 aprovada será IndexedDB com Dexie. Arquivos locais só podem ser habilitados depois que o IndexedDB v2 estiver estável, o backup v2 estiver funcional, a restauração estiver validada e a política de quota estiver definida. Quando habilitados, backup e restauração devem contemplar os arquivos e seus metadados.

## 5. Certificados e anexos

Arquivos aceitos inicialmente:

- PDF;
- JPG;
- JPEG;
- PNG.

No modo local, os arquivos permanecem no armazenamento local e integram a exportação e a restauração locais. Backend e object storage privado são evoluções futuras para armazenamento remoto; quando existirem, devem isolar anexos por usuário e impedir acesso cruzado.

No modo local, os formatos PDF, JPG, JPEG e PNG seguem os mesmos gates definidos para arquivos locais nesta especificação.

## 6. Evolução para cloud

Destino arquitetural:

```text
Conta
↓
API
↓
Banco central
↓
Desktop/PWA
```

## 7. Autenticação futura

Prever:

- criar conta;
- login;
- recuperação de acesso;
- alteração de senha;
- encerramento de sessões;
- exclusão de conta;
- provedores externos opcionais.

Senhas nunca em texto puro. Preferência futura: Argon2id ou mecanismo equivalente revisado no momento da implementação.

## 8. Sessões

Preferir mecanismos seguros adequados ao stack futuro, por exemplo cookies `HttpOnly`, `Secure` e `SameSite`, se a arquitetura web adotada recomendar isso.

Não fixar implementação antes da auditoria técnica.

## 9. PWA e offline

Visão futura:

- leitura e registro no celular;
- funcionamento parcial offline;
- fila local de eventos;
- sincronização ao recuperar conexão;
- política clara de conflitos.

IndexedDB com Dexie é a tecnologia aprovada para a persistência local v2. A futura fila de sincronização pode reutilizar essa base, mas outbox, conflitos e sincronização não entram antes de existir uma necessidade cloud concreta.

O payload `rotina-369:data:v1` deve permanecer intacto durante e depois da migração. A migração será validada, idempotente e testada; nunca removerá ou sobrescreverá o original. Reversibilidade significa que, antes do cutover, falha ou aborto mantém v1 como fonte principal e faz rollback integral da transação v2. Depois do cutover, v1 é somente leitura, não existe dual-write e dados exclusivos do v2 não precisam ser traduzidos de volta; recuperação depende de backup/restauração v2, sem promessa de retorno ao v1 sem perda.

Backup/restauração v2 é um contrato lógico desacoplado das tabelas Dexie. O formato separa versão pública do backup, geração da persistência e versão interna do schema; exportação recalcula fingerprints e restauração valida envelope, conteúdo, referências e procedência antes de substituir atomicamente somente o conjunto preparado. A tela de Dados e backup exporta v2 e aceita arquivos v2 e v1. Importação v1 registra origem `backup-v1`; nenhuma importação escreve em `rotina-369:data:v1`. Após uma edição do planner ativo, a procedência da versão anterior deixa de descrever o conteúdo atual e é removida do conjunto preparado; os bytes legados originais permanecem no localStorage.

No bootstrap, o marker `dayforge:persistence:v2` é escrito antes da ativação transacional da metadata. Metadata ativa e validada é autoridade mesmo se o marker estiver ausente ou inválido; nesse caso o marker é reparado quando o navegador permitir. Marker presente sem banco ativo validável bloqueia escrita e fallback ao v1, mantém apenas uma sessão em memória e mostra aviso persistente. Importação de backup ou restauração explícita do padrão pode recuperar um banco compatível; banco inacessível ou metadata inválida não é reparado silenciosamente.

Desde a Etapa 0.2, uma proteção mínima impede que defaults sejam gravados sobre um payload v1 cuja leitura falhou; importação de backup ou restauração do padrão são as recuperações explícitas disponíveis.

## 10. Multiusuário

Quando cloud/multiusuário existir:

- autorização por usuário;
- isolamento de registros;
- rate limiting;
- logs de segurança;
- proteção de uploads;
- URLs temporárias/autorizadas para anexos;
- backups;
- recuperação;
- auditoria de ações sensíveis.

## 11. Privacidade por domínio

O Dayforge pode armazenar informações pessoais de rotina, estudo, fitness, nutrição, sono, agenda e futuramente finanças. Segurança e privacidade devem ser requisitos de primeira classe antes de qualquer comercialização pública.
