import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, clientes, empreiteiras, userRoles } from "@shared/db/schema";

/**
 * J23 — adiciona um papel ADITIVO ao usuário (multi-role), criando a tabela
 * complementar correspondente reaproveitando o cadastro. Idempotente. NÃO altera o
 * papel primário (`users.role`) — só acrescenta capacidade. Usado no upgrade
 * anunciante → contratante/empreiteiro (mesma conta/login).
 */
export async function adicionarPapel(
  userId: string,
  role: "contratante" | "empreiteiro",
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return false;

    await tx
      .insert(userRoles)
      .values({ userId, role, origem: "upgrade" })
      .onConflictDoNothing();

    if (role === "contratante") {
      await tx
        .insert(clientes)
        .values({
          userId,
          nome: user.name,
          email: user.email,
          telefone: user.phone ?? null,
          tipo: "Pessoa Física",
          status: "aprovacao",
        })
        .onConflictDoNothing({ target: clientes.userId });
    } else {
      await tx
        .insert(empreiteiras)
        .values({
          userId,
          nome: user.name,
          responsavel: user.name,
          email: user.email,
          telefone: user.phone ?? null,
          status: "aprovacao",
        })
        .onConflictDoNothing({ target: empreiteiras.userId });
    }

    return true;
  });
}
