import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, pgEnum, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin", "contratante", "empreiteiro"]);
export const statusEnum = pgEnum("status", ["ativo", "inativo", "aprovacao"]);
export const obraStatusEnum = pgEnum("obra_status", ["em_andamento", "concluida", "pausada", "planejamento"]);
export const planoEnum = pgEnum("plano", ["free", "pro", "enterprise"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("contratante"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  idioma: varchar("idioma", { length: 16 }).notNull().default("pt-BR"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("America/Sao_Paulo"),
  plano: planoEnum("plano").notNull().default("free"),
  planoStartedAt: timestamp("plano_started_at").defaultNow(),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdBy: varchar("created_by"),
  ativo: boolean("ativo").notNull().default(true),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  avatarFileId: varchar("avatar_file_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordSetupTokens = pgTable("password_setup_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
});

export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("Pessoa Jurídica"),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cnpjCpf: text("cnpj_cpf"),
  cep: text("cep"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  avatarUrl: text("avatar_url"),
  perfilCompleto: boolean("perfil_completo").notNull().default(false),
  obrasCount: integer("obras_count").default(0),
  volumeFinanceiro: numeric("volume_financeiro", { precision: 15, scale: 2 }).default("0"),
  status: statusEnum("status").notNull().default("ativo"),
});

export const empreiteiras = pgTable("empreiteiras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  nome: text("nome").notNull(),
  responsavel: text("responsavel").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cnpj: text("cnpj"),
  especialidade: text("especialidade"),
  especialidades: text("especialidades").array().notNull().default(sql`ARRAY[]::text[]`),
  raioKm: integer("raio_km"),
  cep: text("cep"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  avatarUrl: text("avatar_url"),
  portfolioUrls: text("portfolio_urls").array().notNull().default(sql`ARRAY[]::text[]`),
  portfolioDocs: text("portfolio_docs").array().notNull().default(sql`ARRAY[]::text[]`),
  descricao: text("descricao"),
  anoFundacao: integer("ano_fundacao"),
  tamanhoEquipe: text("tamanho_equipe"),
  siteUrl: text("site_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  registroProfissional: text("registro_profissional"),
  perfilCompleto: boolean("perfil_completo").notNull().default(false),
  obrasCount: integer("obras_count").default(0),
  avaliacao: numeric("avaliacao", { precision: 3, scale: 1 }).default("0"),
  status: statusEnum("status").notNull().default("ativo"),
});

export const obras = pgTable("obras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  clienteId: varchar("cliente_id").references(() => clientes.id),
  empreiteiraId: varchar("empreiteira_id").references(() => empreiteiras.id),
  status: obraStatusEnum("status").notNull().default("planejamento"),
  valorTotal: numeric("valor_total", { precision: 15, scale: 2 }).default("0"),
  valorPago: numeric("valor_pago", { precision: 15, scale: 2 }).default("0"),
  progresso: integer("progresso").default(0),
  dataInicio: text("data_inicio"),
  dataPrevisao: text("data_previsao"),
});

export const financeiro = pgTable("financeiro", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 15, scale: 2 }).notNull(),
  data: text("data").notNull(),
  obraId: varchar("obra_id").references(() => obras.id),
  categoria: text("categoria"),
});

export const candidaturaStatusEnum = pgEnum("candidatura_status", ["pendente", "aceita", "rejeitada"]);

export const candidaturas = pgTable("candidaturas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").references(() => obras.id),
  empreiteiroId: varchar("empreiteiro_id").references(() => users.id),
  valorProposta: numeric("valor_proposta", { precision: 15, scale: 2 }).notNull(),
  prazoEstimado: integer("prazo_estimado"),
  dataInicio: text("data_inicio"),
  dataTermino: text("data_termino"),
  descricao: text("descricao"),
  observacoesPrazo: text("observacoes_prazo"),
  status: candidaturaStatusEnum("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow(),
  atividades: text("atividades"),
});

export const marketplaceLeadStatusEnum = pgEnum("marketplace_lead_status", ["pendente", "notificado", "descartado"]);

export const marketplaceLeads = pgTable("marketplace_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone").notNull(),
  isWhatsapp: boolean("is_whatsapp").notNull().default(false),
  status: marketplaceLeadStatusEnum("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NextAuth.js tables
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
  userAgent: text("user_agent"),
  ip: text("ip"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consentDocumentEnum = pgEnum("consent_document", ["termos", "privacidade"]);

export const userConsents = pgTable(
  "user_consents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    documento: consentDocumentEnum("documento").notNull(),
    versao: text("versao").notNull(),
    aceitoEm: timestamp("aceito_em").defaultNow().notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    revogadoEm: timestamp("revogado_em"),
  },
  (t) => ({
    uniqUserDocVersao: uniqueIndex("user_consents_user_doc_versao_uniq").on(t.userId, t.documento, t.versao),
  }),
);

export const userPreferencias = pgTable("user_preferencias", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  notificacoes: jsonb("notificacoes").$type<Record<string, boolean>>().notNull().default({}),
  privacidade: jsonb("privacidade").$type<Record<string, boolean>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformSettings = pgTable("platform_settings", {
  chave: text("chave").primaryKey(),
  valor: jsonb("valor").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export const userFileVisibilityEnum = pgEnum("user_file_visibility", ["public", "private"]);

export const userFiles = pgTable("user_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  visibility: userFileVisibilityEnum("visibility").notNull(),
  bucketKey: text("bucket_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  publicUrl: text("public_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const empreiteiroDocumentos = pgTable("empreiteiro_documentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empreiteiroUserId: varchar("empreiteiro_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  status: text("status").notNull().default("enviado"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const empreiteiroPortfolio = pgTable("empreiteiro_portfolio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empreiteiroUserId: varchar("empreiteiro_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  titulo: text("titulo"),
  descricao: text("descricao"),
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserFile = typeof userFiles.$inferSelect;
export type EmpreiteiroDocumento = typeof empreiteiroDocumentos.$inferSelect;
export type EmpreiteiroPortfolioItem = typeof empreiteiroPortfolio.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true });
export const insertEmpreiteiraSchema = createInsertSchema(empreiteiras).omit({ id: true });
export const insertObraSchema = createInsertSchema(obras).omit({ id: true });
export const insertFinanceiroSchema = createInsertSchema(financeiro).omit({ id: true });
export const insertCandidaturaSchema = createInsertSchema(candidaturas).omit({ id: true, createdAt: true });
export const insertMarketplaceLeadSchema = createInsertSchema(marketplaceLeads).omit({ id: true, createdAt: true, status: true });
export const insertUserConsentSchema = createInsertSchema(userConsents).omit({ id: true, aceitoEm: true, revogadoEm: true });
export const insertUserPreferenciasSchema = createInsertSchema(userPreferencias).omit({ updatedAt: true });
export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({ updatedAt: true });

export const marketplaceLeadSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(120, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(160, "Email muito longo"),
  telefone: z.string().trim().min(8, "Telefone inválido").max(30, "Telefone muito longo"),
  isWhatsapp: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["contratante", "empreiteiro"]),
  phone: z.string().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Você deve aceitar os Termos de Uso e a Política de Privacidade" }) }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type InsertEmpreiteira = z.infer<typeof insertEmpreiteiraSchema>;
export type Empreiteira = typeof empreiteiras.$inferSelect;
export type InsertObra = z.infer<typeof insertObraSchema>;
export type Obra = typeof obras.$inferSelect;
export type InsertFinanceiro = z.infer<typeof insertFinanceiroSchema>;
export type Financeiro = typeof financeiro.$inferSelect;
export type InsertCandidatura = z.infer<typeof insertCandidaturaSchema>;
export type Candidatura = typeof candidaturas.$inferSelect;
export type InsertMarketplaceLead = z.infer<typeof insertMarketplaceLeadSchema>;
export type MarketplaceLead = typeof marketplaceLeads.$inferSelect;
export type MarketplaceLeadInput = z.infer<typeof marketplaceLeadSchema>;
