import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const modalSource = readFileSync(
  resolve(process.cwd(), "features/empreiteiro/minhas-obras/components/CompartilharModal.tsx"),
  "utf8",
);

describe("compartilhamento de link no xgestão", () => {
  it("não oferece WhatsApp nem cria URL de compartilhamento para esse canal", () => {
    assert.doesNotMatch(modalSource, /whatsapp|WhatsApp|wa\.me/i);
    assert.match(modalSource, /E-mail/);
    assert.match(modalSource, /Copiar link/);
  });
});