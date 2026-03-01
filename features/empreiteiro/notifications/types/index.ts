export type NotificacaoTipo = 'lembrete' | 'alerta' | 'info' | 'sucesso';

export interface EmpreiteiroNotification {
  id: string;
  titulo: string;
  descricao: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  criadoEm: string;
  href: string;
}
