import type { PaymentEvolutionData, StatusDistributionData } from '../types';
import { ADMIN_DASHBOARD_COLORS } from '../constants';

export const mockPaymentEvolutionData: PaymentEvolutionData[] = [
  { mes: 'JAN', medicoes: 1_200_000, pagamentos: 980_000 },
  { mes: 'FEV', medicoes: 1_450_000, pagamentos: 1_200_000 },
  { mes: 'MAR', medicoes: 1_600_000, pagamentos: 1_380_000 },
  { mes: 'ABR', medicoes: 1_750_000, pagamentos: 1_520_000 },
  { mes: 'MAI', medicoes: 1_900_000, pagamentos: 1_650_000 },
  { mes: 'JUN', medicoes: 2_050_000, pagamentos: 1_780_000 },
  { mes: 'JUL', medicoes: 2_200_000, pagamentos: 1_900_000 },
  { mes: 'AGO', medicoes: 2_380_000, pagamentos: 2_050_000 },
  { mes: 'SET', medicoes: 2_520_000, pagamentos: 2_180_000 },
  { mes: 'OUT', medicoes: 2_650_000, pagamentos: 2_300_000 },
  { mes: 'NOV', medicoes: 2_750_000, pagamentos: 2_380_000 },
  { mes: 'DEZ', medicoes: 2_800_000, pagamentos: 2_400_000 },
];

export const mockStatusDistributionData: StatusDistributionData[] = [
  { name: 'Em andamento', value: 45, color: ADMIN_DASHBOARD_COLORS.info },
  { name: 'Concluída', value: 25, color: ADMIN_DASHBOARD_COLORS.success },
  { name: 'Em atraso', value: 20, color: ADMIN_DASHBOARD_COLORS.error },
  { name: 'Suspensa/cancelada', value: 10, color: ADMIN_DASHBOARD_COLORS.gray },
];
