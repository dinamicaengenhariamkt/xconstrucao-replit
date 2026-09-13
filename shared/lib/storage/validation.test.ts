import assert from "node:assert/strict";
import test from "node:test";
import { QUOTA_OBRA_BYTES, maxBytesParaMime, validateUpload } from "./validation";

/**
 * XG10 — limites de upload por tipo de arquivo.
 *
 * A reunião de 2026-09-12 fechou os números: ~200 MB por obra, com teto por
 * extensão porque "se o cara subir um vídeo de 100 MB, já foi metade do que
 * ele tem contratado" (23:55).
 */

const empreiteiro = { kind: "obra_anexo" as const, role: "empreiteiro" };

test("formatos de projeto de obra passam a ser aceitos", () => {
  // Antes de XG10 só imagem e PDF entravam; DWG e vídeo eram recusados.
  for (const mime of [
    "image/jpeg",
    "application/pdf",
    "image/vnd.dwg",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4",
  ]) {
    const r = validateUpload({ ...empreiteiro, mime, size: 1_000_000 });
    assert.equal(r.ok, true, `${mime} deveria ser aceito: ${r.message ?? ""}`);
  }
});

test("cada família tem seu próprio teto", () => {
  assert.equal(maxBytesParaMime("image/jpeg"), 10_000_000);
  assert.equal(maxBytesParaMime("application/pdf"), 20_000_000);
  assert.equal(maxBytesParaMime("image/vnd.dwg"), 20_000_000);
  assert.equal(maxBytesParaMime("video/mp4"), 50_000_000);
  assert.equal(maxBytesParaMime("application/zip"), null);
});

test("imagem grande é recusada mesmo com o kind aceitando 50 MB", () => {
  // O ponto do teto por tipo: liberar vídeo não pode liberar imagem junto.
  const r = validateUpload({ ...empreiteiro, mime: "image/png", size: 12_000_000 });
  assert.equal(r.ok, false);
  assert.match(r.message ?? "", /10 MB/);

  const ok = validateUpload({ ...empreiteiro, mime: "image/png", size: 9_000_000 });
  assert.equal(ok.ok, true);
});

test("vídeo respeita 50 MB", () => {
  assert.equal(validateUpload({ ...empreiteiro, mime: "video/mp4", size: 49_000_000 }).ok, true);
  assert.equal(validateUpload({ ...empreiteiro, mime: "video/mp4", size: 51_000_000 }).ok, false);
});

test("PDF respeita 20 MB", () => {
  assert.equal(validateUpload({ ...empreiteiro, mime: "application/pdf", size: 19_000_000 }).ok, true);
  assert.equal(validateUpload({ ...empreiteiro, mime: "application/pdf", size: 21_000_000 }).ok, false);
});

test("o dono da obra no xgestão pode anexar", () => {
  // Regressão: `obra_anexo` só aceitava contratante, e o empreiteiro é o dono
  // da obra no xgestão.
  const r = validateUpload({ ...empreiteiro, mime: "application/pdf", size: 1_000 });
  assert.equal(r.ok, true);
});

test("formato fora da lista segue recusado", () => {
  const r = validateUpload({ ...empreiteiro, mime: "application/x-msdownload", size: 1_000 });
  assert.equal(r.ok, false);
  assert.match(r.message ?? "", /Formato não aceito/);
});

test("arquivo vazio é recusado", () => {
  assert.equal(validateUpload({ ...empreiteiro, mime: "application/pdf", size: 0 }).ok, false);
});

test("outros kinds não herdaram os novos formatos", () => {
  // `obra_foto` continua só com imagem: vídeo na galeria não foi pedido.
  const r = validateUpload({ kind: "obra_foto", role: "empreiteiro", mime: "video/mp4", size: 1_000 });
  assert.equal(r.ok, false);
});

test("quota da obra é o valor combinado na reunião", () => {
  assert.equal(QUOTA_OBRA_BYTES, 200_000_000);
});
