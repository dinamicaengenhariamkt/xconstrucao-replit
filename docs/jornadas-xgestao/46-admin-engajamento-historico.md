# XG46 — Admin: engajamento e mês a mês (Lote C)

**Status:** implementado no dev em 10/11/2026, sem commit (Ramon commita pelo Replit).
**Pedido:** Ramon, 10/11/2026, último lote da visão do admin (XG44 e XG45 antes).

## 1. Páginas

| Página | O que mostra | Leva a |
|---|---|---|
| `/admin/xgestao` (home) | Dois números novos: pagantes ativos na semana (%) e quantos pararam de usar | Engajamento |
| `/admin/xgestao/engajamento` (nova, no menu) | Uso de pagantes, de quem está no teste e de todos (7 dias, 8 a 30, mais de 30, nunca); lista de quem paga ou testa e parou; tabela por assinante com último uso do responsável, da equipe, último registro e registros em 30 dias | Detalhe do assinante; lista filtrada "Sem uso" |
| `/admin/xgestao/historico` (nova, no menu "Mês a mês") | Últimos 12 meses: testes iniciados, começaram a pagar, saíram, pagantes no fim do mês, recorrente no fim do mês, recebido no mês; barras de recorrente e recebido | — |
| `/admin/xgestao/assinantes` | Filtro novo "Sem uso" (`?situacao=sem_uso`); "Último acesso" passa a considerar a sessão | Detalhe |
| `/admin/xgestao/assinantes/[id]` | Bloco de uso no cartão "Saúde das obras"; motivo "Sem usar há N dias" na atenção | — |
| CSV de assinantes | Colunas novas: uso, último uso da empresa, último registro, registros em 30 dias | — |

## 2. Regras do engajamento

Em `features/xgestao/admin/lib/engajamento.ts`. Sinais gravados pelo app, nada estimado:

- **Uso**: o mais recente entre o último login (`users.last_login_at`) e a última renovação
  da sessão (`sessions.last_used_at`, que o refresh grava a cada ~15 min de app aberto).
  Só o login não bastava: quem fica logado por 7 ou 30 dias não faz login de novo.
  Vale para o responsável e para cada pessoa da equipe.
- **Registro**: o último dado lançado nas obras (mesma conta da "obra parada": diário,
  financeiro, fotos, ocorrências, anexos, etapas, checklist e a criação da obra).
- O nível usa o mais recente dos três (responsável, equipe, registro): até 7 dias, 8 a 30,
  mais de 30, nunca.
- **Sem uso** (pede atenção): situação `pago` ou `em_teste` e 14 dias ou mais sem sinal.
  Quem cancelou, está pendente ou em somente leitura já tem motivo próprio.
- "Registros em 30 dias" conta diário, lançamentos financeiros, fotos, ocorrências e anexos.

## 3. Regras do mês a mês

Em `features/xgestao/admin/lib/historico-mensal.ts`. Reconstruído do que o banco já guarda,
sem tabela nova:

- Datas das assinaturas (`createdAt`, `renovaEm`, `canceladaEm`, status) e o evento
  `cancelamento_efetivado`, como no XG45. Períodos pagos que se tocam são unidos: troca de
  plano não é saída nem entrada; quem saiu e voltou conta como entrada de novo.
- Recebido = lançamentos de mensalidade do xgestão no caixa (XG45), pelo mês da data.
- Mês no fuso de São Paulo. No mês corrente vale a situação de hoje, e o recorrente bate
  com o do Financeiro.
- **Limite:** o banco não guarda desde quando um pagamento ficou pendente. Nos meses
  passados quem atrasou conta como pagante até perder o acesso.

## 4. Testes

| Tipo | Arquivo | O que prova |
|---|---|---|
| Unitário | `tests/unit/xgestao-admin-engajamento-historico.test.ts` | Níveis e limites de 7/30 dias, sinal mais recente, data futura, risco só para pago/teste a partir de 14 dias, resumo por grupo, motivo "sem uso"; meses e fuso, períodos unidos na troca de plano, histórico com teste, entrada, troca, saída efetivada, pendência no mês atual |
| Integração | `tests/e2e/integration/xgestao-admin-engajamento.integration.spec.ts` | Sessão vence o login antigo; parado 20 dias pede atenção; equipe ativa reativa a empresa; registro na obra conta e sai dos 30 dias quando envelhece; CSV e home; mês a mês com teste, assinatura, mensalidade recebida e cancelamento; recorrente igual ao Financeiro; acesso só admin |
| Navegador | `tests/e2e/xgestao-admin-engajamento.browser.spec.ts` | Home → Engajamento → assinante parado → lista "Sem uso" → Mês a mês pelo menu; celular sem rolagem lateral |
