import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminDashboardError } from "@features/xgestao/admin/components/AdminDashboardError";

describe("estado de erro do painel admin xgestão", () => {
  it("distingue indisponibilidade de uma base vazia e oferece nova tentativa", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardError isRetrying={false} onRetry={() => {}} />,
    );

    assert.match(html, /Não foi possível carregar o painel xgestão/);
    assert.match(html, /não foram substituídos por zeros/i);
    assert.match(html, /Tentar novamente/);
    assert.doesNotMatch(html, /Ainda não há assinantes/);
  });

  it("desabilita a ação durante a nova tentativa", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardError isRetrying onRetry={() => {}} />,
    );

    assert.match(html, /disabled=""/);
    assert.match(html, /Tentando novamente/);
  });
});