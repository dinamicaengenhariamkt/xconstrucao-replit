import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertClienteSchema, insertEmpreiteiraSchema, insertObraSchema, insertFinanceiroSchema } from "@shared/schema";
import { hashPassword, comparePassword, createToken, authMiddleware } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      const existingUsername = await storage.getUserByUsername(parsed.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      const hashed = await hashPassword(parsed.password);
      const user = await storage.createUser({
        ...parsed,
        password: hashed,
        role: parsed.role as any,
      });
      const token = createToken(user.id);
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      return res.status(400).json({ message: e.message || "Erro ao cadastrar" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(parsed.email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      const valid = await comparePassword(parsed.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      const token = createToken(user.id);
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      return res.status(400).json({ message: e.message || "Erro ao entrar" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token");
    return res.json({ ok: true });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const userId = (req as any).userId;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Não autenticado" });
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  app.get("/api/dashboard/stats", authMiddleware, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/clientes", authMiddleware, async (_req, res) => {
    const data = await storage.getClientes();
    return res.json(data);
  });

  app.post("/api/clientes", authMiddleware, async (req, res) => {
    try {
      const parsed = insertClienteSchema.parse(req.body);
      const c = await storage.createCliente(parsed);
      return res.json(c);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/clientes/:id", authMiddleware, async (req, res) => {
    await storage.deleteCliente(req.params.id);
    return res.json({ ok: true });
  });

  app.get("/api/empreiteiras", authMiddleware, async (_req, res) => {
    const data = await storage.getEmpreiteiras();
    return res.json(data);
  });

  app.post("/api/empreiteiras", authMiddleware, async (req, res) => {
    try {
      const parsed = insertEmpreiteiraSchema.parse(req.body);
      const e = await storage.createEmpreiteira(parsed);
      return res.json(e);
    } catch (e: any) {
      return res.status(400).json({ message: (e as any).message });
    }
  });

  app.delete("/api/empreiteiras/:id", authMiddleware, async (req, res) => {
    await storage.deleteEmpreiteira(req.params.id);
    return res.json({ ok: true });
  });

  app.get("/api/obras", authMiddleware, async (_req, res) => {
    const data = await storage.getObras();
    return res.json(data);
  });

  app.post("/api/obras", authMiddleware, async (req, res) => {
    try {
      const parsed = insertObraSchema.parse(req.body);
      const o = await storage.createObra(parsed);
      return res.json(o);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/obras/:id", authMiddleware, async (req, res) => {
    await storage.deleteObra(req.params.id);
    return res.json({ ok: true });
  });

  app.get("/api/financeiro", authMiddleware, async (_req, res) => {
    const data = await storage.getFinanceiros();
    return res.json(data);
  });

  app.post("/api/financeiro", authMiddleware, async (req, res) => {
    try {
      const parsed = insertFinanceiroSchema.parse(req.body);
      const f = await storage.createFinanceiro(parsed);
      return res.json(f);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}
