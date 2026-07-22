# Jornada — Saldo e Saque do Empreiteiro (Transferência)

> Status: concluída | Prioridade: média | Wave: 10
> Última atualização: 2026-07-22
>
> Observação: menor prioridade — o crédito no split já é automático; o saque
> pode começar manual pelo painel Asaas. Esta jornada traz o saque para dentro
> da plataforma.
>
> **CONCLUÍDA (2026-07-22):** tabela `saques` (histórico local, enum
> `saque_status`, bootstrap idempotente verificado). `features/marketplace/
> saldo-service.ts` DECIFRA a apiKey da subconta (vault) só em memória e chama
> `getBalance`/`requestTransfer`; guards valor>0 ≤ saldo + subconta aprovada.
> Endpoints `GET /api/empreiteiro/recebimento/saldo` e `POST .../saque`
> (rate-limit apertado no saque). Página `app/empreiteiro/saldo/page.tsx` (saldo
> + form de saque + histórico) + item de nav "Meu Saldo". Testes: 8 guards verdes
> (incl. gate não cria `saques`); caminho feliz skipado (ASAAS sandbox).

## 1. Contexto & Objetivo
Depois do split (J48), o empreiteiro tem saldo na subconta Asaas. Esta jornada dá a ele uma tela "Meu saldo" para ver o saldo real e **solicitar saque** para o banco dele (ex: Itaú) direto pela plataforma, via `/transfers` do Asaas — sem entrar no painel Asaas.

## 2. Personas
- **Empreiteiro**: consulta saldo e solicita transferência para a conta bancária/PIX cadastrada.
- **Sistema**: consulta `getBalance` e dispara `requestTransfer` no contexto da subconta.

## 3. Fluxo ponta-a-ponta
1. Empreiteiro abre "Meu saldo".
2. Plataforma chama `getBalance` (com a apiKey cifrada da subconta) → mostra saldo.
3. Empreiteiro solicita saque → `requestTransfer` (PIX/TED para a conta cadastrada em J45).
4. Status do saque exibido (pendente/concluído).

```mermaid
flowchart LR
  A[Meu saldo] --> B[getBalance - apiKey subconta]
  B --> C[exibe saldo]
  C --> D[solicitar saque]
  D --> E[requestTransfer /transfers]
```

## 4. Telas envolvidas
- `app/empreiteiro/saldo/page.tsx` — **a criar**: saldo + histórico + botão de saque.

## 5. Componentes-chave
- `features/marketplace/saldo-service.ts` — **a criar** (ou estender `subconta-service.ts`): decifra apiKey, chama `getBalance`/`requestTransfer`.
- [shared/lib/asaas-client.ts](../../shared/lib/asaas-client.ts) — `getBalance`, `requestTransfer` (J43).
- Reusar dados bancários/PIX de `asaas_subcontas` (J42/J45).

## 6. Schema (Drizzle)
Reusa `asaas_subcontas`. Opcional: tabela `saques` para histórico local (id, user_id, valor, status, asaas_transfer_id, created_at) — avaliar na execução se o histórico do Asaas basta ou se queremos espelho local.

## 7. Endpoints
- `GET /api/empreiteiro/recebimento/saldo` — saldo atual da subconta.
- `POST /api/empreiteiro/recebimento/saque` — solicita transferência (guard: só empreiteiro dono; exige subconta aprovada + saldo suficiente).

## 8. Mocks a remover
- Nenhum mock pré-existente. Nunca exibir saldo fixo/fake — sempre `getBalance` real.

## 9. Checklist de implementação
- [ ] Tela "Meu saldo" em `app/empreiteiro/saldo`
- [ ] `GET /api/empreiteiro/recebimento/saldo` (getBalance com apiKey da subconta)
- [ ] `POST /api/empreiteiro/recebimento/saque` (requestTransfer)
- [ ] (Opcional) tabela/histórico local `saques`
- [ ] Guards: subconta `aprovada`, saldo suficiente, valor > 0
- [ ] Gate `MARKETPLACE_SPLIT`
- [ ] Teste de integração (`tests/e2e/integration/`): saldo retorna valor; saque cria transfer em sandbox

## 10. Critérios de aceite
1. Empreiteiro com subconta aprovada vê o saldo real da subconta em sandbox.
2. Solicita saque válido → `requestTransfer` cria transferência (assert no sandbox).
3. Saque acima do saldo → erro amigável.
4. Subconta não aprovada → tela bloqueada com orientação.

## 11. Riscos / Pontos de atenção
- **Saque bancário real (Itaú) não é testável em sandbox** — validar manualmente em produção controlada.
- apiKey da subconta é decifrada apenas em memória no server — nunca expor ao client nem logar.
- Definir política de saque (mínimo, taxa, agendamento) com o negócio antes de habilitar em produção.
- Considerar rate-limit no endpoint de saque.

## 12. Links cruzados
- Depende de: J43 (`getBalance`/`requestTransfer`), J45 (subconta + dados bancários), J48 (crédito via split).
- Relacionada: J50 (reconciliação de saldo).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-07-22: optou-se por tabela local `saques` (histórico + base de reconciliação J50) em vez de confiar só no Asaas (decisão de produto). Enum `saque_status`: pendente|concluido|falhou. Marca `concluido` só quando o Asaas retorna DONE/CONFIRMED; senão fica `pendente` até reconciliação.
- 2026-07-22: a apiKey da subconta é decifrada (`crypto-vault.decrypt`) SÓ em memória no `saldo-service.ts` (server) — confirmado que não vaza ao client (grep no page/hook). Primeira jornada a LER de volta o `asaas_api_key_enc` cifrado na J45.
- 2026-07-22: política de saque desta rodada = guards essenciais (valor>0, ≤ saldo real via getBalance, subconta aprovada, rate-limit 5/min). Valor mínimo/taxa ficam como decisão de negócio futura (não implementados).
- 2026-07-22: `rm -rf .next-e2e` após rodar testes E2E — o dir gerado pelo Next entra no `include` do tsconfig e um build parcial quebra o `npm run check` até ser removido/regerado.
