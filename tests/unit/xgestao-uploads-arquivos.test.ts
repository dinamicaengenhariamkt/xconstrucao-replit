import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildKey,
  kindPrivatizavel,
  roleAllowedForKind,
  validateKeyForOwner,
  visibilityForKind,
  visibilityFromKey,
} from "@shared/lib/storage/key-builder";
import { MENSAGEM_HEIC, validateUpload } from "@shared/lib/storage/validation";

const USER = "11111111-2222-3333-4444-555555555555";

describe("EMP-02 — arquivos de obra do xgestão nascem privados", () => {
  for (const kind of ["obra_anexo", "obra_capa", "obra_foto"] as const) {
    it(`${kind}: chave privada quando a obra é do xgestão e pública no marketplace`, () => {
      const privada = buildKey({ kind, role: "empreiteiro", userId: USER, originalName: "a.png", visibility: "private" });
      const publica = buildKey({ kind, role: "empreiteiro", userId: USER, originalName: "a.png" });
      assert.equal(visibilityFromKey(privada), "private");
      assert.equal(visibilityFromKey(publica), "public", "marketplace segue público");
      assert.ok(validateKeyForOwner({ key: privada, kind, role: "empreiteiro", userId: USER }).ok);
      assert.ok(validateKeyForOwner({ key: publica, kind, role: "empreiteiro", userId: USER }).ok);
      assert.equal(visibilityForKind(kind), "public", "padrão do kind não muda");
    });
  }

  it("override de visibilidade não vale para kinds fora da obra", () => {
    assert.equal(kindPrivatizavel("avatar"), false);
    const key = buildKey({ kind: "avatar", role: "empreiteiro", userId: USER, originalName: "a.png", visibility: "private" });
    assert.equal(visibilityFromKey(key), "public");
  });

  it("chave privada de outro usuário continua recusada", () => {
    const key = buildKey({ kind: "obra_foto", role: "empreiteiro", userId: USER, originalName: "a.png", visibility: "private" });
    const outro = "99999999-2222-3333-4444-555555555555";
    assert.equal(validateKeyForOwner({ key, kind: "obra_foto", role: "empreiteiro", userId: outro }).ok, false);
  });
});

describe("EMP-01 — comprovante do empreiteiro", () => {
  it("empreiteiro pode enviar comprovante, em prefixo próprio", () => {
    assert.ok(roleAllowedForKind("comprovante_pagamento", "empreiteiro"));
    const key = buildKey({ kind: "comprovante_pagamento", role: "empreiteiro", userId: USER, originalName: "nota.pdf" });
    assert.match(key, /(^|\/)private\/empreiteiro\/[^/]+\/comprovantes\//);
    assert.ok(validateKeyForOwner({ key, kind: "comprovante_pagamento", role: "empreiteiro", userId: USER }).ok);
    assert.equal(
      validateUpload({ kind: "comprovante_pagamento", mime: "application/pdf", size: 1000, role: "empreiteiro" }).ok,
      true,
    );
  });

  it("contratante segue em private/contratante e não usa a pasta do empreiteiro", () => {
    const key = buildKey({ kind: "comprovante_pagamento", role: "contratante", userId: USER, originalName: "nota.pdf" });
    assert.match(key, /(^|\/)private\/contratante\//);
    assert.ok(validateKeyForOwner({ key, kind: "comprovante_pagamento", role: "contratante", userId: USER }).ok);
    const doEmpreiteiro = buildKey({ kind: "comprovante_pagamento", role: "empreiteiro", userId: USER, originalName: "n.pdf" });
    assert.equal(
      validateKeyForOwner({ key: doEmpreiteiro, kind: "comprovante_pagamento", role: "contratante", userId: USER }).ok,
      false,
    );
  });
});

describe("EMP-11 — HEIC e CAD", () => {
  const base = { kind: "obra_anexo" as const, role: "empreiteiro", size: 1000 };

  it("HEIC recebe mensagem específica (mime ou extensão)", () => {
    assert.equal(validateUpload({ ...base, kind: "obra_foto", mime: "image/heic", filename: "IMG_1.HEIC" }).message, MENSAGEM_HEIC);
    assert.equal(
      validateUpload({ ...base, kind: "obra_foto", mime: "application/octet-stream", filename: "IMG_2.heic" }).message,
      MENSAGEM_HEIC,
    );
  });

  it("xgestão: octet-stream só passa com extensão de CAD", () => {
    const xg = { ...base, restringirCad: true };
    for (const ext of ["dwg", "dxf", "rvt", "ifc", "skp"]) {
      const r = validateUpload({ ...xg, mime: "application/octet-stream", filename: `planta.${ext}` });
      assert.equal(r.ok, true, `${ext}: ${r.message ?? ""}`);
    }
    for (const nome of ["virus.exe", "script.sh", "semextensao", "pagina.html"]) {
      assert.equal(validateUpload({ ...xg, mime: "application/octet-stream", filename: nome }).ok, false, nome);
    }
    assert.equal(validateUpload({ ...xg, mime: "application/octet-stream" }).ok, false, "sem nome não passa");
  });

  it("marketplace mantém o comportamento anterior para octet-stream", () => {
    assert.equal(validateUpload({ ...base, mime: "application/octet-stream", filename: "arquivo.exe" }).ok, true);
  });

  it("formatos legítimos seguem aceitos", () => {
    assert.equal(validateUpload({ ...base, mime: "image/vnd.dwg", filename: "a.dwg" }).ok, true);
    assert.equal(validateUpload({ ...base, mime: "application/pdf", filename: "a.pdf" }).ok, true);
  });
});
