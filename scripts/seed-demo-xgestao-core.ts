import { extrairHost, pareceProducao } from "../shared/lib/db-env";

export const CANONICAL_ADMIN = {
  email: "admin@xconstrucao.com",
  username: "admin_xconstrucao",
  name: "Rafael Santos",
  password: "Admin@2026!Constru",
} as const;

export const XGESTAO_ADMIN = {
  email: "admin.xgestao@xconstrucao.test",
  username: "admin_xgestao_demo",
  name: "Gestão xgestão (Demonstração)",
  password: "Xgestao@2026!Demo",
} as const;

export const XGESTAO_EMPREITEIRO = {
  email: "demo.xgestao@xconstrucao.test",
  username: "empreiteiro_xgestao_demo",
  name: "Construtora Horizonte xgestão",
  password: "Xgestao@2026!Demo",
  phone: "(11) 98888-1000",
  cnpj: "11222333000181",
} as const;

export const OBRA_DEMO = {
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

export type DemoUser = {
  id: string;
  email: string;
  username?: string | null;
  password?: string | null;
  name: string;
  role: string;
  adminEscopo?: string | null;
  canManageUsers?: boolean | null;
  ativo?: boolean | null;
  phone?: string | null;
  cpfCnpj?: string | null;
  plano?: string | null;
  onboardingConcluido?: boolean | null;
  mustChangePassword?: boolean | null;
  emailVerified?: Date | null;
};

export type DemoProfile = {
  id: string;
  userId: string | null;
  nome: string;
  responsavel: string;
  email: string;
  telefone?: string | null;
  cnpj?: string | null;
  especialidade?: string | null;
  especialidades?: string[] | null;
  raioKm?: number | null;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  descricao?: string | null;
  perfilCompleto?: boolean | null;
  status?: string | null;
};

export type DemoWork = {
  id: string;
  empreiteiraId: string | null;
  clienteId: string | null;
  nome: string;
  endereco: string;
  numero?: string | null;
  complemento?: string | null;
  cep?: string | null;
  cidade?: string | null;
  uf?: string | null;
  descricao?: string | null;
  status?: string | null;
  visibilidade?: string | null;
  statusModeracao?: string | null;
  modalidade?: string | null;
  materiaisPor?: string | null;
  areaM2?: string | null;
  valorTotal?: string | null;
  valorPago?: string | null;
  progresso?: number | null;
  dataInicio?: string | null;
  dataPrevisao?: string | null;
  updatedAt?: Date | null;
};

export type DemoPlatformSetting = {
  chave: string;
  valor: Record<string, unknown>;
  updatedAt?: Date | null;
  updatedBy?: string | null;
};

export type DemoStore = {
  findUserByEmail(email: string): Promise<DemoUser | undefined>;
  createUser(user: Omit<DemoUser, "id">): Promise<DemoUser>;
  updateUser(id: string, patch: Partial<Omit<DemoUser, "id" | "email">>): Promise<void>;
  listRoles(userId: string): Promise<string[]>;
  addRole(userId: string, role: "empreiteiro" | "xgestao"): Promise<void>;
  findProfileByUserId(userId: string): Promise<DemoProfile | undefined>;
  createProfile(profile: Omit<DemoProfile, "id">): Promise<DemoProfile>;
  updateProfile(id: string, patch: Partial<Omit<DemoProfile, "id" | "userId">>): Promise<void>;
  findOwnWork(empreiteiraId: string, nome: string): Promise<DemoWork | undefined>;
  createWork(work: Omit<DemoWork, "id">): Promise<DemoWork>;
  updateWork(id: string, patch: Partial<Omit<DemoWork, "id">>): Promise<void>;
  findPlatformSetting(chave: string): Promise<DemoPlatformSetting | undefined>;
  createPlatformSetting(setting: DemoPlatformSetting): Promise<void>;
  updatePlatformSetting(chave: string, patch: Partial<Omit<DemoPlatformSetting, "chave">>): Promise<void>;
};

export type PasswordService = {
  hash(password: string): Promise<string>;
  matches(password: string, stored: string): Promise<boolean>;
};

function changesFor<T extends object>(current: T, expected: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(expected).filter(([key, value]) => {
      const currentValue = current[key as keyof T];
      return Array.isArray(value)
        ? JSON.stringify(currentValue) !== JSON.stringify(value)
        : currentValue !== value;
    }),
  ) as Partial<T>;
}

function hasChanges(value: object): boolean {
  return Object.keys(value).length > 0;
}

export function developmentDatabaseError(
  databaseUrl: string | undefined,
  nodeEnv: string | undefined,
): string | undefined {
  const url = databaseUrl?.trim() ?? "";
  if (!url) return "DATABASE_URL não está definido.";

  if (nodeEnv === "production" || pareceProducao(url)) {
    return (
      `O banco "${extrairHost(url)}" não é reconhecido como desenvolvimento. ` +
      "O seed de demonstração xgestão nunca roda fora de desenvolvimento."
    );
  }
}

export function assertDevelopmentDatabase(
  databaseUrl: string | undefined,
  nodeEnv: string | undefined,
): void {
  const error = developmentDatabaseError(databaseUrl, nodeEnv);
  if (error) throw new Error(error);
}

export function previewDemo(): string[] {
  return [
    "preservaria todas as contas e dados existentes do marketplace",
    `criaria ou atualizaria ${XGESTAO_ADMIN.email}`,
    `criaria ou atualizaria ${XGESTAO_EMPREITEIRO.email} e sua obra própria`,
    "deixaria marketplaceVisivel=false no ambiente de desenvolvimento",
  ];
}

export async function runDemo(options: {
  dryRun: boolean;
  store: DemoStore;
  passwords: PasswordService;
  now: Date;
}): Promise<string[] | undefined> {
  if (options.dryRun) return previewDemo();
  await prepareDemo(options.store, options.passwords, options.now);
}

/**
 * Aplica o estado reservado de demonstração sem tocar em registros fora do
 * escopo. Reexecuções que já encontram esse estado são no-ops, inclusive nos
 * timestamps, para que o seed seja comprovadamente idempotente.
 */
export async function prepareDemo(
  store: DemoStore,
  passwords: PasswordService,
  now: Date,
): Promise<void> {
  const canonicalAdmin = await store.findUserByEmail(CANONICAL_ADMIN.email);
  let globalAdminId = canonicalAdmin?.id;
  if (!canonicalAdmin) {
    const created = await store.createUser({
      ...CANONICAL_ADMIN,
      password: await passwords.hash(CANONICAL_ADMIN.password),
      role: "admin",
      adminEscopo: "global",
      canManageUsers: true,
      ativo: true,
      emailVerified: now,
    });
    globalAdminId = created.id;
  } else if (
    !["admin", "superadmin"].includes(canonicalAdmin.role) ||
    canonicalAdmin.adminEscopo === "xgestao"
  ) {
    throw new Error(
      `A conta canônica ${CANONICAL_ADMIN.email} existe, mas não é um administrador global. ` +
        "Nenhuma alteração foi feita nessa conta.",
    );
  }

  if (!globalAdminId) throw new Error("Não foi possível preparar as identidades da demonstração.");

  const restrictedAdmin = await store.findUserByEmail(XGESTAO_ADMIN.email);
  if (restrictedAdmin) {
    const patch = changesFor(restrictedAdmin, {
      name: XGESTAO_ADMIN.name,
      role: "admin",
      adminEscopo: "xgestao",
      canManageUsers: false,
      ativo: true,
      mustChangePassword: false,
    });
    if (!restrictedAdmin.emailVerified) patch.emailVerified = now;
    if (
      !(await passwords.matches(XGESTAO_ADMIN.password, restrictedAdmin.password ?? ""))
    ) {
      patch.password = await passwords.hash(XGESTAO_ADMIN.password);
    }
    if (hasChanges(patch)) await store.updateUser(restrictedAdmin.id, patch);
  } else {
    await store.createUser({
      ...XGESTAO_ADMIN,
      password: await passwords.hash(XGESTAO_ADMIN.password),
      role: "admin",
      adminEscopo: "xgestao",
      canManageUsers: false,
      ativo: true,
      mustChangePassword: false,
      emailVerified: now,
    });
  }

  let empreiteiro = await store.findUserByEmail(XGESTAO_EMPREITEIRO.email);
  if (empreiteiro) {
    const patch = changesFor(empreiteiro, {
      name: XGESTAO_EMPREITEIRO.name,
      role: "empreiteiro",
      phone: XGESTAO_EMPREITEIRO.phone,
      cpfCnpj: XGESTAO_EMPREITEIRO.cnpj,
      plano: "free",
      ativo: true,
      onboardingConcluido: true,
      mustChangePassword: false,
    });
    if (!empreiteiro.emailVerified) patch.emailVerified = now;
    if (
      !(await passwords.matches(XGESTAO_EMPREITEIRO.password, empreiteiro.password ?? ""))
    ) {
      patch.password = await passwords.hash(XGESTAO_EMPREITEIRO.password);
    }
    if (hasChanges(patch)) await store.updateUser(empreiteiro.id, patch);
  } else {
    const { cnpj, ...empreiteiroIdentity } = XGESTAO_EMPREITEIRO;
    empreiteiro = await store.createUser({
      ...empreiteiroIdentity,
      password: await passwords.hash(XGESTAO_EMPREITEIRO.password),
      role: "empreiteiro",
      cpfCnpj: cnpj,
      plano: "free",
      ativo: true,
      onboardingConcluido: true,
      mustChangePassword: false,
      emailVerified: now,
    });
  }

  if (!empreiteiro) throw new Error("Não foi possível preparar o empreiteiro da demonstração.");

  const existingRoles = new Set(await store.listRoles(empreiteiro.id));
  for (const role of ["empreiteiro", "xgestao"] as const) {
    if (!existingRoles.has(role)) await store.addRole(empreiteiro.id, role);
  }

  const profileValues: Omit<DemoProfile, "id" | "userId"> = {
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
    status: "ativo",
  };
  let profile = await store.findProfileByUserId(empreiteiro.id);
  if (profile) {
    const patch = changesFor(profile, profileValues);
    if (hasChanges(patch)) await store.updateProfile(profile.id, patch);
  } else {
    profile = await store.createProfile({ userId: empreiteiro.id, ...profileValues });
  }

  if (!profile) throw new Error("Não foi possível preparar o perfil da empreiteira de demonstração.");

  const workValues = {
    ...OBRA_DEMO,
    empreiteiraId: profile.id,
    clienteId: null,
    status: "em_andamento",
    visibilidade: "rascunho",
    statusModeracao: "pendente",
    modalidade: "empreitada_global",
    materiaisPor: "empreiteiro",
    areaM2: "180.00",
    valorTotal: "240000.00",
    valorPago: "72000.00",
    progresso: 30,
    dataInicio: "2026-07-01",
    dataPrevisao: "2026-11-30",
  } as const;
  const work = await store.findOwnWork(profile.id, OBRA_DEMO.nome);
  if (work) {
    const patch = changesFor(work, workValues);
    if (hasChanges(patch)) await store.updateWork(work.id, { ...patch, updatedAt: now });
  } else {
    await store.createWork({ ...workValues, updatedAt: now });
  }

  const platform = await store.findPlatformSetting("plataforma");
  if (platform) {
    if (platform.valor.marketplaceVisivel !== false) {
      await store.updatePlatformSetting(platform.chave, {
        valor: { ...platform.valor, marketplaceVisivel: false },
        updatedAt: now,
        updatedBy: globalAdminId,
      });
    }
  } else {
    await store.createPlatformSetting({
      chave: "plataforma",
      valor: { marketplaceVisivel: false },
      updatedAt: now,
      updatedBy: globalAdminId,
    });
  }
}