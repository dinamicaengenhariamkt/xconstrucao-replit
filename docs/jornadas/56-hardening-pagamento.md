# Jornada — Hardening dos Fluxos de Pagamento

> Status: pronto | Prioridade: alta | Wave: 11
> Última atualização: 2026-07-22
>
> Correções pontuais de robustez/validação/idempotência descobertas na auditoria ASAAS.
> A arquitetura de erro dos 3 fluxos (assinatura, split de obra, anúncio) já era madura
> (feedback ao usuário, nenhuma tela travada); estes são reforços de defesa em profundidade.

## 1. Contexto & Objetivo
Auditoria dos fluxos de pagamento apontou 3 lacunas de baixo risco (nenhuma travava a tela).
Objetivo: fechá-las reusando padrões já existentes no próprio código.

## 2. Correções
1. **CPF/CNPJ com checksum no `/pagar`** — [app/api/anuncios/pedidos/[id]/pagar/route.ts](../../app/api/anuncios/pedidos/[id]/pagar/route.ts):
   o schema zod validava só comprimento; passou a usar `isCpfCnpjValid` ([masks.ts](../../shared/lib/masks.ts)),
   que checa o dígito verificador — mesma função do cadastro/configurações. Impede request direto
   à API com documento inválido (defesa em profundidade; o client já validava).
2. **Guarda idempotente no checkout-split** — [features/marketplace/split-service.ts](../../features/marketplace/split-service.ts):
   antes o `iniciarCheckoutSplit` fazia `INSERT` incondicional + cobrança ASAAS, então dois cliques
   rápidos podiam criar 2 cobranças. Agora, se já existe split `pendente` com `invoiceUrl` para o
   mesmo `financeiroId`, **reusa** a URL — espelha o guard do anúncio (`gerarLinkPagamento`). Nova
   coluna `pagamentos_split.invoice_url` (bootstrap idempotente `ADD COLUMN IF NOT EXISTS`).
3. **Guarda de URL vazia no redirect** — [pagamentos/page.tsx](../../app/contratante/pagamentos/page.tsx)
   e [use-planos.ts](../../features/planos/ui/use-planos.ts): antes de `window.location.assign`,
   checa URL vazia (evita navegar para "undefined" num caminho futuro que retorne ok sem URL).

## 3. Mocks
Nenhum. Todos os fixes reusam utilitários/colunas existentes.

## 4. Checklist
- [x] CPF/CNPJ com checksum no `/pagar`
- [x] Guarda idempotente no checkout-split (coluna `invoice_url` + reuso)
- [x] Guarda de URL vazia nos 2 redirects de pagamento

## 5. Nota de cobertura de teste
Os fixes 1 e 2 vivem **atrás de gates** que a suíte de integração corta antes no modo manual:
`/pagar` retorna 404 (flag `AD_PAYMENT_GATEWAY` off) antes de validar o CPF; `iniciarCheckoutSplit`
retorna `SPLIT_DESABILITADO` antes do INSERT. A validação real deles depende de **ASAAS sandbox**
(caminho feliz, ver bloco condicional em [checkout-split.integration.spec.ts](../../tests/e2e/integration/checkout-split.integration.spec.ts))
ou de **testes unitários** (J35, ainda sem Vitest). A suíte completa foi rodada só para garantir
que as mudanças de schema/rota **não quebraram** nada existente.

## 6. Follow-ups (não implementados)
- **Rate-limiter distribuído** (risco médio no saque em multi-instância): o rate-limit atual é
  em memória ([rate-limit.ts](../../features/auth/api/rate-limit.ts)); um distribuído exige
  Redis/KV externo (não há no projeto). Jornada de infra própria.

## 7. Links cruzados
- Origem: auditoria ASAAS (J31/J47/J11). Reusa padrão idempotente do anúncio (J31).
