import 'server-only';

import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  empreiteiras,
  financeiro,
  obraAnexos,
  obraAditivos,
  obraChecklistItens,
  obraChecklists,
  obraEquipe,
  obraOcorrencias,
  obraShareLinks,
  obras,
  userFiles,
  users,
  xgestaoMembroObras,
  xgestaoMembros,
} from '@shared/db/schema';
import { createSignedReadUrl } from '@shared/lib/storage/r2';
import { ladoDoLancamento } from '@features/empreiteiro/minhas-obras/lib/lado-lancamento';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import type { ProfitSummaryData } from '@features/shared/profit/types';
import { buildObraPublicaView } from '@features/xgestao/obra-publica/server/projection';
import type { ObraPublicaView } from '@features/xgestao/obra-publica/types';
import { normalizarSecoes, SECOES_PUBLICAS, type SecaoPublica, type SecoesPublicas } from '@features/xgestao/obra-publica/secoes';
import { lancamentoAtrasadoEm } from '../lib/data-sp';
import { obraPertenceAoXgestao } from './escopo';
import { custoRealPorObra } from './custo-real';

export interface XgestaoObraDetalhe {
  obra: {
    id: string;
    nome: string;
    status: string;
    cidade: string | null;
    uf: string | null;
    valorTotal: number;
    /** Custo real: saídas pagas pelo dono (`custo-real.ts`), não `obras.valor_pago`. */
    valorPago: number;
    dataInicio: string | null;
    dataPrevisao: string | null;
    criadaEm: string | null;
    atualizadaEm: string | null;
  };
  assinante: {
    /** XG44 — id do titular, para o link ao detalhe do assinante. */
    userId: string;
    empreiteiraId: string;
    empreiteira: string;
    responsavel: string | null;
    email: string;
  };
  /** Diagnóstico administrativo — nunca exposto no link público (XG04 §8). */
  lucro: ProfitSummaryData;
  linkPublico: {
    ativo: boolean;
    visualizacoes: number;
    ultimoAcessoEm: string | null;
    criadoEm: string | null;
  };
  /**
   * XG36 — todos os links do cliente (ADM-01: também os revogados e vencidos),
   * com o status e as seções que cada um mostra.
   */
  linksPublicos: Array<{
    nome: string;
    status: 'ativo' | 'expirado' | 'revogado';
    secoes: SecaoPublica[];
    visualizacoes: number;
    ultimoAcessoEm: string | null;
    criadoEm: string | null;
    expiraEm: string | null;
  }>;
  /**
   * Conteúdo operacional (etapas, diário, fotos) na visão de leitura do link.
   * ADM-01: os recebimentos vêm da projeção administrativa, sem o corte de
   * capacidade do plano (conta Basic ou somente leitura).
   */
  conteudo: ObraPublicaView | null;
  /** ADM-01 — projeção administrativa: tudo o que a obra tem, só leitura. */
  administrativo: XgestaoObraAdministrativo;
}

export interface XgestaoObraAdministrativo {
  financeiro: Array<{
    id: string;
    tipo: 'entrada' | 'saida';
    lado: 'receita' | 'custo' | null;
    descricao: string;
    categoria: string | null;
    valor: number;
    data: string;
    vencimento: string | null;
    pagoEm: string | null;
    /** Status gravado, com `atrasado` calculado na hora (ADM-09). */
    status: 'pago' | 'pendente' | 'atrasado' | 'cancelado';
    fornecedor: string | null;
    metodoPagamento: string | null;
    /** URL assinada de curta duração (ou link externo); `null` sem comprovante. */
    comprovanteUrl: string | null;
  }>;
  aditivos: Array<{ id: string; descricao: string; valor: number; data: string }>;
  equipe: Array<{
    id: string;
    nome: string;
    papel: string;
    tipo: string;
    telefone: string | null;
    email: string | null;
    /** Só o final da chave (LGPD): o admin confere, não copia. */
    pixMascarado: string | null;
    valorContrato: number | null;
    ativo: boolean;
  }>;
  /** Membros da empresa com acesso a esta obra (XG31). */
  acessos: Array<{ userId: string; nome: string; email: string; papel: string; status: string; permissao: string }>;
  anexos: Array<{ id: string; nome: string; tipo: string; observacao: string | null; url: string | null; criadoEm: string | null }>;
  checklists: Array<{
    id: string;
    nome: string;
    tipo: string;
    status: string;
    recorrencia: string;
    assinadoPor: string | null;
    assinadoEm: string | null;
    itens: Array<{ titulo: string; concluida: boolean }>;
  }>;
  ocorrencias: Array<{
    id: string;
    titulo: string;
    descricao: string;
    gravidade: string;
    status: string;
    criadaEm: string | null;
    resolvidaEm: string | null;
    observacaoResolucao: string | null;
  }>;
}

function money(valor: unknown): number {
  const parsed = Number(valor ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Comprovante e anexo assinados por pouco tempo: a tela é de consulta. */
const URL_ADMIN_TTL_SEGUNDOS = 15 * 60;

async function urlAssinada(bucketKey: string | null | undefined): Promise<string | null> {
  if (!bucketKey) return null;
  try {
    return await createSignedReadUrl({ key: bucketKey, expiresIn: URL_ADMIN_TTL_SEGUNDOS });
  } catch {
    // Storage fora do ar não derruba o detalhe: o item aparece sem link.
    return null;
  }
}

/** "•••• 1234": mostra só os 4 últimos caracteres da chave PIX. */
export function mascararPix(chave: string | null | undefined): string | null {
  const limpa = chave?.trim();
  if (!limpa) return null;
  return limpa.length <= 4 ? '••••' : `•••• ${limpa.slice(-4)}`;
}

/** Admin enxerga o conteúdo operacional completo, não o recorte do link. */
const TODAS_AS_SECOES = Object.fromEntries(
  SECOES_PUBLICAS.map((secao) => [secao, true]),
) as SecoesPublicas;

export async function detalheObraXgestao(obraId: string): Promise<XgestaoObraDetalhe | null> {
  // A checagem de escopo vem primeiro: sem ela, o id de uma obra de
  // marketplace abriria o detalhe por esta rota.
  if (!(await obraPertenceAoXgestao(obraId))) return null;

  const [linha] = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      status: obras.status,
      cidade: obras.cidade,
      uf: obras.uf,
      valorTotal: obras.valorTotal,
      dataInicio: obras.dataInicio,
      dataPrevisao: obras.dataPrevisao,
      criadaEm: obras.createdAt,
      atualizadaEm: obras.updatedAt,
      titularId: empreiteiras.userId,
      empreiteiraId: empreiteiras.id,
      empreiteira: empreiteiras.nome,
      responsavel: users.name,
      email: users.email,
    })
    .from(obras)
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .innerJoin(users, eq(users.id, empreiteiras.userId))
    .where(eq(obras.id, obraId));

  if (!linha) return null;

  // XG34 — sem Saúde: dependia de `obras.progresso`/`obras.valor_pago`, que o xgestão não escreve.
  const [lucro, conteudo, custoPorObra, links] = await Promise.all([
    computeProfitSummaryForObras([obraId]),
    buildObraPublicaView(obraId, TODAS_AS_SECOES),
    custoRealPorObra([obraId]),
    db
      .select({
        nome: obraShareLinks.nome,
        ativo: obraShareLinks.ativo,
        secoes: obraShareLinks.secoes,
        expiraEm: obraShareLinks.expiraEm,
        visualizacoes: obraShareLinks.visualizacoes,
        ultimoAcessoEm: obraShareLinks.ultimoAcessoEm,
        criadoEm: obraShareLinks.criadoEm,
      })
      .from(obraShareLinks)
      .where(eq(obraShareLinks.obraId, obraId))
      .orderBy(desc(obraShareLinks.criadoEm)),
  ]);
  const agora = new Date();
  const todosLinks = links.map((l) => ({
    ...l,
    status: !l.ativo ? 'revogado' as const : l.expiraEm && l.expiraEm <= agora ? 'expirado' as const : 'ativo' as const,
  }));
  const ativos = todosLinks.filter((l) => l.status === 'ativo');
  const administrativo = await projecaoAdministrativa(obraId, linha.titularId ?? null, agora);
  // ADM-01 — o acompanhamento mostra os recebimentos sem o corte do plano.
  const conteudoAdmin = conteudo && {
    ...conteudo,
    secoes: { ...conteudo.secoes, pagamentos: true },
    pagamentos: recebimentosDaProjecao(administrativo, money(linha.valorTotal)),
  };
  const iso = (data: Date | null) => (data ? data.toISOString() : null);
  const ultimoAcesso = ativos
    .map((l) => l.ultimoAcessoEm)
    .filter((data): data is Date => Boolean(data))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    obra: {
      id: linha.id,
      nome: linha.nome,
      status: linha.status,
      cidade: linha.cidade,
      uf: linha.uf,
      valorTotal: money(linha.valorTotal),
      valorPago: custoPorObra.get(obraId) ?? 0,
      dataInicio: linha.dataInicio,
      dataPrevisao: linha.dataPrevisao,
      criadaEm: linha.criadaEm ? linha.criadaEm.toISOString() : null,
      atualizadaEm: linha.atualizadaEm ? linha.atualizadaEm.toISOString() : null,
    },
    assinante: {
      userId: linha.titularId!,
      empreiteiraId: linha.empreiteiraId,
      empreiteira: linha.empreiteira,
      responsavel: linha.responsavel,
      email: linha.email,
    },
    lucro,
    // Resumo agregado de todos os links ativos (antes só o mais recente contava).
    linkPublico: {
      ativo: ativos.length > 0,
      visualizacoes: ativos.reduce((total, l) => total + (l.visualizacoes ?? 0), 0),
      ultimoAcessoEm: iso(ultimoAcesso),
      criadoEm: iso(ativos[ativos.length - 1]?.criadoEm ?? null),
    },
    linksPublicos: todosLinks.map((l) => ({
      nome: l.nome,
      status: l.status,
      secoes: (() => {
        const s = normalizarSecoes(l.secoes);
        return SECOES_PUBLICAS.filter((secao) => s[secao] && secao !== 'tarefas');
      })(),
      visualizacoes: l.visualizacoes ?? 0,
      ultimoAcessoEm: iso(l.ultimoAcessoEm),
      criadoEm: iso(l.criadoEm),
      expiraEm: iso(l.expiraEm),
    })),
    conteudo: conteudoAdmin,
    administrativo,
  };
}

/** Recebimentos no formato do acompanhamento, a partir da projeção administrativa. */
function recebimentosDaProjecao(adm: XgestaoObraAdministrativo, valorObra: number): ObraPublicaView['pagamentos'] {
  const parcelas = adm.financeiro
    .filter((l) => l.lado === 'receita' && l.status !== 'cancelado')
    .map((l) => ({
      id: l.id,
      descricao: l.descricao,
      valor: l.valor,
      vencimento: l.vencimento,
      pagoEm: l.pagoEm,
      status: l.status as 'pago' | 'pendente' | 'atrasado',
    }));
  const valorTotal = valorObra + adm.aditivos.reduce((t, a) => t + a.valor, 0);
  const recebido = parcelas.filter((p) => p.status === 'pago').reduce((t, p) => t + p.valor, 0);
  return { valorTotal, recebido, saldo: Math.max(0, valorTotal - recebido), parcelas };
}

/**
 * ADM-01 — projeção administrativa da obra, sem o corte de capacidade do link
 * público: financeiro interno (entradas e saídas, fornecedor, status,
 * comprovante assinado), equipe (PIX mascarado), quem da empresa tem acesso,
 * anexos, checklists e ocorrências com a observação da resolução. Leitura
 * apenas: nada aqui é editável pelo admin.
 */
async function projecaoAdministrativa(obraId: string, titularId: string | null, agora: Date): Promise<XgestaoObraAdministrativo> {
  const [lancamentos, aditivos, equipe, acessos, anexos, checklists, ocorrencias] = await Promise.all([
    db
      .select({
        id: financeiro.id,
        tipo: financeiro.tipo,
        descricao: financeiro.descricao,
        categoria: financeiro.categoria,
        valor: financeiro.valor,
        data: financeiro.data,
        status: financeiro.status,
        dataVencimento: financeiro.dataVencimento,
        dataPagamento: financeiro.dataPagamento,
        metodoPagamento: financeiro.metodoPagamento,
        comprovanteUrl: financeiro.comprovanteUrl,
        comprovanteKey: userFiles.bucketKey,
        fornecedorNome: financeiro.fornecedorNome,
        recebedorUserId: financeiro.recebedorUserId,
        pagadorUserId: financeiro.pagadorUserId,
      })
      .from(financeiro)
      .leftJoin(userFiles, and(eq(userFiles.id, financeiro.comprovanteFileId), isNull(userFiles.deletedAt)))
      .where(and(eq(financeiro.obraId, obraId), eq(financeiro.escopo, 'obra')))
      .orderBy(desc(financeiro.data), desc(financeiro.id)),
    db
      .select({ id: obraAditivos.id, descricao: obraAditivos.descricao, valor: obraAditivos.valor, data: obraAditivos.data })
      .from(obraAditivos)
      .where(eq(obraAditivos.obraId, obraId))
      .orderBy(asc(obraAditivos.data)),
    db
      .select({
        id: obraEquipe.id,
        nome: obraEquipe.nome,
        papel: obraEquipe.papel,
        tipo: obraEquipe.tipo,
        telefone: obraEquipe.telefone,
        email: obraEquipe.email,
        pixChave: obraEquipe.pixChave,
        valorContrato: obraEquipe.valorContrato,
        ativo: obraEquipe.ativo,
      })
      .from(obraEquipe)
      .where(eq(obraEquipe.obraId, obraId))
      .orderBy(asc(obraEquipe.nome)),
    db
      .select({
        userId: xgestaoMembros.userId,
        nome: users.name,
        email: users.email,
        papel: xgestaoMembros.papel,
        status: xgestaoMembros.status,
        permissao: xgestaoMembroObras.permissao,
      })
      .from(xgestaoMembroObras)
      .innerJoin(xgestaoMembros, eq(xgestaoMembros.id, xgestaoMembroObras.membroId))
      .innerJoin(users, eq(users.id, xgestaoMembros.userId))
      .where(eq(xgestaoMembroObras.obraId, obraId))
      .orderBy(asc(users.name)),
    db
      .select({
        id: obraAnexos.id,
        titulo: obraAnexos.titulo,
        tipo: obraAnexos.tipo,
        observacao: obraAnexos.observacao,
        linkUrl: obraAnexos.linkUrl,
        arquivoNome: userFiles.originalName,
        bucketKey: userFiles.bucketKey,
        criadoEm: obraAnexos.createdAt,
      })
      .from(obraAnexos)
      .leftJoin(userFiles, and(eq(userFiles.id, obraAnexos.fileId), isNull(userFiles.deletedAt)))
      .where(eq(obraAnexos.obraId, obraId))
      .orderBy(desc(obraAnexos.createdAt)),
    db
      .select({
        id: obraChecklists.id,
        nome: obraChecklists.nome,
        tipo: obraChecklists.tipo,
        status: obraChecklists.status,
        recorrencia: obraChecklists.recorrencia,
        assinadoPor: obraChecklists.assinadoPor,
        assinadoEm: obraChecklists.assinadoEm,
      })
      .from(obraChecklists)
      .where(eq(obraChecklists.obraId, obraId))
      .orderBy(asc(obraChecklists.createdAt)),
    db
      .select({
        id: obraOcorrencias.id,
        titulo: obraOcorrencias.titulo,
        descricao: obraOcorrencias.descricao,
        gravidade: obraOcorrencias.gravidade,
        status: obraOcorrencias.status,
        criadaEm: obraOcorrencias.createdAt,
        resolvidaEm: obraOcorrencias.resolvidoEm,
        observacaoResolucao: obraOcorrencias.observacaoResolucao,
      })
      .from(obraOcorrencias)
      .where(eq(obraOcorrencias.obraId, obraId))
      .orderBy(desc(obraOcorrencias.createdAt)),
  ]);
  const itens = checklists.length === 0
    ? []
    : await db
      .select({ checklistId: obraChecklistItens.checklistId, titulo: obraChecklistItens.titulo, concluida: obraChecklistItens.concluida })
      .from(obraChecklistItens)
      .where(inArray(obraChecklistItens.checklistId, checklists.map((c) => c.id)))
      .orderBy(asc(obraChecklistItens.ordem));
  const itensPor = new Map<string, Array<{ titulo: string; concluida: boolean }>>();
  for (const item of itens) {
    const lista = itensPor.get(item.checklistId) ?? [];
    lista.push({ titulo: item.titulo, concluida: item.concluida });
    itensPor.set(item.checklistId, lista);
  }
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  const [financeiroComUrl, anexosComUrl] = await Promise.all([
    Promise.all(lancamentos.map(async (l) => ({
      id: l.id,
      tipo: (l.tipo === 'entrada' ? 'entrada' : 'saida') as 'entrada' | 'saida',
      lado: ladoDoLancamento(l, titularId),
      descricao: l.descricao,
      categoria: l.categoria,
      valor: money(l.valor),
      data: l.data,
      vencimento: l.dataVencimento,
      pagoEm: l.status === 'pago' ? (l.dataPagamento ?? l.data) : null,
      status: l.status === 'pago' || l.status === 'cancelado'
        ? l.status
        : lancamentoAtrasadoEm(l, agora) ? 'atrasado' as const : 'pendente' as const,
      fornecedor: l.fornecedorNome,
      metodoPagamento: l.metodoPagamento,
      comprovanteUrl: (await urlAssinada(l.comprovanteKey)) ?? (l.comprovanteUrl?.startsWith('https://') ? l.comprovanteUrl : null),
    }))),
    Promise.all(anexos.map(async (a) => ({
      id: a.id,
      nome: a.titulo ?? a.arquivoNome ?? 'Anexo',
      tipo: a.tipo,
      observacao: a.observacao,
      url: a.linkUrl ?? (await urlAssinada(a.bucketKey)),
      criadoEm: iso(a.criadoEm),
    }))),
  ]);
  return {
    financeiro: financeiroComUrl,
    aditivos: aditivos.map((a) => ({ id: a.id, descricao: a.descricao, valor: money(a.valor), data: a.data })),
    equipe: equipe.map((m) => ({
      id: m.id,
      nome: m.nome,
      papel: m.papel,
      tipo: m.tipo,
      telefone: m.telefone,
      email: m.email,
      pixMascarado: mascararPix(m.pixChave),
      valorContrato: m.valorContrato === null ? null : money(m.valorContrato),
      ativo: m.ativo,
    })),
    acessos,
    anexos: anexosComUrl,
    checklists: checklists.map((c) => ({ ...c, itens: itensPor.get(c.id) ?? [] })),
    ocorrencias: ocorrencias.map((o) => ({
      ...o,
      criadaEm: iso(o.criadaEm),
      resolvidaEm: iso(o.resolvidaEm),
      observacaoResolucao: o.status === 'resolvida' ? o.observacaoResolucao : null,
    })),
  };
}
