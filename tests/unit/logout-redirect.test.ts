import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLogoutRedirect } from "@features/auth/utils/logout-redirect";

describe("buildLogoutRedirect", () => {
  it("identifica o login do xgestão e preserva o retorno interno", () => {
    assert.equal(
      buildLogoutRedirect("xgestao", "/xgestao/obras"),
      "/login?perfil=xgestao&next=%2Fxgestao%2Fobras",
    );
  });

  it("não permite next externo ou fora do produto xgestão", () => {
    assert.equal(buildLogoutRedirect("xgestao", "https://example.com"), "/login?perfil=xgestao");
    assert.equal(buildLogoutRedirect("xgestao", "/admin"), "/login?perfil=xgestao");
    assert.equal(buildLogoutRedirect("xgestao", "//example.com"), "/login?perfil=xgestao");
  });

  it("preserva os destinos das personas do marketplace", () => {
    assert.equal(buildLogoutRedirect("contratante"), "/login?perfil=contratante");
    assert.equal(buildLogoutRedirect("empreiteiro"), "/login?perfil=empreiteiro");
    assert.equal(buildLogoutRedirect("administrador"), "/login?perfil=administrador");
  });
});