// J21 — Observabilidade de Comunicação (Admin).
// Tipos compartilhados entre service (server), endpoints e UI (client).
// Tudo aqui é READ-ONLY: o admin observa, não participa das threads.

export type NotificacaoTipo = "lembrete" | "alerta" | "info" | "sucesso";

/** Item da lista paginada de threads de chat (visão admin). */
export interface AdminChatThread {
  threadId: string;
  obraId: string;
  obraNome: string;
  contratanteUserId: string;
  contratanteNome: string;
  empreiteiroUserId: string;
  empreiteiroNome: string;
  totalMensagens: number;
  ultimaMensagemTexto: string | null;
  ultimaMensagemEm: string | null; // ISO
  ultimoAutorUserId: string | null;
  /** true quando a última mensagem aguarda resposta da contraparte (>0 não lidas). */
  temNaoRespondida: boolean;
  criadaEm: string; // ISO
}

/** Mensagem individual no histórico read-only de uma thread. */
export interface AdminChatMensagem {
  id: string;
  autorUserId: string;
  autorNome: string;
  texto: string;
  anexoObraId: string | null;
  anexoObraNome: string | null;
  lidaEm: string | null; // ISO
  criadaEm: string; // ISO
}

/** Histórico completo de uma thread + cabeçalho de contexto. */
export interface AdminChatThreadDetalhe {
  thread: AdminChatThread;
  mensagens: AdminChatMensagem[];
}

/** Notificação disparada na plataforma (visão admin de observabilidade). */
export interface AdminNotificacaoItem {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  descricao: string;
  href: string | null;
  /** Canal de entrega. Hoje toda notificação persistida é in-app (sino). */
  canal: "in-app";
  lida: boolean;
  destinatarioUserId: string;
  destinatarioNome: string;
  destinatarioEmail: string;
  criadoEm: string; // ISO
}

/** Linha da trilha de auditoria de leituras admin (chat read, etc). */
export interface AdminAuditoriaItem {
  id: string;
  action: string;
  actorId: string | null;
  actorNome: string | null;
  targetUserId: string | null;
  payload: Record<string, unknown>;
  ip: string | null;
  criadoEm: string; // ISO
}

/** Envelope paginado genérico usado por todos os endpoints da jornada. */
export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminChatThreadsFiltro {
  page?: number;
  pageSize?: number;
  busca?: string; // obra ou nome de participante
  somenteNaoRespondidas?: boolean;
}

export interface AdminNotificacoesFiltro {
  page?: number;
  pageSize?: number;
  tipo?: NotificacaoTipo;
  status?: "lida" | "nao-lida";
  busca?: string; // título/descrição/destinatário
}

export interface AdminAuditoriaFiltro {
  page?: number;
  pageSize?: number;
  action?: string;
}
