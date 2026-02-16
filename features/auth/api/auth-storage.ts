import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, type User, type InsertUser } from "@shared/db/schema";

export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

export async function updateUserEmailVerified(userId: string, timestamp: Date): Promise<void> {
  await db.update(users).set({ emailVerified: timestamp }).where(eq(users.id, userId));
}
