/**
 * Prepara a demonstração do xgestão em DESENVOLVIMENTO sem apagar dados.
 *
 * Uso:
 *   npm run db:demo:xgestao:preview
 *   CONFIRM_XGESTAO_DEMO=SIM npm run db:demo:xgestao
 *   npm run db:demo:xgestao:check
 *
 * A operação só cria/atualiza três identidades conhecidas:
 *   - admin@xconstrucao.com (apenas se ainda não existir; permanece global)
 *   - admin.xgestao@xconstrucao.test (admin restrito ao xgestão)
 *   - demo.xgestao@xconstrucao.test (empreiteiro xgestão + obra própria)
 *
 * Nenhuma tabela é limpa e nenhuma identidade existente fora dessas contas é
 * alterada. Produção e bancos com host desconhecido são sempre recusados.
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
import { extrairHost, pareceProducao } from "../shared/lib/db-env";
import { hashPassword } from "../features/auth/api/auth-service";

const DRY_RUN = process.argv.includes("--dry-run");
const CHECK_ONLY = process.argv.includes("--check");

const CANONICAL_ADMIN = {
  email: "admin@xconstrucao.com",
  username: "admin_xconstrucao",
  name: "Rafael Santos",
  password: "Admin@2026!Constru",
} as const;

const XGESTAO_ADMIN = {
  email: "admin.xgestao@xconstrucao.test",
  username: "admin_xgestao_demo",
  name: "Gestão xgestão (Demonstração)",
  password: "Xgestao@2026!Demo",
} as const;

const XGESTAO_EMPREITEIRO = {
  email: "demo.xgestao@xconstrucao.test",
  username: "empreiteiro_xgestao_demo",
  name: "Construtora Horizonte xgestão",
  password: "Xgestao@2026!Demo",
  phone: "(11) 98888-1000",
  cnpj: "11222333000181",
} as const;

const OBRA_DEMO = {
  nome: "Reforma Residencial — Demonstração xgestão",
  endereco: "Rua das Palmeiras",
  numero: "120",
  complemento: "Casa 2",
  cep: "01310-100",
  cidade: "São Paulo",
  uf: "SP",
  descricao:
    "Obra própria de demonstração para acompanhar planejamento, progresso e execução no xgestão.",
} as const;

function abort(message: string): never {
  console.error(`[demo-xgestao] ${message}`);
  process.exit(1);
}

function assertDevelopmentDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.trim()) abort("DATABASE_URL não está definido.");

  if (process.env.NODE_ENV === "production" || pareceProducao(databaseUrl)) {
    abort(
      `O banco "${extrairHost(databaseUrl)}" não é reconhecido como desenvolvimento. ` +
        "O seed de demonstração xgestão nunca roda fora de desenvolvimento.",
    );
  }
}

async function validateDemo(): Promise<boolean> {
  const [globalAdmin] = await db
    .select({ id: users.id, role: users.role, adminEscopo: users.adminEscopo })
    .from(users)
    .where(eq(users.email, CANONICAL_ADMIN.email))
    .limit(1);
  const [restrictedAdmin] = await db
    .select({ id: users.id, role: users.role, adminEscopo: users.adminEscopo })
    .from(users)
    .where(eq(users.email, XGESTAO_ADMIN.email))
    .limit(1);
  const [empreiteiro] = await db
    .select({ id: users.id, role: users.role, ativo: users.ativo })
    .from(users)
    .where(eq(users.email, XGESTAO_EMPREITEIRO.email))
    .limit(1);
  const [plataforma] = await db
    .select({ valor: platformSettings.valor })
    .from(platformSettings)
    .where(eq(platformSettings.chave, "plataforma"))
    .limit(1);

  const roles = empreiteiro
    ? await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, empreiteiro.id))
    : [];
  const [perfil] = empreiteiro
    ? await db
        .select({ id: empreiteiras.id })
        .from(empreiteiras)
        .where(eq(empreiteiras.userId, empreiteiro.id))
        .limit(1)
    : [];
  const [obra] = perfil
    ? await db
        .select({ id: obras.id, clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
        .from(obras)
        .where(
          and(
            eq(obras.empreiteiraId, perfil.id),
            eq(obras.nome, OBRA_DEMO.nome),
            isNull(obras.clienteId),
          ),
        )
        .limit(1)
    : [];

  const marketplaceVisivel = (plataforma?.valor as Record<string, unknown> | undefined)
    ?.marketplaceVisivel;
  const roleNames = new Set(roles.map((item) => item.role));
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
  if (!roleNames.has("empreiteiro") || !roleNames.has("xgestao")) {
    failures.push("empreiteiro de demonstração sem os papéis empreiteiro + xgestão");
  }
  if (!perfil) failures.push("perfil da empreiteira de demonstração ausente");
  if (!obra || obra.clienteId !== null) failures.push("obra própria de demonstração ausente ou vinculada a contratante");
  if (marketplaceVisivel !== false) failures.push("modo público xgestão não está ativo");

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
  assertDevelopmentDatabase();

  if (CHECK_ONLY) {
    if (!(await validateDemo())) process.exit(1);
    return;
  }

  if (DRY_RUN) {
    console.log("[demo-xgestao] DRY-RUN — nenhuma alteração será feita.");
    console.log("  - preservaria todas as contas e dados existentes do marketplace");
    console.log(`  - criaria ou atualizaria ${XGESTAO_ADMIN.email}`);
    console.log(`  - criaria ou atualizaria ${XGESTAO_EMPREITEIRO.email} e sua obra própria`);
    console.log("  - deixaria marketplaceVisivel=false no ambiente de desenvolvimento");
    return;
  }

  if (process.env.CONFIRM_XGESTAO_DEMO !== "SIM") {
    abort(
      "Confirmação ausente. Revise primeiro com npm run db:demo:xgestao:preview e depois rode " +
        "CONFIRM_XGESTAO_DEMO=SIM npm run db:demo:xgestao.",
    );
  }

  const now = new Date();
  const [canonicalAdmin] = await db
    .select({ id: users.id, role: users.role, adminEscopo: users.adminEscopo })
    .from(users)
    .where(eq(users.email, CANONICAL_ADMIN.email))
    .limit(1);

  let globalAdminId = canonicalAdmin?.id;
  if (!canonicalAdmin) {
    const [created] = await db
      .insert(users)
      .values({
        ...CANONICAL_ADMIN,
        password: await hashPassword(CANONICAL_ADMIN.password),
        role: "admin",
        adminEscopo: "global",
        canManageUsers: true,
        ativo: true,
        emailVerified: now,
      })
      .returning({ id: users.id });
    globalAdminId = created.id;
    console.log(`[demo-xgestao] Admin global criado: ${CANONICAL_ADMIN.email}`);
  } else if (!["admin", "superadmin"].includes(canonicalAdmin.role) || canonicalAdmin.adminEscopo === "xgestao") {
    abort(
      `A conta canônica ${CANONICAL_ADMIN.email} existe, mas não é um administrador global. ` +
        "Nenhuma alteração foi feita nessa conta.",
    );
  } else {
    console.log(`[demo-xgestao] Admin global preservado: ${CANONICAL_ADMIN.email}`);
  }

  const [existingRestrictedAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, XGESTAO_ADMIN.email))
    .limit(1);
  const restrictedAdminPassword = await hashPassword(XGESTAO_ADMIN.password);
  if (existingRestrictedAdmin) {
    await db
      .update(users)
      .set({
        name: XGESTAO_ADMIN.name,
        password: restrictedAdminPassword,
        role: "admin",
        adminEscopo: "xgestao",
        canManageUsers: false,
        ativo: true,
        mustChangePassword: false,
        emailVerified: now,
      })
      .where(eq(users.id, existingRestrictedAdmin.id));
  } else {
    await db.insert(users).values({
      ...XGESTAO_ADMIN,
      password: restrictedAdminPassword,
      role: "admin",
      adminEscopo: "xgestao",
      canManageUsers: false,
      ativo: true,
      mustChangePassword: false,
      emailVerified: now,
    });
  }

  const [existingEmpreiteiro] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, XGESTAO_EMPREITEIRO.email))
    .limit(1);
  const empreiteiroPassword = await hashPassword(XGESTAO_EMPREITEIRO.password);
  let empreiteiroId = existingEmpreiteiro?.id;
  if (existingEmpreiteiro) {
    await db
      .update(users)
      .set({
        name: XGESTAO_EMPREITEIRO.name,
        password: empreiteiroPassword,
        role: "empreiteiro",
        phone: XGESTAO_EMPREITEIRO.phone,
        cpfCnpj: XGESTAO_EMPREITEIRO.cnpj,
        plano: "free",
        ativo: true,
        onboardingConcluido: true,
        mustChangePassword: false,
        emailVerified: now,
      })
      .where(eq(users.id, existingEmpreiteiro.id));
  } else {
    const [created] = await db
      .insert(users)
      .values({
        ...XGESTAO_EMPREITEIRO,
        password: empreiteiroPassword,
        role: "empreiteiro",
        cpfCnpj: XGESTAO_EMPREITEIRO.cnpj,
        plano: "free",
        ativo: true,
        onboardingConcluido: true,
        mustChangePassword: false,
        emailVerified: now,
      })
      .returning({ id: users.id });
    empreiteiroId = created.id;
  }

  if (!empreiteiroId || !globalAdminId) abort("Não foi possível preparar as identidades da demonstração.");

  await db
    .insert(userRoles)
    .values([
      { userId: empreiteiroId, role: "empreiteiro", origem: "signup" },
      { userId: empreiteiroId, role: "xgestao", origem: "signup" },
    ])
    .onConflictDoNothing();

  const dadosEmpreiteira = {
    nome: XGESTAO_EMPREITEIRO.name,
    responsavel: "Ana Martins",
    email: XGESTAO_EMPREITEIRO.email,
    telefone: XGESTAO_EMPREITEIRO.phone,
    cnpj: XGESTAO_EMPREITEIRO.cnpj,
    especialidade: "Reformas residenciais",
    especialidades: ["Reformas", "Planejamento", "Acabamento"],
    raioKm: 50,
    cep: OBRA_DEMO.cep,
    endereco: "Rua das Palmeiras",
    cidade: OBRA_DEMO.cidade,
    estado: OBRA_DEMO.uf,
    descricao: "Empreiteira de demonstração do xgestão.",
    perfilCompleto: true,
    status: "ativo" as const,
  };
  const [existingProfile] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, empreiteiroId))
    .limit(1);
  let empreiteiraId = existingProfile?.id;
  if (existingProfile) {
    await db.update(empreiteiras).set(dadosEmpreiteira).where(eq(empreiteiras.id, existingProfile.id));
  } else {
    const [created] = await db
      .insert(empreiteiras)
      .values({ userId: empreiteiroId, ...dadosEmpreiteira })
      .returning({ id: empreiteiras.id });
    empreiteiraId = created.id;
  }

  if (!empreiteiraId) abort("Não foi possível preparar o perfil da empreiteira de demonstração.");

  const dadosObra = {
    ...OBRA_DEMO,
    empreiteiraId,
    clienteId: null,
    status: "em_andamento" as const,
    visibilidade: "rascunho" as const,
    statusModeracao: "pendente" as const,
    modalidade: "empreitada_global" as const,
    materiaisPor: "empreiteiro" as const,
    areaM2: "180.00",
    valorTotal: "240000.00",
    valorPago: "72000.00",
    progresso: 30,
    dataInicio: "2026-07-01",
    dataPrevisao: "2026-11-30",
    updatedAt: now,
  };
  const [existingWork] = await db
    .select({ id: obras.id })
    .from(obras)
    .where(
      and(
        eq(obras.empreiteiraId, empreiteiraId),
        eq(obras.nome, OBRA_DEMO.nome),
        isNull(obras.clienteId),
      ),
    )
    .limit(1);
  if (existingWork) {
    await db.update(obras).set(dadosObra).where(eq(obras.id, existingWork.id));
  } else {
    await db.insert(obras).values(dadosObra);
  }

  const [existingPlatformSettings] = await db
    .select({ valor: platformSettings.valor })
    .from(platformSettings)
    .where(eq(platformSettings.chave, "plataforma"))
    .limit(1);
  const plataformaAtual = (existingPlatformSettings?.valor as Record<string, unknown> | undefined) ?? {};
  const plataformaDemo = { ...plataformaAtual, marketplaceVisivel: false };
  if (existingPlatformSettings) {
    await db
      .update(platformSettings)
      .set({ valor: plataformaDemo, updatedAt: now, updatedBy: globalAdminId })
      .where(eq(platformSettings.chave, "plataforma"));
  } else {
    await db.insert(platformSettings).values({
      chave: "plataforma",
      valor: plataformaDemo,
      updatedAt: now,
      updatedBy: globalAdminId,
    });
  }

  if (!(await validateDemo())) abort("O seed terminou, mas a conferência final falhou.");
}

main().catch((error: unknown) => {
  console.error("[demo-xgestao] Falha:", error);
  process.exit(1);
});