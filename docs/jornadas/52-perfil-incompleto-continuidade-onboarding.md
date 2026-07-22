# Jornada — Perfil Incompleto & Continuidade de Onboarding

> Status: pronto | Prioridade: alta | Wave: 11
> Última atualização: 2026-07-22
>
> Extensão da J51: o wizard é **pulável**, então muitos usuários chegam ao produto com o
> perfil ainda incompleto. Esta jornada avisa (sem bloquear) e induz a completar depois,
> e reforça o gate do wizard para navegação direta ao dashboard.

## 1. Contexto & Objetivo
Depois que o usuário pula o wizard (ou o completa sem preencher o perfil rico), nada o
lembrava de completar o perfil fora da tela de Configurações. Objetivo: um aviso global,
**não-bloqueante**, que apareça no dashboard das personas com perfil rico e leve direto às
Configurações. A obrigatoriedade real continua só na porta do pagamento (decisão da J51).

## 2. Fonte de verdade — `perfil_completo`, não "pulou"
Reusa a coluna derivada `perfil_completo` (clientes/empreiteiras), recalculada no PATCH de
perfil. É um predicado melhor que "pulou o wizard": cobre também quem completou o wizard mas
não preencheu os 9 campos do contratante / +6 do empreiteiro, e não incomoda quem já estava
completo. **Anunciante não tem perfil rico** → o banner não monta para ele.

## 3. Componentes
- [features/perfil/components/PerfilIncompletoBanner.tsx](../../features/perfil/components/PerfilIncompletoBanner.tsx) — banner amber full-width (molde do `EmailVerificationBanner`). Lê `user.role` (useAuth); consome `usePerfilContratante`/`usePerfilEmpreiteiro` (com `enabled` gateado pela role, evita 403); some quando `perfilCompleto===true`. CTA "Completar perfil" → Configurações. `data-testid="banner-perfil-incompleto-global"`.
- [features/onboarding/components/OnboardingGate.tsx](../../features/onboarding/components/OnboardingGate.tsx) — reforço client-side do gate: consulta `/api/auth/me` (autoritativo) e desvia a `/onboarding` só com `onboardingConcluido===false` explícito (nunca em ausência/erro → sem loop); ignora admin/superadmin e a própria rota `/onboarding`.
- Montados nos layouts [contratante](../../app/contratante/layout.tsx)/[empreiteiro](../../app/empreiteiro/layout.tsx) (banner + gate) e [anunciante](../../app/anunciante/layout.tsx) (só gate — banner não se aplica).
- `usePerfilContratante/Empreiteiro` ganharam param opcional `{ enabled }` ([use-perfil.ts](../../features/perfil/hooks/use-perfil.ts)).

## 4. Gate do wizard — decisão
Mantido **client-side** (decisão do dono). O redirect pós-login (J51) já cobre o fluxo real;
o `OnboardingGate` cobre navegação direta ao dashboard sem introduzir middleware server-side
(evita duplicar a leitura de token/impersonation e risco de loop). Um gate server-side
dedicado fica como follow-up se um dia for requisito de segurança.

## 5. Cadastro por admin (validação, sem código novo)
Empreiteiro/contratante criado por admin (`POST /api/admin/usuarios` → `createUserWithProfile`)
já nasce `onboarding_concluido=false` (herda o default do schema) → **cai no wizard no 1º
login**, igual ao cadastro público. Coberto por teste (J54.b), sem alteração de código.

## 6. Checklist
- [x] `PerfilIncompletoBanner` (fonte = `perfil_completo`; anunciante não monta)
- [x] `usePerfil*` com `enabled` opcional (evita 403 da persona errada)
- [x] `OnboardingGate` (reforço client-side sem loop; ignora admin e `/onboarding`)
- [x] Montagem nos 3 layouts
- [x] Validação: empreiteiro criado por admin cai no wizard (teste J54.b)

## 7. Critérios de aceite
1. Contratante/empreiteiro com `perfil_completo=false` vê o banner global; completa o perfil → banner some.
2. Anunciante nunca vê o banner (não tem perfil rico).
3. Navegação direta ao dashboard com `onboarding_concluido=false` desvia a `/onboarding`; admin não.
4. O aviso é não-bloqueante: o usuário continua usando o produto; obrigatoriedade só no pagamento.

## 8. Links cruzados
- Estende a J51 (wizard). Reusa J02 (perfis/`perfil_completo`) e J26 (public-config indireto).
- Testes de browser (banner visível, redirect direto) ficam para a J37.
