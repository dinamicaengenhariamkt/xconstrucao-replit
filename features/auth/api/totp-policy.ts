// J22 — política de 2FA da plataforma.
// Centraliza a decisão de produto "exigir 2FA para admin/superadmin" (§9 do doc).
// Ativável por env sem mexer em código: ADMIN_2FA_OBRIGATORIO=1.
// Mantido como módulo próprio pra ser importado por endpoints e pelo login.
export const ADMIN_2FA_OBRIGATORIO = process.env.ADMIN_2FA_OBRIGATORIO === "1";
