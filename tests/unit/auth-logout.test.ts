import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { useAuthStore } from "@features/auth/store/auth-store";

const originalFetch = global.fetch;

const xgestaoUser = {
  id: "user-xgestao",
  email: "empreiteiro@example.com",
  name: "Empreiteiro xgestão",
  role: "empreiteiro",
  roles: ["xgestao"],
};

afterEach(() => {
  global.fetch = originalFetch;
  useAuthStore.setState({ user: null });
});

describe("auth store logout", () => {
  it("mantém o destino xgestão mesmo quando a API devolve redirect antigo", async () => {
    let requestBody: Record<string, unknown> | undefined;
    global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({
        persona: "empreiteiro",
        redirect: "/login?perfil=empreiteiro",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    useAuthStore.setState({ user: xgestaoUser });

    const result = await useAuthStore.getState().logout({
      persona: "xgestao",
      next: "/xgestao/obras",
    });

    assert.deepEqual(requestBody, { persona: "xgestao", next: "/xgestao/obras" });
    assert.deepEqual(result, {
      persona: "xgestao",
      redirect: "/login?perfil=xgestao&next=%2Fxgestao%2Fobras",
    });
    assert.equal(useAuthStore.getState().user, null);
  });

  it("usa o fallback xgestão quando a API falha", async () => {
    global.fetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
    useAuthStore.setState({ user: xgestaoUser });

    await assert.doesNotReject(async () => {
      const result = await useAuthStore.getState().logout({
        persona: "xgestao",
        next: "/xgestao/configuracoes?tab=plano",
      });
      assert.equal(
        result.redirect,
        "/login?perfil=xgestao&next=%2Fxgestao%2Fconfiguracoes%3Ftab%3Dplano",
      );
    });
  });

  it("usa o mesmo fallback xgestão quando a requisição fica indisponível", async () => {
    global.fetch = (async () => {
      throw new Error("network unavailable");
    }) as typeof fetch;
    useAuthStore.setState({ user: xgestaoUser });

    const result = await useAuthStore.getState().logout({ persona: "xgestao" });

    assert.equal(result.persona, "xgestao");
    assert.equal(result.redirect, "/login?perfil=xgestao");
  });

  it("preserva o fallback das personas existentes", async () => {
    global.fetch = (async () => new Response(null, { status: 503 })) as typeof fetch;
    useAuthStore.setState({
      user: {
        id: "user-contratante",
        email: "contratante@example.com",
        name: "Contratante",
        role: "contratante",
      },
    });

    const result = await useAuthStore.getState().logout();

    assert.deepEqual(result, {
      persona: "contratante",
      redirect: "/login?perfil=contratante",
    });
  });
});