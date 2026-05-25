# Jornada — Medições & Diário de Obra

> Status: pronto | Prioridade: alta | Wave: 2
> Última atualização: 2026-05-25

## 1. Contexto & Objetivo
Permitir que o empreiteiro registre etapas concluídas (com fotos/percentual) e o contratante aprove/conteste. Cada medição aprovada vira gatilho de pagamento (J08) e atualiza `obras.progresso`.

## 2. Personas
- **Empreiteiro**: cria medição com descrição, % executado, fotos.
- **Contratante**: aprova ou contesta (vira disputa — J10).
- **Admin**: auditoria, intervenção em disputas.

## 3. Fluxo ponta-a-ponta
1. Empreiteiro abre obra em `/empreiteiro/minhas-obras/[id]` → "registrar medição".
2. Submete: etapa, %, descrição, fotos.
3. Contratante recebe notificação → abre `/contratante/medicoes` ou detalhe da obra.
4. Aprova → atualiza `obras.progresso`, gera lançamento financeiro (J08).
5. Contesta → dispara J10.

## 4. Telas envolvidas
- [app/contratante/medicoes/](../../app/contratante/medicoes/) — lista + aprovação
- [app/empreiteiro/minhas-obras/](../../app/empreiteiro/minhas-obras/) — registrar dentro do detalhe
- [app/admin/obras/](../../app/admin/obras/) — aba de medições por obra

## 5. Componentes-chave
- [features/contratante/medicoes/](../../features/contratante/medicoes/) — api/, components/, hooks/, mocks/
- [features/empreiteiro/minhas-obras/](../../features/empreiteiro/minhas-obras/)

## 6. Schema (Drizzle)
**A criar** em [shared/db/schema.ts](../../shared/db/schema.ts):
- `medicoes` (id, obraId, empreiteiraId, titulo, descricao, percentualExecutado, percentualAcumulado, valorAssociado, status [pendente|aprovada|contestada], criadaEm, aprovadaEm)
- `medicao_anexos` (id, medicaoId, url, tipo)
- Enum `medicao_status`.

## 7. Endpoints
- `GET /api/contratante/medicoes` (a criar)
- `GET /api/contratante/medicoes/[id]`
- `POST /api/contratante/medicoes/[id]/aprovar`
- `POST /api/contratante/medicoes/[id]/contestar`
- `POST /api/empreiteiro/medicoes` — criar (escopo: obra do próprio)
- `GET /api/empreiteiro/medicoes`

## 8. Mocks a remover
- [features/contratante/medicoes/mocks/medicoes.mock.ts](../../features/contratante/medicoes/mocks/medicoes.mock.ts)
- Service em [features/contratante/medicoes/api/](../../features/contratante/medicoes/api/) (substituir fetch mock por real)

## 9. Checklist de implementação
- [x] Criar tabela `medicoes` + bootstrap idempotente _(Task #47)_
- [x] Endpoints de criação (empreiteiro) e aprovação/contestação (contratante) _(Task #47)_
- [x] Upload de fotos via R2 — novo kind `obra_foto` + integração com `FileUploader` _(Task #72)_
- [x] Atualizar `obras.progresso` no aprovar (SUM dos `percentual` aprovados) _(Task #47)_
- [ ] Gerar lançamento financeiro (J08) no aprovar
- [ ] Notificações em criação/aprovação/contestação (J13)
- [x] Substituir mock no front (contratante real; empreiteiro/`minhas-obras` zeroado) _(Task #47)_
- [x] Diário de obra ponta-a-ponta nas 3 personas (texto + fotos) _(Task #72)_
- [x] Ocorrências (criar + resolver atomicamente) nas 3 personas _(Task #72)_
- [x] Galeria de fotos da obra (upload + delete por autor/admin) nas 3 personas _(Task #72)_
- [x] Etapas da obra (escopo contratante/admin + progresso por empreiteiro) nas 3 personas _(Task #72)_
- [x] Admin enxerga read-only Etapas/Diário/Ocorrências/Fotos via tabs novas em `/admin/obras/[id]` _(Task #72)_

## 10. Critérios de aceite
1. Empreiteiro registra medição "Fundação 100%" → contratante recebe notificação.
2. Contratante aprova → `obras.progresso` aumenta, `financeiro` ganha entrada vinculada.
3. Contestar → vira `disputa` em J10.
4. `SELECT SUM(percentual_executado) FROM medicoes WHERE obra_id=X AND status='aprovada'` ≤ 100.

## 11. Riscos / Pontos de atenção
- Soma de % não pode passar 100 — validar no aprovar.
- Anexos com tamanho/peso podem virar problema de armazenamento.
- Aprovação automática após X dias sem resposta? — decidir antes de codar.

## 12. Links cruzados
- Depende de: J05.
- Alimenta: J07, J08, J10.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #47): enum DB usa `pendente|aprovada|contestada` (3 valores), mas a UI do contratante já tinha `aguardando_aprovacao|aprovada|rejeitada|paga` — backend mapeia DB → contrato UI no endpoint (paga fica para J08).
- 2026-05-25 (Task #47): `medicao_anexos` (tabela separada) não foi criada — fotos viram coluna `text[]` em `medicoes` guardando chaves R2; basta `kind='medicao_foto'` em `kind-builder.ts` quando a UI de upload sair (gap aberto).
- 2026-05-25 (Task #47): aprovar valida que `SUM(percentual aprovado) ≤ 100`; cria medição também valida que `SUM(pendentes+aprovadas) ≤ 100` para não represar 200% pendentes.
- 2026-05-25 (Task #47): aprovação não gera lançamento financeiro ainda (J08); flag explícita para que a próxima task de J08 ouça `medicoes.aprovar` no audit log e crie o `financeiro` correspondente.
- 2026-05-25 (Task #72): novo kind R2 `obra_foto` (público, 8MB, JPEG/PNG/WEBP) em `key-builder.ts` + `validation.ts` + commit endpoint; ownership via `public/obra-fotos/{userId}/<file>` (anti-tamper na chave).
- 2026-05-25 (Task #72): 4 tabelas novas — `obra_etapas`, `obra_diario`, `obra_ocorrencias`, `obra_fotos` — com bootstrap idempotente em `server/bootstrap-medicoes-extras.ts`. Resolver de ocorrência é UPDATE atômico (`WHERE status='aberta'`) com 409 se já resolvida.
- 2026-05-25 (Task #72): empreiteiro não cria/deleta etapas (só contratante/admin); empreiteiro só atualiza `progresso`/`status` (anti-tamper no PATCH).
- 2026-05-25 (Task #72): helper `features/obras/api/access.ts` (`findObraAccess`, `canWriteObraContent`) — base reusável pra endpoints de obra com gate role+ownership.
- 2026-05-25 (Task #72): empreiteiro detail page mantém TaskManager/Checklists/Timeline/Cronograma/Documentos/Equipe/Financeiro/Lucro/Saúde **em mock** (BLOCO J06 novo coexiste com os blocos legados). Migração desses blocos pra dados reais fica como carry para tasks futuras (J11 Equipe, J08 Financeiro/Lucro, J09 Documentos, jornada própria de Checklists).
- 2026-05-25 (Task #72): modal `AtualizarProgressoModal` (empreiteiro) ainda escreve em store local; carry pra próxima task — endpoint `POST /api/empreiteiro/medicoes` já existe (Task #47).
