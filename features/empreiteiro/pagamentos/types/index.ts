export interface MedicaoEmpreiteiro {
  id: string;
  obraId: string;
  obraNome: string;
  numero: number;
  periodo: string;
  valor: number;
  status: 'recebido' | 'aguardando_aprovacao' | 'pendente' | 'rejeitado';
  dataEnvio: string;
  dataRecebimento?: string;
  descricao: string;
}

export interface PagamentosEmpriteiroKPI {
  totalContratado: number;
  totalRecebido: number;
  aguardandoAprovacao: number;
  aLiberar: number;
}
