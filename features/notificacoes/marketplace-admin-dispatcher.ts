import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras, users } from "@shared/db/schema";
import { criarNotificacao } from "./service";

function formatarValorBRL(valor: unknown): string | null {
  const num = Number(valor);
  if (!Number.isFinite(num) || num <= 0) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Notifica todos os admin/superadmin de um evento-chave do marketplace (J57).
 *
 * Escopo deliberado: dispara SÓ no ACEITE de uma candidatura (obra contratada),
 * NÃO a cada proposta recebida — evita spam na caixa dos admins. Espelha o
 * padrão de `assinatura-admin-dispatcher.ts` (role IN admin/superadmin + loop
 * `criarNotificacao`, href de admin).
 *
 * Fire-and-forget seguro — resolve os nomes das partes por `obraId` para manter
 * o caller (rota de aceite) enxuto; todos os erros são capturados internamente.
 */
export async function dispararNotificacaoObraContratadaAdmin(
  obraId: string,
): Promise<void> {
  try {
    const [obra] = await db
      .select({
        nome: obras.nome,
        valorTotal: obras.valorTotal,
        clienteId: obras.clienteId,
        empreiteiraId: obras.empreiteiraId,
      })
      .from(obras)
      .where(eq(obras.id, obraId));
    if (!obra) return;

    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["admin", "superadmin"]));
    if (admins.length === 0) return;

    let contratanteNome: string | null = null;
    if (obra.clienteId) {
      const [cli] = await db
        .select({ nome: clientes.nome })
        .from(clientes)
        .where(eq(clientes.id, obra.clienteId));
      contratanteNome = cli?.nome ?? null;
    }
    let empreiteiraNome: string | null = null;
    if (obra.empreiteiraId) {
      const [emp] = await db
        .select({ nome: empreiteiras.nome })
        .from(empreiteiras)
        .where(eq(empreiteiras.id, obra.empreiteiraId));
      empreiteiraNome = emp?.nome ?? null;
    }

    const valorLabel = formatarValorBRL(obra.valorTotal);
    const partes =
      contratanteNome && empreiteiraNome
        ? `${contratanteNome} contratou ${empreiteiraNome}`
        : "As partes fecharam o contrato";
    const valorSuffix = valorLabel ? ` (${valorLabel})` : "";
    const descricao = `${partes} para a obra "${obra.nome}"${valorSuffix}.`;

    for (const admin of admins) {
      await criarNotificacao({
        userId: admin.id,
        tipo: "info",
        titulo: "Obra contratada",
        descricao,
        href: "/admin/obras",
      });
    }
  } catch (err) {
    console.error("[marketplace-admin-dispatcher] falha ao notificar admins:", err);
  }
}
