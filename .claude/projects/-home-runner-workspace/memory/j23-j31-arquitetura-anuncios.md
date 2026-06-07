---
name: j23-j31-arquitetura-anuncios
description: Decisões de arquitetura travadas para J23 (self-service de anúncios) e J31 (pagamento de anúncios) da XConstrução
metadata:
  type: project
---

Em 2026-06-07 o PO reestruturou a J23 (`docs/jornadas/23-meus-anuncios-self-service.md`) e criou a J31 bloqueada (`docs/jornadas/31-pagamento-anuncios.md`). Decisões travadas que guiam a implementação futura:

**J23 — self-service de anúncios (planejada, Wave 6):**
- **D2 multi-role aditivo**: hoje `users.role` é enum de valor ÚNICO e `anunciantes` é desacoplada de `users`. Solução: criar tabela `user_roles` (N papéis/usuário, papel novo `anunciante`), manter `users.role` como papel PRIMÁRIO p/ não quebrar guards existentes; helper `userHasRole`. Anunciante vira papel acoplável; virar contratante/empreiteiro = adicionar papel reaproveitando cadastro, sem deslogar.
- **D3 pedido multi-slot**: `pedidos_anuncio` (cabeçalho) + `pedido_slots` (zona+período+template+criativo). Aprovar materializa em `anuncios` reusando pipeline J16/J24.
- **D4 moderação obrigatória** antes de exibir.
- **D5 checkout-protótipo plugável**: `billing-port.ts` com `PrototipoBilling` ("adquirido", não cobra); cobrança real extraída p/ J31.
- **D6 navegação multi-papel (regra de ouro)**: "anunciante não é visão concorrente, é capacidade onde o usuário já está". Cliente anuncia via item "Meus Anúncios" DENTRO da própria visão; visão `app/anunciante/*` dedicada só p/ outsider puro; outsider que vira cliente CONVERGE (redirect) p/ visão de cliente — nunca duas portas, nunca deslogar, sem seletor de workspace.

**J31 — pagamento de anúncios (bloqueada, Wave 7):** em série atrás de J23 (precisa existir) + J14 (precisa do provedor). Pagamento AVULSO (one-off por pedido), reusa abstração de gateway da J14. Só troca `PrototipoBilling` pelo adapter real.

**Status (2026-06-07): J23 e J24 PRONTAS** (ambas `pronto` no README). J23 fechada após auditoria: corrigido bloqueador do href de notificação (era fixo `/anunciante/meus-anuncios`, quebrava após convergência D6 — agora resolvido pelo papel primário em `anuncio-dispatcher.ts`). J24 validada 100% (admin + home dinâmica `MercadoEmFoco` + toggle). Bloqueios refrescados: J14/J31=negócio (gateway), J20=negócio (quando coletar NPS), J28=jurídico (texto+re-consent; user_consents já versiona), J30=processo de QA/rollout sem lockout (mais viável de atacar agora — não falta código). Detalhes que divergem do plano original: `user_roles.role` usa enum DEDICADO `user_additive_role` (sem admin/superadmin — constraint de banco); anunciante unificado via `anunciantes.userId` nullable (NÃO há coluna `solicitanteUserId`); `destaque-dados` fica fora do self-service; zero slots publicados → pedido vira `aprovado` (não `publicado`); primeiro pedido de cliente concede papel `anunciante`. Código em `features/anuncios/self-service/`, `app/anunciante/`, `features/anunciante/`, bootstrap `server/bootstrap-anuncios-self-service.ts`. `npm run check` + `npm run build` passam. Pendente: validar fluxos com app rodando (e2e) e aceite. **Falta commitar** (arquivos untracked).

**Why:** decisões de produto/arquitetura não derivam do código atual (multi-role não existia). **How to apply:** J31 liga o billing real trocando `PrototipoBilling` em `features/anuncios/self-service/billing-port.ts` e amarra período obrigatório. Relacionado: J24 (templates reusados), J14 (gateway).
