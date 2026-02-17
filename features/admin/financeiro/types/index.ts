import type { IconType } from 'react-icons';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component prop types
// ---------------------------------------------------------------------------

export type StatsCardBadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatsCardData {
  label: string;
  value: string;
  icon: IconType;
  iconBgColor: string;
  badge?: {
    label: string;
    variant: StatsCardBadgeVariant;
  };
}

export type StatsCardProps = StatsCardData;

/** Props da apresentação pura (recebe stats já montados) */
export interface StatsGridProps {
  stats: StatsCardData[];
}

/** Props do container (recebe dados brutos do domínio) */
export interface StatsGridContainerProps {
  data: AdminFinanceiroDashboardStats;
}

export interface PaymentsEvolutionChartProps {
  data: PaymentEvolutionData[];
}

export interface PaymentsEvolutionChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

export interface StatusDistributionChartProps {
  data: StatusDistributionData[];
  totalObras?: number;
}

export interface StatusDistributionChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

export interface ProgressBarProps {
  percent: number;
}

export interface ObrasAtencaoTableProps {
  obras: ObraAtencao[];
}

export interface TopClientesTableProps {
  clientes: TopCliente[];
}

export interface TopEmpreiteirasTableProps {
  empreiteiras: TopEmpreiteira[];
}

export interface ReceitasPlataformaTableProps {
  receitas: ReceitaPlataforma[];
  total: number;
}

export interface WelcomeSectionProps {
  periodo: PeriodoSeletor;
  onPeriodoChange: (periodo: PeriodoSeletor) => void;
}
