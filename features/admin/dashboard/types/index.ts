export interface AdminDashboardStats {
  totalClientes: number;
  totalEmpreiteiras: number;
  obrasAtivas: number;
  obrasFinalizadas: number;
  volumePlataforma: number;
  inadimplencia: number;
  obrasComAtraso: number;
}

export type AlertaTipo = 'obra_atraso' | 'inadimplencia' | 'receita_pendente' | 'sistema';

export interface AdminDashboardAlerta {
  id: string;
  tipo: AlertaTipo;
  titulo: string;
  descricao: string;
  url?: string;
}
