import 'server-only';

import { and, asc, desc, eq, exists, isNull, like, ne, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  empreiteiras,
  financeiro,
  obraAditivos,
  obraDiario,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obraTarefas,
  obras,
  userFiles,
} from '@shared/db/schema';
import type { ObraPublicaPagamentos, ObraPublicaView } from '../types';
import { SECOES_PADRAO, type SecoesPublicas } from '../secoes';
import { createSignedReadUrl } from '@shared/lib/storage/r2';
import { ladoDoLancamento } from '@features/empreiteiro/minhas-obras/lib/lado-lancamento';

const PUBLIC_LINK_MEDIA_TTL_SECONDS = 12 * 60 * 60;

async function signedPublicMediaUrl(bucketKey: string): Promise<string> {
  return createSignedReadUrl({ key: bucketKey, expiresIn: PUBLIC_LINK_MEDIA_TTL_SECONDS });
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mostRecent(...dates: Array<Date | string | null | undefined>): string | null {
  const normalized = dates.map(toIso).filter((date): date is string => Boolean(date));
  return normalized.sort((a, b) => b.localeCompare(a))[0] ?? null;
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;

/** Hoje em America/Sao_Paulo, no formato das colunas de data do financeiro. */
function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

/**
 * XG30 — o lado do recebimento, e nada além dele.
 *
 * Os números seguem a aba Financeiro (XG22): contrato + aditivos, e o recebido
 * somado dos lançamentos pagos em que o empreiteiro é recebedor — nunca de
 * `obras.valor_pago`, que o xgestão não preenche. A classificação é a mesma
 * função da aba (`ladoDoLancamento`); um lançamento que ela não reconhece como
 * receita não entra, nem como parcela, nem na soma.
 *
 * O select lista coluna por coluna de propósito: fornecedor, beneficiário,
 * método e comprovante não saem do banco, então não há como vazarem.
 */
async function buildPagamentos(obraId: string): Promise<ObraPublicaPagamentos> {
  const [base] = await db
    .select({ valorTotal: obras.valorTotal, empreiteiroUserId: empreiteiras.userId })
    .from(obras)
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.id, obraId));

  const [[aditivosAgg], lancamentos] = await Promise.all([
    db
      .select({ total: sql<string>`COALESCE(SUM(${obraAditivos.valor}), 0)` })
      .from(obraAditivos)
      .where(eq(obraAditivos.obraId, obraId)),
    db
      .select({
        id: financeiro.id,
        tipo: financeiro.tipo,
        descricao: financeiro.descricao,
        valor: financeiro.valor,
        data: financeiro.data,
        status: financeiro.status,
        dataVencimento: financeiro.dataVencimento,
        dataPagamento: financeiro.dataPagamento,
        recebedorUserId: financeiro.recebedorUserId,
        pagadorUserId: financeiro.pagadorUserId,
      })
      .from(financeiro)
      .where(and(
        eq(financeiro.obraId, obraId),
        eq(financeiro.escopo, 'obra'),
        ne(financeiro.status, 'cancelado'),
      ))
      .orderBy(asc(financeiro.data)),
  ]);

  const hoje = hojeSaoPaulo();
  const empreiteiroUserId = base?.empreiteiroUserId ?? null;
  const parcelas = lancamentos
    .filter((l) => ladoDoLancamento(l, empreiteiroUserId) === 'receita')
    .map((l) => {
      const vencimento = l.dataVencimento ?? (l.status === 'pago' ? null : l.data);
      // Pendente com vencimento passado é atraso de fato, mesmo que ninguém
      // tenha trocado o status — a mesma leitura derivada da XG25.
      const vencida = l.status !== 'pago'
        && vencimento !== null
        && DATA_ISO.test(vencimento)
        && vencimento.slice(0, 10) < hoje;
      return {
        id: l.id,
        descricao: l.descricao,
        valor: Number(l.valor ?? 0),
        vencimento,
        pagoEm: l.status === 'pago' ? (l.dataPagamento ?? l.data) : null,
        status: l.status === 'pago'
          ? 'pago' as const
          : l.status === 'atrasado' || vencida ? 'atrasado' as const : 'pendente' as const,
      };
    });

  const valorTotal = Number(base?.valorTotal ?? 0) + Number(aditivosAgg?.total ?? 0);
  const recebido = parcelas
    .filter((p) => p.status === 'pago')
    .reduce((soma, p) => soma + p.valor, 0);

  return {
    valorTotal,
    recebido,
    saldo: Math.max(0, valorTotal - recebido),
    parcelas,
  };
}

/**
 * Constrói, campo a campo, o conteúdo que poderá ser enviado a quem possuir
 * um link público. A validação do link/token fica na XG04; esta projeção nunca
 * lê contatos, identificadores de pessoas ou custos. O único dado financeiro é
 * o recebimento, e só com a seção `pagamentos` ligada (XG30). URLs de mídia só
 * são assinadas depois de a página pública validar o token.
 */
export async function buildObraPublicaView(
  obraId: string,
  secoes: SecoesPublicas = SECOES_PADRAO,
): Promise<ObraPublicaView | null> {
  const [obra] = await db
    .select({
      id: obras.id,
      titulo: obras.nome,
      tipo: obras.tipo,
      descricao: obras.descricao,
      areaM2: obras.areaM2,
      status: obras.status,
      cidade: obras.cidade,
      uf: obras.uf,
      // Só a rua, e apenas com a seção ligada. Basta para situar a obra, sem
      // entregar a porta exata de um canteiro com material estocado a quem
      // recebeu um link sem login (XG04 §8).
      endereco: obras.endereco,
      dataInicio: obras.dataInicio,
      dataPrevisao: obras.dataPrevisao,
      imagemBucketKey: userFiles.bucketKey,
    })
    .from(obras)
    .leftJoin(
      userFiles,
      and(
        eq(userFiles.id, obras.fotoCapaFileId),
        isNull(userFiles.deletedAt),
        like(userFiles.mime, 'image/%'),
        or(
          // Uma capa enviada especificamente pelo editor é uma mídia pública
          // deliberada. Fotos comuns só podem virar capa pública depois de
          // aprovadas para compartilhamento na galeria desta mesma obra.
          eq(userFiles.kind, 'obra_capa'),
          exists(
            db
              .select({ id: obraFotos.id })
              .from(obraFotos)
              .where(and(
                eq(obraFotos.obraId, obras.id),
                eq(obraFotos.fileId, userFiles.id),
                eq(obraFotos.enviadaAoContratante, true),
              )),
          ),
        ),
      ),
    )
    .where(eq(obras.id, obraId));

  if (!obra) return null;

  // Seção desligada não é escondida na renderização: a query nem roda, então o
  // conteúdo não chega a sair do banco. Esconder no cliente deixaria o dado no
  // HTML servido; aqui ele simplesmente não é lido.
  // XG30 — etapas e cronograma leem a mesma tabela; uma query atende as duas
  // seções, e as datas só são projetadas quando o cronograma está ligado.
  const [etapas, diarioRows, ocorrenciaRows, fotoRows, tarefaRows, pagamentos] = await Promise.all([
    !secoes.etapas && !secoes.cronograma ? [] : db
      .select({
        id: obraEtapas.id,
        nome: obraEtapas.nome,
        descricao: obraEtapas.descricao,
        progresso: obraEtapas.progresso,
        status: obraEtapas.status,
        dataInicio: obraEtapas.dataInicio,
        prazo: obraEtapas.prazo,
        updatedAt: obraEtapas.updatedAt,
      })
      .from(obraEtapas)
      .where(eq(obraEtapas.obraId, obraId))
      .orderBy(asc(obraEtapas.ordem), asc(obraEtapas.createdAt)),
    !secoes.diario ? [] : db
      .select({
        id: obraDiario.id,
        texto: obraDiario.texto,
        createdAt: obraDiario.createdAt,
      })
      .from(obraDiario)
      .where(eq(obraDiario.obraId, obraId))
      .orderBy(desc(obraDiario.createdAt)),
    !secoes.ocorrencias ? [] : db
      .select({
        id: obraOcorrencias.id,
        titulo: obraOcorrencias.titulo,
        descricao: obraOcorrencias.descricao,
        gravidade: obraOcorrencias.gravidade,
        status: obraOcorrencias.status,
        resolvidoEm: obraOcorrencias.resolvidoEm,
        createdAt: obraOcorrencias.createdAt,
      })
      .from(obraOcorrencias)
      .where(eq(obraOcorrencias.obraId, obraId))
      .orderBy(desc(obraOcorrencias.createdAt)),
    !secoes.fotos ? [] : db
      .select({
        id: obraFotos.id,
         bucketKey: userFiles.bucketKey,
        fase: obraFotos.fase,
        tag: obraFotos.tag,
        createdAt: obraFotos.createdAt,
      })
      .from(obraFotos)
      .innerJoin(
        userFiles,
        and(
          eq(userFiles.id, obraFotos.fileId),
          isNull(userFiles.deletedAt),
           like(userFiles.mime, 'image/%'),
        ),
      )
      .where(and(eq(obraFotos.obraId, obraId), eq(obraFotos.enviadaAoContratante, true)))
      .orderBy(desc(obraFotos.createdAt)),
    // `responsavel` é nome de pessoa da equipe e fica fora por LGPD, como já
    // acontece com a autoria no diário e nas ocorrências (XG04 §8).
    !secoes.tarefas ? [] : db
      .select({
        id: obraTarefas.id,
        titulo: obraTarefas.titulo,
        descricao: obraTarefas.descricao,
        etapa: obraTarefas.etapa,
        status: obraTarefas.status,
        prazo: obraTarefas.prazo,
        progresso: obraTarefas.progresso,
      })
      .from(obraTarefas)
      .where(eq(obraTarefas.obraId, obraId))
      .orderBy(asc(obraTarefas.createdAt)),
    secoes.pagamentos ? buildPagamentos(obraId) : null,
  ]);

  const fotoRowsWithUrls = await Promise.all(fotoRows.map(async (foto) => ({
    ...foto,
    url: await signedPublicMediaUrl(foto.bucketKey),
  })));

  return {
    obra: {
      id: obra.id,
      titulo: obra.titulo,
      tipo: obra.tipo,
      descricao: obra.descricao,
      areaM2: obra.areaM2,
      status: obra.status,
      cidade: obra.cidade,
      uf: obra.uf,
      logradouro: secoes.localizacao ? obra.endereco : null,
      dataInicio: obra.dataInicio,
      dataPrevisao: obra.dataPrevisao,
      imagemUrl: obra.imagemBucketKey ? await signedPublicMediaUrl(obra.imagemBucketKey) : null,
      // XG30 — as atualizações saíram; quem registra o avanço agora é a etapa.
      ultimaAtualizacao: mostRecent(
        diarioRows[0]?.createdAt,
        ocorrenciaRows[0]?.createdAt,
        fotoRowsWithUrls[0]?.createdAt,
        ...etapas.map((etapa) => etapa.updatedAt),
      ),
    },
    etapas: etapas.map((etapa) => ({
      id: etapa.id,
      nome: etapa.nome,
      descricao: etapa.descricao,
      progresso: etapa.progresso,
      status: etapa.status,
      dataInicio: secoes.cronograma ? toIso(etapa.dataInicio) : null,
      prazo: secoes.cronograma ? toIso(etapa.prazo) : null,
    })),
    diario: diarioRows.map((entry) => ({
      id: entry.id,
      texto: entry.texto,
      createdAt: toIso(entry.createdAt) ?? '',
      // Não assinamos anexos de diário por IDs soltos: a galeria obra_fotos é
      // o único vínculo de mídia com escopo de obra verificável nesta projeção.
      fotos: [],
    })),
    ocorrencias: ocorrenciaRows.map((entry) => ({
      id: entry.id,
      titulo: entry.titulo,
      descricao: entry.descricao,
      gravidade: entry.gravidade,
      status: entry.status,
       fotoUrl: null,
      resolvidoEm: toIso(entry.resolvidoEm) ?? undefined,
      createdAt: toIso(entry.createdAt) ?? '',
    })),
     fotos: fotoRowsWithUrls.map((foto) => ({
        id: foto.id,
        url: foto.url,
        fase: foto.fase,
        tag: foto.tag,
        createdAt: toIso(foto.createdAt) ?? '',
      })),
    tarefas: tarefaRows.map((tarefa) => ({
      id: tarefa.id,
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      etapa: tarefa.etapa,
      status: tarefa.status,
      prazo: tarefa.prazo || null,
      progresso: tarefa.progresso ?? null,
    })),
    pagamentos,
    secoes,
  };
}