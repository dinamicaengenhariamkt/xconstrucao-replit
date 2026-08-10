# Jornada — XG01: Fundações e shell do xgestão

> Status: planejada | Prioridade: alta | Wave: xgestão-1
> Última atualização: 2026-08-09

## 1. Contexto & Objetivo

Estabelecer o xgestão como produto distinto: role aditiva, prefixo de URL próprio, layout com marca própria e os toggles que permitem ocultar o marketplace depois. Ao fim desta jornada o empreiteiro faz login e cai num ambiente que diz "xgestão", com o console de obra já funcionando dentro dele.

O cliente foi explícito na reunião: *"teria que ter essa diferenciação do cara entender que nesse momento ele tá entrando pro xgestão e não pro marketplace"*.

## 2. Personas

- **Empreiteiro (xgestão)**: assina o produto e gerencia as próprias obras. É o cliente pagante.
- **Superadmin**: concede a role aditiva e opera os toggles de plataforma.

## 3. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  A[Empreiteiro faz login] --> B{tem role aditiva xgestao?}
  B -- sim --> C[/xgestao/obras]
  B -- não --> D[/empreiteiro/dashboard]
  C --> E[Console de obra reaproveitado]
```

1. Admin concede a role aditiva `xgestao` ao usuário.
2. No login, o destino pós-login passa a ser `/xgestao/obras`.
3. O layout do xgestão carrega com marca e menu próprios (4 itens).
4. O console de obra existente renderiza dentro do novo shell, sem fork.

## 4. Telas envolvidas

- [app/xgestao/layout.tsx](../../app/xgestao/layout.tsx) — **a criar**. Shell do produto.
- [app/xgestao/obras/page.tsx](../../app/xgestao/obras/page.tsx) — **a criar**. Página fina sobre `MinhasObrasView`.
- [app/xgestao/obras/[id]/page.tsx](../../app/xgestao/obras/[id]/page.tsx) — **a criar**. Página fina sobre `ObraConsoleView`.
- [app/empreiteiro/minhas-obras/page.tsx](../../app/empreiteiro/minhas-obras/page.tsx) — origem da extração.
- [app/empreiteiro/minhas-obras/[id]/page.tsx](../../app/empreiteiro/minhas-obras/[id]/page.tsx) — 460 linhas; origem da extração do console.

## 5. Componentes-chave

- `features/xgestao/components/XGestaoLayout.tsx` — **a criar**.
- `features/xgestao/components/XGestaoSidebar.tsx` — **a criar**. Única duplicação intencional do plano: o conteúdo é genuinamente diferente do [EmpreiteiroSidebar](../../features/empreiteiro/components/EmpreiteiroSidebar.tsx), e abstrair sairia mais caro que copiar a estrutura.
- `features/xgestao/constants.ts` — **a criar**. Nav com **apenas** Minhas Obras, Dashboard, Planos, Configurações. Sem Novas Obras / Candidaturas / Recebimentos / Saldo — isso é marketplace.
- `features/xgestao/lib/entitlement.ts` — **a criar**. `assertXgestaoUser(userId)` → `{ empreiteiraId, hasXgestao }`. **Ponto único** chamado por toda rota xgestão.
- `features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx` — **extrair**.
- `features/empreiteiro/minhas-obras/components/ObraConsoleView.tsx` — **extrair**, com prop `basePath`.

## 6. Schema (Drizzle)

- Tabela existente reaproveitada: `user_roles` em [shared/db/schema.ts:196](../../shared/db/schema.ts) (J23) — role aditiva, já usada por `useHasRole('anunciante')`.
- Alteração: adicionar `"xgestao"` ao `userAdditiveRoleEnum` ([schema.ts:194](../../shared/db/schema.ts)).

> ⚠️ **`userAdditiveRoleEnum` é um enum Postgres real, não TEXT.** Exige `ALTER TYPE ... ADD VALUE`, que em versões mais antigas do Postgres não roda dentro de transação. Verificar se o `drizzle-kit push` cobre; se não, migration manual. Conferir também se [`server/bootstrap-anuncios-self-service.ts`](../../server/bootstrap-anuncios-self-service.ts) recria o enum de forma idempotente — são dois caminhos para o mesmo DDL.

- `platformSettings` é JSONB key/value → os toggles novos (`xgestao`, `marketplaceVisivel`) **não exigem migration**.

## 7. Endpoints

- Nenhum endpoint novo nesta jornada. O `assertXgestaoUser` é helper de servidor, consumido pelas jornadas seguintes.

## 8. Configuração

- [features/admin/platform-settings/server/settings-reader.ts:34](../../features/admin/platform-settings/server/settings-reader.ts) — acrescentar aos defaults de `plataforma`: `xgestao: true`, `marketplaceVisivel: true`.
- [app/api/admin/configuracoes/route.ts](../../app/api/admin/configuracoes/route.ts) — espelhar os mesmos defaults (é a fonte de escrita).

## 9. Checklist de implementação

- [ ] `grep -rn "/empreiteiro/" features/empreiteiro/minhas-obras/` **antes de tudo** — hrefs hardcoded são o que transforma 1 dia em 3
- [ ] Adicionar `"xgestao"` ao `userAdditiveRoleEnum` + migration
- [ ] Criar `features/xgestao/lib/entitlement.ts`
- [ ] Adicionar os toggles `xgestao` e `marketplaceVisivel` no reader e na rota de escrita
- [ ] Extrair `MinhasObrasView` de `app/empreiteiro/minhas-obras/page.tsx`
- [ ] Extrair `ObraConsoleView` (com prop `basePath`) do console de 460 linhas
- [ ] Criar layout, sidebar e constants do xgestão
- [ ] Criar as 3 páginas finas sob `app/xgestao/`
- [ ] [proxy.ts:48](../../proxy.ts) — regra `/xgestao` em `PROTECTED_PAGES`, `"/xgestao/:path*"` no `config.matcher`, e `/xgestao` nos prefixos de manutenção
- [ ] [features/auth/utils/redirect-by-role.ts:46](../../features/auth/utils/redirect-by-role.ts) — `/xgestao` nos `allowedPrefixes` de `empreiteiro` e `superadmin`; destino pós-login ciente da role aditiva
- [ ] Verificar que `/empreiteiro/*` continua funcionando idêntico

## 10. Critérios de aceite

1. Empreiteiro **com** a role aditiva loga e cai em `/xgestao/obras`, com marca xgestão e exatamente 4 itens de menu.
2. Abrir uma obra em `/xgestao/obras/[id]` renderiza o console completo, com todas as abas funcionando e navegação de volta apontando para `/xgestao/obras`.
3. Empreiteiro **sem** a role aditiva continua caindo em `/empreiteiro/dashboard`, com tudo funcionando como antes.
4. Contratante acessando `/xgestao` é redirecionado ao login.
5. Nenhum arquivo de `features/empreiteiro/minhas-obras/` foi copiado — confirmar por `git diff --stat` (extrações aparecem como alteração, não como arquivo novo duplicado).
6. Verificação: `SELECT role, COUNT(*) FROM user_roles GROUP BY role` inclui `xgestao`.

## 11. Riscos / Pontos de atenção

- **A extração do console é o risco da jornada.** 460 linhas com estado de abas, filtros e possivelmente hrefs absolutos. Estimado 1 dia, pode virar 3.
- **`ALTER TYPE` em enum Postgres** pode exigir migration manual fora de transação.
- **O proxy não distingue xgestão de empreiteiro** — o JWT diz `empreiteiro`. A regra em `proxy.ts` fica intencionalmente grossa (barra contratante e anônimo); o direito real é validado server-side via `assertXgestaoUser`. Isso é coerente com o modelo de defesa em profundidade declarado em [proxy.ts:26](../../proxy.ts). **Não** colocar a claim no JWT agora — forçaria rotação de token para todos os usuários já logados.

## 12. Links cruzados

- Bloqueia: XG02, XG03, XG04, XG05, XG06 (todas dependem do `assertXgestaoUser` e do shell)
- Relacionada: J23 (roles aditivas), J26 (configurações de plataforma)

## 13. Gaps descobertos durante execução

> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.
