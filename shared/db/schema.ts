import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "contratante", "empreiteiro"]);
export const statusEnum = pgEnum("status", ["ativo", "inativo", "aprovacao"]);
export const obraStatusEnum = pgEnum("obra_status", ["em_andamento", "concluida", "pausada", "planejamento"]);

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
});

export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("Pessoa Jurídica"),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cnpjCpf: text("cnpj_cpf"),
  obrasCount: integer("obras_count").default(0),
  volumeFinanceiro: numeric("volume_financeiro", { precision: 15, scale: 2 }).default("0"),
  status: statusEnum("status").notNull().default("ativo"),
});

export const empreiteiras = pgTable("empreiteiras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  responsavel: text("responsavel").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cnpj: text("cnpj"),
  especialidade: text("especialidade"),
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
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true });
export const insertEmpreiteiraSchema = createInsertSchema(empreiteiras).omit({ id: true });
export const insertObraSchema = createInsertSchema(obras).omit({ id: true });
export const insertFinanceiroSchema = createInsertSchema(financeiro).omit({ id: true });
export const insertCandidaturaSchema = createInsertSchema(candidaturas).omit({ id: true, createdAt: true });

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
