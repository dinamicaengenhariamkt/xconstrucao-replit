import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { eq, inArray } from "drizzle-orm";
import { criarNotificacao } from "./service";

/**
 * Dispara notificações in-app para todos os admin/superadmin sobre eventos
 * de assinatura de um usuário (checkout, cancelamento, inadimplência).
 *
 * Fire-and-forget seguro — todos os erros são capturados internamente.
 *
 * Eventos suportados:
 *  - "checkout"        → Nova assinatura paga ativada
 *  - "cancelamento"    → Usuário cancelou a assinatura
 *  - "inadimplente"    → Pagamento recusado / assinatura inadimplente
 *  - "reativacao"      → Assinatura reativada após pagamento confirmado
 */
export async function dispararNotificacaoAssinaturaAdmin(args: {
  tipo: "checkout" | "cancelamento" | "inadimplente" | "reativacao";
  userNome: string;
  userEmail: string;
  planoNome: string;
  ciclo?: "mensal" | "anual";
  /** Sobrescreve a descrição gerada automaticamente para o tipo. */
  descricaoOverride?: string;
  /** Tipo da notificação in-app. Default: "info". Use "alerta" para situações críticas. */
  tipoNotificacao?: "info" | "alerta" | "sucesso" | "lembrete";
}): Promise<void> {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["admin", "superadmin"]));

    if (admins.length === 0) return;

    let titulo: string;
    let descricao: string;
    const cicloLabel = args.ciclo === "anual" ? "anual" : "mensal";

    switch (args.tipo) {
      case "checkout":
        titulo = `Nova assinatura: ${args.planoNome}`;
        descricao = `${args.userNome} (${args.userEmail}) assinou o plano ${args.planoNome} (${cicloLabel}).`;
        break;
      case "cancelamento":
        titulo = `Assinatura cancelada: ${args.planoNome}`;
        descricao = `${args.userNome} (${args.userEmail}) cancelou o plano ${args.planoNome}.`;
        break;
      case "inadimplente":
        titulo = `Pagamento recusado: ${args.planoNome}`;
        descricao = `Pagamento de ${args.userNome} (${args.userEmail}) para o plano ${args.planoNome} foi recusado. Assinatura marcada como inadimplente.`;
        break;
      case "reativacao":
        titulo = `Assinatura reativada: ${args.planoNome}`;
        descricao = `${args.userNome} (${args.userEmail}) regularizou o pagamento e o plano ${args.planoNome} foi reativado.`;
        break;
    }

    if (args.descricaoOverride) {
      descricao = args.descricaoOverride;
    }

    const tipoNotificacao = args.tipoNotificacao ?? "info";

    for (const admin of admins) {
      await criarNotificacao({
        userId: admin.id,
        tipo: tipoNotificacao,
        titulo,
        descricao,
        href: "/admin/financeiro",
      });
    }
  } catch (err) {
    console.error("[assinatura-admin-dispatcher] falha ao notificar admins:", err);
  }
}
