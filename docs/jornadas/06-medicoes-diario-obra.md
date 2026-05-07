# Jornada — Medições & Diário de Obra

> Status: mock | Prioridade: alta | Wave: 2
> Última atualização: 2026-05-05

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
- [ ] Criar tabelas `medicoes`, `medicao_anexos` + migration
- [ ] Endpoints de criação (empreiteiro) e aprovação/contestação (contratante)
- [ ] Upload de anexos
- [ ] Atualizar `obras.progresso` no aprovar (somar `percentualExecutado`)
- [ ] Gerar lançamento financeiro (J08) no aprovar
- [ ] Notificações em criação/aprovação/contestação (J13)
- [ ] Substituir mock no front
- [ ] Tela timeline de medições por obra (acumulado visível)

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

- _Sem registros ainda._
