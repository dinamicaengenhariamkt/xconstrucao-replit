# Jornada — Satisfação & NPS/CSAT (surveys)

> Status: pronto | Prioridade: baixa | Wave: 4
> Última atualização: 2026-07-24
>
> **DESBLOQUEADA e implementada** (2026-07-24) com premissas de negócio padrão
> confirmadas com o dono: **NPS** disparado pós-conclusão de obra (às duas
> personas, 0-10) e **CSAT** disparado pós-pagamento (0-5, segmentado por
> persona). A coleta é **pulável** (o convite fica pendente nas notificações, não
> intercepta o fluxo). O card do admin volta a aparecer, mas só quando há
> respostas reais na janela — sem respostas, some (estado "dados pendentes"),
> nunca número inventado. Se o negócio quiser outra estratégia de coleta
> (momentos/frequência), ajustar os gatilhos em [features/surveys/triggers.ts](../../features/surveys/triggers.ts).

## 1. Contexto & Objetivo
Durante a J18 (Dashboard Financeiro Admin) ficou claro que NPS/CSAT **não têm
fonte de dados** no projeto — eram 100% mock. A decisão foi **ocultar** o bloco
na UI em vez de exibir números fictícios, e registrar aqui o que existe, por que
importa, e o procedimento para reativar quando houver coleta real.

Esta jornada cria o sistema de pesquisas de satisfação:
- **NPS** (Net Promoter Score): "de 0 a 10, o quanto você recomendaria…?" →
  promotores (9–10) − detratores (0–6), em escala −100..100.
- **CSAT** (Customer Satisfaction): nota média 0–5 por persona (clientes e
  empreiteiras), coletada em momentos-chave (pós-conclusão de obra, pós-pagamento).

## 2. Personas
- **Contratante / Empreiteiro**: respondem as pesquisas em momentos definidos.
- **Admin**: lê NPS/CSAT consolidados no dashboard financeiro.

## 3. Onde está oculto hoje (o que reativar)
- **Página**: [app/admin/financeiro/](../../app/admin/financeiro/) — o bloco
  "Satisfação dos usuários (NPS + CSAT)" foi comentado/ocultado (busque por
  `Bloco 2.45` em [app/admin/financeiro/page.tsx](../../app/admin/financeiro/page.tsx)).
- **Componente** (pronto, só desconectado): `SatisfactionMetricsSection` em
  [features/admin/financeiro/components/](../../features/admin/financeiro/components/).
- **Shape de referência** (tipo vivo, usado pelo componente):
  [features/admin/financeiro/types/index.ts](../../features/admin/financeiro/types/index.ts) → `SatisfactionMetrics`:
  ```ts
  interface SatisfactionMetrics {
    npsScore: number;        // -100..100
    npsDelta: number;        // vs período anterior
    npsResponses: number;    // nº de respostas
    csatClientes: number;    // 0..5
    csatEmpreiteiras: number;// 0..5
    breakdown: { promotores: number; neutros: number; detratores: number }; // %
  }
  ```

## 4. Fluxo ponta-a-ponta (quando desbloquear)
```mermaid
flowchart LR
  EV[evento gatilho: obra concluída / pagamento] --> SV[cria survey pendente]
  SV --> U[persona responde 0-10 / 0-5]
  U --> DB[(respostas)]
  DB --> AGG[agrega NPS/CSAT]
  AGG --> ADM[/admin/financeiro: SatisfactionMetricsSection]
```

## 5. Schema (Drizzle) — a criar
- `surveys` — uma pesquisa enviada (tipo nps|csat, persona, contexto/obraId, status, enviadoEm).
- `survey_respostas` — resposta (surveyId, nota, comentário?, respondidoEm). Único por survey.
- Índices por `tipo + respondidoEm` para a agregação por período.

## 6. Endpoints — a criar
- `POST /api/surveys/[id]/responder` — registra a resposta da persona.
- `GET /api/admin/financeiro/satisfacao` — NPS/CSAT consolidados (substitui o mock).
- (Opcional) job/trigger que cria o survey nos eventos de conclusão/pagamento.

## 7. Procedimento para reativar (passo a passo)
1. **Definir com o cliente final** a estratégia de coleta (momentos, frequência, canais).
2. Criar as tabelas `surveys`/`survey_respostas` e a migration.
3. Implementar a criação do survey nos gatilhos (J06 conclusão, J08 pagamento).
4. Criar `GET /api/admin/financeiro/satisfacao` calculando NPS (promotores−detratores)
   e CSAT (média 0–5) por persona, no mesmo shape de `SatisfactionMetrics`.
5. Criar o hook `useSatisfacao()` e **reconectar** `SatisfactionMetricsSection`
   (hoje oculta) ao endpoint real — reexibir o "Bloco 2.45".
6. (O mock `satisfaction-metrics.mock.ts` já foi removido no cleanup da J18 — 2026-06-03; o shape vive em `features/admin/financeiro/types`.)

## 8. Critérios de aceite (quando desbloquear)
1. Persona responde survey → linha em `survey_respostas`.
2. `/admin/financeiro` mostra NPS/CSAT reais (não mock), com nº de respostas real.
3. Sem respostas → estado "dados pendentes" honesto (não zero falso).

## 9. Riscos / Pontos de atenção
- Não exibir NPS/CSAT inventado em hipótese alguma — melhor ocultar (estado atual).
- Frequência de pesquisa: cuidado com fadiga (não perguntar a cada interação).
- LGPD: comentários livres podem conter dados pessoais — tratar como tal.

## 10. Links cruzados
- Originada por: J18 (que ocultou o bloco por falta de fonte).
- Gatilhos de coleta: J06 (conclusão de obra), J08 (pagamento).
- Relacionada: J17/J18 §13 (deltas "vs período anterior" também dependem de baseline).

## 11. Gaps descobertos durante execução
- 2026-06-01: Jornada criada como continuação de J18. NPS/CSAT ocultados na UI do
  admin (sem fonte). Bloqueada até o usuário definir a estratégia de coleta com o
  cliente final.
- 2026-06-03: O mock `satisfaction-metrics.mock.ts` foi removido no cleanup de mocks
  órfãos da J18 (não era importado por código). O shape de referência permanece vivo
  em `features/admin/financeiro/types` (`SatisfactionMetrics`), usado pelo componente.
- 2026-07-24: **Desbloqueada e implementada** com premissas padrão aprovadas pelo
  dono. Entregue:
  - **Schema**: `surveys` + `survey_respostas` ([shared/db/schema.ts](../../shared/db/schema.ts)),
    aplicado via SQL idempotente (o `db:push` interativo não roda headless neste ambiente).
  - **Service/gatilhos**: [features/surveys/service.ts](../../features/surveys/service.ts) e
    [features/surveys/triggers.ts](../../features/surveys/triggers.ts). NPS na transição
    `→concluida` (PATCH de obra + edição admin do dossiê); CSAT após `quitarLancamento`.
    Idempotentes pela unique `uq_surveys_tipo_persona_origem` — reenvio do evento não duplica.
  - **Endpoints**: `POST /api/surveys/[id]/responder` (authz por dono, 404/403/409/422),
    `GET /api/surveys/pendentes`, `GET /api/admin/financeiro/satisfacao` (204 quando não há base).
  - **Agregação**: `getSatisfactionMetrics` em
    [caixa-service.ts](../../features/admin/financeiro/api/caixa-service.ts) — NPS/CSAT reais,
    janela 90d, `npsDelta` vs 90d anteriores.
  - **UI**: card de coleta pulável nas notificações das duas personas
    ([features/surveys/components/SurveyPendenteCard.tsx](../../features/surveys/components/SurveyPendenteCard.tsx));
    `SatisfactionMetricsSection` reconectada no admin via `useSatisfacao()` (Bloco 2.45 reexibido).
  - **Testes**: [tests/e2e/integration/j20-satisfacao.integration.spec.ts](../../tests/e2e/integration/j20-satisfacao.integration.spec.ts) — 9 casos verdes.
  - **Decisão pendente de negócio (não-bloqueante)**: a estratégia de coleta ficou na premissa
    padrão. Se o dono quiser NPS trimestral, frequência limitada, ou outros gatilhos, é ajuste
    localizado em `triggers.ts` — a fundação já está pronta.
- 2026-07-24: **`empreiteiras.avaliacao` NÃO virou fonte de NPS/CSAT** — é seed-only,
  cosmético, sem write-path real. NPS/CSAT usam exclusivamente `survey_respostas`.
