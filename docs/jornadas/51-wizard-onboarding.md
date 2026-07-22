# Jornada — Wizard de Onboarding (Primeiro Acesso)

> Status: pendente | Prioridade: alta | Wave: 11
> Última atualização: 2026-07-22
>
> Observação: introduz um passo-a-passo pós-cadastro (hoje inexistente: o fluxo é
> `cadastro → verificar email → login → dashboard cru`). O wizard é **pulável** —
> dados só viram obrigatórios na porta do pagamento. **Não** reconstrói a criação
> de conta Asaas: reusa o provisionamento proativo silencioso já entregue na J44
> (`provisionarCustomerAsaas`). Decisões de produto confirmadas com o dono em
> 2026-07-22 (ver §11).
>
> **Decisão de arquitetura do gate (2026-07-22, durante execução):** o gate do
> wizard **NÃO** é `perfilCompleto` — descobriu-se que ele é 100% derivado pelo
> servidor (`isProfileComplete` exige 9 campos, incluindo avatar), incompatível
> com um wizard pulável. O gate passa a ser uma flag dedicada
> **`users.onboarding_concluido`** (default `false`), marcada `true` ao **concluir
> OU pular** o wizard. `perfilCompleto` segue com sua semântica original ("perfil
> rico 100% preenchido") e é intocado.

## 1. Contexto & Objetivo
Dar ao recém-cadastrado um primeiro acesso guiado em vez de largá-lo cru no dashboard: escolher **PF/PJ explicitamente** (hoje é heurística por tamanho do documento), completar dados de empresa e ver os planos no momento de maior atenção — com **merchandising do plano pago** e "começar no free" como saída. O objetivo é aumentar a qualidade do perfil e a conversão para pago **sem** adicionar fricção bloqueante ao funil de cadastro.

## 2. Personas
- **Contratante**: informa tipo PF/PJ + dados de empresa; vê planos; pode pular.
- **Empreiteiro**: idem; adicionalmente é convidado (opcional) a configurar recebimento (link para a seção da J45, atrás de `MARKETPLACE_SPLIT`).
- **Anunciante**: wizard **enxuto** — não escolhe plano de assinatura nem configura recebimento (não é pagador de plano nem recebedor Asaas). Só dados mínimos, se houver.
- **Sistema**: mantém a criação silenciosa do customer Asaas no cadastro (J44); marca `perfilCompleto=true` ao concluir.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  A[/cadastro/] --> B[verificar email] --> C[/login]
  C --> D{perfilCompleto?}
  D -- false --> W[/onboarding wizard]
  D -- true --> DASH[dashboard da persona]
  W --> P1[Passo 1: PF/PJ + empresa]
  P1 --> P2[Passo 2: empreiteiro → link recebimento J45]
  P2 --> P3[Passo 3: planos — empurra pago, free como saída]
  P3 --> P4[Concluir → perfilCompleto=true] --> DASH
  W -. pular por agora .-> DASH
```

1. Após login, o consumidor do redirect verifica `onboardingConcluido`. Se `false`, desvia para `/onboarding`; senão, dashboard.
2. **Passo 1** — Tipo (PF/PJ explícito) + dados de empresa (nome/razão social, CNPJ pré-preenchido do cadastro). Grava via endpoint de perfil existente.
3. **Passo 2 (empreiteiro)** — cartão opcional "Configurar recebimento" que **linka** para `SecaoRecebimentos` (J45), atrás de `MARKETPLACE_SPLIT`. Não duplica o formulário de subconta.
4. **Passo 3** — Planos: destaque do pago (benefícios), "começar no free" visível. Reusa catálogo/checkout existentes. Anunciante pula este passo.
5. **Passo 4** — Concluir → `perfilCompleto=true` → dashboard.
6. **Pular por agora** — disponível em todos os passos → dashboard, `perfilCompleto` permanece `false` (wizard reaparece no próximo login até completar). Dados só viram obrigatórios na porta do pagamento (guard já existente no checkout).

## 4. Telas envolvidas
- `app/onboarding/` — **a criar**: wizard multi-step client-side (não existe hoje).
- [app/contratante/configuracoes/page.tsx](../../app/contratante/configuracoes/page.tsx) e [app/empreiteiro/configuracoes/page.tsx](../../app/empreiteiro/configuracoes/page.tsx) — destino canônico dos dados; o wizard reusa os mesmos endpoints de perfil, não cria escrita paralela.

## 5. Componentes-chave
- [features/marketplace/customer-service.ts](../../features/marketplace/customer-service.ts) — `provisionarCustomerAsaas` (J44): **mantido intacto**, já cria o customer Asaas silenciosamente no cadastro.
- [features/planos/ui/PlanoUpsellDialog.tsx](../../features/planos/ui/PlanoUpsellDialog.tsx) — padrão de merchandising a reusar/adaptar no Passo 3.
- [shared/lib/plans-catalog.ts](../../shared/lib/plans-catalog.ts) — fonte de verdade dos planos/limites por persona.
- [features/marketplace/components/SecaoRecebimentos.tsx](../../features/marketplace/components/SecaoRecebimentos.tsx) — alvo do link do Passo 2 (empreiteiro, J45).
- [features/auth/utils/redirect-by-role.ts](../../features/auth/utils/redirect-by-role.ts) — `resolvePostLoginRedirect`/`getRedirectPathByRole`: ponto de interceptação para desviar ao `/onboarding`.

## 6. Schema (Drizzle)
- **Nova coluna** `users.onboarding_concluido` (boolean, default `false`) — o **gate do wizard**. Criada idempotente em `server/bootstrap-onboarding.ts` (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) + espelho em [shared/db/schema.ts](../../shared/db/schema.ts). Marcada `true` ao concluir OU pular. Sem novas tabelas.
- **Não usa `perfilCompleto` como gate**: ele é derivado pelo servidor (exige 9 campos, incl. avatar) e permanece intocado com sua semântica de "perfil rico". Ver observação no header.
- **PF/PJ explícito**: o wizard grava `tipo` via `PATCH /api/perfil/contratante` (o handler já aceita `tipo`), sobrescrevendo a heurística `cpfCnpj.length > 11` do cadastro ([features/auth/api/auth-storage.ts](../../features/auth/api/auth-storage.ts)). A heurística continua como default do cadastro rápido — não é preciso alterá-la. Empreiteiro é sempre PJ (tabela `empreiteiras` não tem `tipo`).

## 7. Endpoints
- **`POST /api/onboarding/concluir`** (novo) — marca `users.onboarding_concluido=true`. Chamado tanto no "Concluir" quanto no "Pular por agora". Guard: usuário autenticado. Idempotente.
- `PATCH /api/perfil/contratante` e `PATCH /api/perfil/empreiteiro` (existentes) — gravam tipo/empresa/endereço no Passo 1.
- `GET /api/auth/me` (existente) — passa a **expor `onboardingConcluido`** para o gate pós-login não precisar de roundtrip extra ao perfil.
- `POST /api/assinaturas/checkout` (existente) — se o usuário escolher pago no Passo 3.
- `POST /api/anunciante/upgrade` (existente, J23) — sub-fluxo multi-papel (ver §12).

## 8. Mocks a remover
- Nenhum. Feature nova; não introduzir dado fixo/fake na tela — sempre refletir o estado real de perfil.

## 9. Checklist de implementação
- [ ] Coluna `users.onboarding_concluido` (bootstrap idempotente + espelho no schema + probe no schema-health)
- [ ] `POST /api/onboarding/concluir` (marca a flag; guard autenticado; idempotente)
- [ ] `GET /api/auth/me` expõe `onboardingConcluido`
- [ ] Rota/telas `app/onboarding/` (wizard multi-step, pulável em todos os passos)
- [ ] Interceptar redirect pós-login: desviar a `/onboarding` quando `!onboardingConcluido` — nos DOIS pontos: `app/login/page.tsx` (`navegarPosLogin`, email/senha + 2FA) e `app/auth/oauth-success/page.tsx` (Google)
- [ ] Passo 1: seletor PF/PJ **explícito** + dados de empresa; gravar via `PATCH /api/perfil/{persona}`
- [ ] Passo 2 (empreiteiro): cartão opcional linkando `SecaoRecebimentos` (J45), atrás de `MARKETPLACE_SPLIT`
- [ ] Passo 3: planos com merchandising do pago + "começar no free"; reusar `usePlanos`/`useCheckout`; **ocultar para anunciante**
- [ ] Passo 4: concluir → `POST /api/onboarding/concluir` → dashboard
- [ ] "Pular por agora" em todos os passos → também chama `POST /api/onboarding/concluir` → dashboard
- [ ] **Não tocar** em `provisionarCustomerAsaas` — a criação Asaas continua no cadastro (J44)
- [ ] Sub-fluxo multi-papel: reuso de `POST /api/anunciante/upgrade` (J23) — documentado, não bloqueia o wizard base
- [ ] Teste de integração em `tests/e2e/integration/` (concluir/pular persiste a flag; gate reflete)

## 10. Critérios de aceite
1. Cadastrar contratante novo → login → cair em `/onboarding` (não no dashboard).
2. Preencher PF/PJ + empresa → concluir → dashboard. Query: `SELECT onboarding_concluido FROM users WHERE id='<e2e>';` retorna `true`; `SELECT tipo FROM clientes WHERE user_id='<e2e>';` retorna o tipo escolhido.
3. Cadastrar + "pular por agora" → cai no dashboard funcional, `onboarding_concluido=true` (não reaparece); dados de perfil seguem incompletos, obrigatórios só na porta do pagamento.
4. Com `PAYMENT_GATEWAY=asaas`, cadastro com CPF válido cria `users.asaas_customer_id` (comportamento J44 preservado, sem regressão).
5. Empreiteiro: Passo 2 linka para `SecaoRecebimentos` (J45) só com `MARKETPLACE_SPLIT=on`.
6. Anunciante: wizard não mostra passo de plano nem de recebimento.
7. Multi-papel: empreiteiro aciona "quero anunciar" → `POST /api/anunciante/upgrade` adiciona papel sem nova conta nem novo login.

## 11. Riscos / Pontos de atenção
- **Fricção no funil** (decisão do dono, 2026-07-22): wizard **pulável**; obrigatoriedade só na porta do pagamento — evita derrubar conversão de signup. Alinhado à recomendação da J44 (§11).
- **Não duplicar formulário de recebimento**: Passo 2 do empreiteiro **linka** para a J45, não recria a criação de subconta.
- **PF/PJ**: trocar heurística por escolha explícita não pode quebrar cadastros existentes (backfill/opcional).
- **Anunciante**: garantir que o wizard dele não ofereça assinatura/recebimento (não é pagador de plano nem recebedor Asaas).
- **Reaparecimento do wizard**: enquanto `perfil_completo=false`, o desvio pós-login deve ser idempotente e nunca criar loop (permitir sempre o "pular" e o acesso direto ao dashboard).

## 12. Links cruzados
- Depende de: J01 (identidade/auth), J44 (customer Asaas proativo — reusado), J11 (planos/checkout — reusado no Passo 3).
- Reusa: J45 (link de recebimento do empreiteiro), J23 (multi-role para "adicionar papel").
- Não bloqueia outras jornadas (é camada de UX sobre fluxos já prontos).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-07-22 — Gate não podia ser `perfilCompleto`**: descobriu-se que `perfilCompleto` é 100% derivado pelo servidor (`isProfileComplete` exige 9 campos, incl. avatar), incompatível com wizard pulável. Decisão: nova flag dedicada `users.onboarding_concluido` (default false), marcada `true` ao concluir OU pular. `perfilCompleto` fica intocado.
- **2026-07-22 — Dois pontos de redirect pós-login, não um**: o login email/senha usa `navegarPosLogin`→`resolvePostLoginDestination` (novo helper que consulta `/api/auth/me`); o OAuth (`app/auth/oauth-success/page.tsx`) tem lógica de redirect PRÓPRIA (switch por role) e precisou de gate separado, reusando o mesmo `/me` já lido. Admin/superadmin excluídos do wizard em ambos os caminhos.
- **2026-07-22 — Backfill sem rewrite**: o bootstrap cria a coluna com `DEFAULT true` (linhas legadas nascem concluídas sem full-table write lock) e depois troca o default para `false` (novos cadastros → wizard). Evita `UPDATE` em massa no boot (feedback do code-review).
- **2026-07-22 — `useRecebimento` ganhou `enabled` opcional**: o hook disparava `GET /api/empreiteiro/recebimento/subconta` (403) para contratante/anunciante no wizard. Adicionado param `{ enabled }` (default true) para gatear a query só ao empreiteiro.
- **2026-07-22 — Checkout `redirect` não avança passo**: quando o gateway real devolve `kind: 'redirect'`, o hook já faz `window.location.assign`; o wizard passou a NÃO chamar `onNext()` nesse caso (só em `activated`), evitando avanço-fantasma antes da navegação externa.
- **2026-07-22 — Anunciante sem passo de plano/recebimento é intencional**: pelo modelo financeiro ([../asaas-modelo-financeiro.md](../asaas-modelo-financeiro.md)), o anunciante não assina plano nem recebe (não tem subconta), e o **customer ASAAS dele é criado lazy no checkout de anúncio (J31)**, não no cadastro nem neste wizard. Por isso o wizard do anunciante é enxuto (só empresa → concluir).
