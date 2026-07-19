---
name: manter-prd-jornadas-atualizado
description: Sempre atualizar os docs de jornada (PRD) ao mapear cobertura de testes/serviços, para retomar rápido após quedas do dev server
metadata:
  type: feedback
---

Ao mapear o que precisa ser testado / quais serviços faltam cobrir (jornadas de teste J36 integração, J37 e2e), manter os documentos de jornada em `docs/jornadas/` atualizados como PRD vivo — registrar progresso (grupos feitos/pendentes, gaps de cobertura, onde parou) a cada avanço.

**Why:** o servidor de desenvolvimento oscila e cai com frequência, forçando reinícios. O usuário quer conseguir voltar à etapa anterior o mais rápido possível sem perder contexto.

**How to apply:** assim que um ajuste/grupo fica pronto (suíte verde), imediatamente: (1) marcar `[x]` no checklist do doc da jornada, e (2) adicionar/atualizar uma nota **"PAREI AQUI: próximo = X"** no fim da seção de notas cronológicas (§10 no doc da J36), com data absoluta. Não deixar para o fim — fazer a cada passo, porque o server pode cair a qualquer momento. Ao retomar, ler primeiro o fim do doc da jornada para saber exatamente onde parou. Usar o radar `npm run test:integration:gaps` como fonte de verdade dos serviços sem cobertura. Para a J36 especificamente: ritmo "um grupo por rodada" (G5→G12), spec em `tests/e2e/integration/`, reusar helpers de `tests/e2e/helpers.ts`. Ver [[jornadas-status]].
