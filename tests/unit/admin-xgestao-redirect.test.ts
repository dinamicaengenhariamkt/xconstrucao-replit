import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRedirectPathByRole,
  resolvePostLoginRedirect,
} from "@features/auth/utils/redirect-by-role";

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
});