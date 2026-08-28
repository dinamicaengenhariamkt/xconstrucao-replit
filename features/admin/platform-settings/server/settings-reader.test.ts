import assert from "node:assert/strict";
import test from "node:test";
import { resolveMarketplaceVisivel } from "./settings-reader";

test("resolveMarketplaceVisivel usa o valor persistido sem override válido", () => {
  assert.equal(
    resolveMarketplaceVisivel({ marketplaceVisivel: false }, { nodeEnv: "production" }),
    false,
  );
  assert.equal(
    resolveMarketplaceVisivel(
      { marketplaceVisivel: false },
      { nodeEnv: "production", override: "valor-invalido" },
    ),
    false,
  );
  assert.equal(
    resolveMarketplaceVisivel({ marketplaceVisivel: true }, { nodeEnv: "production" }),
    true,
  );
  assert.equal(resolveMarketplaceVisivel({}, { nodeEnv: "production" }), true);
});

test("resolveMarketplaceVisivel aplica o override somente em produção", () => {
  assert.equal(
    resolveMarketplaceVisivel(
      { marketplaceVisivel: true },
      { nodeEnv: "production", override: " false " },
    ),
    false,
  );
  assert.equal(
    resolveMarketplaceVisivel(
      { marketplaceVisivel: false },
      { nodeEnv: "production", override: "TRUE" },
    ),
    true,
  );
  assert.equal(
    resolveMarketplaceVisivel(
      { marketplaceVisivel: true },
      { nodeEnv: "development", override: "false" },
    ),
    true,
  );
  assert.equal(
    resolveMarketplaceVisivel(
      { marketplaceVisivel: false },
      { nodeEnv: "test", override: "true" },
    ),
    false,
  );
});