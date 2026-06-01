# Jornada — UI de Assinatura (persona-facing)

> Status: pendente | Prioridade: média | Wave: 3
> Última atualização: 2026-06-01
>
> Fecha o lado VISÍVEL da J11. Todo o backend já existe e está testado — esta
> jornada é só front: plugar as telas de plano do contratante e do empreiteiro
> nos endpoints reais.

## 1. Contexto & Objetivo
A J11 entregou planos, checkout, cancelamento, gating e webhook — tudo funcional
via adapter manual. Mas as páginas `/contratante/planos` e `/empreiteiro/planos`
que o usuário final usa ainda não consomem esses endpoints. Esta jornada entrega
a experiência de escolher plano, assinar, ver "minha assinatura" e cancelar.

## 2. Personas
- **Contratante / Empreiteiro**: vê planos da sua persona, assina, gerencia, cancela.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  U[/contratante/planos] --> L[GET /api/planos]
  U --> A[POST /api/assinaturas/checkout]
  A --> ACT[adapter manual: ativa]
  ACT --> ST[users.plano atualizado]
  U --> C[POST /api/assinaturas/cancelar]
```

## 4. Telas envolvidas
- [app/contratante/planos/](../../app/contratante/planos/) — escolher/gerenciar plano.
- [app/empreiteiro/planos/](../../app/empreiteiro/planos/) — idem.
- Aba "Plano & Uso" em [app/contratante/configuracoes/](../../app/contratante/configuracoes/) e [app/empreiteiro/configuracoes/](../../app/empreiteiro/configuracoes/) — já lê `/api/perfil/plano`, conectar o CTA de upgrade.

## 5. Componentes-chave
- Cards de plano + botão assinar/cancelar (a criar/conectar em `features/contratante/` e `features/empreiteiro/`).
- Estado de "plano atual" derivado de `/api/perfil/plano`.

## 6. Schema (Drizzle)
Nada novo. Usa `planos`, `assinaturas` (J11).

## 7. Endpoints (já existem — J11)
- `GET /api/planos` — planos da persona.
- `POST /api/assinaturas/checkout` — assina (manual: ativa direto; gateway real: redirect).
- `POST /api/assinaturas/cancelar` — cancela.
- `GET /api/perfil/plano` — plano atual + uso/limites.

## 8. Mocks a remover
- Verificar se as páginas de plano persona têm dados hardcoded; se sim, trocar pelos endpoints.

## 9. Checklist de implementação
- [ ] `/contratante/planos` e `/empreiteiro/planos` listam planos reais (`GET /api/planos`)
- [ ] Botão "assinar" → `POST /api/assinaturas/checkout`; tratar `kind: redirect` (gateway real) vs `activated` (manual)
- [ ] Card "minha assinatura atual" (plano, uso vs limite, renova em) via `GET /api/perfil/plano`
- [ ] Botão "cancelar" → `POST /api/assinaturas/cancelar` com confirmação
- [ ] Tratar resposta 402 `LIMITE_PLANO` de J03/J05 com CTA de upgrade (upsell)
- [ ] Feedback de loading/erro

## 10. Critérios de aceite
1. Empreiteiro abre `/empreiteiro/planos` → vê free/pro/enterprise com preços reais.
2. Clica "assinar Pro" → assinatura ativa → `/api/perfil/plano` reflete tier pro.
3. Excede limite em J05 → recebe 402 → UI mostra upsell para upgrade.
4. Cancela → volta para free.

## 11. Riscos / Pontos de atenção
- Quando o gateway real (J14) entrar, o checkout passa a retornar `redirect` — a UI já deve tratar os dois `kind`.
- Não duplicar a lógica de limites no front: o servidor é a fonte de verdade (402).

## 12. Links cruzados
- Depende de: J11 (backend completo).
- Relacionada: J02 (aba Plano & Uso), J14 (quando o checkout virar redirect).

## 13. Gaps descobertos durante execução
- _Sem registros ainda._
