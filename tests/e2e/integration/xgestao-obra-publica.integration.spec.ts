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
    // XG30 — `valorTotal` saiu desta lista: o bloco `pagamentos` expõe o
    // contrato ao link em que o dono ligou a seção. O lado do custo segue
    // proibido logo abaixo.
    expect(apenasCodigo(types)).not.toMatch(/valorPago|orcamento|telefone|email|numero|complemento|cep|autorNome|autorId|registroProfissional|assinadoPor/);
    expect(projection).toContain("import 'server-only';");
    expect(apenasCodigo(projection)).not.toMatch(/\busers\b|valorPago|numero|complemento|cep|autorId|autorNome|resolvidoPorId/);

    // XG30 — pagamentos mostram só o recebimento. Custos, fornecedor,
    // beneficiário, método e comprovante nunca saem do banco.
    const pagamentosProibidos = /custo|fornecedor|metodoPagamento|comprovante|lucro|categoria|pagamentosSplit/i;
    expect(apenasCodigo(types)).not.toMatch(pagamentosProibidos);
    expect(apenasCodigo(projection)).not.toMatch(pagamentosProibidos);
    expect(projection).toContain('secoes.pagamentos ? buildPagamentos(obraId) : null');
    expect(projection).toContain("ladoDoLancamento(l, empreiteiroUserId) === 'receita'");
    expect(projection).toContain("ne(financeiro.status, 'cancelado')");

    // XG22 — a chave PIX, o valor de contrato e o contrato assinado do prestador
    // são dados financeiros de terceiro. A equipe inteira já fica fora do link
    // público por LGPD; estes campos reforçam a guarda, porque agora existe algo
    // em `obra_equipe` que é sigiloso mesmo para quem acompanha a obra.
    expect(apenasCodigo(types)).not.toMatch(/pixChave|valorContrato|contratoFileId|contratoLinkUrl/);
    expect(apenasCodigo(projection)).not.toMatch(
      /pixChave|pix_chave|valorContrato|valor_contrato|contratoFileId|contratoLinkUrl|obraEquipe/,
    );

    // O logradouro é o único componente de endereço que pode sair, e só quando
    // o dono liga a seção. Número, complemento, CEP e coordenadas seguem
    // ausentes do contrato — as linhas acima garantem isso.
    expect(types).toContain('logradouro: string | null;');
    expect(projection).toContain('logradouro: secoes.localizacao ? obra.endereco : null');
    expect(projection).not.toMatch(/obras\.lat|obras\.lng/);

    // Seção desligada não é filtrada na renderização: a query nem roda.
    for (const guarda of [
      '!secoes.etapas && !secoes.cronograma ? []',
      '!secoes.diario ? []',
      '!secoes.ocorrencias ? []',
      '!secoes.fotos ? []',
      '!secoes.tarefas ? []',
    ]) {
      expect(projection).toContain(guarda);
    }
    // As datas das etapas só saem com o cronograma ligado.
    expect(projection).toContain('dataInicio: secoes.cronograma ? toIso(etapa.dataInicio) : null');

    // XG30 — checklist é controle interno e as atualizações perderam a fonte:
    // nenhum dos dois é lido pela projeção.
    expect(apenasCodigo(projection)).not.toMatch(/obraChecklists|obraChecklistItens|\bmedicoes\b/);

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
    // XG30 — valores só vão para quem o dono escolher, link a link.
    expect(SECOES_PADRAO.pagamentos).toBe(false);
    expect(SECOES_PADRAO.cronograma).toBe(true);
    expect(Object.keys(SECOES_PADRAO)).not.toContain('checklists');
    expect(Object.keys(SECOES_PADRAO)).not.toContain('atualizacoes');
    // Link salvo antes da XG30 com as chaves antigas ligadas: elas somem.
    expect(normalizarSecoes({ checklists: true, atualizacoes: true })).toEqual(SECOES_PADRAO);

    // Dado corrompido ou ausente cai no padrão, nunca em "tudo ligado" — links
    // emitidos antes da coluna existir seguem esta mesma regra.
    expect(normalizarSecoes(null)).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes('lixo')).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes({ diario: 'sim' })).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes({ inexistente: true })).toEqual(SECOES_PADRAO);
    expect(normalizarSecoes({ diario: true }).diario).toBe(true);
  });

  test('pagamentos só contam o lado do recebimento', async () => {
    const { ladoDoLancamento } = await import(
      '../../../features/empreiteiro/minhas-obras/lib/lado-lancamento'
    );
    const dono = 'user-dono';
    const base = { recebedorUserId: null, pagadorUserId: null };

    expect(ladoDoLancamento({ ...base, tipo: 'entrada', recebedorUserId: dono }, dono)).toBe('receita');
    // Despesa do xgestão: o empreiteiro paga. Nunca pode virar parcela no link.
    expect(ladoDoLancamento({ ...base, tipo: 'saida', pagadorUserId: dono }, dono)).toBe('custo');
    // Legado do marketplace sem as duas pontas: saída do contratante = entrada nossa.
    expect(ladoDoLancamento({ ...base, tipo: 'saida' }, dono)).toBe('receita');
    expect(ladoDoLancamento({ ...base, tipo: 'entrada' }, dono)).toBeNull();
    // Sem dono conhecido, nada é classificado — e nada vai para o link.
    expect(ladoDoLancamento({ ...base, tipo: 'saida' }, null)).toBeNull();
  });

  test('wrappers públicos injetam dados e nunca habilitam escrita ou fetch autenticado', async () => {
    const cronograma = await source('features/xgestao/obra-publica/components/TabCronogramaPublica.tsx');
    expect(cronograma).toContain('data={etapas}');
    expect(cronograma).toContain('readOnly');
    expect(await source('features/empreiteiro/minhas-obras/components/CronogramaGanttCard.tsx'))
      .toContain('useObraEtapas(obraId, !injected)');

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