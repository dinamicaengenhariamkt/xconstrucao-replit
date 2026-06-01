import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { disputas, obras, users } from "@shared/db/schema";
import { criarNotificacao } from "./service";
import { getPartesObra } from "@features/disputas/disputas-service";

/**
 * Notificações do ciclo de disputas (J10 → J13). Fire-and-forget: erros são
 * logados mas nunca derrubam o caller. Sem advisory lock — cada evento parte de
 * uma única ação (abrir / resolver) do usuário ou admin.
 */

async function obraNome(obraId: string): Promise<string> {
  const [o] = await db.select({ nome: obras.nome }).from(obras).where(eq(obras.id, obraId)).limit(1);
  return o?.nome ?? "obra";
}

/** Notifica a contraparte (e admins) de que uma disputa foi aberta. */
export async function dispararNotificacaoDisputaAberta(args: { disputaId: string }): Promise<void> {
  try {
    const [d] = await db.select().from(disputas).where(eq(disputas.id, args.disputaId)).limit(1);
    if (!d) return;
    const nome = await obraNome(d.obraId);

    if (d.contraparteUserId) {
      await criarNotificacao({
        userId: d.contraparteUserId,
        tipo: "alerta",
        titulo: "Disputa aberta",
        descricao: `${nome}: foi aberta uma disputa — "${d.titulo}". Responda na área de disputas.`,
        href: `/disputas/${d.id}`,
      });
    }

    // Avisa todos os admins/superadmins para entrarem na fila de mediação.
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));
    const superadmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "superadmin"));
    for (const a of [...admins, ...superadmins]) {
      await criarNotificacao({
        userId: a.id,
        tipo: "info",
        titulo: "Nova disputa na fila",
        descricao: `${nome}: "${d.titulo}" aguarda mediação.`,
        href: `/admin/disputas`,
      });
    }
  } catch (err) {
    console.error("[disputa-notif] falha em dispararNotificacaoDisputaAberta:", err);
  }
}

/** Notifica ambas as partes da decisão do admin. */
export async function dispararNotificacaoDisputaResolvida(args: { disputaId: string }): Promise<void> {
  try {
    const [d] = await db.select().from(disputas).where(eq(disputas.id, args.disputaId)).limit(1);
    if (!d) return;
    const partes = await getPartesObra(d.obraId);
    const nome = partes?.obraNome ?? "obra";
    const alvos = [partes?.contratanteUserId, partes?.empreiteiroUserId].filter(
      (v): v is string => Boolean(v),
    );
    for (const userId of alvos) {
      await criarNotificacao({
        userId,
        tipo: "sucesso",
        titulo: "Disputa resolvida",
        descricao: `${nome}: a disputa "${d.titulo}" foi resolvida pela administração.`,
        href: `/disputas/${d.id}`,
      });
    }
  } catch (err) {
    console.error("[disputa-notif] falha em dispararNotificacaoDisputaResolvida:", err);
  }
}
