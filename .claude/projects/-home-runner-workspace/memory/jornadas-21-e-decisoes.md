---
name: jornadas-21-e-decisoes
description: Decisões de escopo de jornadas tomadas em 2026-06-02 (J21 nova, chat admin read-only, escopo J02/J10/J01)
metadata:
  type: project
---

Decisões de roadmap das jornadas tomadas em 2026-06-02 (sessão `/jornada` macro):

- **J21 (nova) — Observabilidade de Comunicação (Admin):** monitoramento de chats read-only + painel de notificações admin reais (hoje [features/admin/notifications/](../../../../features/admin/notifications/) é só mock) + trilha de auditoria/rastreio. Absorve os 2 checkboxes abertos de J13.
- **Chat admin = leitura-only POR FORA.** O schema de chat é 1:1 RÍGIDO (`chat_threads` tem `obraId` UNIQUE + `contratanteUserId` + `empreiteiroUserId`, sem coluna de participante extra — [shared/db/schema.ts:339](../../../../shared/db/schema.ts)). Decisão: admin NÃO vira participante; lê as tabelas via endpoints admin novos. Schema de chat fica INTOCADO. Possível canal admin↔áreas foi adiado (não escolhido).
- **J02 — matar tudo:** desativar conta self-service, preferências respeitadas em TODOS os dispatchers (hoje só `nova-obra-zona` lê `user_preferencias`), trocar email self-service com re-verificação, + Export LGPD e 2FA.
- **J10 — fechar a jornada:** implementar a aba "Disputas" no detalhe da obra p/ contratante e empreiteiro (backend 100% pronto, só falta UI consumindo `GET /api/disputas`).
- **J01 — só promover "revisão" → "pronto"** no README; auditoria confirmou tudo implementado. Único "gap" (gate superadmin em [oauth-convert/route.ts:59](../../../../app/api/auth/oauth-convert/route.ts)) é proposital, não bloqueia.
- **Standby:** J14 (gateway) e J20 (NPS/CSAT) — bloqueadas por decisão externa.
- **Commit de J17/J18** (não commitados no working tree) fica a cargo do usuário ("vejo depois no detalhe").

**Why:** o usuário pediu levantamento completo de gaps reais e decidiu o destino de cada um (jornada nova vs continuação).
**How to apply:** ao retomar, J21 já está documentada em [docs/jornadas/21-observabilidade-comunicacao-admin.md]; J13 aponta pra ela. Implementação da J21 ainda não começou.

## Atualização 2026-06-02 (implementação J01/J02/J07/J10 + J22)

Fechadas a 100% nesta sessão (código + UI + docs):
- **J01** → promovida a "pronto" (auditoria; gate superadmin oauth-convert é proposital).
- **J02** → "pronto". 4 itens entregues: helper único [features/notificacoes/preferences.ts](../../../../features/notificacoes/preferences.ts) gateia email de candidatura/pagamento; `POST /api/auth/desativar-conta`; `POST /api/auth/trocar-email` + `GET /api/auth/confirmar-novo-email`; `GET /api/auth/exportar-dados`. UI compartilhada em [features/perfil/components/ContaSection.tsx](../../../../features/perfil/components/ContaSection.tsx) (aba Privacidade das 2 personas).
- **J07** → mock `activities.mock.ts` DELETADO; página `/contratante/atividades` usa `useAtividadesFeed` (cursor real).
- **J10** → aba Disputas em ambas as personas via [features/disputas/components/TabDisputas.tsx](../../../../features/disputas/components/TabDisputas.tsx) + `GET /api/obras/[id]/disputas` + hooks em [use-obra-disputas.ts](../../../../features/disputas/hooks/use-obra-disputas.ts).
- **J22 (nova)** → [docs/jornadas/22-autenticacao-forte-2fa.md] — 2FA TOTP extraído da J02 (feature do zero, mexe no login). Status pendente, sem código ainda.

**2FA decisão:** adiado da J02 → virou J22 (a pedido do usuário, pra fechar a J02 a 100%).
**Pendente de produto:** preferências só gateiam email onde HÁ email hoje (candidatura, pagamento). Medição/disputa/chat são in-app puro; helper pronto pra quando ganharem email.
**Próximo provável:** J21 (observabilidade admin) — não iniciada.
