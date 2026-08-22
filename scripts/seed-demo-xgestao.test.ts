/**
 * Cobertura do seed aditivo xgestão.
 *
 * Executor: `node:test` (Node 20) + tsx.
 * Rodar: npm run test:seed:xgestao
 *
 * O repositório em memória torna observável cada escrita sem usar o banco de
 * desenvolvimento. Assim, a suíte prova tanto o escopo das mutações quanto a
 * idempotência da execução real do núcleo do seed.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_ADMIN,
  developmentDatabaseError,
  type DemoPlatformSetting,
  type DemoProfile,
  type DemoStore,
  type DemoUser,
  type DemoWork,
  OBRA_DEMO,
  runDemo,
  XGESTAO_ADMIN,
  XGESTAO_EMPREITEIRO,
} from "./seed-demo-xgestao-core.js";

const NOW = new Date("2026-08-22T12:00:00.000Z");
const PASSWORDS = {
  hash: async (password: string) => `hash:${password}`,
  matches: async (password: string, stored: string) => stored === `hash:${password}`,
};

function jsonSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class MemoryStore implements DemoStore {
  writes = 0;
  users: DemoUser[];
  profiles: DemoProfile[];
  works: DemoWork[];
  platformSettings: DemoPlatformSetting[];
  private readonly roles = new Map<string, Set<string>>();

  constructor(seed: {
    users: DemoUser[];
    profiles: DemoProfile[];
    works: DemoWork[];
    platformSettings: DemoPlatformSetting[];
    roles?: Array<[string, string[]]>;
  }) {
    this.users = structuredClone(seed.users);
    this.profiles = structuredClone(seed.profiles);
    this.works = structuredClone(seed.works);
    this.platformSettings = structuredClone(seed.platformSettings);
    for (const [userId, roles] of seed.roles ?? []) this.roles.set(userId, new Set(roles));
  }

  async findUserByEmail(email: string) {
    return this.users.find((user) => user.email === email);
  }

  async createUser(user: Omit<DemoUser, "id">) {
    const created: DemoUser = { ...structuredClone(user), id: `user-${this.users.length + 1}` };
    this.users.push(created);
    this.writes++;
    return created;
  }

  async updateUser(id: string, patch: Partial<Omit<DemoUser, "id" | "email">>) {
    const user = this.users.find((item) => item.id === id);
    assert.ok(user, `usuário ${id} deve existir`);
    Object.assign(user, structuredClone(patch));
    this.writes++;
  }

  async listRoles(userId: string) {
    return [...(this.roles.get(userId) ?? [])];
  }

  async addRole(userId: string, role: "empreiteiro" | "xgestao") {
    const roles = this.roles.get(userId) ?? new Set<string>();
    if (!roles.has(role)) {
      roles.add(role);
      this.roles.set(userId, roles);
      this.writes++;
    }
  }

  async findProfileByUserId(userId: string) {
    return this.profiles.find((profile) => profile.userId === userId);
  }

  async createProfile(profile: Omit<DemoProfile, "id">) {
    const created: DemoProfile = { ...structuredClone(profile), id: `profile-${this.profiles.length + 1}` };
    this.profiles.push(created);
    this.writes++;
    return created;
  }

  async updateProfile(id: string, patch: Partial<Omit<DemoProfile, "id" | "userId">>) {
    const profile = this.profiles.find((item) => item.id === id);
    assert.ok(profile, `perfil ${id} deve existir`);
    Object.assign(profile, structuredClone(patch));
    this.writes++;
  }

  async findOwnWork(empreiteiraId: string, nome: string) {
    return this.works.find(
      (work) => work.empreiteiraId === empreiteiraId && work.nome === nome && work.clienteId === null,
    );
  }

  async createWork(work: Omit<DemoWork, "id">) {
    const created: DemoWork = { ...structuredClone(work), id: `work-${this.works.length + 1}` };
    this.works.push(created);
    this.writes++;
    return created;
  }

  async updateWork(id: string, patch: Partial<Omit<DemoWork, "id">>) {
    const work = this.works.find((item) => item.id === id);
    assert.ok(work, `obra ${id} deve existir`);
    Object.assign(work, structuredClone(patch));
    this.writes++;
  }

  async findPlatformSetting(chave: string) {
    return this.platformSettings.find((setting) => setting.chave === chave);
  }

  async createPlatformSetting(setting: DemoPlatformSetting) {
    this.platformSettings.push(structuredClone(setting));
    this.writes++;
  }

  async updatePlatformSetting(chave: string, patch: Partial<Omit<DemoPlatformSetting, "chave">>) {
    const setting = this.platformSettings.find((item) => item.chave === chave);
    assert.ok(setting, `configuração ${chave} deve existir`);
    Object.assign(setting, structuredClone(patch));
    this.writes++;
  }

  snapshot() {
    return JSON.parse(
      JSON.stringify({
        users: [...this.users].sort((a, b) => a.id.localeCompare(b.id)),
        profiles: [...this.profiles].sort((a, b) => a.id.localeCompare(b.id)),
        works: [...this.works].sort((a, b) => a.id.localeCompare(b.id)),
        platformSettings: [...this.platformSettings].sort((a, b) => a.chave.localeCompare(b.chave)),
        roles: [...this.roles.entries()]
          .map(([userId, roles]): [string, string[]] => [userId, [...roles].sort()])
          .sort(([a], [b]) => a.localeCompare(b)),
      }),
    );
  }
}

function seedStore(): MemoryStore {
  return new MemoryStore({
    users: [
      {
        id: "global-admin",
        ...CANONICAL_ADMIN,
        password: "global-password-kept",
        role: "admin",
        adminEscopo: "global",
        canManageUsers: true,
        ativo: true,
        emailVerified: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "marketplace-user",
        email: "cliente.existente@example.test",
        username: "cliente_existente",
        password: "senha-cliente",
        name: "Cliente existente",
        role: "contratante",
        phone: "11999990000",
        ativo: true,
        emailVerified: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "reserved-admin",
        ...XGESTAO_ADMIN,
        password: "senha-antiga",
        name: "Nome incorreto",
        role: "contratante",
        adminEscopo: "global",
        canManageUsers: true,
        ativo: false,
        mustChangePassword: true,
        emailVerified: null,
      },
      {
        id: "reserved-empreiteiro",
        ...XGESTAO_EMPREITEIRO,
        password: "senha-antiga",
        name: "Empresa antiga",
        role: "contratante",
        phone: null,
        cpfCnpj: null,
        plano: "pro",
        ativo: false,
        onboardingConcluido: false,
        mustChangePassword: true,
        emailVerified: null,
      },
    ],
    profiles: [
      {
        id: "marketplace-profile",
        userId: "marketplace-user",
        nome: "Perfil que não pertence à demonstração",
        responsavel: "Cliente existente",
        email: "cliente.existente@example.test",
        especialidades: ["Estrutural"],
      },
    ],
    works: [
      {
        id: "marketplace-work",
        empreiteiraId: "marketplace-profile",
        clienteId: "marketplace-user",
        nome: "Obra existente do marketplace",
        endereco: "Rua preservada",
        status: "planejamento",
        updatedAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    ],
    platformSettings: [
      {
        chave: "plataforma",
        valor: {
          marketplaceVisivel: true,
          limiteObras: 9,
          integracoes: { analytics: true },
        },
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedBy: "marketplace-user",
      },
      {
        chave: "outra-configuracao",
        valor: { preservada: true },
      },
    ],
  });
}

describe("ambiente do seed xgestão", () => {
  it("recusa produção, inclusive quando NODE_ENV é production", () => {
    assert.match(
      developmentDatabaseError("postgresql://user:pass@localhost:5432/dev", "production") ?? "",
      /nunca roda fora de desenvolvimento/i,
    );
    assert.match(
      developmentDatabaseError("postgresql://user:pass@prod-db.example.com:5432/app", "development") ?? "",
      /prod-db/i,
    );
  });

  it("recusa host desconhecido e só aceita host de desenvolvimento explícito", () => {
    assert.match(
      developmentDatabaseError("postgresql://user:pass@db.abcdefgh.supabase.co:5432/postgres", "development") ?? "",
      /não é reconhecido como desenvolvimento/i,
    );
    assert.equal(
      developmentDatabaseError("postgresql://user:pass@localhost:5432/dev", "development"),
      undefined,
    );
  });
});

describe("preparação xgestão", () => {
  it("mantém a prévia sem nenhuma escrita", async () => {
    const store = seedStore();
    const before = store.snapshot();

    const preview = await runDemo({ dryRun: true, store, passwords: PASSWORDS, now: NOW });

    assert.ok(preview?.some((line) => line.includes("preservaria todas as contas")));
    assert.equal(store.writes, 0);
    assert.deepEqual(store.snapshot(), before);
  });

  it("preserva registros fora do escopo, altera somente a demonstração e é idempotente", async () => {
    const store = seedStore();
    const before = store.snapshot();

    await runDemo({ dryRun: false, store, passwords: PASSWORDS, now: NOW });

    const firstState = store.snapshot();
    assert.notDeepEqual(firstState, before, "a preparação deve corrigir as identidades reservadas");
    assert.deepEqual(
      jsonSnapshot(store.users.find((user) => user.id === "marketplace-user")),
      before.users.find((user: DemoUser) => user.id === "marketplace-user"),
      "usuário não relacionado deve permanecer intacto",
    );
    assert.deepEqual(
      jsonSnapshot(store.works.find((work) => work.id === "marketplace-work")),
      before.works.find((work: DemoWork) => work.id === "marketplace-work"),
      "obra não relacionada deve permanecer intacta",
    );
    assert.deepEqual(
      store.platformSettings.find((setting) => setting.chave === "outra-configuracao"),
      before.platformSettings.find((setting: DemoPlatformSetting) => setting.chave === "outra-configuracao"),
      "configuração não relacionada deve permanecer intacta",
    );

    const platform = store.platformSettings.find((setting) => setting.chave === "plataforma");
    assert.deepEqual(platform?.valor, {
      marketplaceVisivel: false,
      limiteObras: 9,
      integracoes: { analytics: true },
    });
    assert.equal(store.users.find((user) => user.email === CANONICAL_ADMIN.email)?.password, "global-password-kept");
    assert.equal(store.users.find((user) => user.email === XGESTAO_ADMIN.email)?.adminEscopo, "xgestao");
    assert.equal(store.users.find((user) => user.email === XGESTAO_EMPREITEIRO.email)?.role, "empreiteiro");
    assert.deepEqual(await store.listRoles("reserved-empreiteiro"), ["empreiteiro", "xgestao"]);
    assert.ok(store.profiles.some((profile) => profile.userId === "reserved-empreiteiro"));
    assert.ok(
      store.works.some(
        (work) => work.nome === OBRA_DEMO.nome && work.clienteId === null,
      ),
    );

    store.writes = 0;
    await runDemo({ dryRun: false, store, passwords: PASSWORDS, now: new Date("2026-08-22T12:10:00.000Z") });
    assert.equal(store.writes, 0, "segunda execução deve ser no-op");
    assert.deepEqual(store.snapshot(), firstState, "duas execuções devem produzir o mesmo estado");
  });
});