/**
 * Dados mockados para atividades recentes
 */

import type { Activity, EfficiencyData } from '../types';

export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'milestone',
    icon: 'CheckCircle2',
    color: 'success',
    title: 'Obra Residencial São Paulo Concluída',
    description: 'Entrega final realizada com sucesso',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
    obraId: '1',
    obraNome: 'Residencial São Paulo',
  },
  {
    id: '2',
    type: 'payment',
    icon: 'DollarSign',
    color: 'info',
    title: 'Pagamento Recebido',
    description: 'Parcela de R$ 120K referente à Obra Industrial',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
    obraId: '2',
    obraNome: 'Obra Industrial',
  },
  {
    id: '3',
    type: 'delivery',
    icon: 'Package',
    color: 'amber',
    title: 'Material Entregue',
    description: 'Cimento e aço chegaram no canteiro da Obra Centro',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
    obraId: '3',
    obraNome: 'Obra Centro',
  },
  {
    id: '4',
    type: 'contract',
    icon: 'FileText',
    color: 'primary',
    title: 'Contrato Assinado',
    description: 'Nova obra residencial em Campinas iniciada',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
    obraId: '4',
    obraNome: 'Residencial Campinas',
  },
  {
    id: '5',
    type: 'milestone',
    icon: 'CheckCircle2',
    color: 'success',
    title: 'Etapa de Fundação Concluída',
    description: 'Obra Comercial atingiu 40% de conclusão',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    obraId: '5',
    obraNome: 'Edifício Comercial',
  },
  {
    id: '6',
    type: 'payment',
    icon: 'DollarSign',
    color: 'info',
    title: 'Pagamento de Fornecedor',
    description: 'Liquidação de materiais da Obra Sul',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 dias atrás
    obraId: '6',
    obraNome: 'Obra Sul',
  },
];

export const mockEmptyActivities: Activity[] = [];

export const mockEfficiencyData: EfficiencyData = {
  percentage: 92,
  label: 'Eficiência da Semana',
  period: 'Última semana',
};
