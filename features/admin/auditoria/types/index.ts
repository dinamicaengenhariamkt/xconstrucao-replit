export type AuditoriaEventTipo =
  | 'login'
  | 'logout'
  | 'cliente_criado'
  | 'cliente_editado'
  | 'cliente_bloqueado'
  | 'empreiteira_criada'
  | 'empreiteira_bloqueada'
  | 'obra_criada'
  | 'obra_atualizada'
  | 'pagamento_registrado'
  | 'configuracao_alterada'
  | 'plano_alterado'
  | 'sistema';

export type AuditoriaModulo =
  | 'clientes'
  | 'empreiteiras'
  | 'obras'
  | 'financeiro'
  | 'planos'
  | 'configuracoes'
  | 'sistema';

export interface AuditoriaEvento {
  id: string;
  tipo: AuditoriaEventTipo;
  modulo: AuditoriaModulo;
  titulo: string;
  descricao: string;
  usuario: string;
  dataHora: string; // ISO string
}

export interface AuditoriaKpi {
  acoesHoje: number;
  loginsHoje: number;
  alertas: number;
  erros: number;
}
