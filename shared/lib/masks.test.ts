import assert from "node:assert/strict";
import test from "node:test";
import { formatDateBr, isDateBrValid, unformatDateBr } from "./masks";

test("formatDateBr aplica barras e remove caracteres extras", () => {
  assert.equal(formatDateBr("10062025"), "10/06/2025");
  assert.equal(formatDateBr("10/06/2025abc"), "10/06/2025");
  assert.equal(formatDateBr("2025-06-10"), "10/06/2025");
  assert.equal(formatDateBr("1a0/6"), "10/6");
  assert.equal(unformatDateBr("10/06/2025"), "10062025");
});

test("formatDateBr limita a entrada a oito dígitos", () => {
  assert.equal(formatDateBr("10/06/20251234"), "10/06/2025");
  assert.equal(unformatDateBr("10/06/20251234"), "10062025");
});

test("isDateBrValid rejeita datas incompletas e impossíveis", () => {
  assert.equal(isDateBrValid("10/06/2025"), true);
  assert.equal(isDateBrValid("29/02/2024"), true);
  assert.equal(isDateBrValid("29/02/2025"), false);
  assert.equal(isDateBrValid("31/04/2025"), false);
  assert.equal(isDateBrValid("10/6/2025"), false);
  assert.equal(isDateBrValid(""), false);
});