import 'server-only';

import {
  compararSemUso,
  resumirEngajamento,
  semUsoComRisco,
  type EngajamentoAssinante,
  type ResumoEngajamento,
} from '../lib/engajamento';
import type { SituacaoAssinante } from '../lib/situacao-assinante';
import { listarAssinantesDetalhados, type XgestaoAssinanteDetalhe } from './assinantes';

export interface AssinanteEngajamento {
  userId: string;
  empreiteiraNome: string;
  nome: string | null;
  tier: string;
  situacao: SituacaoAssinante;
  obrasGerenciadas: number;
  engajamento: EngajamentoAssinante;
}

export interface EngajamentoXgestao {
  resumo: ResumoEngajamento;
  /** Pagam ou estão no teste e não usam há 14 dias ou mais, do mais parado ao menos. */
  semUso: AssinanteEngajamento[];
  /** Todos, do uso mais recente ao mais antigo: base da tabela da página. */
  assinantes: AssinanteEngajamento[];
}

function linha(a: XgestaoAssinanteDetalhe): AssinanteEngajamento {
  return {
    userId: a.userId,
    empreiteiraNome: a.empreiteiraNome,
    nome: a.nome,
    tier: a.plano.tier,
    situacao: a.situacao,
    obrasGerenciadas: a.obrasGerenciadas,
    engajamento: a.engajamento,
  };
}

/** XG46 — quem usa o xgestão, quem parou e quem nunca começou. */
export async function engajamentoXgestao(assinantesCarregados?: XgestaoAssinanteDetalhe[]): Promise<EngajamentoXgestao> {
  const assinantes = assinantesCarregados ?? (await listarAssinantesDetalhados());
  return {
    resumo: resumirEngajamento(assinantes),
    semUso: assinantes
      .filter((a) => semUsoComRisco(a.situacao.codigo, a.engajamento))
      .sort((a, b) => compararSemUso(a.engajamento, b.engajamento))
      .map(linha),
    assinantes: assinantes
      .map(linha)
      .sort((a, b) => -compararSemUso(a.engajamento, b.engajamento) || a.empreiteiraNome.localeCompare(b.empreiteiraNome, 'pt-BR')),
  };
}
