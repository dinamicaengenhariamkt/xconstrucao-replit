import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  membroPodeAcessarArea,
  membroPodeAcessarCategoriaFinanceira,
} from "./permissions";

test("null member area permissions preserve unrestricted legacy access", () => {
  assert.equal(membroPodeAcessarArea(null, "diario"), true);
  assert.equal(membroPodeAcessarArea(null, "equipe"), true);
});

test("restricted member area list only grants listed areas", () => {
  assert.equal(membroPodeAcessarArea(["cronograma", "diario"], "diario"), true);
  assert.equal(membroPodeAcessarArea(["cronograma", "diario"], "financeiro"), false);
  assert.equal(membroPodeAcessarArea([], "equipe"), false);
});

test("null finance categories preserve access to every category, including uncategorized rows", () => {
  assert.equal(membroPodeAcessarCategoriaFinanceira(null, "mao_de_obra"), true);
  assert.equal(membroPodeAcessarCategoriaFinanceira(null, "material"), true);
  assert.equal(membroPodeAcessarCategoriaFinanceira(null, null), true);
});

test("restricted finance categories expose only the allowed category", () => {
  assert.equal(membroPodeAcessarCategoriaFinanceira(["mao_de_obra"], "mao_de_obra"), true);
  assert.equal(membroPodeAcessarCategoriaFinanceira(["mao_de_obra"], "material"), false);
  assert.equal(membroPodeAcessarCategoriaFinanceira(["mao_de_obra"], null), false);
  assert.equal(membroPodeAcessarCategoriaFinanceira([], "mao_de_obra"), false);
});