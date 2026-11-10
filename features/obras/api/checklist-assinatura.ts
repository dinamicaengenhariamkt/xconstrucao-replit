/**
 * EMP-08 — na obra própria do xgestão, data/hora de conclusão e assinatura
 * vêm do relógio do servidor, e a assinatura guarda o usuário logado. O nome
 * digitado (`assinadoPor`) segue só como texto de exibição. O que o cliente
 * manda em `completadoEm`/`assinadoEm` só vale como "limpar" (null).
 */
export type EntradaAssinatura = {
  completadoEm?: string | null;
  assinadoPor?: string | null;
  assinadoEm?: string | null;
};

export type CamposAssinatura = {
  completadoEm?: string | null;
  assinadoPor?: string | null;
  assinadoEm?: string | null;
  assinadoPorUserId?: string | null;
};

export function carimbarAssinaturaChecklist(
  data: EntradaAssinatura,
  userId: string,
  agora: Date,
): CamposAssinatura {
  const iso = agora.toISOString();
  const out: CamposAssinatura = {};
  if (data.completadoEm !== undefined) out.completadoEm = data.completadoEm === null ? null : iso;
  if (data.assinadoPor !== undefined) {
    const nome = data.assinadoPor?.trim() || null;
    out.assinadoPor = nome;
    out.assinadoEm = nome ? iso : null;
    out.assinadoPorUserId = nome ? userId : null;
  } else if (data.assinadoEm === null) {
    out.assinadoEm = null;
    out.assinadoPorUserId = null;
  }
  return out;
}
