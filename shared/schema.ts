import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "contratante", "empreiteiro"]);
export const statusEnum = pgEnum("status", ["ativo", "inativo", "aprovacao"]);
export const obraStatusEnum = pgEnum("obra_status", ["em_andamento", "concluida", "pausada", "planejamento"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true });
export const insertEmpreiteiraSchema = createInsertSchema(empreiteiras).omit({ id: true });
export const insertObraSchema = createInsertSchema(obras).omit({ id: true });
export const insertFinanceiroSchema = createInsertSchema(financeiro).omit({ id: true });

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
