import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRedirectPathByRole,
  resolvePostLoginRedirect,
} from "@features/auth/utils/redirect-by-role";
import { XGESTAO_HOME, XGESTAO_OBRAS } from "@features/xgestao/routes";

describe("redirecionamento do administrador xgestão", () => {
  it("envia o administrador restrito diretamente ao painel xgestão", () => {
    assert.equal(getRedirectPathByRole("admin", [], "xgestao"), "/admin/xgestao");
    assert.equal(
      resolvePostLoginRedirect("admin", null, [], "xgestao"),
      "/admin/xgestao",
    );
  });

  it("não aceita next fora do escopo xgestão", () => {
    assert.equal(
      resolvePostLoginRedirect("admin", "/admin/financeiro", [], "xgestao"),
      "/admin/xgestao",
    );
    assert.equal(
      resolvePostLoginRedirect("admin", "/admin/xgestao", [], "xgestao"),
      "/admin/xgestao",
    );
  });

  it("mantém administradores globais e superadmins no painel completo", () => {
    assert.equal(getRedirectPathByRole("admin", [], "global"), "/admin/financeiro");
    assert.equal(getRedirectPathByRole("superadmin", [], "xgestao"), "/admin/financeiro");
  });

  it("usa a visão administrativa xgestão quando o login veio desse produto", () => {
    assert.equal(
      resolvePostLoginRedirect(
        "superadmin",
        "/xgestao/obras",
        [],
        "global",
        "xgestao",
      ),
      "/admin/xgestao",
    );
    assert.equal(
      resolvePostLoginRedirect(
        "admin",
        "/admin/financeiro",
        [],
        "global",
        "xgestao",
      ),
      "/admin/xgestao",
    );
  });

  it("preserva o destino xgestão apenas para empreiteiro autorizado", () => {
    assert.equal(
      resolvePostLoginRedirect(
        "empreiteiro",
        "/xgestao/obras",
        ["empreiteiro", "xgestao"],
        undefined,
        "xgestao",
      ),
      "/xgestao/obras",
    );
    assert.equal(
      resolvePostLoginRedirect(
        "empreiteiro",
        "/xgestao/obras",
        ["empreiteiro"],
        undefined,
        "xgestao",
      ),
      "/empreiteiro/dashboard",
    );
    assert.equal(
      resolvePostLoginRedirect(
        "contratante",
        "/admin/xgestao",
        ["contratante"],
        undefined,
        "xgestao",
      ),
      "/contratante/dashboard",
    );
  });

  /**
   * XG28 — o caso que faltava, e que é a porta de entrada do produto.
   *
   * Os testes acima passam `/xgestao/obras` como `next` **explícito**: provam
   * que a allowlist preserva um destino pedido, não qual destino o produto
   * escolhe sozinho. O default — o que acontece quando alguém simplesmente
   * loga — não tinha nenhuma asserção, e foi justamente o que esta jornada
   * mudou.
   */
  it("leva o empreiteiro do xgestão ao dashboard quando não há next", () => {
    assert.equal(
      getRedirectPathByRole("empreiteiro", ["empreiteiro", "xgestao"]),
      XGESTAO_HOME,
    );
    assert.equal(
      resolvePostLoginRedirect("empreiteiro", null, ["empreiteiro", "xgestao"]),
      XGESTAO_HOME,
    );
  });

  it("não leva ao xgestão quem não tem o produto", () => {
    // O contraste que dá sentido ao teste acima: é o entitlement em `roles`
    // que decide, não a role de empreiteiro.
    assert.equal(
      getRedirectPathByRole("empreiteiro", ["empreiteiro"]),
      "/empreiteiro/dashboard",
    );
  });

  it("continua respeitando um next explícito dentro do xgestão", () => {
    // A lista segue alcançável por link direto — mudou o default, não a
    // allowlist.
    assert.equal(
      resolvePostLoginRedirect(
        "empreiteiro",
        XGESTAO_OBRAS,
        ["empreiteiro", "xgestao"],
      ),
      XGESTAO_OBRAS,
    );
  });
});