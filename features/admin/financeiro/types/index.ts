export interface AdminFinanceiroDashboardStats {
  volumeContratado: number;
  totalPagoEmpreiteiras: number;
  saldoPagar: number;
  taxasPlataforma: number;
  obrasRiscoFinanceiro: number;
  inadimplencia: number;
}

export interface PaymentEvolutionData {
  mes: string;
  medicoes: number;
  pagamentos: number;
}

export interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

export type ObraSituacao =
  | 'pagamento_atrasado'
  | 'medicao_pendente'
  | 'em_dia'
  | 'obra_suspensa';

export interface ObraAtencao {
  id: string;
  nome: string;
  codigo: string;
  cliente: string;
  empreiteira: string;
  valorContratado: number;
  valorPago: number;
  percentConcluido: number;
  situacao: ObraSituacao;
}

export interface TopCliente {
  id: string;
  nome: string;
  obras: number;
  volContratado: number;
  pago: number;
  saldo: number;
}

export interface TopEmpreiteira {
  id: string;
  nome: string;
  obras: number;
  volContratado: number;
  pago: number;
  saldo: number;
}

export type ReceitaTipo = 'medicoes' | 'assinatura' | 'outros';

export interface ReceitaPlataforma {
  id: string;
  tipo: ReceitaTipo;
  nome: string;
  valor: number;
  percentTotal: number;
  iconColor: string;
  barColor: string;
}

export type PeriodoSeletor = '30dias' | '3meses' | '12meses' | 'personalizado';
