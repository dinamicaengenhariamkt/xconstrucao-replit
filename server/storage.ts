import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, clientes, empreiteiras, obras, financeiro,
  type User, type InsertUser,
  type Cliente, type InsertCliente,
  type Empreiteira, type InsertEmpreiteira,
  type Obra, type InsertObra,
  type Financeiro, type InsertFinanceiro,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUserEmailVerified(userId: string, timestamp: Date): Promise<void>;

  getClientes(): Promise<Cliente[]>;
  getCliente(id: string): Promise<Cliente | undefined>;
  createCliente(data: InsertCliente): Promise<Cliente>;
  deleteCliente(id: string): Promise<void>;

  getEmpreiteiras(): Promise<Empreiteira[]>;
  getEmpreiteira(id: string): Promise<Empreiteira | undefined>;
  createEmpreiteira(data: InsertEmpreiteira): Promise<Empreiteira>;
  deleteEmpreiteira(id: string): Promise<void>;

  getObras(): Promise<Obra[]>;
  getObra(id: string): Promise<Obra | undefined>;
  createObra(data: InsertObra): Promise<Obra>;
  deleteObra(id: string): Promise<void>;

  getFinanceiros(): Promise<Financeiro[]>;
  createFinanceiro(data: InsertFinanceiro): Promise<Financeiro>;

  getDashboardStats(): Promise<{
    totalClientes: number;
    totalEmpreiteiras: number;
    totalObras: number;
    obrasAndamento: number;
    totalEntradas: string;
    totalSaidas: string;
    saldoGeral: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string) {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async updateUserEmailVerified(userId: string, timestamp: Date) {
    await db.update(users).set({ emailVerified: timestamp }).where(eq(users.id, userId));
  }

  async getClientes() {
    return db.select().from(clientes);
  }

  async getCliente(id: string) {
    const [c] = await db.select().from(clientes).where(eq(clientes.id, id));
    return c;
  }

  async createCliente(data: InsertCliente) {
    const [c] = await db.insert(clientes).values(data).returning();
    return c;
  }

  async deleteCliente(id: string) {
    await db.delete(clientes).where(eq(clientes.id, id));
  }

  async getEmpreiteiras() {
    return db.select().from(empreiteiras);
  }

  async getEmpreiteira(id: string) {
    const [e] = await db.select().from(empreiteiras).where(eq(empreiteiras.id, id));
    return e;
  }

  async createEmpreiteira(data: InsertEmpreiteira) {
    const [e] = await db.insert(empreiteiras).values(data).returning();
    return e;
  }

  async deleteEmpreiteira(id: string) {
    await db.delete(empreiteiras).where(eq(empreiteiras.id, id));
  }

  async getObras() {
    return db.select().from(obras);
  }

  async getObra(id: string) {
    const [o] = await db.select().from(obras).where(eq(obras.id, id));
    return o;
  }

  async createObra(data: InsertObra) {
    const [o] = await db.insert(obras).values(data).returning();
    return o;
  }

  async deleteObra(id: string) {
    await db.delete(obras).where(eq(obras.id, id));
  }

  async getFinanceiros() {
    return db.select().from(financeiro);
  }

  async createFinanceiro(data: InsertFinanceiro) {
    const [f] = await db.insert(financeiro).values(data).returning();
    return f;
  }

  async getDashboardStats() {
    const [clienteCount] = await db.select({ count: sql<number>`count(*)::int` }).from(clientes);
    const [empreiteiraCount] = await db.select({ count: sql<number>`count(*)::int` }).from(empreiteiras);
    const [obraCount] = await db.select({ count: sql<number>`count(*)::int` }).from(obras);
    const [obraAndamento] = await db.select({ count: sql<number>`count(*)::int` }).from(obras).where(eq(obras.status, "em_andamento"));

    const [entradasSum] = await db.select({
      total: sql<string>`COALESCE(SUM(valor::numeric), 0)::text`
    }).from(financeiro).where(eq(financeiro.tipo, "entrada"));

    const [saidasSum] = await db.select({
      total: sql<string>`COALESCE(SUM(valor::numeric), 0)::text`
    }).from(financeiro).where(eq(financeiro.tipo, "saida"));

    const entradas = parseFloat(entradasSum.total || "0");
    const saidas = parseFloat(saidasSum.total || "0");

    return {
      totalClientes: clienteCount.count,
      totalEmpreiteiras: empreiteiraCount.count,
      totalObras: obraCount.count,
      obrasAndamento: obraAndamento.count,
      totalEntradas: entradasSum.total || "0",
      totalSaidas: saidasSum.total || "0",
      saldoGeral: (entradas - saidas).toString(),
    };
  }
}

export const storage = new DatabaseStorage();
