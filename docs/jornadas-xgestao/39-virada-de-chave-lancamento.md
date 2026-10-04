# Jornada — XG39: virada de chave do lançamento (limites e pagamento real)

> Status: planejada (executar só com o OK de lançamento do Ramon) | Prioridade: alta | Wave: xgestão-39
> Última atualização: 2026-10-04

## 1. Contexto & Objetivo

Na fase de teste o xgestão roda **sem limitador** e com pagamento em **sandbox**, de propósito.
Esta jornada junta tudo que precisa mudar no dia do lançamento, para nada ficar esquecido e para
a virada ser uma lista curta de passos conferíveis.

Regra: o código que aplica limites pode ser preparado antes, mas **desligado**. Nesta jornada só se
**liga** e se confere.

## 2. Personas

- **Ramon / admin**: executa a virada e confere.
- **Assinantes**: passam a ter limites reais e cobrança real.

## 3. Fluxo ponta-a-ponta

1. Ramon dá o OK de lançamento.
2. Limites de plano são ligados (obras e usuários).
3. Gateway muda de sandbox para produção.
4. Conferência ponta a ponta com uma assinatura real de valor baixo.

## 4. Telas envolvidas

- Aba Plano do xgestão e tela de planos — textos dos limites batendo com o que o servidor aplica
- Faixa "Ambiente de testes" nas telas de pagamento — precisa sumir

## 5. Componentes-chave

- [shared/lib/plans-catalog.ts](../../shared/lib/plans-catalog.ts) — `XGESTAO_FREEMIUM_OBRAS_ATIVAS_TEMP_LIMIT = 9999` (`:8`) e textos das features (`:125-142`)
- [server/bootstrap-planos.ts](../../server/bootstrap-planos.ts) — seed com `ON CONFLICT DO NOTHING` (não sobrescreve linha existente)
- [features/obras/api/create-obra.ts](../../features/obras/api/create-obra.ts) — aplicação do limite de obras (402)
- [features/xgestao/equipe/server/member-service.ts](../../features/xgestao/equipe/server/member-service.ts) — onde o limite de usuários seria aplicado no convite
- [features/planos/gateway/asaas-gateway.ts](../../features/planos/gateway/asaas-gateway.ts) — ambiente e webhook

## 6. Schema (Drizzle)

- Limite de usuários por plano: campo de limite no catálogo/linha de `planos` (preparar antes, desligado).
- Corrigir as linhas já semeadas em `planos` (UPDATE explícito; o seed não sobrescreve).

## 7. Endpoints

- `POST /api/xgestao/obras` — 402 `LIMITE_PLANO` passa a disparar de verdade
- `POST /api/xgestao/membros` — novo 402 ao estourar usuários do plano
- `POST /api/webhooks/gateway` — em produção

## 8. Mocks a remover

Nenhum.

## 9. Checklist de implementação

### Preparar antes (desligado)
- [ ] Limite de usuários por plano no convite de membro, atrás do mesmo mecanismo do limite de obras
- [ ] Teste de integração dos dois limites com valores reais num cenário de teste

### No dia da virada
- [ ] **Obras por plano:** Freemium 1 · Basic 3 · Pro 10 (XG03 §6). Trocar o `9999` e conferir as linhas em `planos`
- [ ] **Usuários por plano:** sugestão Freemium 1 · Basic 3 · Pro ilimitado (confirmar com o cliente)
- [ ] **Funcionalidades por plano:** aplicar o documento de planos do cliente, se já tiver chegado
- [ ] Textos de planos/upsell batendo com os limites aplicados
- [ ] `ASAAS_ENVIRONMENT=production`, chave de produção, webhook de produção com `ASAAS_WEBHOOK_TOKEN`
- [ ] `TRUST_PROXY_HEADERS=1` no publicado
- [ ] Faixa "Ambiente de testes" sumiu
- [ ] Assinaturas e obras de teste: decidir se limpa ou mantém antes de abrir

## 10. Critérios de aceite

1. Conta Freemium nova não cria a 2ª obra (402) e não convida o 2º usuário.
2. `SELECT persona, tier, limites FROM planos WHERE persona='xgestao';` (ou colunas equivalentes) mostra os valores de lançamento.
3. Uma assinatura real de valor baixo ativa o plano pelo webhook e aparece no admin.

## 11. Riscos / Pontos de atenção

- Contas criadas na fase de teste podem ter mais obras/usuários que o limite novo: aplicar a mesma
  regra da [XG35](35-teste-gratis-e-fim-do-teste.md) (nada some, só bloqueia criar).
- Trocar de sandbox para produção invalida assinaturas sandbox: avisar testadores.

## 12. Links cruzados

- Depende de: [XG33](33-ajustes-pendentes-mvp.md) (AJ-01, AJ-02), [XG35](35-teste-gratis-e-fim-do-teste.md), [XG37](37-equipe-empresa-fechamento.md), [XG38](38-termos-privacidade-no-ar.md)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada; recebe AJ-10/AJ-11 da XG33 e o limite de usuários da XG37.
