import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  clientes,
  empreiteiras,
  notificacoes,
  obras,
  userPreferencias,
  users,
} from "@shared/db/schema";
import { sendNovaObraZonaEmail } from "@shared/lib/email";

function formatarValorBRL(valor: unknown): string | null {
  const num = Number(valor);
  if (!Number.isFinite(num) || num <= 0) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export interface DispararNovaObraZonaResult {
  status: "sent" | "no_location" | "no_matches" | "not_found" | "failed";
  notifCount?: number;
  emailCount?: number;
  matchedCount?: number;
}

/**
 * Dispara notificação in-app + email para empreiteiros cuja zona de atuação
 * (UF ou cidade) bate com a obra recém-aprovada pela moderação. Task #94 (J13).
 *
 * Idempotência: o caller (`/api/admin/obras/[id]/aprovar`) só chama este
 * helper na transição não-aprovada → aprovada (uma única vez por aprovação).
 * Re-aprovação após rejeição/republicação dispara de novo, mantendo paridade
 * com a atividade `obra_publicada` emitida no mesmo gancho.
 *
 * Match: mesma regra do GET /api/obras (Task #87):
 *   UPPER(obras.uf) ∈ zonaAtuacaoUfs  OR
 *   LOWER(TRIM(obras.cidade)) ∈ zonaAtuacaoCidades
 *
 * In-app é sempre criada para todos os matches. Email respeita preferência
 * `email_novaObra` em `user_preferencias.notificacoes` (default `true`).
 * Erros de email não derrubam o batch — best-effort por destinatário.
 *
 * Não notifica:
 *   - empreiteiras sem `user_id` vinculado
 *   - usuários inativos (`users.ativo = false`)
 *   - o próprio dono da obra (caso o contratante também tenha conta empreiteira)
 *   - obras sem UF nem cidade preenchidas (sem como fazer match)
 */
export async function dispararNotificacaoNovaObraZona(
  obraId: string,
): Promise<DispararNovaObraZonaResult> {
  let obra:
    | {
        id: string;
        nome: string;
        uf: string | null;
        cidade: string | null;
        valorTotal: unknown;
        clienteId: string | null;
      }
    | undefined;
  try {
    [obra] = await db
      .select({
        id: obras.id,
        nome: obras.nome,
        uf: obras.uf,
        cidade: obras.cidade,
        valorTotal: obras.valorTotal,
        clienteId: obras.clienteId,
      })
      .from(obras)
      .where(eq(obras.id, obraId));
  } catch (err) {
    console.error("[nova-obra-zona] falha ao ler obra:", err);
    return { status: "failed" };
  }

  if (!obra) return { status: "not_found" };

  const ufNorm = obra.uf ? obra.uf.trim().toUpperCase() : null;
  const cidadeNorm = obra.cidade ? obra.cidade.trim().toLowerCase() : null;
  if (!ufNorm && !cidadeNorm) {
    return { status: "no_location" };
  }

  // Resolve user owner (contratante) para excluir do alvo.
  let ownerUserId: string | null = null;
  if (obra.clienteId) {
    try {
      const [cli] = await db
        .select({ userId: clientes.userId })
        .from(clientes)
        .where(eq(clientes.id, obra.clienteId));
      ownerUserId = cli?.userId ?? null;
    } catch {
      ownerUserId = null;
    }
  }

  // Match empreiteiras com zona compatível + usuário ativo.
  // LEFT JOIN em prefs para default true quando linha não existe.
  let matches: Array<{
    userId: string;
    email: string | null;
    name: string | null;
    prefsNotificacoes: Record<string, boolean> | null;
  }> = [];
  try {
    const filters: any[] = [
      isNotNull(empreiteiras.userId),
      eq(users.ativo, true),
    ];
    if (ownerUserId) filters.push(ne(users.id, ownerUserId));
    const matchExpr =
      ufNorm && cidadeNorm
        ? sql`(${ufNorm}::text = ANY(${empreiteiras.zonaAtuacaoUfs}) OR ${cidadeNorm}::text = ANY(${empreiteiras.zonaAtuacaoCidades}))`
        : ufNorm
          ? sql`(${ufNorm}::text = ANY(${empreiteiras.zonaAtuacaoUfs}))`
          : sql`(${cidadeNorm}::text = ANY(${empreiteiras.zonaAtuacaoCidades}))`;
    filters.push(matchExpr);

    matches = await db
      .selectDistinct({
        userId: users.id,
        email: users.email,
        name: users.name,
        prefsNotificacoes: userPreferencias.notificacoes,
      })
      .from(empreiteiras)
      .innerJoin(users, eq(users.id, empreiteiras.userId))
      .leftJoin(userPreferencias, eq(userPreferencias.userId, users.id))
      .where(and(...filters));
  } catch (err) {
    console.error("[nova-obra-zona] falha ao buscar matches:", err);
    return { status: "failed" };
  }

  if (matches.length === 0) {
    return { status: "no_matches", matchedCount: 0 };
  }

  const href = `/empreiteiro/novas-obras/${obra.id}`;
  const cidadeLabel = obra.cidade?.trim() || null;
  const ufLabel = ufNorm;
  const localLabel =
    cidadeLabel && ufLabel
      ? `${cidadeLabel} - ${ufLabel}`
      : cidadeLabel || ufLabel || "sua região";
  const titulo = "Nova obra na sua zona";
  const descricao = `A obra "${obra.nome}" em ${localLabel} acaba de entrar no marketplace.`;
  const valorFormatado = formatarValorBRL(obra.valorTotal);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const link = baseUrl ? `${baseUrl}${href}` : href;

  let notifCount = 0;
  let emailCount = 0;

  for (const m of matches) {
    // In-app: sempre tenta (best-effort por destinatário).
    try {
      await db.insert(notificacoes).values({
        userId: m.userId,
        tipo: "info",
        titulo,
        descricao,
        href,
      });
      notifCount++;
    } catch (err) {
      console.error(
        "[nova-obra-zona] falha ao criar notificação in-app:",
        m.userId,
        err,
      );
    }

    // Email: respeita preferência (default true se ausente).
    const prefs = m.prefsNotificacoes ?? null;
    const emailEnabled = prefs ? prefs.email_novaObra !== false : true;
    if (!emailEnabled || !m.email) continue;
    try {
      await sendNovaObraZonaEmail(m.email, {
        empreiteiroNome: m.name ?? "Empreiteiro",
        obraNome: obra.nome,
        cidade: cidadeLabel,
        uf: ufLabel,
        valorFormatado,
        link,
      });
      emailCount++;
    } catch (err) {
      console.error("[nova-obra-zona] falha ao enviar email:", m.email, err);
    }
  }

  return {
    status: "sent",
    matchedCount: matches.length,
    notifCount,
    emailCount,
  };
}
