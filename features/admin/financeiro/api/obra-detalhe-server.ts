import { desc, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { clientes, empreiteiras, financeiro, medicoes, obras } from '@shared/db/schema';
import type {
  AdminHistoricoItem,
  AdminMedicao,
  AdminObraFinanceiroDetalhe,
  MedicaoStatus,
  SituacaoKey,
} from '../types';

/**
 * Detalhe financeiro REAL de uma obra (J18 drill-down). Substitui o
 * `getMockObraDetalhe`. Junta `obras` + `clientes` + `empreiteiras` +
 * `medicoes` + `financeiro` para montar `AdminObraFinanceiroDetalhe`.
 */

function fmtBr(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return typeof input === 'string' ? input : '—';
  return d.toLocaleDateString('pt-BR');
}

function mapMedicaoStatus(status: string): MedicaoStatus {
  switch (status) {
    case 'aprovada':
      return 'aprovada_contratante';
    case 'contestada':
      return 'rejeitada_contratante';
    default:
      return 'pendente';
  }
}

export async function getAdminObraDetalhe(
  obraId: string,
): Promise<AdminObraFinanceiroDetalhe | null> {
  const [row] = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      endereco: obras.endereco,
      tipo: obras.tipo,
      status: obras.status,
      valorTotal: obras.valorTotal,
      valorPago: obras.valorPago,
      progresso: obras.progresso,
      dataInicio: obras.dataInicio,
      dataPrevisao: obras.dataPrevisao,
      clienteNome: clientes.nome,
      empreiteiraNome: empreiteiras.nome,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.id, obraId))
    .limit(1);

  if (!row) return null;

  // ── Medições reais ──────────────────────────────────────────────────────
  const medRows = await db
    .select({
      id: medicoes.id,
      numero: medicoes.numero,
      etapa: medicoes.etapa,
      valor: medicoes.valor,
      status: medicoes.status,
      createdAt: medicoes.createdAt,
      decidedAt: medicoes.decidedAt,
      motivoContestacao: medicoes.motivoContestacao,
    })
    .from(medicoes)
    .where(eq(medicoes.obraId, obraId))
    .orderBy(medicoes.numero);

  const medicoesUi: AdminMedicao[] = medRows.map((m) => {
    const status = mapMedicaoStatus(m.status);
    const valor = Number(m.valor ?? 0);
    return {
      id: m.id,
      numero: m.numero,
      periodo: m.etapa || `Medição ${m.numero}`,
      valorMedicao: valor,
      valorPago: status === 'aprovada_contratante' ? valor : 0,
      status,
      dataVencimento: fmtBr(m.createdAt),
      dataAprovacao: m.status === 'aprovada' && m.decidedAt ? new Date(m.decidedAt).toISOString().slice(0, 10) : undefined,
      dataRejeicao: m.status === 'contestada' && m.decidedAt ? new Date(m.decidedAt).toISOString().slice(0, 10) : undefined,
      motivoRejeicao: m.motivoContestacao ?? undefined,
    };
  });

  // ── Histórico real (lançamentos financeiros da obra) ────────────────────
  const finRows = await db
    .select({
      id: financeiro.id,
      tipo: financeiro.tipo,
      descricao: financeiro.descricao,
      valor: financeiro.valor,
      data: financeiro.data,
      categoria: financeiro.categoria,
    })
    .from(financeiro)
    .where(eq(financeiro.obraId, obraId))
    .orderBy(desc(financeiro.data))
    .limit(30);

  const historico: AdminHistoricoItem[] = finRows.map((f) => ({
    id: f.id,
    tipo: f.tipo === 'entrada' ? 'medicao' : 'pagamento',
    titulo: f.tipo === 'entrada' ? 'Recebimento' : 'Pagamento',
    descricao: f.descricao,
    valor: Number(f.valor),
    data: fmtBr(f.data),
  }));

  const valorTotal = Number(row.valorTotal ?? 0);
  const valorPago = Number(row.valorPago ?? 0);

  let situacao: SituacaoKey;
  if (row.status === 'pausada') situacao = 'obra_suspensa';
  else if (medRows.some((m) => m.status === 'contestada')) situacao = 'medicao_pendente';
  else situacao = 'em_dia';

  return {
    id: row.id,
    nome: row.nome,
    codigo: `OBR-${row.id.slice(0, 6).toUpperCase()}`,
    cliente: row.clienteNome ?? '—',
    empreiteira: row.empreiteiraNome ?? '—',
    valorContratado: valorTotal,
    valorPago,
    percentConcluido: row.progresso ?? 0,
    situacao,
    endereco: row.endereco ?? '—',
    tipo: row.tipo ?? '—',
    dataInicio: fmtBr(row.dataInicio),
    dataPrevisaoFim: fmtBr(row.dataPrevisao),
    aditivos: 0, // não há tabela de aditivos — gap documentado (§13)
    valorTotal,
    medicoes: medicoesUi,
    historico,
  };
}
