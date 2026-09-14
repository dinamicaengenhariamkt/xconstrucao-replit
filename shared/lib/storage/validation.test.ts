import assert from "node:assert/strict";
import test from "node:test";
import { KIND_RULES, QUOTA_OBRA_BYTES, maxBytesParaMime, validateUpload } from "./validation";
import { KIND_ROLES, buildKey, roleAllowedForKind, validateKeyForOwner } from "./key-builder";

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

test("formato fora da lista segue recusado, com mensagem em português de gente", () => {
  const r = validateUpload({ ...empreiteiro, mime: "application/x-msdownload", size: 1_000 });
  assert.equal(r.ok, false);
  // XG19 — a mensagem diz o que É aceito, em nome de família ("planilha"),
  // não a lista crua de 20 mime types.
  assert.match(r.message ?? "", /não é aceito aqui/);
  assert.match(r.message ?? "", /planilha/);
  assert.doesNotMatch(r.message ?? "", /application\//);
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

/**
 * XG19 — o upload tem DOIS portões de permissão: `validateUpload` no presign e
 * `validateKeyForOwner` no commit. Os testes acima cobriam só o primeiro.
 *
 * Foi por isso que a regressão passou verde: a XG10 liberou `obra_anexo` para
 * o empreiteiro, o teste do presign confirmou, e o commit — que tinha a lista
 * duplicada à mão — seguiu recusando. O arquivo subia inteiro para o R2 e era
 * apagado na rejeição.
 *
 * Os testes abaixo exercitam os dois lados juntos. Um portão sozinho passando
 * não significa upload funcionando.
 */

const UID = "11111111-2222-4333-8444-555555555555";

function chaveCanonica(kind: "obra_anexo" | "obra_capa" | "obra_foto") {
  return buildKey({ kind, role: "empreiteiro", userId: UID, originalName: "planilha.xlsx" });
}

test("empreiteiro anexa documento na própria obra — presign E commit", () => {
  const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  // Portão 1: presign.
  assert.equal(validateUpload({ ...empreiteiro, mime, size: 1_000_000 }).ok, true);

  // Portão 2: commit. Era aqui que quebrava.
  const key = chaveCanonica("obra_anexo");
  const r = validateKeyForOwner({ key, kind: "obra_anexo", role: "empreiteiro", userId: UID });
  assert.equal(r.ok, true, `commit recusou a chave do presign: ${r.reason}`);
});

test("as duas pontas concordam sobre quem pode subir cada kind", () => {
  // Trava estrutural: qualquer divergência futura entre `KIND_ROLES` e a
  // checagem do presign quebra aqui, não em produção.
  for (const kind of Object.keys(KIND_ROLES) as (keyof typeof KIND_ROLES)[]) {
    for (const role of ["admin", "contratante", "empreiteiro", "superadmin", "anunciante"]) {
      const presign = validateUpload({
        kind,
        role,
        mime: KIND_RULES[kind].mimes[0],
        size: 1_000,
      });
      const permitido = roleAllowedForKind(kind, role);
      // Se o presign recusou por OUTRO motivo (mime/tamanho), ignora: aqui só
      // interessa o veredito de permissão.
      if (!presign.ok && !/permissão/.test(presign.message ?? "")) continue;
      assert.equal(
        presign.ok,
        permitido,
        `${kind}/${role}: presign diz ${presign.ok}, KIND_ROLES diz ${permitido}`,
      );
    }
  }
});

test("role sem permissão é recusado no commit com motivo legível", () => {
  const key = chaveCanonica("obra_anexo");
  const r = validateKeyForOwner({ key, kind: "obra_anexo", role: "anunciante", userId: UID });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "role");
});

test("chave de outro usuário é recusada mesmo com role válido", () => {
  // O anti-tampering que motivou toda essa validação continua de pé.
  const key = chaveCanonica("obra_anexo");
  const outro = "99999999-8888-4777-8666-555555555555";
  const r = validateKeyForOwner({ key, kind: "obra_anexo", role: "empreiteiro", userId: outro });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "userId mismatch");
});
