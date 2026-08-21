import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const root = process.cwd();
const execFile = promisify(execFileCallback);

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test.describe('xgestão — conteúdo público de obra em leitura', () => {
  test('mantém um contrato público restrito e uma projeção somente server-side', async () => {
    const [types, projection] = await Promise.all([
      source('features/xgestao/obra-publica/types.ts'),
      source('features/xgestao/obra-publica/server/projection.ts'),
    ]);

    expect(types).toContain('export interface ObraPublicaView');
    expect(types).not.toMatch(/valorPago|valorTotal|orcamento|telefone|email|autorNome|autorId|registroProfissional|assinadoPor/);
    expect(projection).toContain("import 'server-only';");
    expect(projection).not.toMatch(/\busers\b|bucketKey|valorPago|valorTotal|autorId|autorNome|resolvidoPorId/);

    // A projeção entrega somente arquivos publicáveis, e as fotos principais
    // exigem também a marcação explícita para o cliente.
    expect(projection).toContain("eq(userFiles.visibility, 'public')");
    expect(projection).toContain('isNull(userFiles.deletedAt)');
    expect(projection).toContain("eq(obraFotos.enviadaAoContratante, true)");
    expect(projection).toContain('userFiles.publicUrl');
  });

  test('wrappers públicos injetam dados e nunca habilitam escrita ou fetch autenticado', async () => {
    const wrappers = await Promise.all([
      source('features/xgestao/obra-publica/components/TabEtapasPublica.tsx'),
      source('features/xgestao/obra-publica/components/TabDiarioPublica.tsx'),
      source('features/xgestao/obra-publica/components/TabOcorrenciasPublica.tsx'),
      source('features/xgestao/obra-publica/components/TabFotosPublica.tsx'),
    ]);
    const cards = await Promise.all([
      source('features/obras/medicoes/components/EtapasJ06Card.tsx'),
      source('features/obras/medicoes/components/DiarioJ06Card.tsx'),
      source('features/obras/medicoes/components/OcorrenciasJ06Card.tsx'),
      source('features/obras/medicoes/components/FotosJ06Card.tsx'),
    ]);

    for (const wrapper of wrappers) {
      expect(wrapper).toContain('canWrite={false}');
      expect(wrapper).toContain('data={');
      expect(wrapper).not.toContain('canWrite={true}');
    }

    expect(cards[0]).toContain('useObraEtapas(obraId, !injected)');
    expect(cards[1]).toContain('useObraDiario(obraId, !injected)');
    expect(cards[2]).toContain('useObraOcorrencias(obraId, !injected)');
    expect(cards[3]).toContain('useObraFotos(obraId, !injected)');
    for (const card of cards) {
      expect(card).toMatch(/if \(!canWrite\) return;/);
    }
  });

  test('renderiza os quatro cards com dados públicos sem fazer fetch nem mostrar ações de escrita', async () => {
    await expect(execFile('npx', ['tsx', 'tests/e2e/integration/xgestao-obra-publica.render.ts'], {
      cwd: root,
    })).resolves.toBeDefined();
  });
});