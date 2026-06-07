---
name: jornadas-status
description: Status atual das jornadas da XConstrução e o que bloqueia as pendentes
metadata:
  type: project
---

Projeto XConstrução tem 31 jornadas em `docs/jornadas/`. Status em 2026-06-07 (após sessões de implementação):

**Prontas recentes:** J23 (self-service de anúncios — multi-role, ver [[j23-j31-arquitetura-anuncios]]), J24 (anúncios ricos), J28 (docs legais versionados — infra pronta), J30 (parcial — itens de baixo risco).

**J30 (parcial):** entregues timeout de sessão, máx tentativas de login, bloqueio de cadastro por perfil, gate de relatórios — todos via `platform_settings` lido em `settings-reader.ts`. CRÍTICO: os helpers `getSessionTimeoutMinutes`/`getMaxTentativasLogin` leem o valor CRU da tabela (função `getRawSetting`), NÃO o merge com DEFAULTS — senão aplicariam timeout/limite por omissão e deslogariam todos. Pisos 5min/3tentativas. **Pendente (próxima fase):** 2FA obrigatório (precisa setup guiado p/ não trancar) + webhooks reais (dispatcher/fila/SSRF).

**J28 (infra pronta):** tabela `legal_documents` + bootstrap com seed v1 = texto atual migrado p/ Markdown (`server/legal-seed/`). Páginas /termos e /politica-privacidade leem do banco via `MarkdownView` (XSS-safe, sem dangerouslySetInnerHTML). Admin em /admin/legal. Re-consent global via `ReconsentGate` nos providers, configurável (`legal.reconsentModo`, padrão `avisar`). **Plug pendente:** jurídico publica v2.

**Bloqueadas (decisão externa):** J14 (escolher gateway — negócio), J31 (depende J14+J23), J20 (NPS/CSAT — decisão de produto sobre quando coletar). J14/J31 são as últimas (negócio).

**Why:** rastrear o que falta e o que é bloqueio real vs decisão. **How to apply:** as pendências de J30/J28 são plugs (2FA, webhooks, texto jurídico); J20 precisa de 1 decisão de produto. Tudo `npm run check`+`build` OK. Arquivos untracked — falta commitar.
