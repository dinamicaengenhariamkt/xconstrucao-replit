# Jornada — Atividades & Timeline

> Status: mock | Prioridade: média | Wave: 3
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Feed cronológico unificado de eventos (candidatura criada, aceite, medição, pagamento, mensagem) por obra e por usuário. Ajuda contratante e empreiteiro a verem "o que aconteceu" sem entrar em cada subtela; alimenta a sensação de progresso.

## 2. Personas
- **Contratante / Empreiteiro**: timeline pessoal e por obra.
- **Admin**: auditoria global (`features/admin/auditoria/`).

## 3. Fluxo ponta-a-ponta
1. Cada jornada que origina um evento (J05, J06, J08, J13) grava uma row em `atividades`.
2. Front consome `GET /api/atividades` filtrando por obra ou por usuário.
3. UI mostra ícone, descrição, link para o objeto relacionado, timestamp relativo.

## 4. Telas envolvidas
- [app/contratante/atividades/](../../app/contratante/atividades/)
- [app/empreiteiro/dashboard/](../../app/empreiteiro/dashboard/) (widget de atividades recentes)
- [app/contratante/dashboard/](../../app/contratante/dashboard/) (widget)
- [app/admin/auditoria/](../../app/admin/auditoria/) (visão admin)

## 5. Componentes-chave
- [features/contratante/dashboard/mocks/activities.mock.ts](../../features/contratante/dashboard/mocks/activities.mock.ts)
- [features/empreiteiro/dashboard/mocks/activities.mock.ts](../../features/empreiteiro/dashboard/mocks/activities.mock.ts)
- [features/admin/auditoria/](../../features/admin/auditoria/)

## 6. Schema (Drizzle)
**A criar**:
- `atividades` (id, tipo [enum], obraId nullable, atorUserId, objetoId, objetoTipo, descricao, metadata jsonb, criadaEm)
- Enum `atividade_tipo` (`candidatura_criada`, `candidatura_aceita`, `candidatura_rejeitada`, `medicao_criada`, `medicao_aprovada`, `medicao_contestada`, `pagamento_efetuado`, `mensagem_enviada`, `obra_criada`, `obra_concluida`, ...).

## 7. Endpoints
- `GET /api/atividades?obraId=&userId=&limit=&cursor=`
- `GET /api/admin/auditoria` — superset com mais detalhes técnicos

## 8. Mocks a remover
- [features/contratante/dashboard/mocks/activities.mock.ts](../../features/contratante/dashboard/mocks/activities.mock.ts)
- [features/empreiteiro/dashboard/mocks/activities.mock.ts](../../features/empreiteiro/dashboard/mocks/activities.mock.ts)
- [features/admin/auditoria/mocks/](../../features/admin/auditoria/mocks/)

## 9. Checklist de implementação
- [ ] Definir lista canônica de tipos de evento
- [ ] Criar tabela + enum + migration
- [ ] Helper `registrarAtividade(tipo, ator, objeto, metadata)` em [server/storage.ts](../../server/storage.ts)
- [ ] Plugar o helper nas jornadas geradoras (J03, J05, J06, J08, J13)
- [ ] Endpoint paginado por cursor
- [ ] Substituir mocks dos widgets de dashboard
- [ ] Página dedicada `/contratante/atividades`

## 10. Critérios de aceite
1. Após contratante criar obra → aparece "Obra X criada" no feed.
2. Após empreiteiro candidatar → aparece "Y se candidatou para X".
3. Filtrar por obra mostra todos os eventos só dela.
4. Atividade tem link para o objeto relacionado (clica em "candidatura aceita" → vai pro detalhe).

## 11. Riscos / Pontos de atenção
- Volume: `atividades` pode crescer rápido. Indexar `(obra_id, criada_em DESC)` e `(ator_user_id, criada_em DESC)`.
- Não duplicar com J13 (notificações). Distinção: atividade = registro histórico, notificação = alerta com canal/leitura. Mesmo evento pode gerar ambos.
- Privacidade: ator não deve ver eventos de obras que não são dele.

## 12. Links cruzados
- Depende de: J05, J06, J08 (geradoras de evento) — escrever a infra primeiro mas plugar gradualmente.
- Relacionada: J13.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- _Sem registros ainda._
