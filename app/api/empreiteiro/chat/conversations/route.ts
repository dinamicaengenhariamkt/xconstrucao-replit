import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarConversasPorUsuario } from "@features/chat/service";
import { toConversationDTO } from "@features/chat/dto";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const rows = await listarConversasPorUsuario(guard.user.id);
  const dto = rows.map(toConversationDTO);

  const r = NextResponse.json(dto);
  setNoCacheHeaders(r);
  return r;
}
