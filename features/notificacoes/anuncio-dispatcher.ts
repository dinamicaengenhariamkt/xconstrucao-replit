import { criarNotificacao } from "./service";
import { getUser } from "@features/auth/api/auth-storage";

/**
 * J23 — Dispatcher de notificações do self-service de anúncios. Eventos do ciclo
 * de vida do pedido/anúncio para o anunciante. Best-effort (falha não quebra o
 * fluxo principal). O `href` aponta para a área de gestão do usuário e serve de
 * chave de dedupe (índice parcial uniq_notificacoes_user_href_unread, J13).
 */

/**
 * Resolve a rota de "Meus Anúncios" pelo PAPEL PRIMÁRIO do usuário. D6: um cliente
 * (contratante/empreiteiro) que anuncia gere os anúncios DENTRO da própria visão —
 * a visão de anunciante converge/redireciona. Por isso a notificação não pode
 * apontar fixo para /anunciante/meus-anuncios; resolve pela visão real do usuário.
 */
async function resolverHrefMeusAnuncios(userId: string, pedidoId: string): Promise<string> {
  const user = await getUser(userId);
  const base =
    user?.role === "contratante"
      ? "/contratante/meus-anuncios"
      : user?.role === "empreiteiro"
        ? "/empreiteiro/meus-anuncios"
        : "/anunciante/meus-anuncios";
  return `${base}?pedido=${pedidoId}`;
}

export async function notificarPedidoRecebido(pedidoId: string, userId: string): Promise<void> {
  await criarNotificacao({
    userId,
    tipo: "info",
    titulo: "Pedido de anúncio recebido",
    descricao: "Seu pedido entrou na fila de análise. Avisaremos quando for revisado.",
    href: await resolverHrefMeusAnuncios(userId, pedidoId),
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
    titulo: slotsPublicados > 0 ? "Anúncio aprovado e no ar" : "Pedido aprovado",
    descricao:
      slotsPublicados > 0
        ? `Seu pedido foi aprovado — ${slotsPublicados} anúncio(s) já estão sendo exibidos.`
        : "Seu pedido foi aprovado.",
    href: await resolverHrefMeusAnuncios(userId, pedidoId),
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
    href: await resolverHrefMeusAnuncios(userId, pedidoId),
  });
}
