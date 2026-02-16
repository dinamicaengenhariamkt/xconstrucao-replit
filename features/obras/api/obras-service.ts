import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obras, type Obra, type InsertObra } from "@shared/db/schema";

/**
 * Service para operações de obras
 * Feature compartilhada usada por admin, contratante e empreiteiro
 */

export async function getObras(): Promise<Obra[]> {
  return db.select().from(obras);
}

export async function getObra(id: string): Promise<Obra | undefined> {
  const [o] = await db.select().from(obras).where(eq(obras.id, id));
  return o;
}

export async function createObra(data: InsertObra): Promise<Obra> {
  const [o] = await db.insert(obras).values(data).returning();
  return o;
}

export async function deleteObra(id: string): Promise<void> {
  await db.delete(obras).where(eq(obras.id, id));
}
