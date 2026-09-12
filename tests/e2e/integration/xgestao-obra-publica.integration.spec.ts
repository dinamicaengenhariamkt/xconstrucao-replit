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

/**
 * Remove comentários antes das asserções de vazamento.
 *
 * A guarda procura nomes de campo no arquivo inteiro, então um comentário que
 * *explica* por que um campo é retido reprovava o teste — o que empurra na
 * direção errada: apagar a explicação em vez de manter a proteção.
 */
function apenasCodigo(conteudo: string): string {
  return conteudo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test.describe('xgestão — conteúdo público de obra em leitura', () => {
  test('mantém um contrato público restrito e uma projeção somente server-side', async () => {
    const [types, projection] = await Promise.all([
      source('features/xgestao/obra-publica/types.ts'),
      source('features/xgestao/obra-publica/server/projection.ts'),
    ]);

    expect(types).toContain('export interface ObraPublicaView');
    expect(apenasCodigo(types)).not.toMatch(/valorPago|valorTotal|orcamento|telefone|email|numero|complemento|cep|autorNome|autorId|registroProfissional|assinadoPor/);
    expect(projection).toContain("import 'server-only';");
    expect(apenasCodigo(projection)).not.toMatch(/\busers\b|valorPago|valorTotal|numero|complemento|cep|autorId|autorNome|resolvidoPorId/);

    // O logradouro é o único componente de endereço que pode sair, e só quando
    // o dono liga a seção. Número, complemento, CEP e coordenadas seguem
    // ausentes do contrato — as linhas acima garantem isso.
    expect(types).toContain('logradouro: string | null;');
    expect(projection).toContain('logradouro: secoes.localizacao ? obra.endereco : null');
    expect(projection).not.toMatch(/obras\.lat|obras\.lng/);

    // Seção desligada não é filtrada na renderização: a query nem roda.
    for (const guarda of [
      '!secoes.etapas ? []',
      '!secoes.diario ? []',
      '!secoes.ocorrencias ? []',
      '!secoes.fotos ? []',
      '!secoes.checklists ? []',
      '!secoes.atualizacoes ? []',
      '!secoes.tarefas ? []',
    ]) {
      expect(projection).toContain(guarda);
    }

    // Tarefas entram sem o responsável, que é nome de pessoa da equipe.
    expect(projection).not.toContain('obraTarefas.responsavel');

    // Mídias nunca ficam permanentemente públicas: somente arquivos ainda
    // existentes, ligados à galeria da obra e aprovados para o cliente recebem
    // capability temporária após a validação do token.
    expect(projection).toContain('isNull(userFiles.deletedAt)');
    expect(projection).toContain("eq(obraFotos.enviadaAoContratante, true)");
    expect(projection).toContain("eq(userFiles.kind, 'obra_capa')");
    expect(projection).toContain('eq(obraFotos.fileId, userFiles.id)');
    expect(projection).toContain('createSignedReadUrl');
    expect(projection).toContain('PUBLIC_LINK_MEDIA_TTL_SECONDS');
  });

  test('conteúdo operacional interno só é publicado por escolha explícita', async () => {
    const { SECOES_PADRAO, normalizarSecoes } = await import(
      '../../../features/xgestao/obra-publica/secoes'
    );

    // Diário e ocorrências carregam anotação de rotina e problema em aberto;
    // tarefas e endereço nunca estiveram no link. Ligar qualquer um deles é
    // decisão do empreiteiro, não padrão herdado.
    expect(SECOES_PADRAO.diario).toBe(false);
    expect(SECOES_PADRAO.ocorrencias).toBe(false);
    expect(SECOES_PADRAO.tarefas).toBe(false);
    expect(SECOES_PADRAO.localizacao).toBe(false);

    // Dado corrompido ou ausente cai no padrão, nunca em "tudo ligado" — links
    // emitidos antes da coluna existir seguem esta mesma regra.
    expect(normalizarSecoes(null)).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes('lixo')).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes({ diario: 'sim' })).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes({ inexistente: true })).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes({ diario: true }).diario).toBe(true);
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