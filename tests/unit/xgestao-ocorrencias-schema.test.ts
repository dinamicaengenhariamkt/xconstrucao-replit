import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ocorrenciaResolverSchema,
  ocorrenciaUpdateSchema,
  podeGerenciarOcorrencia,
} from "../../features/obras/api/ocorrencia-schemas";

test("update aceita edição parcial e normaliza espaços", () => {
  const r = ocorrenciaUpdateSchema.parse({ titulo: "  Vazamento na laje  " });
  assert.equal(r.titulo, "Vazamento na laje");
  assert.equal(r.descricao, undefined);
});

test("update recusa corpo vazio, campo desconhecido e valores inválidos", () => {
  assert.equal(ocorrenciaUpdateSchema.safeParse({}).success, false);
  assert.equal(ocorrenciaUpdateSchema.safeParse({ status: "aberta" }).success, false);
  assert.equal(ocorrenciaUpdateSchema.safeParse({ obraId: "x", titulo: "abc" }).success, false);
  assert.equal(ocorrenciaUpdateSchema.safeParse({ titulo: "ab" }).success, false);
  assert.equal(ocorrenciaUpdateSchema.safeParse({ gravidade: "alta" }).success, false);
  assert.equal(ocorrenciaUpdateSchema.safeParse({ fotoFileId: "nao-uuid" }).success, false);
  assert.equal(ocorrenciaUpdateSchema.safeParse({ descricao: "x".repeat(2001) }).success, false);
});

test("update permite remover a foto com null", () => {
  assert.equal(ocorrenciaUpdateSchema.parse({ fotoFileId: null }).fotoFileId, null);
});

test("observação: vazia vira null, ausente fica undefined, limite de 1000", () => {
  assert.equal(ocorrenciaResolverSchema.parse({ observacaoResolucao: "   " }).observacaoResolucao, null);
  assert.equal(ocorrenciaResolverSchema.parse({}).observacaoResolucao, undefined);
  assert.equal(ocorrenciaResolverSchema.parse({ observacaoResolucao: " Trocada a manta " }).observacaoResolucao, "Trocada a manta");
  assert.equal(ocorrenciaResolverSchema.safeParse({ observacaoResolucao: "x".repeat(1001) }).success, false);
});

test("gerenciar: autor, dono e gestor; colaborador só o próprio", () => {
  assert.equal(podeGerenciarOcorrencia("u1", "u1", "colaborador"), true);
  assert.equal(podeGerenciarOcorrencia("u1", "u2", "colaborador"), false);
  assert.equal(podeGerenciarOcorrencia("u1", "u2", "dono"), true);
  assert.equal(podeGerenciarOcorrencia("u1", "u2", "gestor"), true);
  assert.equal(podeGerenciarOcorrencia("u1", "u2", null), false);
});
