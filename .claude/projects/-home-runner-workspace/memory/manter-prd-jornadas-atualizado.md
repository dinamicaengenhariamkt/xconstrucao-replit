---
name: manter-prd-jornadas-atualizado
description: Sempre atualizar os docs de jornada (PRD) ao mapear cobertura de testes/serviços, para retomar rápido após quedas do dev server
metadata:
  type: feedback
---

Ao mapear o que precisa ser testado / quais serviços faltam cobrir (jornadas de teste J36 integração, J37 e2e), manter os documentos de jornada em `docs/jornadas/` atualizados como PRD vivo — registrar progresso (grupos feitos/pendentes, gaps de cobertura, onde parou) a cada avanço.

**Why:** o servidor de desenvolvimento oscila e cai com frequência, forçando reinícios. O usuário quer conseguir voltar à etapa anterior o mais rápido possível sem perder contexto.

**How to apply:** depois de cada bloco de trabalho em testes, escrever no doc da jornada o estado atual (checklist + nota "onde parei" com data absoluta). Usar o radar `npm run test:integration:gaps` como fonte de verdade dos serviços sem cobertura. Ver [[jornadas-status]].
