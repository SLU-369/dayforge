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

Deve preservar:

- dados estruturados;
- configurações;
- histórico;
- anexos/certificados quando backend permitir.

A persistência local v2 aprovada será IndexedDB com Dexie. O backup v2 deve cobrir todo o store local que represente dados do usuário e possuir restauração validada antes de arquivos binários serem aceitos.

## 5. Certificados e anexos

Arquivos aceitos inicialmente:

- PDF;
- JPG;
- JPEG;
- PNG.

Backend futuro deve isolar anexos por usuário e impedir acesso cruzado.

No modo local, PDF, JPG, JPEG e PNG só podem ser habilitados depois que IndexedDB v2, backup, restauração, limites e comportamento de quota estiverem estáveis e testados.

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

O payload `rotina-369:data:v1` deve permanecer intacto durante a migração. A migração futura será validada, idempotente, reversível e testada; nunca removerá ou sobrescreverá o original antes de validar o destino. Já na Etapa 0.2, uma proteção mínima deve impedir que defaults sejam gravados sobre um payload v1 cuja leitura falhou.

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
