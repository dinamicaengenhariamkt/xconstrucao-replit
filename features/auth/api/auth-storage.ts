import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  users,
  clientes,
  empreiteiras,
  type User,
  type InsertUser,
} from "@shared/db/schema";

export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

export async function updateUserEmailVerified(userId: string, timestamp: Date): Promise<void> {
  await db.update(users).set({ emailVerified: timestamp }).where(eq(users.id, userId));
}

/**
 * Cria a row de domínio (clientes / empreiteiras) vinculada a um usuário,
 * caso ainda não exista. Idempotente — pode ser chamado várias vezes para
 * o mesmo usuário sem efeitos colaterais.
 *
 * Usado tanto no fluxo de cadastro email/senha (POST /api/auth/register)
 * quanto no primeiro login OAuth (callback NextAuth + oauth-convert).
 */
export async function ensureProfileRow(user: User): Promise<void> {
  // Atomicidade no nível do banco (constraint UNIQUE em userId já existe).
  // Isso evita race conditions entre register e oauth-convert/verify-email
  // disparando inserts concorrentes para o mesmo user.
  if (user.role === "contratante") {
    await db
      .insert(clientes)
      .values({
        userId: user.id,
        nome: user.name,
        email: user.email,
        telefone: user.phone ?? null,
        tipo: "Pessoa Física",
        status: "aprovacao",
      })
      .onConflictDoNothing({ target: clientes.userId });
    return;
  }

  if (user.role === "empreiteiro") {
    await db
      .insert(empreiteiras)
      .values({
        userId: user.id,
        nome: user.name,
        responsavel: user.name,
        email: user.email,
        telefone: user.phone ?? null,
        status: "aprovacao",
      })
      .onConflictDoNothing({ target: empreiteiras.userId });
  }
}

/**
 * Cria o usuário e, se for contratante/empreiteiro, também a row de domínio
 * vinculada (clientes / empreiteiras) com defaults sensatos.
 */
export async function createUserWithProfile(data: InsertUser): Promise<User> {
  const user = await createUser(data);
  await ensureProfileRow(user);
  return user;
}
