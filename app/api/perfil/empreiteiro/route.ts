import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { empreiteiras, users } from "@shared/db/schema";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { ensureProfileRow } from "@features/auth/api/auth-storage";
import { findMunicipio, loadMunicipios } from "@shared/lib/ibge-municipios";

export const ESPECIALIDADES_PERMITIDAS = [
  "Alvenaria",
  "Elétrica",
  "Hidráulica",
  "Pintura",
  "Acabamento",
  "Fundações",
  "Estrutura Metálica",
  "Gesso/Drywall",
  "Cobertura/Telhado",
  "Paisagismo",
  "Reformas",
  "Obras Comerciais",
] as const;

const especialidadesSchema = z
  .array(z.string().trim().min(2).max(60))
  .max(25)
  .transform((items) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of items) {
      const t = raw.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  });

const updateSchema = z.object({
  nome: z.string().min(3).optional(),
  responsavel: z.string().min(3).optional(),
  telefone: z.string().min(8).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  avatarUrl: z.string().max(2_500_000).optional().nullable(),
  especialidades: especialidadesSchema.optional(),
  raioKm: z.number().int().min(0).max(2000).optional().nullable(),
  portfolioUrls: z.array(z.string().max(2_500_000)).max(10).optional(),
  portfolioDocs: z.array(z.string().max(7_000_000)).max(3).optional(),
  zonaAtuacaoUfs: z
    .array(z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF inválida"))
    .max(27)
    .transform((items) => Array.from(new Set(items)))
    .optional(),
  zonaAtuacaoCidades: z
    .array(z.string().trim().min(2).max(80))
    .max(50)
    .transform((items) => {
      const seen = new Set<string>();
      const out: string[] = [];
      for (const raw of items) {
        const t = raw.trim();
        if (!t) continue;
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(t);
      }
      return out;
    })
    .optional(),
  descricao: z.string().max(2000).optional().nullable(),
  anoFundacao: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  tamanhoEquipe: z.string().max(50).optional().nullable(),
  siteUrl: z.string().url().max(300).optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url().max(300).optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().max(300).optional().nullable().or(z.literal("")),
  registroProfissional: z.string().max(80).optional().nullable(),
  // user-level fields (persisted in users table)
  bio: z.string().max(400).optional().nullable(),
  idioma: z.string().max(16).optional(),
  timezone: z.string().max(64).optional(),
});

function isProfileComplete(e: typeof empreiteiras.$inferSelect) {
  return Boolean(
    e.nome &&
      e.responsavel &&
      e.email &&
      e.telefone &&
      e.cnpj &&
      e.cep &&
      e.endereco &&
      e.cidade &&
      e.estado &&
      e.avatarUrl &&
      e.descricao &&
      Array.isArray(e.especialidades) &&
      e.especialidades.length > 0 &&
      typeof e.raioKm === "number" && e.raioKm > 0 &&
      Array.isArray(e.portfolioUrls) &&
      e.portfolioUrls.length > 0
  );
}

async function loadOrCreate(userId: string) {
  let [row] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, userId));
  if (!row) {
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    if (!u) return null;
    await ensureProfileRow(u);
    [row] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, userId));
  }
  return row ?? null;
}

async function loadUser(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  return u ?? null;
}

function withUserFields(row: typeof empreiteiras.$inferSelect, u: typeof users.$inferSelect | null) {
  return {
    ...row,
    bio: u?.bio ?? null,
    idioma: u?.idioma ?? "pt-BR",
    timezone: u?.timezone ?? "America/Sao_Paulo",
  };
}

export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "empreiteiro") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const row = await loadOrCreate(payload.sub);
  if (!row) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });
  const u = await loadUser(payload.sub);
  return NextResponse.json(withUserFields(row, u));
}

export async function PATCH(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (payload.role !== "empreiteiro") return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await loadOrCreate(payload.sub);
  if (!existing) return NextResponse.json({ message: "Perfil não encontrado" }, { status: 404 });

  // Task #95: validar zonaAtuacaoCidades contra a base IBGE para evitar
  // duplicatas tipo "São Paulo" vs "Sao Paulo" e cidades inexistentes.
  // Se a base IBGE não carregou (rede caiu), aceita o que veio — não bloquear
  // o Salvar inteiro por uma indisponibilidade de terceiro.
  if (parsed.data.zonaAtuacaoCidades && parsed.data.zonaAtuacaoCidades.length > 0) {
    const ibgeList = await loadMunicipios();
    if (ibgeList.length > 0) {
      const ufHints = parsed.data.zonaAtuacaoUfs ?? [];
      const canonical: string[] = [];
      const invalid: string[] = [];
      for (const c of parsed.data.zonaAtuacaoCidades) {
        // tenta com cada UF da zona (se houver) como hint; se nenhum match, sem hint.
        let m = null as Awaited<ReturnType<typeof findMunicipio>>;
        for (const uf of ufHints) {
          m = await findMunicipio(c, uf);
          if (m) break;
        }
        if (!m) m = await findMunicipio(c);
        if (m) canonical.push(m.nome);
        else invalid.push(c);
      }
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            message: `Cidade(s) não reconhecida(s) na base IBGE: ${invalid.join(", ")}`,
            errors: {
              fieldErrors: {
                zonaAtuacaoCidades: [
                  `Cidade(s) inválida(s): ${invalid.join(", ")}. Selecione uma sugestão da lista.`,
                ],
              },
            },
          },
          { status: 422 },
        );
      }
      const seen = new Set<string>();
      const finalList: string[] = [];
      for (const n of canonical) {
        const k = n.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        finalList.push(n);
      }
      parsed.data.zonaAtuacaoCidades = finalList;
    }
  }

  const { bio, idioma, timezone, ...empreiteiraData } = parsed.data;

  const merged = { ...existing, ...empreiteiraData } as typeof empreiteiras.$inferSelect;
  const perfilCompleto = isProfileComplete(merged);

  // Status transition: só promove para fila de curadoria ('aprovacao')
  // quando o perfil fica completo. Usuários já 'ativo'/'inativo' não
  // regridem ao editar o perfil; perfis incompletos mantêm seu status atual.
  let status = existing.status;
  if (existing.status !== "ativo" && existing.status !== "inativo" && perfilCompleto) {
    status = "aprovacao";
  }

  const [updated] = await db
    .update(empreiteiras)
    .set({ ...empreiteiraData, perfilCompleto, status })
    .where(eq(empreiteiras.id, existing.id))
    .returning();

  // Persist user-level fields (bio, idioma, timezone) atomically
  const userPatch: Partial<typeof users.$inferInsert> = {};
  if (bio !== undefined) userPatch.bio = bio;
  if (idioma !== undefined) userPatch.idioma = idioma;
  if (timezone !== undefined) userPatch.timezone = timezone;
  if (Object.keys(userPatch).length > 0) {
    await db.update(users).set(userPatch).where(eq(users.id, payload.sub));
  }
  const u = await loadUser(payload.sub);

  return NextResponse.json(withUserFields(updated, u));
}
