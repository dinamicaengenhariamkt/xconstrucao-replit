import type { AdminDashboardStats, AdminDashboardAlerta } from '../types';

export const mockDashboardStats: AdminDashboardStats = {
  totalClientes: 47,
  totalEmpreiteiras: 18,
  obrasAtivas: 23,
  obrasFinalizadas: 31,
  volumePlataforma: 43_820_000,
  inadimplencia: 8.2,
  obrasComAtraso: 4,
};

export const mockDashboardAlertas: AdminDashboardAlerta[] = [
  {
    id: 'al-1',
    tipo: 'obra_atraso',
    titulo: 'Retrofit Galpão Sul — medição em atraso',
    descricao: 'Medição nº 3 venceu em 15/01/2025 (R$ 551.800)',
    url: '/admin/obras/obr-e008',
  },
  {
    id: 'al-2',
    tipo: 'obra_atraso',
    titulo: 'Condomínio Jardim das Flores — medição em atraso',
    descricao: 'Medição nº 4 venceu em 31/01/2025 (R$ 830.000)',
    url: '/admin/obras/obr-005',
  },
  {
    id: 'al-3',
    tipo: 'inadimplencia',
    titulo: 'Taxa de inadimplência acima da média',
    descricao: '8,2% do volume contratado está em aberto com prazo vencido',
  },
  {
    id: 'al-4',
    tipo: 'receita_pendente',
    titulo: 'Receitas de assinaturas pendentes',
    descricao: '3 contratos de plano Pro com renovação atrasada',
    url: '/admin/planos',
  },
  {
    id: 'al-5',
    tipo: 'obra_atraso',
    titulo: 'Torres Empresariais Norte — sem medição iniciada',
    descricao: 'Obra iniciada em jan/2025 sem registro de medição',
    url: '/admin/obras/obr-e007',
  },
];
