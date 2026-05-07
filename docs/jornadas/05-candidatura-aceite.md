# Jornada — Candidatura & Aceite

> Status: parcial | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Empreiteiro envia proposta para uma obra; contratante avalia múltiplas e aceita uma. O aceite vincula `obra.empreiteiraId`, muda status para `em_andamento`, rejeita as concorrentes e abre o canal de comunicação (J13). É a junção do marketplace.

## 2. Personas
- **Empreiteiro**: envia proposta (valor, prazo, descrição).
- **Contratante**: vê propostas recebidas, aceita uma, rejeita outras.
- **Admin**: observador (auditoria).

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  E[Empreiteiro detalhe obra] --> AP[Form aplicar]
  AP --> P[POST /api/empreiteiro/candidaturas]
  P --> CDB[(candidaturas pendente)]
  CDB --> CTR[Contratante: minhas-obras/[id]]
  CTR --> AC[POST /aceitar]
  AC --> O[(obras: empreiteiraId, em_andamento)]
  AC --> R[(candidaturas concorrentes: rejeitada)]
  AC --> N[Notificações J13]
```

## 4. Telas envolvidas
- [app/empreiteiro/novas-obras/](../../app/empreiteiro/novas-obras/) — botão "aplicar" no detalhe
- [app/contratante/minhas-obras/](../../app/contratante/minhas-obras/) — aba "propostas recebidas" no detalhe
- [app/admin/obras/](../../app/admin/obras/) — coluna com candidaturas

## 5. Componentes-chave
- [features/empreiteiro/novas-obras/](../../features/empreiteiro/novas-obras/) — fluxo de aplicar
- [features/contratante/detalhes-obra/](../../features/contratante/detalhes-obra/) — listagem e aceite
- Schema Zod: `insertCandidaturaSchema` em [shared/db/schema.ts](../../shared/db/schema.ts)

## 6. Schema (Drizzle)
Existente: `candidaturas` (`obraId, empreiteiroId, valorProposta, prazoEstimado, dataInicio, dataTermino, descricao, observacoesPrazo, status [pendente|aceita|rejeitada], atividades`).

**A avaliar**:
- Coluna `motivoRejeicao text` para feedback ao empreiteiro.
- Coluna `mensagemContratante text` se o contratante quiser justificar aceite.

## 7. Endpoints
- `POST /api/empreiteiro/candidaturas` — criar (existente)
- `GET /api/empreiteiro/candidaturas` — minhas propostas
- `GET /api/contratante/minhas-obras/[id]/candidaturas` — listar propostas recebidas
- `POST /api/contratante/candidaturas/[id]/aceitar` — aceita uma, rejeita outras numa transação
- `POST /api/contratante/candidaturas/[id]/rejeitar`
- `POST /api/empreiteiro/candidaturas/[id]/cancelar` — antes de aceite

## 8. Mocks a remover
- Mocks de detalhe em [features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts](../../features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts) (parte do fluxo aplicar).
- Verificar se [features/contratante/minhas-obras/mocks/](../../features/contratante/minhas-obras/mocks/) injeta candidaturas mock.

## 9. Checklist de implementação
- [ ] Endpoint `aceitar` em transação: update da `obras` (empreiteiraId, status='em_andamento') + update das demais candidaturas para `rejeitada`
- [ ] Validação: empreiteiro não pode candidatar duas vezes na mesma obra
- [ ] Validação: contratante não pode candidatar na própria obra
- [ ] Tela de "propostas recebidas" no detalhe de obra do contratante
- [ ] Tela de "minhas candidaturas" para empreiteiro (nova ou aproveitar `obras-salvas`?)
- [ ] Disparo de notificação ao empreiteiro em aceite/rejeição (link J13)
- [ ] Cancelamento de candidatura própria pelo empreiteiro (antes do aceite)

## 10. Critérios de aceite
1. Empreiteiro candidata em obra → aparece em "propostas recebidas" do contratante.
2. Contratante aceita uma de N → `obras.empreiteira_id` setado, `obras.status='em_andamento'`, demais candidaturas com `status='rejeitada'`.
3. Obra some do marketplace J04.
4. Empreiteiro vê obra em "minhas-obras" e canal de chat fica disponível (J13).
5. Notificação visível para o empreiteiro vencedor e os rejeitados.

## 11. Riscos / Pontos de atenção
- Aceite precisa ser **atômico** (transação) — risco de inconsistência se falhar no meio.
- Race condition: dois aceites simultâneos em propostas diferentes da mesma obra. Resolver com lock otimista ou `SELECT ... FOR UPDATE`.
- `candidaturas.empreiteiroId` referencia `users.id` — verificar se o front está mandando o id certo (ou se devia referenciar `empreiteiras.id`).

## 12. Links cruzados
- Depende de: J01, J03, J04.
- Alimenta: J06, J08, J13.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- _Sem registros ainda._
