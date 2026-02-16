import { users } from "@shared/db/schema";

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  avatarUrl?: string | null;
}
