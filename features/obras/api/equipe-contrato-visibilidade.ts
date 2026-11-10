/**
 * EMP-06 — o acordo com cada prestador (PIX, valor e contrato assinado) é dado
 * financeiro. Membro sem acesso ao contrato da obra (`canAccessObraContrato`
 * falso: sem a área financeiro ou limitado a categorias) recebe a equipe sem
 * esses campos, tanto em `GET /api/obras/:id/equipe` quanto no detalhe.
 */
export const CAMPOS_CONTRATO_MEMBRO = [
  'pixChave',
  'valorContrato',
  'contratoFileId',
  'contratoLinkUrl',
  'contratoUrl',
  'contratoNome',
] as const;

export function ocultarContratoMembro<T extends object>(membro: T): T {
  const copia = { ...membro } as Record<string, unknown>;
  for (const campo of CAMPOS_CONTRATO_MEMBRO) delete copia[campo];
  return copia as T;
}
