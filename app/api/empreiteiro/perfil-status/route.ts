import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * GET /api/empreiteiro/perfil-status
 *
 * Status do perfil do empreiteiro consumido pela tela "Novas Obras"
 * (`usePerfilStatus`). Historicamente o frontend chamava este endpoint mas ele
 * NUNCA existiu → 404 em todo carregamento; o hook tolerava (default isBlocked:false),
 * mas o erro poluía o console e disparava retries a cada foco de janela. J40 #22.
 *
 * Não há sistema de bloqueio implementado no servidor (volume/atrasos/score nunca
 * foram construídos), então retornamos `isBlocked: false` explicitamente — o mesmo
 * comportamento efetivo de hoje, agora sem 404. `completionPercentage` e `pendencias`
 * são calculados a partir do perfil real (informativos, não bloqueantes).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const [emp] = await db
    .select({
      telefone: empreiteiras.telefone,
      descricao: empreiteiras.descricao,
      avatarUrl: empreiteiras.avatarUrl,
      zonaUfs: empreiteiras.zonaAtuacaoUfs,
      registroProfissional: empreiteiras.registroProfissional,
    })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, guard.user.id));

  // Checklist leve de completude do perfil (informativo). Cada item preenchido
  // conta igual. Se não houver linha de empreiteira ainda, 0%.
  const checks = [
    !!emp?.telefone,
    !!emp?.descricao,
    !!emp?.avatarUrl,
    !!(emp?.zonaUfs && emp.zonaUfs.length > 0),
    !!emp?.registroProfissional,
  ];
  const preenchidos = checks.filter(Boolean).length;
  const completionPercentage = Math.round((preenchidos / checks.length) * 100);

  const pendencias = [
    { id: "telefone", titulo: "Telefone", descricao: "Adicione um telefone de contato.", resolvido: !!emp?.telefone },
    { id: "descricao", titulo: "Descrição", descricao: "Descreva sua empreiteira.", resolvido: !!emp?.descricao },
    { id: "avatar", titulo: "Foto/Logo", descricao: "Envie uma foto ou logo.", resolvido: !!emp?.avatarUrl },
    { id: "zona", titulo: "Zona de atuação", descricao: "Defina UFs/cidades onde você atua.", resolvido: !!(emp?.zonaUfs && emp.zonaUfs.length > 0) },
    { id: "registro", titulo: "Registro profissional", descricao: "Informe CREA/CAU se aplicável.", resolvido: !!emp?.registroProfissional },
  ].filter((p) => !p.resolvido);

  const r = NextResponse.json({
    // Sem sistema de bloqueio no servidor — nunca bloqueia por aqui.
    isBlocked: false,
    completionPercentage,
    pendencias,
    motivoBloqueio: "",
    motivosBloqueio: [],
  });
  setNoCacheHeaders(r);
  return r;
}
