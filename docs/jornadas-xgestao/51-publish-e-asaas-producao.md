# XG51: publish e virada do Asaas para produção

Roteiro para publicar o xgestão e, depois, trocar o Asaas do sandbox para produção. Vale a partir das mudanças de 10/11/2026 (XG47 a XG50).

## 1. Publish com Asaas ainda em sandbox

### Antes de publicar (Replit → Publishing → Secrets do deploy)

Os valores do Asaas saíram de `[userenv.shared]` do `.replit`. O publicado só enxerga o que estiver nos Secrets do deploy.

| Secret | Valor agora (sandbox) |
|---|---|
| `PAYMENT_GATEWAY` | `asaas` |
| `ASAAS_ENVIRONMENT` | `sandbox` |
| `ASAAS_API_KEY` | chave do sandbox (começa com `$aact_hmlg_`) |
| `ASAAS_WEBHOOK_TOKEN` | o mesmo token cadastrado no webhook do painel sandbox |
| `ASAAS_WEBHOOK_IPS` | não criar |
| `E2E_TEST_AUTH` | não pode existir |
| `NEXT_PUBLIC_BASE_URL` e `NEXTAUTH_URL` | domínio público do site |
| `R2_*` | conferir. Se for o mesmo bucket do dev, criar `R2_KEY_PREFIX` próprio de produção |

Se `PAYMENT_GATEWAY` faltar, o site continua no ar, mas assinar, cancelar e trocar de plano respondem "Pagamentos indisponíveis no momento". O log do boot também mostra `ERRO de configuração`.

### Publicar

O banco de produção recebe as colunas e tabelas novas sozinho, no boot. O servidor só começa a atender depois disso, e a etapa leva menos de 1 segundo.

### Depois de publicar

1. No log do deploy, procurar:
   - `[boot] pagamentos: gateway=asaas asaas_env=sandbox`;
   - `schema health check passed`.
2. No painel do Asaas **sandbox**, em Integrações → Webhooks, o webhook deve estar assim:
   - URL `https://<domínio>/api/webhooks/gateway`;
   - API v3;
   - token igual ao `ASAAS_WEBHOOK_TOKEN`;
   - eventos de cobrança (`PAYMENT_*`) e de assinatura;
   - fila ativa.
3. Teste de fumaça no site publicado:
   - login, criar obra, enviar foto e abrir o link do cliente;
   - assinar com o cartão de teste do sandbox e, no painel sandbox, "confirmar recebimento";
   - conferir a assinatura ativa, o lançamento no caixa e o assinante no admin;
   - trocar de plano para cima e para baixo;
   - cancelar.
4. Arquivos antigos para privados. Rodar no banco e no bucket de produção (o Claude ajuda):
   - `npx tsx scripts/conferir-arquivos-multiplas-obras.ts` (deve dar 0);
   - `npx tsx scripts/migrar-arquivos-obra-privados.ts --dry-run`;
   - depois, rodar sem o `--dry-run`.

## 2. Virada do Asaas para produção

1. **Conta de produção.** Entrar em asaas.com com o CNPJ da empresa, completar o cadastro e enviar os documentos. A conta precisa estar aprovada.
2. **Cartão de crédito.** Na conta aprovada, conferir que cartão de crédito está liberado e as taxas.
3. **Tokenização de cartão.** Pedir ao atendimento do Asaas, pelo chat do painel ou pelo gerente de contas. Texto sugerido: "Quero habilitar a tokenização de cartão de crédito para assinaturas via API. Preciso alterar o valor de assinaturas recorrentes no cartão (troca de plano)." O Asaas analisa o cadastro antes de liberar. Sem a tokenização, a troca de plano não consegue mudar o valor no cartão em produção. O resto funciona.
4. **Chave de API.** Em Integrações → Chaves de API, gerar a chave de produção (começa com `$aact_prod_`). Ela aparece uma única vez: guarde num cofre.
5. **Webhook de produção.** Em Integrações → Webhooks, criar com:
   - URL `https://<domínio>/api/webhooks/gateway`;
   - API v3;
   - um token novo e forte de autenticação;
   - eventos de cobrança (`PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `PAYMENT_REFUND_IN_PROGRESS`, `PAYMENT_CHARGEBACK_REQUESTED`) e de assinatura;
   - fila ativa.

   O nome dos menus pode variar no painel.
6. **Domínio.** Se o painel pedir, cadastrar o domínio do site. Ele é o endereço de retorno do checkout.
7. **Secrets do deploy:**
   - `ASAAS_ENVIRONMENT=production`;
   - `ASAAS_API_KEY` com a chave de produção;
   - `ASAAS_WEBHOOK_TOKEN` com o token novo.

   Publicar de novo. O log deve mostrar `asaas_env=production` sem `ERRO`, e a faixa "Ambiente de testes" some. Se a chave e o ambiente não combinarem, o checkout fica recusado e o log avisa.
8. **Limpar dados de teste** no banco de produção: assinaturas e eventos do sandbox e `asaas_customer_id` do sandbox. Os ids do sandbox não existem na conta de produção. O Claude prepara o comando com prévia.
9. **Compra de teste real:**
   - marcar uma conta própria como interna no admin, para ela não entrar nas métricas;
   - assinar o Basic com cartão próprio e conferir assinatura, caixa e admin;
   - cancelar e estornar pelo painel do Asaas;
   - conferir que o estorno tira o acesso e aparece como saída no caixa.

## 3. Anual (quando quiser ligar)

- Preencher `valor_anual` de cada plano e ligar `anualAtivo` na chave `xgestao` de `platform_settings`. Ainda não há tela no admin para isso: o Claude faz pelo banco, com prévia.

A tela passa a mostrar a opção anual. A cobrança é anual, libera 12 meses e entra no caixa como um lançamento só. Enquanto não houver preço anual, a opção não aparece e a API recusa.
