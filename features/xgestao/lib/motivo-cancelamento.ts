/**
 * CRM-03 — motivo do cancelamento do xgestão, em regras puras (tela do
 * empreiteiro, rota de cancelar e admin leem daqui).
 *
 * A resposta é OPCIONAL: quem cancela pode não escolher nada. A lista é
 * fechada para dar para contar; o texto livre completa ("Outro" ou detalhe).
 * Gravado em `assinaturas.motivo_cancelamento` e `motivo_cancelamento_texto`
 * (ver docs/jornadas-xgestao/49-admin-segmentos-contato.md).
 */
export const MOTIVOS_CANCELAMENTO = [
  'preco_alto',
  'usei_pouco',
  'faltou_funcao',
  'outra_ferramenta',
  'obras_acabaram',
  'outro',
] as const;

export type MotivoCancelamento = (typeof MOTIVOS_CANCELAMENTO)[number];

export const ROTULO_MOTIVO_CANCELAMENTO: Record<MotivoCancelamento, string> = {
  preco_alto: 'Preço alto',
  usei_pouco: 'Usei pouco',
  faltou_funcao: 'Faltou alguma função',
  outra_ferramenta: 'Vou usar outra ferramenta',
  obras_acabaram: 'Minhas obras acabaram',
  outro: 'Outro',
};

/** Rótulo de quem cancelou sem escolher um motivo. */
export const SEM_MOTIVO_ROTULO = 'Não informou';

export const MOTIVO_CANCELAMENTO_TEXTO_MAX = 500;

export function isMotivoCancelamento(valor: unknown): valor is MotivoCancelamento {
  return typeof valor === 'string' && (MOTIVOS_CANCELAMENTO as readonly string[]).includes(valor);
}

export function rotuloMotivoCancelamento(valor: string | null | undefined): string {
  return isMotivoCancelamento(valor) ? ROTULO_MOTIVO_CANCELAMENTO[valor] : SEM_MOTIVO_ROTULO;
}

/**
 * Normaliza o que veio da tela: motivo fora da lista vira `null`, texto vazio
 * vira `null`, espaços nas pontas saem. Texto acima do limite é RECUSADO
 * (`erro`) em vez de cortado, para a pessoa não perder o que escreveu sem saber.
 */
export function normalizarMotivoCancelamento(
  motivo: unknown,
  texto: unknown,
): { ok: true; motivo: MotivoCancelamento | null; texto: string | null } | { ok: false; erro: string } {
  if (motivo !== undefined && motivo !== null && motivo !== '' && !isMotivoCancelamento(motivo)) {
    return { ok: false, erro: 'Motivo de cancelamento inválido.' };
  }
  if (texto !== undefined && texto !== null && typeof texto !== 'string') {
    return { ok: false, erro: 'O comentário deve ser texto.' };
  }
  const limpo = typeof texto === 'string' ? texto.trim() : '';
  if (limpo.length > MOTIVO_CANCELAMENTO_TEXTO_MAX) {
    return { ok: false, erro: `O comentário pode ter até ${MOTIVO_CANCELAMENTO_TEXTO_MAX} caracteres.` };
  }
  return {
    ok: true,
    motivo: isMotivoCancelamento(motivo) ? motivo : null,
    texto: limpo || null,
  };
}

export interface ContagemMotivo {
  /** Código do motivo, ou `sem_resposta` para quem não escolheu. */
  motivo: MotivoCancelamento | 'sem_resposta';
  rotulo: string;
  quantidade: number;
}

/**
 * Contagem por motivo, na ordem da lista e com "Não informou" no fim. Motivos
 * sem nenhum cancelamento ficam fora para o resumo não virar uma tabela de zeros.
 */
export function resumirMotivosCancelamento(motivos: ReadonlyArray<string | null | undefined>): {
  total: number;
  porMotivo: ContagemMotivo[];
} {
  const contagem = new Map<MotivoCancelamento | 'sem_resposta', number>();
  for (const m of motivos) {
    const chave = isMotivoCancelamento(m) ? m : 'sem_resposta';
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  const ordem: Array<MotivoCancelamento | 'sem_resposta'> = [...MOTIVOS_CANCELAMENTO, 'sem_resposta'];
  return {
    total: motivos.length,
    porMotivo: ordem
      .filter((m) => (contagem.get(m) ?? 0) > 0)
      .map((m) => ({
        motivo: m,
        rotulo: m === 'sem_resposta' ? SEM_MOTIVO_ROTULO : ROTULO_MOTIVO_CANCELAMENTO[m],
        quantidade: contagem.get(m) ?? 0,
      })),
  };
}
