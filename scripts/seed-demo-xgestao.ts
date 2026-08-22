/**
 * Prepara a demonstração do xgestão em DESENVOLVIMENTO sem apagar dados.
 *
 * Uso:
 *   npm run db:demo:xgestao:preview
 *   CONFIRM_XGESTAO_DEMO=SIM npm run db:demo:xgestao
 *   npm run db:demo:xgestao:check
 */
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../shared/db/db";
import {
  empreiteiras,
  obras,
  platformSettings,
  userRoles,
  users,
} from "../shared/db/schema";
import { comparePassword, hashPassword } from "../features/auth/api/auth-service";
import {
  CANONICAL_ADMIN,
  type DemoPlatformSetting,
  type DemoProfile,
  type DemoStore,
  type DemoUser,
  type DemoWork,
  OBRA_DEMO,
  runDemo,
  XGESTAO_ADMIN,
  XGESTAO_EMPREITEIRO,
  assertDevelopmentDatabase,
} from "./seed-demo-xgestao-core";

const DRY_RUN = process.argv.includes("--dry-run");
const CHECK_ONLY = process.argv.includes("--check");

function abort(message: string): never {
  console.error(`[demo-xgestao] ${message}`);
  process.exit(1);
}

function createStore(): DemoStore {
  return {
    async findUserByEmail(email) {
      const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return row as DemoUser | undefined;
    },
    async createUser(user) {
      const [row] = await db.insert(users).values(user as unknown as typeof users.$inferInsert).returning();
      return row as unknown as DemoUser;
    },
    async updateUser(id, patch) {
      await db.update(users).set(patch as unknown as typeof users.$inferInsert).where(eq(users.id, id));
    },
    async listRoles(userId) {
      const rows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, userId));
      return rows.map((row) => row.role);
    },
    async addRole(userId, role) {
      await db.insert(userRoles).values({ userId, role, origem: "signup" }).onConflictDoNothing();
    },
    async findProfileByUserId(userId) {
      const [row] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, userId)).limit(1);
      return row as DemoProfile | undefined;
    },
    async createProfile(profile) {
      const [row] = await db.insert(empreiteiras).values(profile as unknown as typeof empreiteiras.$inferInsert).returning();
      return row as unknown as DemoProfile;
    },
    async updateProfile(id, patch) {
      await db.update(empreiteiras).set(patch as unknown as typeof empreiteiras.$inferInsert).where(eq(empreiteiras.id, id));
    },
    async findOwnWork(empreiteiraId, nome) {
      const [row] = await db
        .select()
        .from(obras)
        .where(and(eq(obras.empreiteiraId, empreiteiraId), eq(obras.nome, nome), isNull(obras.clienteId)))
        .limit(1);
      return row as DemoWork | undefined;
    },
    async createWork(work) {
      const [row] = await db.insert(obras).values(work as unknown as typeof obras.$inferInsert).returning();
      return row as unknown as DemoWork;
    },
    async updateWork(id, patch) {
      await db.update(obras).set(patch as unknown as typeof obras.$inferInsert).where(eq(obras.id, id));
    },
    async findPlatformSetting(chave) {
      const [row] = await db.select().from(platformSettings).where(eq(platformSettings.chave, chave)).limit(1);
      return row as DemoPlatformSetting | undefined;
    },
    async createPlatformSetting(setting) {
      await db.insert(platformSettings).values(setting as unknown as typeof platformSettings.$inferInsert);
    },
    async updatePlatformSetting(chave, patch) {
      await db.update(platformSettings).set(patch as unknown as typeof platformSettings.$inferInsert).where(eq(platformSettings.chave, chave));
    },
  };
}

async function validateDemo(): Promise<boolean> {
  const store = createStore();
  const globalAdmin = await store.findUserByEmail(CANONICAL_ADMIN.email);
  const restrictedAdmin = await store.findUserByEmail(XGESTAO_ADMIN.email);
  const empreiteiro = await store.findUserByEmail(XGESTAO_EMPREITEIRO.email);
  const roles = empreiteiro ? new Set(await store.listRoles(empreiteiro.id)) : new Set<string>();
  const profile = empreiteiro ? await store.findProfileByUserId(empreiteiro.id) : undefined;
  const work = profile ? await store.findOwnWork(profile.id, OBRA_DEMO.nome) : undefined;
  const platform = await store.findPlatformSetting("plataforma");
  const failures: string[] = [];

  if (!globalAdmin || !["admin", "superadmin"].includes(globalAdmin.role) || globalAdmin.adminEscopo === "xgestao") {
    failures.push("admin global canônico ausente ou com escopo incorreto");
  }
  if (!restrictedAdmin || restrictedAdmin.role !== "admin" || restrictedAdmin.adminEscopo !== "xgestao") {
    failures.push("admin restrito do xgestão ausente ou com escopo incorreto");
  }
  if (!empreiteiro || empreiteiro.role !== "empreiteiro" || !empreiteiro.ativo) {
    failures.push("empreiteiro de demonstração ausente ou inativo");
  }
  if (!roles.has("empreiteiro") || !roles.has("xgestao")) {
    failures.push("empreiteiro de demonstração sem os papéis empreiteiro + xgestão");
  }
  if (!profile) failures.push("perfil da empreiteira de demonstração ausente");
  if (!work || work.clienteId !== null) failures.push("obra própria de demonstração ausente ou vinculada a contratante");
  if (platform?.valor.marketplaceVisivel !== false) failures.push("modo público xgestão não está ativo");

  if (failures.length > 0) {
    console.error("[demo-xgestao] Validação falhou:");
    for (const failure of failures) console.error(`  - ${failure}`);
    return false;
  }

  console.log("[demo-xgestao] Base de demonstração validada:");
  console.log(`  - Admin global: ${CANONICAL_ADMIN.email}`);
  console.log(`  - Admin xgestão: ${XGESTAO_ADMIN.email}`);
  console.log(`  - Empreiteiro xgestão: ${XGESTAO_EMPREITEIRO.email}`);
  console.log(`  - Obra própria: ${OBRA_DEMO.nome}`);
  console.log("  - Marketplace público: oculto");
  return true;
}

async function main() {
  try {
    assertDevelopmentDatabase(process.env.DATABASE_URL, process.env.NODE_ENV);
  } catch (error) {
    abort(error instanceof Error ? error.message : String(error));
  }

  if (CHECK_ONLY) {
    if (!(await validateDemo())) process.exit(1);
    return;
  }

  if (DRY_RUN) {
    console.log("[demo-xgestao] DRY-RUN — nenhuma alteração será feita.");
    const preview = await runDemo({
      dryRun: true,
      store: createStore(),
      passwords: { hash: hashPassword, matches: comparePassword },
      now: new Date(),
    });
    for (const item of preview ?? []) console.log(`  - ${item}`);
    return;
  }

  if (process.env.CONFIRM_XGESTAO_DEMO !== "SIM") {
    abort(
      "Confirmação ausente. Revise primeiro com npm run db:demo:xgestao:preview e depois rode " +
        "CONFIRM_XGESTAO_DEMO=SIM npm run db:demo:xgestao.",
    );
  }

  await runDemo({
    dryRun: false,
    store: createStore(),
    passwords: { hash: hashPassword, matches: comparePassword },
    now: new Date(),
  });

  if (!(await validateDemo())) abort("O seed terminou, mas a conferência final falhou.");
}

main().catch((error: unknown) => {
  console.error("[demo-xgestao] Falha:", error);
  process.exit(1);
});