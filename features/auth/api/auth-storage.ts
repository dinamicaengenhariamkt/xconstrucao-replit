import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  users,
  clientes,
  empreiteiras,
  anunciantes,
  userRoles,
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

/** Registra o último login (J29 — base do churn por inatividade). */
export async function updateUserLastLogin(userId: string, when: Date): Promise<void> {
  await db.update(users).set({ lastLoginAt: when }).where(eq(users.id, userId));
}

/** Soft-delete: desativa a conta (self-service J02 ou admin). Login passa a recusar. */
export async function setUserAtivo(userId: string, ativo: boolean): Promise<void> {
  await db.update(users).set({ ativo }).where(eq(users.id, userId));
}

/**
 * Troca o email do usuário e o remarca como verificado (já confirmado pelo
 * token de verificação enviado ao novo endereço). J02 — trocar email self-service.
 */
export async function updateUserEmail(userId: string, email: string, verifiedAt: Date): Promise<void> {
  await db.update(users).set({ email, emailVerified: verifiedAt }).where(eq(users.id, userId));
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
 * vinculada (clientes / empreiteiras) com defaults sensatos. Atômico:
 * se a criação do profile falhar, o user também é descartado.
 */
export async function createUserWithProfile(
  data: InsertUser,
  profileExtras?: { cpfCnpj?: string },
): Promise<User> {
  // cpfCnpj vem normalizado (só dígitos) do registerSchema. ≤11 dígitos → CPF
  // (Pessoa Física); mais que isso → CNPJ (Pessoa Jurídica). Persistido no
  // perfil de domínio para que o checkout de assinatura (ASAAS) o encontre.
  const cpfCnpj = profileExtras?.cpfCnpj || null;
  const tipoCliente = cpfCnpj && cpfCnpj.length > 11 ? "Pessoa Jurídica" : "Pessoa Física";

  return await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(data).returning();

    if (user.role === "contratante") {
      await tx
        .insert(clientes)
        .values({
          userId: user.id,
          nome: user.name,
          email: user.email,
          telefone: user.phone ?? null,
          tipo: tipoCliente,
          cnpjCpf: cpfCnpj,
          status: "aprovacao",
        })
        .onConflictDoNothing({ target: clientes.userId });
    } else if (user.role === "empreiteiro") {
      await tx
        .insert(empreiteiras)
        .values({
          userId: user.id,
          nome: user.name,
          responsavel: user.name,
          email: user.email,
          telefone: user.phone ?? null,
          cnpj: cpfCnpj,
          status: "aprovacao",
        })
        .onConflictDoNothing({ target: empreiteiras.userId });
    } else if (user.role === "anunciante") {
      // J23 — identidade de anunciante vinculada à conta (unifica `anunciantes`).
      await tx
        .insert(anunciantes)
        .values({
          userId: user.id,
          nome: user.name,
          email: user.email,
          telefone: user.phone ?? null,
          status: "ativo",
        })
        .onConflictDoNothing({ target: anunciantes.userId });
    }

    // J23 — multi-role: registra o papel PRIMÁRIO como papel aditivo também, para
    // que userHasRole funcione de forma consistente desde o cadastro. Só papéis
    // comuns entram em user_roles (o enum aditivo não aceita admin/superadmin).
    if (user.role === "contratante" || user.role === "empreiteiro" || user.role === "anunciante") {
      await tx
        .insert(userRoles)
        .values({ userId: user.id, role: user.role, origem: "signup" })
        .onConflictDoNothing();
    }

    return user;
  });
}

/**
 * Verifica se o usuário OAuth recém-logado já tem alguma row de domínio.
 * Usado pelo oauth-convert para detectar "primeiro login" e aplicar a
 * persona escolhida na landing antes de criar a row errada.
 */
export async function hasAnyProfileRow(userId: string): Promise<boolean> {
  const [c] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, userId));
  if (c) return true;
  const [e] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, userId));
  return Boolean(e);
}

/**
 * Atualiza a role do usuário. Usado no oauth-convert quando a persona
 * escolhida na landing diverge da role default persistida pelo DrizzleAdapter.
 */
export async function updateUserRole(
  userId: string,
  role: "admin" | "contratante" | "empreiteiro"
): Promise<User | undefined> {
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
  return updated;
}
