import type { IconType } from 'react-icons';

export type PeriodoSeletor = '30dias' | '3meses' | '12meses' | 'personalizado';

export interface DateRange {
  from: Date;
  to?: Date;
}

export interface WelcomeSectionProps {
  periodo: PeriodoSeletor;
  onPeriodoChange: (p: PeriodoSeletor) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

export interface AdminFinanceiroDashboardStats {
  volumeContratado: number;
  totalPagoEmpreiteiras: number;
  saldoPagar: number;
  taxasPlataforma: number;
  obrasRiscoFinanceiro: number;
  inadimplencia: number;
}

export type StatsCardBadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatsCardBadge {
  label: string;
  variant: StatsCardBadgeVariant;
}

export interface StatsCardProps {
  label: string;
  value: string;
  icon: IconType;
  iconBgColor: string;
  badge?: StatsCardBadge;
}

export interface StatsCardData {
  label: string;
  value: string;
  icon: IconType;
  iconBgColor: string;
  badge?: StatsCardBadge;
}

export interface StatsGridProps {
  stats: StatsCardData[];
}

export interface StatsGridContainerProps {
  data: AdminFinanceiroDashboardStats;
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

export type SituacaoKey = 'pagamento_atrasado' | 'medicao_pendente' | 'em_dia' | 'obra_suspensa';

export interface ObraAtencao {
  id: string;
  nome: string;
  codigo: string;
  cliente: string;
  empreiteira: string;
  valorContratado: number;
  valorPago: number;
  percentConcluido: number;
  situacao: SituacaoKey;
}

export type MedicaoStatus = 'pago' | 'pendente' | 'atrasado' | 'em_analise';

export interface AdminMedicao {
  id: string;
  numero: number;
  periodo: string;
  valorMedicao: number;
  valorPago: number;
  status: MedicaoStatus;
  dataVencimento: string;
  dataPagamento?: string;
}

export interface AdminHistoricoItem {
  id: string;
  tipo: 'pagamento' | 'medicao' | 'aditivo' | 'alerta';
  titulo: string;
  descricao: string;
  valor?: number;
  data: string;
}

export interface AdminObraFinanceiroDetalhe extends ObraAtencao {
  endereco: string;
  tipo: string;
  dataInicio: string;
  dataPrevisaoFim: string;
  aditivos: number;
  valorTotal: number;
  medicoes: AdminMedicao[];
  historico: AdminHistoricoItem[];
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
