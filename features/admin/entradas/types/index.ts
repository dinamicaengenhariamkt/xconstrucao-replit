export type EntradaPeriodo = '7dias' | '30dias' | '3meses' | '12meses' | 'personalizado';

export interface DateRange {
  from: Date;
  to?: Date;
}
export type EntradaTipoReceita = 'taxa_medicao' | 'assinatura' | 'outros_servicos';
export type EntradaOrigem = 'cliente' | 'empreiteira' | 'outros';
export type EntradaStatus = 'recebido' | 'pendente' | 'em_processamento';

export interface Entrada {
  id: string;
  dataHora: string; // ISO datetime: '2024-06-26T14:30:00'
  descricao: string;
  clienteEmpreiteira: string;
  tipoReceita: EntradaTipoReceita;
  origem: EntradaOrigem;
  valor: number;
  status: EntradaStatus;
}

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

export interface EntradaChartPoint {
  dia: string;
  taxas: number;
  assinaturas: number;
  outros: number;
}

export interface EntradaInsight {
  maiorDia: string;
  maiorDiaValor: number;
  diasSemEntrada: number;
}

export interface EntradaTopItem {
  nome: string;
  obras: number;
  totalEntradas: number;
}

export interface EntradaChartData {
  chart: EntradaChartPoint[];
  insights: EntradaInsight;
}
