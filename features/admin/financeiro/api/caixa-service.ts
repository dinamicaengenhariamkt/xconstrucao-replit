import { and, desc, eq, lte, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, clientes, empreiteiras, financeiro, kpiSnapshots, obras, users } from "@shared/db/schema";

/**
 * Service de leitura do Financeiro Admin (J09). Caixa CONSOLIDADO = dinheiro de
 * obra (J06/J08) + dinheiro de plataforma (assinaturas J11, anúncios J12,
 * estornos de disputa J10). Toda agregação é feita no banco.
 *
 * Categorização de receita/saída para os KPIs deriva de `financeiro.categoria`
 * e `financeiro.escopo` — sem fonte externa. Indicadores econômicos (IPCA/INCC),
 * NPS/CSAT e métricas de adoção NÃO têm fonte de dados real no projeto e ficam
 * documentados como pendência externa (ver docs/jornadas/09-financeiro-admin.md §13).
 */

// ─── Período → intervalo de datas ISO (yyyy-mm-dd) ──────────────────────────
const DIA_MS = 86_400_000;

export interface Intervalo {
  inicio: string | null;
  fim: string | null;
}

/**
 * Converte um label de período em [inicio, fim] (datas ISO). `agoraMs` permite
 * testes determinísticos. Períodos suportados cobrem caixa/entradas/saídas.
 */
export function resolverIntervalo(
  periodo: string | null | undefined,
  agoraMs: number,
  custom?: { from?: string | null; to?: string | null },
): Intervalo {
  const hoje = new Date(agoraMs);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const desde = (dias: number) => iso(new Date(agoraMs - dias * DIA_MS));
  switch (periodo) {
    case "7dias":
      return { inicio: desde(7), fim: iso(hoje) };
    case "30dias":
      return { inicio: desde(30), fim: iso(hoje) };
    case "90dias":
    case "3meses":
      return { inicio: desde(90), fim: iso(hoje) };
    case "12meses":
      return { inicio: desde(365), fim: iso(hoje) };
    case "anoAtual":
      return { inicio: `${hoje.getUTCFullYear()}-01-01`, fim: iso(hoje) };
    case "personalizado":
      return {
        inicio: custom?.from ? custom.from.slice(0, 10) : null,
        fim: custom?.to ? custom.to.slice(0, 10) : iso(hoje),
      };
    default:
      return { inicio: null, fim: iso(hoje) };
  }
}

/**
 * Dias do período sem nenhuma movimentação (J40 P1 #9 — antes era `0` fixo,
 * exibido como insight "N dias no período").
 *
 * O `chart` só contém dias COM movimento, então o resultado é o span do
 * intervalo menos os dias presentes. Sem `inicio` definido (período "todos"),
 * a janela é aberta e o número não teria significado → devolve 0.
 */
function contarDiasSemMovimento(
  chart: Array<{ dia: string }>,
  periodo: string | null,
  agoraMs: number,
): number {
  const { inicio, fim } = resolverIntervalo(periodo, agoraMs);
  if (!inicio || !fim) return 0;
  const inicioMs = Date.parse(`${inicio}T00:00:00Z`);
  const fimMs = Date.parse(`${fim}T00:00:00Z`);
  if (Number.isNaN(inicioMs) || Number.isNaN(fimMs) || fimMs < inicioMs) return 0;
  const totalDias = Math.floor((fimMs - inicioMs) / DIA_MS) + 1;
  const diasComMovimento = new Set(chart.map((p) => p.dia)).size;
  return Math.max(0, totalDias - diasComMovimento);
}

function condsPeriodo(intervalo: Intervalo) {
  const conds: any[] = [];
  if (intervalo.inicio) conds.push(sql`${financeiro.data} >= ${intervalo.inicio}`);
  if (intervalo.fim) conds.push(sql`${financeiro.data} <= ${intervalo.fim}`);
  return conds;
}

/**
 * Retorna o intervalo equivalente ao período ANTERIOR (para cálculo de crescimento%).
 * Retorna null quando não há período anterior bem-definido (ex: null, personalizado).
 */
function resolverIntervaloPrevio(periodo: string | null | undefined, agoraMs: number): Intervalo | null {
  if (!periodo) return null;
  const hoje = new Date(agoraMs);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const desde = (dias: number) => iso(new Date(agoraMs - dias * DIA_MS));
  switch (periodo) {
    case "7dias":
      return { inicio: desde(14), fim: desde(7) };
    case "30dias":
      return { inicio: desde(60), fim: desde(30) };
    case "90dias":
    case "3meses":
      return { inicio: desde(180), fim: desde(90) };
    case "12meses":
      return { inicio: desde(730), fim: desde(365) };
    case "anoAtual": {
      const prevYear = hoje.getUTCFullYear() - 1;
      return { inicio: `${prevYear}-01-01`, fim: `${prevYear}-12-31` };
    }
    default:
      return null;
  }
}

/** Computa crescimentoPercent comparando total atual com total do período anterior. */
async function computeCrescimento(
  tipo: "entrada" | "saida",
  totalAtual: number,
  periodo: string | null,
  agoraMs: number,
): Promise<number> {
  const prevIntervalo = resolverIntervaloPrevio(periodo, agoraMs);
  if (!prevIntervalo) return 0;
  const prevConds = [
    sql`${financeiro.tipo} = ${tipo}`,
    sql`${financeiro.status} = 'pago'`,
    ...condsPeriodo(prevIntervalo),
  ];
  const [prevRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)`,
    })
    .from(financeiro)
    .where(and(...prevConds));
  const prevTotal = Number(prevRow?.total ?? 0);
  if (prevTotal <= 0) return totalAtual > 0 ? 100 : 0;
  return Math.round(((totalAtual - prevTotal) / prevTotal) * 100);
}

// ─── Resumo / KPIs do caixa ─────────────────────────────────────────────────
export interface CaixaResumo {
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
  previsaoProximoMes: number;
}

/** Resumo do mês corrente (consolidado, ambos os escopos). */
export async function getCaixaResumo(agoraMs: number): Promise<CaixaResumo> {
  const inicioMes = `${new Date(agoraMs).toISOString().slice(0, 7)}-01`;
  const [row] = await db
    .select({
      saldoEntradas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      saldoSaidas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
      entradasMes: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago' AND ${financeiro.data} >= ${inicioMes}), 0)`,
      saidasMes: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago' AND ${financeiro.data} >= ${inicioMes}), 0)`,
      previstoEntrada: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} IN ('pendente','atrasado')), 0)`,
    })
    .from(financeiro);
  const saldoAtual = Number(row?.saldoEntradas ?? 0) - Number(row?.saldoSaidas ?? 0);
  return {
    saldoAtual,
    entradasMes: Number(row?.entradasMes ?? 0),
    saidasMes: Number(row?.saidasMes ?? 0),
    previsaoProximoMes: Number(row?.previstoEntrada ?? 0),
  };
}

export interface CaixaKpiData {
  saldoDisponivel: number;
  entradasPeriodo: number;
  saidasPeriodo: number;
  resultadoPeriodo: number;
  saldoProjetado: number;
  diasCaixa: number;
  entradasVariacao: string;
  saidasVariacao: string;
  resultadoLabel: string;
  saldoProjetadoLabel: string;
  diasCaixaLabel: string;
  saldoAtualizadoEm: string;
}

export async function getCaixaKpis(periodo: string | null, agoraMs: number): Promise<CaixaKpiData> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = condsPeriodo(intervalo);

  const [periodoRow] = await db
    .select({
      entradas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      saidas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
      previstoEntrada: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} IN ('pendente','atrasado')), 0)`,
    })
    .from(financeiro)
    .where(conds.length ? and(...conds) : sql`true`);

  // Saldo total acumulado (todo o histórico pago).
  const [totalRow] = await db
    .select({
      entradas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      saidas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro);

  const entradasPeriodo = Number(periodoRow?.entradas ?? 0);
  const saidasPeriodo = Number(periodoRow?.saidas ?? 0);
  const resultadoPeriodo = entradasPeriodo - saidasPeriodo;
  const saldoDisponivel = Number(totalRow?.entradas ?? 0) - Number(totalRow?.saidas ?? 0);
  const saldoProjetado = saldoDisponivel + Number(periodoRow?.previstoEntrada ?? 0);

  // Dias de caixa = saldo / burn diário médio do período (saídas/dias).
  const dias = intervalo.inicio
    ? Math.max(1, Math.round((agoraMs - new Date(intervalo.inicio).getTime()) / DIA_MS))
    : 30;
  const burnDiario = saidasPeriodo / dias;
  const diasCaixa = burnDiario > 0 ? Math.floor(saldoDisponivel / burnDiario) : 0;

  return {
    saldoDisponivel,
    entradasPeriodo,
    saidasPeriodo,
    resultadoPeriodo,
    saldoProjetado,
    diasCaixa,
    entradasVariacao: "",
    saidasVariacao: "",
    resultadoLabel: resultadoPeriodo >= 0 ? "Superávit no período" : "Déficit no período",
    saldoProjetadoLabel: "Inclui recebíveis pendentes",
    diasCaixaLabel: burnDiario > 0 ? "Com base no burn do período" : "Sem saídas no período",
    saldoAtualizadoEm: new Date(agoraMs).toISOString(),
  };
}

// ─── Movimentações (lista consolidada) ──────────────────────────────────────
export interface Movimentacao {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  referencia: string;
  status: "confirmado" | "pendente" | "cancelado";
}

function mapStatusMov(status: string): Movimentacao["status"] {
  if (status === "pago") return "confirmado";
  if (status === "cancelado") return "cancelado";
  return "pendente";
}

export async function getMovimentacoes(periodo: string | null, agoraMs: number, limit = 200): Promise<Movimentacao[]> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = condsPeriodo(intervalo);
  const rows = await db
    .select({
      id: financeiro.id,
      tipo: financeiro.tipo,
      descricao: financeiro.descricao,
      valor: financeiro.valor,
      data: financeiro.data,
      categoria: financeiro.categoria,
      status: financeiro.status,
      escopo: financeiro.escopo,
      obraNome: obras.nome,
    })
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .where(conds.length ? and(...conds) : sql`true`)
    .orderBy(sql`${financeiro.data} DESC`)
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo === "entrada" ? "entrada" : "saida",
    descricao: r.descricao,
    valor: Number(r.valor),
    data: r.data,
    categoria: r.categoria ?? (r.escopo === "plataforma" ? "Plataforma" : "Obra"),
    referencia: r.obraNome ?? (r.escopo === "plataforma" ? "Plataforma" : "—"),
    status: mapStatusMov(r.status),
  }));
}

// ─── Gráfico saldo no tempo ─────────────────────────────────────────────────
export interface CaixaChartPoint {
  dia: string;
  saldo?: number;
  projecao?: number;
}

export async function getCaixaChart(periodo: string | null, agoraMs: number): Promise<CaixaChartPoint[]> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = condsPeriodo(intervalo);
  // Saldo líquido por dia (entrada - saída, pago).
  const rows = await db
    .select({
      dia: financeiro.data,
      delta: sql<string>`COALESCE(SUM(CASE WHEN ${financeiro.tipo} = 'entrada' THEN ${financeiro.valor} ELSE -${financeiro.valor} END) FILTER (WHERE ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro)
    .where(conds.length ? and(...conds) : sql`true`)
    .groupBy(financeiro.data)
    .orderBy(financeiro.data);
  // Acumula para obter o saldo corrente.
  let acc = 0;
  return rows.map((r) => {
    acc += Number(r.delta);
    return { dia: r.dia, saldo: acc };
  });
}

// ─── Entradas / Saídas: lista detalhada ─────────────────────────────────────
function categoriaParaTipoReceita(categoria: string | null, escopo: string): "taxa_medicao" | "assinatura" | "outros_servicos" {
  const c = (categoria ?? "").toLowerCase();
  if (c.includes("assinatura")) return "assinatura";
  if (c.includes("medi") || escopo === "obra") return "taxa_medicao";
  return "outros_servicos";
}

export interface Entrada {
  id: string;
  dataHora: string;
  descricao: string;
  clienteEmpreiteira: string;
  tipoReceita: "taxa_medicao" | "assinatura" | "outros_servicos";
  origem: "cliente" | "empreiteira" | "outros";
  valor: number;
  status: "recebido" | "pendente" | "em_processamento";
}

export async function getEntradas(periodo: string | null, agoraMs: number, custom?: { from?: string | null; to?: string | null }): Promise<Entrada[]> {
  const intervalo = resolverIntervalo(periodo, agoraMs, custom);
  const conds = [eq(financeiro.tipo, "entrada"), ...condsPeriodo(intervalo)];
  const rows = await db
    .select({
      id: financeiro.id,
      data: financeiro.data,
      descricao: financeiro.descricao,
      valor: financeiro.valor,
      categoria: financeiro.categoria,
      status: financeiro.status,
      escopo: financeiro.escopo,
      clienteNome: clientes.nome,
    })
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .where(and(...conds))
    .orderBy(sql`${financeiro.data} DESC`);
  return rows.map((r) => ({
    id: r.id,
    dataHora: `${r.data}T00:00:00`,
    descricao: r.descricao,
    clienteEmpreiteira: r.clienteNome ?? "—",
    tipoReceita: categoriaParaTipoReceita(r.categoria, r.escopo),
    origem: r.clienteNome ? "cliente" : "outros",
    valor: Number(r.valor),
    status: r.status === "pago" ? "recebido" : r.status === "atrasado" ? "pendente" : "em_processamento",
  }));
}

function categoriaParaTipoSaida(categoria: string | null, escopo: string): "pagamento_medicao" | "reembolso" | "custo_operacional" {
  const c = (categoria ?? "").toLowerCase();
  if (c.includes("estorno") || c.includes("reembol")) return "reembolso";
  if (escopo === "obra" || c.includes("medi")) return "pagamento_medicao";
  return "custo_operacional";
}

export interface Saida {
  id: string;
  dataHora: string;
  descricao: string;
  obra?: string;
  destino: string;
  destinoPerfil: "empreiteira" | "cliente" | "outro";
  tipoSaida: "pagamento_medicao" | "reembolso" | "custo_operacional";
  status: "pago" | "agendado" | "pendente_aprovacao" | "atrasado";
  valor: number;
}

export async function getSaidas(periodo: string | null, agoraMs: number, custom?: { from?: string | null; to?: string | null }): Promise<Saida[]> {
  const intervalo = resolverIntervalo(periodo, agoraMs, custom);
  const conds = [eq(financeiro.tipo, "saida"), ...condsPeriodo(intervalo)];
  const rows = await db
    .select({
      id: financeiro.id,
      data: financeiro.data,
      descricao: financeiro.descricao,
      valor: financeiro.valor,
      categoria: financeiro.categoria,
      status: financeiro.status,
      escopo: financeiro.escopo,
      obraNome: obras.nome,
      empreiteiraNome: empreiteiras.nome,
    })
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(and(...conds))
    .orderBy(sql`${financeiro.data} DESC`);
  return rows.map((r) => ({
    id: r.id,
    dataHora: `${r.data}T00:00:00`,
    descricao: r.descricao,
    obra: r.obraNome ?? undefined,
    destino: r.empreiteiraNome ?? (r.escopo === "plataforma" ? "Plataforma" : "—"),
    destinoPerfil: r.empreiteiraNome ? "empreiteira" : "outro",
    tipoSaida: categoriaParaTipoSaida(r.categoria, r.escopo),
    status:
      r.status === "pago"
        ? "pago"
        : r.status === "atrasado"
          ? "atrasado"
          : r.status === "cancelado"
            ? "pendente_aprovacao"
            : "agendado",
    valor: Number(r.valor),
  }));
}

// ─── KPIs de entradas / saídas ──────────────────────────────────────────────
export interface EntradaKpi {
  totalEntradas: number;
  crescimentoPercent: number;
  taxasMedicoes: number;
  taxasMedicoesPercent: number;
  assinaturas: number;
  assinaturasPercent: number;
  outrosServicos: number;
  outrosServicosPercent: number;
  ticketMedioPorCliente: number;
  ticketMedioPorObra: number;
}

export async function getEntradaKpi(periodo: string | null, agoraMs: number): Promise<EntradaKpi> {
  const [entradas, crescimentoPercent] = await Promise.all([
    getEntradas(periodo, agoraMs),
    (async () => {
      const intervalo = resolverIntervalo(periodo, agoraMs);
      const conds = [sql`${financeiro.tipo} = 'entrada'`, sql`${financeiro.status} = 'pago'`, ...condsPeriodo(intervalo)];
      const [row] = await db.select({ total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)` }).from(financeiro).where(and(...conds));
      return computeCrescimento("entrada", Number(row?.total ?? 0), periodo, agoraMs);
    })(),
  ]);
  const total = entradas.reduce((s, e) => s + e.valor, 0);
  const grupo = (t: Entrada["tipoReceita"]) => entradas.filter((e) => e.tipoReceita === t).reduce((s, e) => s + e.valor, 0);
  const taxas = grupo("taxa_medicao");
  const assin = grupo("assinatura");
  const outros = grupo("outros_servicos");
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const clientesUnicos = new Set(entradas.map((e) => e.clienteEmpreiteira)).size || 1;
  return {
    totalEntradas: total,
    crescimentoPercent,
    taxasMedicoes: taxas,
    taxasMedicoesPercent: pct(taxas),
    assinaturas: assin,
    assinaturasPercent: pct(assin),
    outrosServicos: outros,
    outrosServicosPercent: pct(outros),
    ticketMedioPorCliente: Math.round(total / clientesUnicos),
    ticketMedioPorObra: entradas.length > 0 ? Math.round(total / entradas.length) : 0,
  };
}

export interface SaidaKpi {
  totalSaidas: number;
  crescimentoPercent: number;
  pagamentosEmpreiteiras: number;
  pagamentosEmpreiteirasPercent: number;
  reembolsos: number;
  reembolsosPercent: number;
  outrosDesembolsos: number;
  outrosDesembolsosPercent: number;
  saidasPrevistas: number;
  maiorPagamento: number;
  maiorPagamentoDescricao: string;
}

export async function getSaidaKpi(periodo: string | null, agoraMs: number): Promise<SaidaKpi> {
  const [saidas, crescimentoPercent] = await Promise.all([
    getSaidas(periodo, agoraMs),
    (async () => {
      const intervalo = resolverIntervalo(periodo, agoraMs);
      const conds = [sql`${financeiro.tipo} = 'saida'`, sql`${financeiro.status} = 'pago'`, ...condsPeriodo(intervalo)];
      const [row] = await db.select({ total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)` }).from(financeiro).where(and(...conds));
      return computeCrescimento("saida", Number(row?.total ?? 0), periodo, agoraMs);
    })(),
  ]);
  const total = saidas.reduce((s, e) => s + e.valor, 0);
  const grupo = (t: Saida["tipoSaida"]) => saidas.filter((e) => e.tipoSaida === t).reduce((s, e) => s + e.valor, 0);
  const pag = grupo("pagamento_medicao");
  const reemb = grupo("reembolso");
  const outros = grupo("custo_operacional");
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const previstas = saidas.filter((s) => s.status !== "pago").reduce((s, e) => s + e.valor, 0);
  const maior = saidas.reduce<Saida | null>((m, s) => (!m || s.valor > m.valor ? s : m), null);
  return {
    totalSaidas: total,
    crescimentoPercent,
    pagamentosEmpreiteiras: pag,
    pagamentosEmpreiteirasPercent: pct(pag),
    reembolsos: reemb,
    reembolsosPercent: pct(reemb),
    outrosDesembolsos: outros,
    outrosDesembolsosPercent: pct(outros),
    saidasPrevistas: previstas,
    maiorPagamento: maior?.valor ?? 0,
    maiorPagamentoDescricao: maior?.descricao ?? "—",
  };
}

// ─── Gráficos de entradas / saídas (séries diárias por categoria) ────────────
export interface EntradaChartData {
  chart: Array<{ dia: string; taxas: number; assinaturas: number; outros: number }>;
  insights: { maiorDia: string; maiorDiaValor: number; diasSemEntrada: number };
}

export async function getEntradaChart(periodo: string | null, agoraMs: number): Promise<EntradaChartData> {
  const entradas = await getEntradas(periodo, agoraMs);
  const porDia = new Map<string, { taxas: number; assinaturas: number; outros: number }>();
  for (const e of entradas) {
    const dia = e.dataHora.slice(0, 10);
    const cur = porDia.get(dia) ?? { taxas: 0, assinaturas: 0, outros: 0 };
    if (e.tipoReceita === "taxa_medicao") cur.taxas += e.valor;
    else if (e.tipoReceita === "assinatura") cur.assinaturas += e.valor;
    else cur.outros += e.valor;
    porDia.set(dia, cur);
  }
  const chart = [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dia, v]) => ({ dia, ...v }));
  let maiorDia = "";
  let maiorDiaValor = 0;
  for (const p of chart) {
    const t = p.taxas + p.assinaturas + p.outros;
    if (t > maiorDiaValor) {
      maiorDiaValor = t;
      maiorDia = p.dia;
    }
  }
  return {
    chart,
    insights: { maiorDia, maiorDiaValor, diasSemEntrada: contarDiasSemMovimento(chart, periodo, agoraMs) },
  };
}

export interface SaidaChartData {
  chart: Array<{ dia: string; pagamentos: number; reembolsos: number; outros: number }>;
  insights: { maiorDia: string; maiorDiaValor: number; diasSemSaida: number };
}

export async function getSaidaChart(periodo: string | null, agoraMs: number): Promise<SaidaChartData> {
  const saidas = await getSaidas(periodo, agoraMs);
  const porDia = new Map<string, { pagamentos: number; reembolsos: number; outros: number }>();
  for (const s of saidas) {
    const dia = s.dataHora.slice(0, 10);
    const cur = porDia.get(dia) ?? { pagamentos: 0, reembolsos: 0, outros: 0 };
    if (s.tipoSaida === "pagamento_medicao") cur.pagamentos += s.valor;
    else if (s.tipoSaida === "reembolso") cur.reembolsos += s.valor;
    else cur.outros += s.valor;
    porDia.set(dia, cur);
  }
  const chart = [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dia, v]) => ({ dia, ...v }));
  let maiorDia = "";
  let maiorDiaValor = 0;
  for (const p of chart) {
    const t = p.pagamentos + p.reembolsos + p.outros;
    if (t > maiorDiaValor) {
      maiorDiaValor = t;
      maiorDia = p.dia;
    }
  }
  return {
    chart,
    insights: { maiorDia, maiorDiaValor, diasSemSaida: contarDiasSemMovimento(chart, periodo, agoraMs) },
  };
}

// ─── Top entidades ──────────────────────────────────────────────────────────
export interface TopItem {
  nome: string;
  obras: number;
  totalEntradas?: number;
  totalSaidas?: number;
}

export async function getTopClientes(periodo: string | null, agoraMs: number): Promise<Array<{ nome: string; obras: number; totalEntradas: number }>> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = [eq(financeiro.tipo, "entrada"), ...condsPeriodo(intervalo)];
  const rows = await db
    .select({
      nome: clientes.nome,
      obras: sql<number>`COUNT(DISTINCT ${financeiro.obraId})::int`,
      total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)`,
    })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .innerJoin(clientes, eq(clientes.id, obras.clienteId))
    .where(and(...conds))
    .groupBy(clientes.nome)
    .orderBy(sql`SUM(${financeiro.valor}) DESC`)
    .limit(10);
  return rows.map((r) => ({ nome: r.nome ?? "—", obras: r.obras, totalEntradas: Number(r.total) }));
}

export async function getTopEmpreiteiras(
  periodo: string | null,
  agoraMs: number,
  tipo: "entrada" | "saida" = "saida",
): Promise<Array<{ nome: string; obras: number; totalEntradas: number; totalSaidas: number }>> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = [eq(financeiro.tipo, tipo), ...condsPeriodo(intervalo)];
  const rows = await db
    .select({
      nome: empreiteiras.nome,
      obras: sql<number>`COUNT(DISTINCT ${financeiro.obraId})::int`,
      total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)`,
    })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(and(...conds))
    .groupBy(empreiteiras.nome)
    .orderBy(sql`SUM(${financeiro.valor}) DESC`)
    .limit(10);
  return rows.map((r) => ({
    nome: r.nome ?? "—",
    obras: r.obras,
    totalEntradas: tipo === "entrada" ? Number(r.total) : 0,
    totalSaidas: tipo === "saida" ? Number(r.total) : 0,
  }));
}

export async function getTopClientesReembolsados(
  periodo: string | null,
  agoraMs: number,
): Promise<Array<{ nome: string; obras: number; totalSaidas: number }>> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = [
    eq(financeiro.tipo, "saida"),
    sql`(LOWER(${financeiro.categoria}) LIKE '%estorno%' OR LOWER(${financeiro.categoria}) LIKE '%reembol%')`,
    ...condsPeriodo(intervalo),
  ];
  const rows = await db
    .select({
      nome: clientes.nome,
      obras: sql<number>`COUNT(DISTINCT ${financeiro.obraId})::int`,
      total: sql<string>`COALESCE(SUM(${financeiro.valor}), 0)`,
    })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .innerJoin(clientes, eq(clientes.id, obras.clienteId))
    .where(and(...conds))
    .groupBy(clientes.nome)
    .orderBy(sql`SUM(${financeiro.valor}) DESC`)
    .limit(10);
  return rows.map((r) => ({ nome: r.nome ?? "—", obras: r.obras, totalSaidas: Number(r.total) }));
}

// ─── Saídas futuras (recebíveis a pagar) ────────────────────────────────────
export interface SaidaFutura {
  id: string;
  vencimento: string;
  descricao: string;
  destino: string;
  destinoPerfil: "empreiteira" | "cliente" | "outro";
  obra?: string;
  tipoSaida: "pagamento_medicao" | "reembolso" | "custo_operacional";
  valor: number;
}

export async function getSaidasFuturas(): Promise<SaidaFutura[]> {
  const rows = await db
    .select({
      id: financeiro.id,
      vencimento: financeiro.dataVencimento,
      data: financeiro.data,
      descricao: financeiro.descricao,
      valor: financeiro.valor,
      categoria: financeiro.categoria,
      escopo: financeiro.escopo,
      obraNome: obras.nome,
      empreiteiraNome: empreiteiras.nome,
    })
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(and(eq(financeiro.tipo, "saida"), sql`${financeiro.status} IN ('pendente','atrasado')`))
    .orderBy(sql`COALESCE(${financeiro.dataVencimento}, ${financeiro.data}) ASC`)
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    vencimento: (r.vencimento ?? r.data).slice(0, 10),
    descricao: r.descricao,
    destino: r.empreiteiraNome ?? (r.escopo === "plataforma" ? "Plataforma" : "—"),
    destinoPerfil: r.empreiteiraNome ? "empreiteira" : "outro",
    obra: r.obraNome ?? undefined,
    tipoSaida: categoriaParaTipoSaida(r.categoria, r.escopo),
    valor: Number(r.valor),
  }));
}

// ─── Dashboard financeiro (KPIs do topo) ────────────────────────────────────
export interface AdminFinanceiroDashboardStats {
  volumeContratado: number;
  totalPagoEmpreiteiras: number;
  saldoPagar: number;
  taxasPlataforma: number;
  obrasRiscoFinanceiro: number;
  inadimplencia: number;
}

/**
 * KPIs financeiros reais do dashboard admin. Derivados de obras + financeiro.
 * - volumeContratado: soma de obras.valorTotal.
 * - totalPagoEmpreiteiras: saídas de obra pagas.
 * - saldoPagar: saídas de obra ainda pendentes/atrasadas.
 * - taxasPlataforma: entradas escopo plataforma pagas.
 * - obrasRiscoFinanceiro: obras com lançamento atrasado.
 * - inadimplencia: total de entradas atrasadas.
 */
export async function getDashboardStats(): Promise<AdminFinanceiroDashboardStats> {
  const [obraRow] = await db
    .select({ volume: sql<string>`COALESCE(SUM(${obras.valorTotal}), 0)` })
    .from(obras);

  const [finRow] = await db
    .select({
      pagoEmpreiteiras: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.escopo} = 'obra' AND ${financeiro.status} = 'pago'), 0)`,
      saldoPagar: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.escopo} = 'obra' AND ${financeiro.status} IN ('pendente','atrasado')), 0)`,
      taxasPlataforma: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.escopo} = 'plataforma' AND ${financeiro.status} = 'pago'), 0)`,
      inadimplencia: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.status} = 'atrasado'), 0)`,
      obrasRisco: sql<number>`COUNT(DISTINCT ${financeiro.obraId}) FILTER (WHERE ${financeiro.status} = 'atrasado')::int`,
    })
    .from(financeiro);

  const volumeContratado = Number(obraRow?.volume ?? 0);
  const inadimplenciaValor = Number(finRow?.inadimplencia ?? 0);
  // UI exibe via formatPercentage → inadimplência como % do contratado.
  const inadimplenciaPct = volumeContratado > 0 ? (inadimplenciaValor / volumeContratado) * 100 : 0;

  return {
    volumeContratado,
    totalPagoEmpreiteiras: Number(finRow?.pagoEmpreiteiras ?? 0),
    saldoPagar: Number(finRow?.saldoPagar ?? 0),
    taxasPlataforma: Number(finRow?.taxasPlataforma ?? 0),
    obrasRiscoFinanceiro: finRow?.obrasRisco ?? 0,
    inadimplencia: Math.round(inadimplenciaPct * 10) / 10,
  };
}

// ─── Tabelas do dashboard (J18) ─────────────────────────────────────────────
export interface ObraAtencao {
  id: string;
  nome: string;
  codigo: string;
  cliente: string;
  empreiteira: string;
  valorContratado: number;
  valorPago: number;
  percentConcluido: number;
  situacao: "pagamento_atrasado" | "medicao_pendente" | "em_dia" | "obra_suspensa";
}

/**
 * Obras que requerem atenção financeira: lançamento atrasado, ou obra pausada.
 * Deriva de `obras` + `financeiro`. Ordena pelas mais críticas primeiro.
 */
export async function getObrasAtencao(): Promise<ObraAtencao[]> {
  const rows = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      status: obras.status,
      valorTotal: obras.valorTotal,
      valorPago: obras.valorPago,
      progresso: obras.progresso,
      clienteNome: clientes.nome,
      empreiteiraNome: empreiteiras.nome,
      atrasados: sql<number>`COALESCE((SELECT COUNT(*) FROM financeiro f WHERE f.obra_id = ${obras.id} AND f.status = 'atrasado'), 0)::int`,
      pendentes: sql<number>`COALESCE((SELECT COUNT(*) FROM financeiro f WHERE f.obra_id = ${obras.id} AND f.status = 'pendente'), 0)::int`,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(sql`${obras.status} <> 'concluida'`)
    .orderBy(sql`(SELECT COUNT(*) FROM financeiro f WHERE f.obra_id = ${obras.id} AND f.status = 'atrasado') DESC`)
    .limit(20);

  return rows
    .map((r) => {
      let situacao: ObraAtencao["situacao"];
      if (r.status === "pausada") situacao = "obra_suspensa";
      else if (r.atrasados > 0) situacao = "pagamento_atrasado";
      else if (r.pendentes > 0) situacao = "medicao_pendente";
      else situacao = "em_dia";
      return {
        id: r.id,
        nome: r.nome,
        codigo: `OBR-${r.id.slice(0, 6).toUpperCase()}`,
        cliente: r.clienteNome ?? "—",
        empreiteira: r.empreiteiraNome ?? "—",
        valorContratado: Number(r.valorTotal ?? 0),
        valorPago: Number(r.valorPago ?? 0),
        percentConcluido: r.progresso ?? 0,
        situacao,
      };
    })
    .filter((o) => o.situacao !== "em_dia"); // só as que precisam de atenção
}

export interface TopEntidadeRica {
  id: string;
  nome: string;
  obras: number;
  volContratado: number;
  pago: number;
  saldo: number;
}

/** Top clientes por volume contratado (obras) com pago/saldo reais. */
export async function getTopClientesRico(): Promise<TopEntidadeRica[]> {
  const rows = await db
    .select({
      id: clientes.id,
      nome: clientes.nome,
      obras: sql<number>`COUNT(DISTINCT ${obras.id})::int`,
      volContratado: sql<string>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      pago: sql<string>`COALESCE(SUM(${obras.valorPago}), 0)`,
    })
    .from(clientes)
    .innerJoin(obras, eq(obras.clienteId, clientes.id))
    .groupBy(clientes.id, clientes.nome)
    .orderBy(sql`SUM(${obras.valorTotal}) DESC`)
    .limit(10);
  return rows.map((r) => {
    const vol = Number(r.volContratado);
    const pago = Number(r.pago);
    return { id: r.id, nome: r.nome ?? "—", obras: r.obras, volContratado: vol, pago, saldo: vol - pago };
  });
}

/** Top empreiteiras por volume contratado nas obras atribuídas. */
export async function getTopEmpreiteirasRico(): Promise<TopEntidadeRica[]> {
  const rows = await db
    .select({
      id: empreiteiras.id,
      nome: empreiteiras.nome,
      obras: sql<number>`COUNT(DISTINCT ${obras.id})::int`,
      volContratado: sql<string>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      pago: sql<string>`COALESCE(SUM(${obras.valorPago}), 0)`,
    })
    .from(empreiteiras)
    .innerJoin(obras, eq(obras.empreiteiraId, empreiteiras.id))
    .groupBy(empreiteiras.id, empreiteiras.nome)
    .orderBy(sql`SUM(${obras.valorTotal}) DESC`)
    .limit(10);
  return rows.map((r) => {
    const vol = Number(r.volContratado);
    const pago = Number(r.pago);
    return { id: r.id, nome: r.nome ?? "—", obras: r.obras, volContratado: vol, pago, saldo: vol - pago };
  });
}

export interface ReceitaPlataforma {
  id: string;
  tipo: "medicoes" | "assinatura" | "outros";
  nome: string;
  valor: number;
  percentTotal: number;
  iconColor: string;
  barColor: string;
}

/** Receita da plataforma por categoria (assinaturas, anúncios, taxas de obra). */
export async function getReceitasPlataforma(): Promise<{ receitas: ReceitaPlataforma[]; total: number }> {
  const rows = await db
    .select({
      assinatura: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.categoria} = 'assinatura' AND ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      anuncio: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.categoria} = 'anuncio' AND ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      obra: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.escopo} = 'obra' AND ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro);
  const r = rows[0];
  const assinatura = Number(r?.assinatura ?? 0);
  const anuncio = Number(r?.anuncio ?? 0);
  const obra = Number(r?.obra ?? 0);
  const total = assinatura + anuncio + obra;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);
  const receitas: ReceitaPlataforma[] = [
    { id: "assinatura", tipo: "assinatura", nome: "Assinaturas", valor: assinatura, percentTotal: pct(assinatura), iconColor: "text-blue-600", barColor: "bg-blue-500" },
    { id: "anuncio", tipo: "outros", nome: "Anúncios", valor: anuncio, percentTotal: pct(anuncio), iconColor: "text-amber-600", barColor: "bg-amber-500" },
    { id: "obra", tipo: "medicoes", nome: "Taxas de obra", valor: obra, percentTotal: pct(obra), iconColor: "text-emerald-600", barColor: "bg-emerald-500" },
  ];
  return { receitas, total };
}

export interface AdoptionMetrics {
  usuariosAtivos30d: number;
  usuariosAtivos30dDeltaPercent: number;
  novosUsuarios30d: number;
  aplicacoes7d: number;
  aplicacoes7dDeltaPercent: number;
  taxaConversaoCandidatura: number;
  churnEmpreiteirosPercent: number;
}

/**
 * Métricas de adoção DERIVADAS DO BANCO (sem fonte externa). "Usuários ativos"
 * = cadastrados que não estão inativos. Conversão = candidaturas aceitas / total.
 *
 * J29: o delta de usuários ativos vem de `kpi_snapshots` (0 até haver ≥1 snapshot
 * de ~30 dias atrás) e o churn de empreiteiros usa `users.last_login_at`
 * (inatividade > {@link CHURN_INATIVIDADE_DIAS} dias).
 */
/**
 * Valor de um snapshot de KPI (J29) na data mais recente em/antes de `periodoRef`
 * (YYYY-MM-DD). Retorna `null` se ainda não há histórico — o caller degrada para 0.
 */
async function getSnapshotValor(metrica: string, periodoRef: string): Promise<number | null> {
  const [row] = await db
    .select({ valor: kpiSnapshots.valor })
    .from(kpiSnapshots)
    .where(and(eq(kpiSnapshots.metrica, metrica), lte(kpiSnapshots.periodo, periodoRef)))
    .orderBy(desc(kpiSnapshots.periodo))
    .limit(1);
  if (!row) return null;
  const n = Number(row.valor);
  return Number.isFinite(n) ? n : null;
}

/** Variação percentual atual vs anterior. 0 quando não há base (anterior ausente/zero). */
function calcularDeltaPercent(atual: number, anterior: number | null): number {
  if (anterior === null || anterior === 0) return 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

/** Janela de inatividade que conta como churn de empreiteiro (J29). */
const CHURN_INATIVIDADE_DIAS = 60;

export async function getAdoptionMetrics(agoraMs: number): Promise<AdoptionMetrics> {
  const ms30 = new Date(agoraMs - 30 * 86_400_000).toISOString();
  const ms7 = new Date(agoraMs - 7 * 86_400_000).toISOString();
  const ms14 = new Date(agoraMs - 14 * 86_400_000).toISOString();

  const [u] = await db
    .select({
      ativos: sql<number>`COUNT(*) FILTER (WHERE ${users.ativo} = true)::int`,
      novos30d: sql<number>`COUNT(*) FILTER (WHERE ${users.createdAt} >= ${ms30})::int`,
    })
    .from(users);

  const [c] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      aceitas: sql<number>`COUNT(*) FILTER (WHERE ${candidaturas.status} = 'aceita')::int`,
      ultimos7: sql<number>`COUNT(*) FILTER (WHERE ${candidaturas.createdAt} >= ${ms7})::int`,
      semana_anterior: sql<number>`COUNT(*) FILTER (WHERE ${candidaturas.createdAt} >= ${ms14} AND ${candidaturas.createdAt} < ${ms7})::int`,
    })
    .from(candidaturas);

  const aplicacoes7d = c?.ultimos7 ?? 0;
  const semanaAnterior = c?.semana_anterior ?? 0;
  const deltaAplic = semanaAnterior > 0 ? Math.round(((aplicacoes7d - semanaAnterior) / semanaAnterior) * 100) : 0;
  const conversao = (c?.total ?? 0) > 0 ? Math.round(((c?.aceitas ?? 0) / (c?.total ?? 1)) * 100) : 0;

  // J29 — delta de usuários ativos vs snapshot de ~30 dias atrás (0 até haver histórico).
  const usuariosAtivos = u?.ativos ?? 0;
  const periodo30 = new Date(agoraMs - 30 * 86_400_000).toISOString().slice(0, 10);
  const ativosAnterior = await getSnapshotValor("usuariosAtivos", periodo30);
  const usuariosAtivos30dDeltaPercent = calcularDeltaPercent(usuariosAtivos, ativosAnterior);

  // J29 — churn de empreiteiros: % com last_login_at além da janela de inatividade.
  // Empreiteiros que nunca logaram (last_login_at NULL) só contam como churn se a
  // conta é antiga (cadastro anterior à janela) — evita penalizar quem acabou de se cadastrar.
  const corteInatividade = new Date(agoraMs - CHURN_INATIVIDADE_DIAS * 86_400_000).toISOString();
  const [churnRow] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      inativos: sql<number>`COUNT(*) FILTER (
        WHERE (${users.lastLoginAt} IS NOT NULL AND ${users.lastLoginAt} < ${corteInatividade})
           OR (${users.lastLoginAt} IS NULL AND ${users.createdAt} < ${corteInatividade})
      )::int`,
    })
    .from(users)
    .where(and(eq(users.role, "empreiteiro"), eq(users.ativo, true)));
  const churnEmpreiteirosPercent =
    (churnRow?.total ?? 0) > 0
      ? Math.round(((churnRow?.inativos ?? 0) / (churnRow?.total ?? 1)) * 100)
      : 0;

  return {
    usuariosAtivos30d: usuariosAtivos,
    usuariosAtivos30dDeltaPercent,
    novosUsuarios30d: u?.novos30d ?? 0,
    aplicacoes7d,
    aplicacoes7dDeltaPercent: deltaAplic,
    taxaConversaoCandidatura: conversao,
    churnEmpreiteirosPercent,
  };
}

// ─── Séries temporais do dashboard (J18) ────────────────────────────────────
const MES_LABELS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export interface PaymentEvolutionPoint {
  mes: string;
  medicoes: number;
  pagamentos: number;
}

/**
 * Evolução de medições (entradas de obra) vs pagamentos (saídas de obra) por mês.
 * Real, derivado de `financeiro`. Substitui `getPaymentEvolutionByPeriodo` (mock).
 */
export async function getPaymentEvolution(periodo: string | null, agoraMs: number): Promise<PaymentEvolutionPoint[]> {
  const intervalo = resolverIntervalo(periodo, agoraMs);
  const conds = [sql`${financeiro.escopo} = 'obra'`, ...condsPeriodo(intervalo)];
  const rows = await db
    .select({
      mes: sql<string>`to_char(${financeiro.data}::date, 'YYYY-MM')`,
      medicoes: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      pagamentos: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro)
    .where(and(...conds))
    .groupBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`);
  return rows.map((r) => {
    const mm = Number(r.mes.split("-")[1] ?? "1");
    return { mes: MES_LABELS[mm - 1] ?? r.mes, medicoes: Number(r.medicoes), pagamentos: Number(r.pagamentos) };
  });
}

export interface StatusDistributionPoint {
  name: string;
  value: number;
  color: string;
}

/** Distribuição de obras por status (real). Substitui `mockStatusDistributionData`. */
export async function getStatusDistribution(): Promise<StatusDistributionPoint[]> {
  const rows = await db
    .select({ status: obras.status, total: sql<number>`COUNT(*)::int` })
    .from(obras)
    .groupBy(obras.status);
  const map = new Map(rows.map((r) => [r.status, r.total]));
  return [
    { name: "Em andamento", value: map.get("em_andamento") ?? 0, color: "#1E88E5" },
    { name: "Planejamento", value: map.get("planejamento") ?? 0, color: "#F5A623" },
    { name: "Concluída", value: map.get("concluida") ?? 0, color: "#22846D" },
    { name: "Pausada", value: map.get("pausada") ?? 0, color: "#9ca3af" },
  ].filter((d) => d.value > 0);
}

// ─── Saída manual (registro de despesa de plataforma) ───────────────────────
export async function registrarSaidaManual(args: {
  descricao: string;
  valor: number;
  categoria: string;
  data?: string;
  status?: "pendente" | "pago";
}): Promise<{ id: string }> {
  const today = args.data ?? new Date().toISOString().slice(0, 10);
  const [row] = await db
    .insert(financeiro)
    .values({
      tipo: "saida",
      descricao: args.descricao,
      valor: String(args.valor),
      data: today,
      escopo: "plataforma",
      categoria: args.categoria,
      status: args.status ?? "pago",
    })
    .returning({ id: financeiro.id });
  return { id: row.id };
}
