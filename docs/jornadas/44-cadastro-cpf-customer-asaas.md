# Jornada — Cadastro: CPF/CNPJ + Customer Asaas Proativo

> Status: concluída | Prioridade: alta | Wave: 10
> Última atualização: 2026-07-22
>
> Observação: fecha um **gap bloqueante de produção** da J11 — o Asaas exige
> CPF/CNPJ para cobrança real.
>
> **CONCLUÍDA (2026-07-22):** CPF/CNPJ coletado no cadastro
> (`registerSchema.cpfCnpj`, obrigatório p/ contratante/empreiteiro, validação de
> dígito) e enviado ao Asaas no checkout. **Customer proativo** implementado:
> `provisionarCustomerAsaas` (`features/marketplace/customer-service.ts`) roda
> best-effort no register (gate `PAYMENT_GATEWAY=asaas`, falha não bloqueia
> cadastro) e persiste `users.asaas_customer_id`. `iniciarCheckout` passa
> `userAsaasCustomerId` ao gateway, que o usa em vez do lookup lazy por email.

## 1. Contexto & Objetivo
Coletar o documento fiscal do usuário e criar o customer Asaas **proativamente** (decisão de produto: "o cara já vai ter conta no Asaas após o cadastro"), em vez de lazy no primeiro checkout. Isso torna a cobrança de assinatura viável em produção e prepara o terreno para o empreiteiro virar recebedor (J45).

## 2. Personas
- **Contratante / Empreiteiro / Anunciante**: informa CPF/CNPJ (no cadastro ou numa etapa pós-cadastro antes do 1º pagamento).
- **Sistema**: cria o customer Asaas best-effort e persiste `asaas_customer_id`.

## 3. Fluxo ponta-a-ponta
1. Usuário se cadastra em `/cadastro` (`registerSchema`).
2. `cpf_cnpj` é coletado (opcional no register; **obrigatório antes do 1º pagamento**).
3. No registro, `createUserWithProfile` chama `findOrCreateCustomer` (best-effort) → persiste `users.asaas_customer_id`.
4. No checkout de assinatura, `iniciarCheckout` passa `userCpfCnpj` para o gateway (que hoje aceita mas nunca recebe).

```mermaid
flowchart LR
  A[/cadastro/] --> B[register + cpf_cnpj]
  B --> C{Asaas disponível?}
  C -- sim --> D[cria customer → users.asaas_customer_id]
  C -- falha --> E[fallback lazy no 1º checkout]
  D --> F[checkout passa userCpfCnpj]
```

## 4. Telas envolvidas
- [app/cadastro/page.tsx](../../app/cadastro/page.tsx) — campo CPF/CNPJ (ou etapa pós-cadastro).
- Etapa pós-cadastro / configurações onde o CPF/CNPJ vira obrigatório antes de pagar (reusar seções de perfil existentes).

## 5. Componentes-chave
- [features/auth/schemas/index.ts](../../features/auth/schemas/index.ts) — `registerSchema`: add `cpfCnpj` com validação (CPF 11 / CNPJ 14 dígitos).
- [app/api/auth/register/route.ts](../../app/api/auth/register/route.ts) — orquestra o registro.
- [features/auth/api/auth-storage.ts](../../features/auth/api/auth-storage.ts) — `createUserWithProfile`: chamar `findOrCreateCustomer` best-effort.
- [features/planos/assinatura-service.ts](../../features/planos/assinatura-service.ts) — `iniciarCheckout`: popular `userCpfCnpj` (hoje só passa name/email).
- [features/planos/gateway/asaas-gateway.ts](../../features/planos/gateway/asaas-gateway.ts) — `findOrCreateCustomer` já aceita `cpfCnpj`.

## 6. Schema (Drizzle)
Reusa colunas criadas em J42: `users.cpf_cnpj`, `users.asaas_customer_id`. Sem novas tabelas.

## 7. Endpoints
- `POST /api/auth/register` — passa a persistir `cpf_cnpj` e (best-effort) `asaas_customer_id`.
- (Opcional) `PATCH /api/perfil` ou similar — permitir informar/atualizar CPF/CNPJ pós-cadastro.

## 8. Mocks a remover
- Nenhum mock removido; porém elimina o **fallback frágil** de `findOrCreateCustomer` por email a cada checkout (passa a usar `asaas_customer_id` persistido quando existir).

## 9. Checklist de implementação
- [x] `cpfCnpj` no `registerSchema` com validação de formato
- [x] Coleta na tela de cadastro (ou etapa pós-cadastro) — decidir UX de fricção
- [x] `createUserWithProfile` cria customer Asaas **best-effort não-bloqueante** (falha do Asaas NÃO impede cadastro; fallback lazy mantido)
- [x] Persistir `users.asaas_customer_id`
- [x] `iniciarCheckout` popula `userCpfCnpj` _(implementado lendo de `clientes.cnpj_cpf`/`empreiteiras.cnpj`, não de `users.cpf_cnpj` como o roteiro previa — funciona, mas diverge do desenho; ver §13)_
- [x] Guard: bloquear checkout de assinatura se `cpf_cnpj` ausente (mensagem amigável)
- [x] Gate atrás de `PAYMENT_GATEWAY=asaas` — não disparar chamadas Asaas em ambiente sem chave
- [x] Teste de integração em `tests/e2e/integration/` (registro persiste cpf_cnpj; checkout envia documento)

## 10. Critérios de aceite
1. Cadastro com CPF válido persiste `users.cpf_cnpj` e, com Asaas disponível, `asaas_customer_id`.
2. Cadastro com Asaas **indisponível** ainda conclui (customer criado lazy depois).
3. Checkout de assinatura em sandbox envia o CPF/CNPJ ao Asaas (verificável no painel).
4. Query: `SELECT cpf_cnpj, asaas_customer_id FROM users WHERE email='<user e2e>';` retorna os valores.

## 11. Riscos / Pontos de atenção
- **Fricção no funil**: exigir CPF/CNPJ no signup pode reduzir conversão. Recomendação: opcional no register, obrigatório na porta do pagamento.
- Criação do customer é **best-effort**: nunca bloquear o cadastro por falha de rede do Asaas (há transação + rollback de consentimento no register — tratar o customer fora do caminho crítico).
- Validar CPF/CNPJ (formato + dígito verificador) antes de enviar — o Asaas rejeita documento inválido.

## 12. Links cruzados
- Depende de: J42 (colunas em `users`), J43 (não estritamente — usa `findOrCreateCustomer` já existente).
- Bloqueia: J45 (empreiteiro precisa de CPF/CNPJ para abrir subconta).
- Fecha gap de: J11 (CPF/CNPJ ao Asaas).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-07-26 — BUG DE PRODUÇÃO: `users.cpf_cnpj` nunca era populado.** Encontrado
  em auditoria de código. `createUserWithProfile` ([features/auth/api/auth-storage.ts](../../features/auth/api/auth-storage.ts))
  recebia o documento e gravava em `clientes.cnpj_cpf` / `empreiteiras.cnpj`, mas
  **não** na coluna `users.cpf_cnpj` criada pela J42 — não existia um único
  `update`/`insert` dessa coluna no projeto inteiro. Prova no banco antes do fix:
  `SELECT count(*), count(cpf_cnpj) FROM users` → **9 usuários, 0 com documento**.

  **Impacto:** [features/marketplace/subconta-service.ts](../../features/marketplace/subconta-service.ts)
  lê justamente essa coluna para abrir a subconta Asaas do empreiteiro (J45). Com
  ela sempre NULL, o onboarding de recebimento respondia `PERFIL_INCOMPLETO` —
  "Informe seu CPF/CNPJ" num formulário onde o dado já tinha sido informado, **sem
  saída possível pela UI**. Estava latente só porque `MARKETPLACE_SPLIT=off`; teria
  quebrado todo empreiteiro no dia do rollout do split. Também derrubava o critério
  de aceite 4 desta jornada.

  **Correção:** documento gravado no `insert(users)` da mesma transação do perfil +
  [scripts/backfill-user-cpf-cnpj.ts](../../scripts/backfill-user-cpf-cnpj.ts) para
  as contas anteriores (normaliza para dígitos, nunca sobrescreve valor existente,
  tem `--dry-run`). Regressão coberta em `auth-conta.integration.spec.ts`
  ("cadastro persiste o documento em users.cpf_cnpj").

- **2026-07-26 — Regra de documento por persona (decisão de produto).**
  `registerSchema` passou a diferenciar: **empreiteiro só aceita CNPJ** (cadastro é
  de pessoa jurídica — quem executa a obra atua como empresa); **contratante** segue
  aceitando CPF ou CNPJ (pode ser tanto alguém reformando a própria casa quanto uma
  empresa contratando outra). **Anunciante** não muda: o documento continua sendo
  coletado no *checkout do anúncio* (customer lazy do Asaas), não no cadastro —
  duplicar a coleta criaria dois pontos de verdade para o mesmo dado. A tela de
  cadastro adapta label, placeholder e texto de ajuda conforme a persona.
  Empreiteiros legados com CPF ficam registrados no `_backlog-paralelo.md` (P2).

- **2026-07-29 — A coleta SAIU do cadastro (revisado pela J61).** A decisão de
  produto mudou: a primeira tela pede só os dados básicos. O documento passou a
  ser coletado no wizard de onboarding (pulável) ou nas Configurações, e a
  obrigatoriedade vive na porta da ação — exatamente a recomendação que o §11
  desta jornada já fazia ("opcional no register, obrigatório na porta do
  pagamento"), agora estendida também a publicar obra e enviar proposta.
  `registerSchema.cpfCnpj` virou opcional; a **regra por persona e a validação de
  dígito verificador continuam valendo quando o documento é informado**. O
  provisionamento do customer Asaas ganhou um segundo ponto de disparo (o PATCH
  de perfil), já que o cadastro pode não receber documento nenhum. Ver
  [J61](61-perfil-minimo-operar.md).
