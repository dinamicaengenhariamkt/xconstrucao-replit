import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { anuncioEventos, anuncios, anunciantes } from "@shared/db/schema";
import { criarLancamentoPlataforma } from "@features/financeiro/lancamentos-service";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Catálogo estático de zonas (espelha AnuncioZonaId da UI) ────────────────
export const ZONAS = [
  { id: "sidebar-sup-contratante", nome: "Sidebar Superior - Contratante", descricao: "Card vertical com imagem 4:3", icone: "web" as const },
  { id: "sidebar-inf-contratante", nome: "Sidebar Inferior - Contratante", descricao: "Card vertical com imagem 4:3", icone: "web" as const },
  { id: "sidebar-sup-empreiteiro", nome: "Sidebar Superior - Empreiteiro", descricao: "Card vertical com imagem 4:3", icone: "web" as const },
  { id: "sidebar-inf-empreiteiro", nome: "Sidebar Inferior - Empreiteiro", descricao: "Card vertical com imagem 4:3", icone: "web" as const },
  { id: "banner-dashboard-contratante", nome: "Banner Dashboard - Contratante", descricao: "Banner horizontal 728x90", icone: "dashboard" as const },
  { id: "banner-dashboard-empreiteiro", nome: "Banner Dashboard - Empreiteiro", descricao: "Banner horizontal 728x90", icone: "dashboard" as const },
  { id: "banner-qa", nome: "Banner Q&A - Todas as personas", descricao: "Card horizontal", icone: "help" as const },
] as const;

export type ZonaId = (typeof ZONAS)[number]["id"];
export const ZONA_IDS = ZONAS.map((z) => z.id) as ZonaId[];
export function isZonaValida(z: string): z is ZonaId {
  return ZONA_IDS.includes(z as ZonaId);
}

// ─── Anúncio ativo por zona (hot path público) ──────────────────────────────
export interface AnuncioPublico {
  id: string;
  titulo: string;
  subtitulo: string | null;
  criativoUrl: string | null;
  ctaUrl: string | null;
  ctaTexto: string | null;
  zona: string;
}

/**
 * Anúncio ativo de uma zona: status='ativa' e dentro do período (inicio/fim).
 * Retorna o mais recente. Hot path — usa índice `idx_anuncios_zona_status`.
 */
export async function getAnuncioAtivoPorZona(zona: string, hoje: string): Promise<AnuncioPublico | null> {
  const [row] = await db
    .select()
    .from(anuncios)
    .where(
      and(
        eq(anuncios.zona, zona),
        eq(anuncios.status, "ativa"),
        sql`(${anuncios.inicio} IS NULL OR ${anuncios.inicio} <= ${hoje})`,
        sql`(${anuncios.fim} IS NULL OR ${anuncios.fim} >= ${hoje})`,
      ),
    )
    .orderBy(desc(anuncios.createdAt))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    subtitulo: row.subtitulo,
    criativoUrl: row.criativoUrl,
    ctaUrl: row.ctaUrl,
    ctaTexto: row.ctaTexto,
    zona: row.zona,
  };
}

/** Status de cada zona (ativo se há anúncio ativo no período). Para a UI admin/slot. */
export interface ZonaView {
  id: string;
  nome: string;
  descricao: string;
  icone: "web" | "dashboard" | "help";
  status: "ativo" | "vazio";
  anuncioAtual?: string;
}

export async function getZonas(hoje: string): Promise<ZonaView[]> {
  const ativos = await db
    .select({ zona: anuncios.zona, titulo: anuncios.titulo })
    .from(anuncios)
    .where(
      and(
        eq(anuncios.status, "ativa"),
        sql`(${anuncios.inicio} IS NULL OR ${anuncios.inicio} <= ${hoje})`,
        sql`(${anuncios.fim} IS NULL OR ${anuncios.fim} >= ${hoje})`,
      ),
    );
  const porZona = new Map<string, string>();
  for (const a of ativos) if (!porZona.has(a.zona)) porZona.set(a.zona, a.titulo);
  return ZONAS.map((z) => ({
    id: z.id,
    nome: z.nome,
    descricao: z.descricao,
    icone: z.icone,
    status: porZona.has(z.id) ? "ativo" : "vazio",
    anuncioAtual: porZona.get(z.id),
  }));
}

// ─── Tracking de eventos ─────────────────────────────────────────────────────
export async function registrarEvento(args: {
  anuncioId: string;
  tipo: "impressao" | "clique";
  userId?: string | null;
}): Promise<boolean> {
  // Valida que o anúncio existe (FK protege, mas evita lixo).
  const [a] = await db.select({ id: anuncios.id }).from(anuncios).where(eq(anuncios.id, args.anuncioId)).limit(1);
  if (!a) return false;
  await db.insert(anuncioEventos).values({
    anuncioId: args.anuncioId,
    tipo: args.tipo,
    userId: args.userId ?? null, // LGPD: null para visitante público
  });
  return true;
}

// ─── KPIs e listagens admin (mapeadas ao contrato de UI) ────────────────────
export interface AnuncioKpi {
  receitaAnuncios: number;
  receitaCrescimentoPercent: number;
  campanhasAtivas: number;
  impressoes: number;
  cliques: number;
  ctrMedio: number;
  anunciantesAtivos: number;
  campanhasExpirando: number;
}

export async function getAnuncioKpi(hoje: string): Promise<AnuncioKpi> {
  const limiteExpiracao = addDays(hoje, 7);
  const [campanhaRow] = await db
    .select({
      receita: sql<string>`COALESCE(SUM(${anuncios.orcamento}) FILTER (WHERE ${anuncios.status} = 'ativa'), 0)`,
      ativas: sql<number>`COUNT(*) FILTER (WHERE ${anuncios.status} = 'ativa')::int`,
      expirando: sql<number>`COUNT(*) FILTER (WHERE ${anuncios.status} = 'ativa' AND ${anuncios.fim} IS NOT NULL AND ${anuncios.fim} <= ${limiteExpiracao})::int`,
    })
    .from(anuncios);

  const [evRow] = await db
    .select({
      impressoes: sql<number>`COUNT(*) FILTER (WHERE ${anuncioEventos.tipo} = 'impressao')::int`,
      cliques: sql<number>`COUNT(*) FILTER (WHERE ${anuncioEventos.tipo} = 'clique')::int`,
    })
    .from(anuncioEventos);

  const [anuncianteRow] = await db
    .select({ ativos: sql<number>`COUNT(*) FILTER (WHERE ${anunciantes.status} = 'ativo')::int` })
    .from(anunciantes);

  const impressoes = evRow?.impressoes ?? 0;
  const cliques = evRow?.cliques ?? 0;
  const ctrMedio = impressoes > 0 ? Math.round((cliques / impressoes) * 10000) / 100 : 0;

  return {
    receitaAnuncios: Number(campanhaRow?.receita ?? 0),
    receitaCrescimentoPercent: 0,
    campanhasAtivas: campanhaRow?.ativas ?? 0,
    impressoes,
    cliques,
    ctrMedio,
    anunciantesAtivos: anuncianteRow?.ativos ?? 0,
    campanhasExpirando: campanhaRow?.expirando ?? 0,
  };
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface CampanhaView {
  id: string;
  titulo: string;
  subtitulo: string;
  anunciante: string;
  anuncianteEmail: string;
  zona: string;
  zonaId: string;
  dataInicio: string;
  dataFim: string;
  impressoes: number;
  cliques: number;
  ctr: number;
  receita: number;
  status: "ativa" | "pausada" | "expirada" | "agendada";
}

function statusToUi(s: string): CampanhaView["status"] {
  if (s === "rascunho") return "agendada";
  return s as CampanhaView["status"];
}

export async function listarCampanhas(): Promise<CampanhaView[]> {
  const rows = await db
    .select({
      a: anuncios,
      anuncianteNome: anunciantes.nome,
      anuncianteEmail: anunciantes.email,
      impressoes: sql<number>`COALESCE((SELECT COUNT(*) FROM anuncio_eventos e WHERE e.anuncio_id = ${anuncios.id} AND e.tipo = 'impressao'), 0)::int`,
      cliques: sql<number>`COALESCE((SELECT COUNT(*) FROM anuncio_eventos e WHERE e.anuncio_id = ${anuncios.id} AND e.tipo = 'clique'), 0)::int`,
    })
    .from(anuncios)
    .leftJoin(anunciantes, eq(anunciantes.id, anuncios.anuncianteId))
    .orderBy(desc(anuncios.createdAt));

  const zonaNome = new Map<string, string>(ZONAS.map((z) => [z.id as string, z.nome]));
  return rows.map(({ a, anuncianteNome, anuncianteEmail, impressoes, cliques }) => ({
    id: a.id,
    titulo: a.titulo,
    subtitulo: a.subtitulo ?? "",
    anunciante: anuncianteNome ?? "—",
    anuncianteEmail: anuncianteEmail ?? "—",
    zona: zonaNome.get(a.zona) ?? a.zona,
    zonaId: a.zona,
    dataInicio: a.inicio ?? "",
    dataFim: a.fim ?? "",
    impressoes,
    cliques,
    ctr: impressoes > 0 ? Math.round((cliques / impressoes) * 10000) / 100 : 0,
    receita: Number(a.orcamento),
    status: statusToUi(a.status),
  }));
}

export interface AnuncianteView {
  id: string;
  nome: string;
  sigla: string;
  corBg: string;
  corTexto: string;
  contato: string;
  email: string;
  telefone: string;
  campanhasAtivas: number;
  receitaTotal: number;
  status: "ativo" | "inativo";
}

export async function listarAnunciantes(): Promise<AnuncianteView[]> {
  const rows = await db
    .select({
      an: anunciantes,
      campanhasAtivas: sql<number>`COALESCE((SELECT COUNT(*) FROM anuncios a WHERE a.anunciante_id = ${anunciantes.id} AND a.status = 'ativa'), 0)::int`,
      receitaTotal: sql<string>`COALESCE((SELECT SUM(a.orcamento) FROM anuncios a WHERE a.anunciante_id = ${anunciantes.id} AND a.status = 'ativa'), 0)`,
    })
    .from(anunciantes)
    .orderBy(desc(anunciantes.createdAt));
  return rows.map(({ an, campanhasAtivas, receitaTotal }) => ({
    id: an.id,
    nome: an.nome,
    sigla: an.sigla ?? an.nome.slice(0, 3).toUpperCase(),
    corBg: "bg-primary/10",
    corTexto: "text-primary",
    contato: an.contato ?? "—",
    email: an.email ?? "—",
    telefone: an.telefone ?? "—",
    campanhasAtivas,
    receitaTotal: Number(receitaTotal),
    status: an.status,
  }));
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
export async function criarAnunciante(args: {
  nome: string;
  sigla?: string;
  contato?: string;
  email?: string;
  telefone?: string;
  status?: "ativo" | "inativo";
}): Promise<typeof anunciantes.$inferSelect> {
  const [row] = await db.insert(anunciantes).values({
    nome: args.nome,
    sigla: args.sigla ?? null,
    contato: args.contato ?? null,
    email: args.email ?? null,
    telefone: args.telefone ?? null,
    status: args.status ?? "ativo",
  }).returning();
  return row;
}

export async function atualizarAnunciante(id: string, patch: Partial<{ nome: string; sigla: string; contato: string; email: string; telefone: string; status: "ativo" | "inativo" }>): Promise<typeof anunciantes.$inferSelect | null> {
  const [row] = await db.update(anunciantes).set(patch).where(eq(anunciantes.id, id)).returning();
  return row ?? null;
}

/**
 * Cria uma campanha. Quando entra "ativa" e há orçamento, lança a receita de
 * anunciante no caixa (J09, escopo plataforma, idempotente por origem=anuncio).
 */
export async function criarCampanha(args: {
  anuncianteId: string;
  titulo: string;
  subtitulo?: string;
  criativoUrl?: string;
  ctaUrl?: string;
  ctaTexto?: string;
  zona: string;
  inicio?: string;
  fim?: string;
  orcamento?: number;
  status?: "rascunho" | "agendada" | "ativa" | "pausada" | "expirada";
}): Promise<typeof anuncios.$inferSelect> {
  const status = args.status ?? "rascunho";
  const row = await db.transaction(async (tx) => {
    const [created] = await tx.insert(anuncios).values({
      anuncianteId: args.anuncianteId,
      titulo: args.titulo,
      subtitulo: args.subtitulo ?? null,
      criativoUrl: args.criativoUrl ?? null,
      ctaUrl: args.ctaUrl ?? null,
      ctaTexto: args.ctaTexto ?? null,
      zona: args.zona,
      inicio: args.inicio ?? null,
      fim: args.fim ?? null,
      orcamento: String(args.orcamento ?? 0),
      status,
    }).returning();
    await maybeLancarReceita(created, tx);
    return created;
  });
  return row;
}

export async function atualizarCampanha(
  id: string,
  patch: Partial<{ titulo: string; subtitulo: string; zona: string; inicio: string; fim: string; orcamento: number; status: "rascunho" | "agendada" | "ativa" | "pausada" | "expirada" }>,
): Promise<typeof anuncios.$inferSelect | null> {
  return db.transaction(async (tx) => {
    const set: Record<string, unknown> = {};
    if (patch.titulo !== undefined) set.titulo = patch.titulo;
    if (patch.subtitulo !== undefined) set.subtitulo = patch.subtitulo;
    if (patch.zona !== undefined) set.zona = patch.zona;
    if (patch.inicio !== undefined) set.inicio = patch.inicio;
    if (patch.fim !== undefined) set.fim = patch.fim;
    if (patch.orcamento !== undefined) set.orcamento = String(patch.orcamento);
    if (patch.status !== undefined) set.status = patch.status;
    if (Object.keys(set).length === 0) {
      const [cur] = await tx.select().from(anuncios).where(eq(anuncios.id, id)).limit(1);
      return cur ?? null;
    }
    const [row] = await tx.update(anuncios).set(set).where(eq(anuncios.id, id)).returning();
    if (row) await maybeLancarReceita(row, tx);
    return row ?? null;
  });
}

export async function deletarCampanha(id: string): Promise<boolean> {
  const res = await db.delete(anuncios).where(eq(anuncios.id, id)).returning({ id: anuncios.id });
  return res.length > 0;
}

/**
 * Lança a receita de anunciante no caixa quando a campanha está ativa e tem
 * orçamento. Idempotente por (origemTipo='anuncio', origemId=anuncio.id) — não
 * duplica ao pausar/reativar.
 */
async function maybeLancarReceita(anuncio: typeof anuncios.$inferSelect, tx: DbOrTx): Promise<void> {
  if (anuncio.status !== "ativa") return;
  const orcamento = Number(anuncio.orcamento);
  if (orcamento <= 0) return;
  await criarLancamentoPlataforma({
    tipo: "entrada",
    descricao: `Anúncio: ${anuncio.titulo}`,
    valor: orcamento,
    categoria: "anuncio",
    status: "pago",
    origemTipo: "anuncio",
    origemId: anuncio.id,
    tx,
  });
}
