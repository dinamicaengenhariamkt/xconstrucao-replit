# Jornada — Configurações Críticas de Segurança

> Status: parcial | Prioridade: média | Wave: 6
> Última atualização: 2026-06-07
>
> **Criada em 2026-06-05**, desmembrada da J26. Reúne os controles de
> configuração que **alteram o fluxo de autenticação/sessão de todos os usuários**.
> **Em 2026-06-07 os itens de BAIXO RISCO foram entregues** (timeout de sessão, máx
> tentativas de login, bloqueio de cadastro por perfil, gate de relatórios), todos
> com a garantia de **não encurtar/bloquear nada por omissão** (só agem quando o
> admin configura). **Pendentes (próxima fase, maior risco):** 2FA obrigatório
> (precisa de setup guiado p/ não trancar) e webhooks reais (dispatcher + fila/SSRF).

## 1. Contexto & Objetivo
A J26 tirou as configurações do "modo fantasma" implementando apenas o que é
seguro (modo manutenção, gating de módulos, senha mínima, nome/descrição). Sobraram
os controles **perigosos**, que mexem em auth/sessão e podem derrubar o login de
todos se mal calibrados. Esta jornada os entrega um a um, com confirmação reforçada
e teste de regressão.

Itens em escopo (todos hoje ocultos na página de configurações):
1. **Timeout de sessão** (`seguranca.timeout`) — expirar sessão por inatividade.
2. **Máximo de tentativas de login** (`seguranca.maxTentativas`) — bloqueio temporário após N falhas.
3. **2FA obrigatório** (`seguranca.doisFatoresAdmins`, `doisFatoresTodos`) — forçar setup de 2FA no login. Evolução da J22.
4. **Bloqueio de cadastro/login por perfil** (`plataforma.empreiteiras`, `plataforma.clienteLogin`) — impedir onboarding/login de um tipo de usuário.
5. **Relatórios exportáveis** (`plataforma.relatorios`) — gate de export na UI/endpoints.
6. **Webhooks reais** (`integracoes.webhookUrl`, `webhookEvents`) — disparo real de eventos (hoje só persiste a config; o "Testar" fake foi removido na J26).

## 2. Personas
- **Admin**: ativa/desativa cada controle com confirmação reforçada (modal de impacto).
- **Todos os usuários**: afetados por timeout, 2FA obrigatório, bloqueio por perfil.

## 3. Fluxo ponta-a-ponta (por item — alto nível)
- **Timeout**: sessão/refresh consultam `seguranca.timeout`; expiram conforme configurado.
- **Máx tentativas**: rate-limit do login lê `maxTentativas` (hoje hardcoded em `rate-limit.ts`).
- **2FA obrigatório**: login exige setup/segundo fator se a flag estiver ativa para o perfil.
- **Bloqueio por perfil**: cadastro/login + proxy negam o perfil desativado.
- **Webhooks**: dispatcher real envia eventos para a URL configurada, com retry.

## 4. Telas envolvidas
- [app/admin/configuracoes/page.tsx](../../app/admin/configuracoes/page.tsx) — reexibir cada controle (hoje "em breve") conforme implementado, sempre com `ConfirmImpactDialog`.

## 5. Componentes-chave
- Reusa [ConfirmImpactDialog](../../features/admin/configuracoes/components/ConfirmImpactDialog.tsx) (criado na J26) para a confirmação reforçada.
- Reusa o [settings-reader](../../features/admin/platform-settings/server/settings-reader.ts) (J26) para ler as flags server-side com cache.
- Auth: [features/auth/api/rate-limit.ts](../../features/auth/api/rate-limit.ts), [app/api/auth/login/route.ts](../../app/api/auth/login/route.ts), políticas de 2FA ([features/auth/api/totp-policy.ts](../../features/auth/api/totp-policy.ts)).

## 6. Schema (Drizzle)
- **Sem schema novo.** Tudo vive em `platform_settings` (chave `seguranca`/`plataforma`/`integracoes`), já existente.
- Webhooks reais podem exigir uma tabela de fila/retry (`webhook_deliveries`) se houver garantia de entrega — avaliar na implementação.

## 7. Endpoints
- `GET/PATCH /api/admin/configuracoes` — já existe (J26). Reusa.
- Webhooks reais: dispatcher interno + (opcional) endpoint de reenvio.

## 8. Mocks a remover
- Nenhum mock — os controles já existem na UI (ocultos). É implementação de efeito real.

## 9. Checklist de implementação
- [ ] Timeout de sessão: ler `seguranca.timeout` no fluxo de sessão/refresh; **teste de não-bloqueio** (sessão normal não expira cedo demais)
- [ ] Máx tentativas: `rate-limit` do login lê `maxTentativas`; testar lockout + desbloqueio
- [ ] 2FA obrigatório (admins/todos): forçar setup no login conforme flag; **não trancar admin sem 2FA configurado** (fluxo de setup obrigatório guiado)
- [ ] Bloqueio por perfil (empreiteiras/clienteLogin): negar cadastro/login + proxy; mensagem clara
- [ ] Relatórios exportáveis: gate na UI + endpoints de export
- [ ] Webhooks reais: dispatcher + (se necessário) fila/retry; remover o estado "em breve"
- [ ] `ConfirmImpactDialog` em cada toggle de alto impacto
- [ ] Auditoria de cada alteração crítica em `audit_logs`

## 10. Critérios de aceite
1. Cada controle reexibido tem efeito real e demonstrável; nenhum volta a ser "fantasma".
2. Ativar 2FA obrigatório não tranca o admin: ele é guiado ao setup, não bloqueado sem saída.
3. Timeout/maxTentativas configurados refletem no comportamento real de sessão/login, sem quebrar o fluxo padrão.
4. Toda ativação crítica passa pelo modal de confirmação e fica em `audit_logs`.

## 11. Riscos / Pontos de atenção
- **Auto-bloqueio é o risco central.** Qualquer item que toque login/sessão precisa de um caminho de escape para o admin e de teste de regressão dedicado (conta sem 2FA continua logando até o setup; admin nunca fica sem acesso).
- **Calibragem**: timeout curto demais ou maxTentativas baixo demais geram suporte. Definir defaults conservadores.
- **Webhooks**: entrega não-garantida sem fila; segredos/assinatura do payload; SSRF (validar URL de destino).
- **Bloqueio por perfil** afeta onboarding inteiro — coordenar com J01.

## 12. Links cruzados
- Origem: J26 (desmembramento dos itens críticos).
- Relacionada: J22 (2FA individual), J19 (hardening/rate-limit), J01 (login/onboarding).
- Reusa: `ConfirmImpactDialog`, `settings-reader` (J26).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho.

- **2026-06-05** — Jornada criada ao implementar a J26. Decisão: os controles de auth/sessão ficam ocultos ("em breve") na página de configurações até esta jornada, para a J26 cumprir o critério "nenhum toggle fantasma" sem assumir o risco de mexer no login de todos. O `ConfirmImpactDialog` e o `settings-reader` já estão prontos (J26) para reuso aqui.
- **2026-06-07** — **Itens de baixo risco entregues.** (1) **Timeout de sessão**
  (`seguranca.timeout`, min) aplicado na janela do refresh/sessão em
  [session-issuer.ts](../../features/auth/api/session-issuer.ts) e
  [refresh/route.ts](../../app/api/auth/refresh/route.ts) via override em
  `createAuthCookies`. (2) **Máx tentativas** (`seguranca.maxTentativas`) no
  [login/route.ts](../../app/api/auth/login/route.ts). (3) **Bloqueio de cadastro
  por perfil** (`plataforma.empreiteiras`/`clienteLogin`) no
  [register/route.ts](../../app/api/auth/register/route.ts) — só barra cadastro
  novo; `anunciante`/admin nunca barrados; login de conta existente intacto. (4)
  Gate de **relatórios** exposto. UI reexibida em
  [configuracoes/page.tsx](../../app/admin/configuracoes/page.tsx) com
  `ConfirmImpactDialog`. **Decisão crítica de não-lockout:** os helpers em
  [settings-reader.ts](../../features/admin/platform-settings/server/settings-reader.ts)
  leem o valor CRU da tabela (não o merge com DEFAULTS) — assim, **sem config
  explícita, timeout e maxTentativas NÃO se aplicam** (mantêm 7/30 dias e o limite
  histórico). Pisos (5 min / 3 tentativas) previnem auto-bloqueio por config absurda.
  **Fora desta leva:** 2FA obrigatório e webhooks reais (próxima fase).
