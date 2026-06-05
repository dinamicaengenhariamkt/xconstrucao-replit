# Jornada — Documentos Legais Versionados + Re-consentimento

> Status: bloqueada | Prioridade: média | Wave: 6
> Última atualização: 2026-06-05
>
> **Criada em 2026-06-05** a partir de auditoria `/jornada`. Pós-MVP, depende de
> decisão jurídica sobre conteúdo e política de re-consentimento. Estruturada agora
> para não se perder no roadmap.

## 1. Contexto & Objetivo
Os Termos de Uso ([app/termos/page.tsx](../../app/termos/page.tsx)) e a Política de
Privacidade ([app/politica-privacidade/page.tsx](../../app/politica-privacidade/page.tsx))
são **JSX hardcoded** (centenas de linhas de texto fixo). Ao mesmo tempo, existe
`user_consents` com coluna `versao` ([shared/db/schema.ts:427](../../shared/db/schema.ts)) —
ou seja, há **versionamento do consentimento sem versionamento do documento**.

Consequência: quando o jurídico alterar os termos, não há (a) registro de qual
versão do texto vigorava, nem (b) mecanismo de **re-consentimento** dos usuários
que aceitaram a versão anterior. Risco de compliance (LGPD) silencioso.

Objetivo: versionar os documentos legais (cada publicação ganha uma versão e data),
ligar `user_consents.versao` ao documento real, e disparar **re-consentimento**
quando a versão vigente for maior que a aceita pelo usuário.

## 2. Personas
- **Admin/Jurídico**: publica uma nova versão do documento (texto + data de vigência).
- **Usuário logado**: ao haver versão nova que exija re-aceite, é solicitado a aceitar
  antes de continuar usando funcionalidades sensíveis.
- **Visitante**: lê a versão vigente nas páginas públicas.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  J[Admin/Jurídico] -->|publica vN| DOC[(legal_documents: tipo, versao, conteudo, vigenteEm)]
  DOC --> PUB[/termos /politica-privacidade leem a versão vigente]
  U[Usuário logado] --> CHK{versao aceita < vigente?}
  CHK -->|sim| REACK[Modal de re-consentimento]
  REACK -->|aceita| CONS[(user_consents: nova versao)]
  CHK -->|não| OK[segue normal]
```

## 4. Telas envolvidas
- [app/termos/page.tsx](../../app/termos/page.tsx) e
  [app/politica-privacidade/page.tsx](../../app/politica-privacidade/page.tsx) — passam
  a renderizar o conteúdo da **versão vigente** (do banco), não JSX fixo.
- **A criar:** tela admin para publicar/gerenciar versões dos documentos legais.
- **A criar:** modal/fluxo de re-consentimento para usuários logados com versão desatualizada.

## 5. Componentes-chave
- **A criar:** `features/legal/` — service (versão vigente, histórico) + hooks +
  componente de re-consentimento.
- Reusar a infra de `user_consents` existente (já registra `versao`, `documento`,
  `aceitoEm`, `revogadoEm`).

## 6. Schema (Drizzle)
- **A criar:** `legal_documents` (id, `tipo` [`termos`|`privacidade`], `versao` INT,
  `conteudo` TEXT/Markdown, `vigente_em` TIMESTAMP, `criado_por`, `criado_em`).
  Migration idempotente via novo `server/bootstrap-legal.ts` registrado em
  `instrumentation.ts`; espelhar em [schema.ts](../../shared/db/schema.ts).
- `user_consents` ([schema.ts:427](../../shared/db/schema.ts)) **já existe** com `versao` —
  passa a referenciar a versão do `legal_documents` aceita.
- Índice único de "versão vigente por tipo" (ex.: só uma vigente por `tipo` num dado momento).

## 7. Endpoints
- **A criar:** `GET /api/legal/[tipo]` — público, retorna a versão vigente (conteúdo + versão).
- **A criar:** `GET/POST /api/admin/legal` — lista versões e publica nova (guard admin).
- **A criar:** `POST /api/legal/consentir` — registra re-consentimento do usuário logado.
- Reusar/estender os endpoints de consentimento existentes se houver (backfill de
  consents já existe em [server/backfill-consents.ts](../../server/backfill-consents.ts)).

## 8. Mocks a remover
- O texto hardcoded de [app/termos/page.tsx](../../app/termos/page.tsx) e
  [app/politica-privacidade/page.tsx](../../app/politica-privacidade/page.tsx) migra
  para `legal_documents` (a versão atual vira a v1).

## 9. Checklist de implementação
- [ ] Tabela `legal_documents` + bootstrap idempotente + espelho no schema
- [ ] Seed da versão atual (migrar o texto hardcoded de termos/privacidade para v1)
- [ ] `GET /api/legal/[tipo]` público + páginas lendo a versão vigente
- [ ] Tela admin para publicar nova versão (com data de vigência)
- [ ] Detecção de "versão aceita < vigente" para o usuário logado
- [ ] Modal/fluxo de re-consentimento + `POST /api/legal/consentir`
- [ ] Gate (decisão jurídica): re-consentimento é obrigatório/bloqueante ou apenas avisado?
- [ ] Auditoria: publicação de versão e re-consentimentos em `audit_logs`

## 10. Critérios de aceite
1. Páginas públicas de termos/privacidade exibem o conteúdo da versão vigente vinda do banco.
2. Admin publica uma nova versão → a página pública passa a mostrar a nova; o histórico fica registrado.
3. Usuário que aceitou a versão anterior, ao logar, recebe o fluxo de re-consentimento (conforme política definida).
4. `user_consents` registra a versão exata aceita por cada usuário.
5. Query de verificação: `SELECT tipo, versao, vigente_em FROM legal_documents` reflete o publicado; `SELECT versao FROM user_consents WHERE user_id=…` reflete o aceite.

## 11. Riscos / Pontos de atenção
- **Decisão jurídica é pré-requisito:** o conteúdo dos documentos, a política de
  re-consentimento (bloqueante vs avisado) e a retroatividade são decisões do
  jurídico/sócios. Engenharia não decide isso — daí o status `bloqueada`.
- **Não bloquear o usuário indevidamente:** re-consentimento bloqueante mal calibrado
  trava o uso. Definir claramente quais ações exigem re-aceite.
- **Markdown vs HTML:** decidir o formato de armazenamento do conteúdo legal (Markdown
  renderizado é mais seguro/portável que HTML cru).
- **Prova de consentimento:** guardar versão + timestamp + (opcional) hash do conteúdo
  para prova futura.

## 12. Links cruzados
- Depende de: decisão jurídica/sócios (conteúdo + política).
- Relacionada: J01 (onboarding/aceite inicial), J19 (compliance/hardening), J26 (config da plataforma).
- Reusa: `user_consents`, [server/backfill-consents.ts](../../server/backfill-consents.ts).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho.

- **2026-06-05** — Jornada criada por auditoria. Confirmado: termos/privacidade são JSX hardcoded; `user_consents.versao` existe mas não há documento versionado correspondente (versionamento de consentimento sem versionamento do documento). Status `bloqueada` por depender de decisão jurídica.
