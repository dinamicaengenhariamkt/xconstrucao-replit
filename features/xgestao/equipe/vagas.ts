/** Vagas de acesso à empresa; prestadores sem login não são membros. */
export type VinculoEquipe = {
  userId: string;
  /** XG48 — `pausado` (acima do limite após descer de plano) não ocupa vaga. */
  status: 'ativo' | 'convidado' | 'revogado' | 'pausado';
};

export type UsoEquipe = {
  utilizadas: number;
  membrosAtivos: number;
  convitesPendentes: number;
  /** null = catálogo legado sem cota configurada, não uma oferta ilimitada. */
  limite: number | null;
};

export function contarVagasEquipe(titular: string, vinculos: readonly VinculoEquipe[]) {
  const ativos = new Set(vinculos.filter(v => v.status === 'ativo').map(v => v.userId));
  ativos.delete(titular);
  const pendentes = new Set(vinculos
    .filter(v => v.status === 'convidado' && v.userId !== titular && !ativos.has(v.userId))
    .map(v => v.userId));
  return {
    utilizadas: 1 + ativos.size + pendentes.size,
    membrosAtivos: ativos.size,
    convitesPendentes: pendentes.size,
  };
}

export function limiteVagasEquipe(limites: Record<string, number>): number | null {
  if (!Object.hasOwn(limites, 'pessoasEmpresa')) return null;
  const limite = limites.pessoasEmpresa;
  if (!Number.isSafeInteger(limite) || limite < 1) {
    throw new Error('Cota de equipe inválida no catálogo xgestão.');
  }
  return limite;
}

export function equipeLotada(uso: UsoEquipe): boolean {
  return uso.limite !== null && uso.utilizadas >= uso.limite;
}
