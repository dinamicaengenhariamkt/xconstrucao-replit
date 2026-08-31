import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOAuthSuccessCallback,
  getExpectedRoleForLogin,
  getLoginContext,
} from "@features/auth/utils/login-context";
import { canApplySignupPersonaToRole } from "@features/auth/utils/oauth-persona";

describe("contexto do login xgestão", () => {
  it("não restringe a entrada xgestão à role empreiteiro", () => {
    assert.equal(getLoginContext("xgestao"), "xgestao");
    assert.equal(getExpectedRoleForLogin("xgestao"), undefined);
  });

  it("mantém as restrições explícitas dos perfis do marketplace e admin", () => {
    assert.equal(getExpectedRoleForLogin("contratante"), "contratante");
    assert.equal(getExpectedRoleForLogin("empreiteiro"), "empreiteiro");
    assert.equal(getExpectedRoleForLogin("administrador"), "admin");
    assert.equal(getExpectedRoleForLogin(null), undefined);
    assert.equal(getExpectedRoleForLogin("desconhecido"), undefined);
  });

  it("transporta contexto e next pelo callback Google", () => {
    assert.equal(
      buildOAuthSuccessCallback("/xgestao/obras", "xgestao"),
      "/auth/oauth-success?next=%2Fxgestao%2Fobras&context=xgestao",
    );
    assert.equal(
      buildOAuthSuccessCallback(null),
      "/auth/oauth-success",
    );
  });

  it("nunca permite que persona OAuth converta admin ou superadmin", () => {
    assert.equal(canApplySignupPersonaToRole("admin"), false);
    assert.equal(canApplySignupPersonaToRole("superadmin"), false);
    assert.equal(canApplySignupPersonaToRole("contratante"), true);
    assert.equal(canApplySignupPersonaToRole("empreiteiro"), true);
  });
});