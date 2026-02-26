export type NotificacaoTipo = 'lembrete' | 'alerta' | 'info' | 'sucesso';

export interface AdminNotification {
  id: string;
  titulo: string;
  descricao: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  criadoEm: string; // ISO datetime string
  href: string;     // rota para page/item específico
}
