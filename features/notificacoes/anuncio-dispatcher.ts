import { criarNotificacao } from "./service";

/**
 * J23 — Dispatcher de notificações do self-service de anúncios. Eventos do ciclo
 * de vida do pedido/anúncio para o anunciante. Best-effort (falha não quebra o
 * fluxo principal). O `href` aponta para a área de gestão do anunciante e serve de
 * chave de dedupe (índice parcial uniq_notificacoes_user_href_unread, J13).
 */

const HREF_MEUS_ANUNCIOS = "/anunciante/meus-anuncios";

export async function notificarPedidoRecebido(pedidoId: string, userId: string): Promise<void> {
  await criarNotificacao({
    userId,
    tipo: "info",
    titulo: "Pedido de anúncio recebido",
    descricao: "Seu pedido entrou na fila de análise. Avisaremos quando for revisado.",
    href: `${HREF_MEUS_ANUNCIOS}?pedido=${pedidoId}`,
  });
}

export async function notificarPedidoAprovado(
  pedidoId: string,
  userId: string,
  slotsPublicados: number,
): Promise<void> {
  await criarNotificacao({
    userId,
    tipo: "sucesso",
    titulo: "Anúncio aprovado e no ar",
    descricao:
      slotsPublicados > 0
        ? `Seu pedido foi aprovado — ${slotsPublicados} anúncio(s) já estão sendo exibidos.`
        : "Seu pedido foi aprovado.",
    href: `${HREF_MEUS_ANUNCIOS}?pedido=${pedidoId}`,
  });
}

export async function notificarPedidoRecusado(
  pedidoId: string,
  userId: string,
  motivo: string,
): Promise<void> {
  await criarNotificacao({
    userId,
    tipo: "alerta",
    titulo: "Pedido de anúncio recusado",
    descricao: `Motivo: ${motivo}`,
    href: `${HREF_MEUS_ANUNCIOS}?pedido=${pedidoId}`,
  });
}
