/**
 * XG28 — as rotas de entrada do xgestão, sem nenhuma dependência.
 *
 * Mora fora de `constants.ts` de propósito: aquele arquivo importa ícones do
 * `react-icons` para o menu, e quem precisa destas constantes é o
 * `redirect-by-role`, que roda no caminho de login (inclusive no servidor).
 * Fazer o redirect arrastar a árvore de ícones junto seria acoplar coisas que
 * não têm relação.
 *
 * O caminho está aqui, e não escrito à mão, porque estava repetido em **onze**
 * arquivos — login, callback do OAuth, cadastro, três landings, o `/xgestao`
 * nu, o layout, o "Ver como" do admin e os dois logouts. Enquanto todos
 * apontassem para a mesma rota isso passava despercebido; ao mover a entrada
 * para o dashboard, trocar dez e esquecer um deixaria o destino do usuário
 * dependendo de **por onde** ele entrou.
 */

/**
 * Para onde o usuário do xgestão vai ao entrar no produto.
 *
 * Do pedido do cliente: *"quando a gente logar na plataforma do xgestão com os
 * nossos usuários, ele pode estar direcionado para a parte de dashboard. O cara
 * vai ter a visão geral, e se ele quiser, para minhas obras, ele navega até o
 * menu"*.
 *
 * A allowlist de `?next=` (`redirect-by-role.ts`) libera o prefixo `/xgestao`
 * inteiro, então esta rota já era um destino aceito — só nunca era a escolhida.
 */
export const XGESTAO_HOME = '/xgestao/dashboard';

/** A lista de obras. Continua sendo o destino do "Ver todas" e do menu. */
export const XGESTAO_OBRAS = '/xgestao/obras';

/**
 * `XGESTAO_HOME` pronta para entrar num `?next=`, que é como as landings e o
 * layout a consomem.
 */
export const XGESTAO_HOME_ENCODED = encodeURIComponent(XGESTAO_HOME);

/** O link de login do xgestão, já com o contexto e o destino. */
export const XGESTAO_LOGIN_HREF = `/login?perfil=xgestao&next=${XGESTAO_HOME_ENCODED}`;
