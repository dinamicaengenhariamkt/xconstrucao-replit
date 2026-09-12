import 'server-only';

import { and, asc, desc, eq, exists, inArray, isNull, like, or } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  obraChecklistItens,
  obraChecklists,
  obraDiario,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obraTarefas,
  medicoes,
  obras,
  userFiles,
} from '@shared/db/schema';
import type { ObraPublicaView } from '../types';
import { SECOES_PADRAO, type SecoesPublicas } from '../secoes';
import { createSignedReadUrl } from '@shared/lib/storage/r2';

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

/**
 * Constrói, campo a campo, o conteúdo que poderá ser enviado a quem possuir
 * um link público. A validação do link/token fica na XG04; esta projeção nunca
 * lê campos financeiros, contatos ou identificadores de pessoas. URLs de mídia
 * só são assinadas depois de a página pública validar o token.
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
      progresso: obras.progresso,
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
  const [etapas, diarioRows, ocorrenciaRows, fotoRows, checklistRows, atualizacaoRows, tarefaRows] = await Promise.all([
    !secoes.etapas ? [] : db
      .select({
        id: obraEtapas.id,
        nome: obraEtapas.nome,
        descricao: obraEtapas.descricao,
        progresso: obraEtapas.progresso,
        status: obraEtapas.status,
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
    !secoes.checklists ? [] : db
      .select({
        id: obraChecklists.id,
        nome: obraChecklists.nome,
        descricao: obraChecklists.descricao,
        tipo: obraChecklists.tipo,
        status: obraChecklists.status,
        completadoEm: obraChecklists.completadoEm,
      })
      .from(obraChecklists)
      .where(eq(obraChecklists.obraId, obraId))
      .orderBy(asc(obraChecklists.createdAt)),
    !secoes.atualizacoes ? [] : db
      .select({
        id: medicoes.id,
        etapa: medicoes.etapa,
        descricao: medicoes.descricao,
        percentual: medicoes.percentual,
        fotos: medicoes.fotos,
        createdAt: medicoes.createdAt,
      })
      .from(medicoes)
      .where(and(eq(medicoes.obraId, obraId), eq(medicoes.status, 'aprovada')))
      .orderBy(desc(medicoes.createdAt)),
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
  ]);

  const fotoRowsWithUrls = await Promise.all(fotoRows.map(async (foto) => ({
    ...foto,
    url: await signedPublicMediaUrl(foto.bucketKey),
  })));

  const checklistIds = checklistRows.map((checklist) => checklist.id);
  const checklistItems = checklistIds.length === 0
    ? []
    : await db
      .select({
        id: obraChecklistItens.id,
        checklistId: obraChecklistItens.checklistId,
        titulo: obraChecklistItens.titulo,
        concluida: obraChecklistItens.concluida,
      })
      .from(obraChecklistItens)
      .where(inArray(obraChecklistItens.checklistId, checklistIds))
      .orderBy(asc(obraChecklistItens.ordem), asc(obraChecklistItens.createdAt));

  return {
    obra: {
      id: obra.id,
      titulo: obra.titulo,
      tipo: obra.tipo,
      descricao: obra.descricao,
      areaM2: obra.areaM2,
      status: obra.status,
      progresso: obra.progresso ?? 0,
      cidade: obra.cidade,
      uf: obra.uf,
      logradouro: secoes.localizacao ? obra.endereco : null,
      dataInicio: obra.dataInicio,
      dataPrevisao: obra.dataPrevisao,
      imagemUrl: obra.imagemBucketKey ? await signedPublicMediaUrl(obra.imagemBucketKey) : null,
      ultimaAtualizacao: mostRecent(
        diarioRows[0]?.createdAt,
        ocorrenciaRows[0]?.createdAt,
       fotoRowsWithUrls[0]?.createdAt,
        atualizacaoRows[0]?.createdAt,
      ),
    },
    etapas: etapas.map((etapa) => ({
      ...etapa,
      createdAt: '',
      updatedAt: '',
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
    atualizacoes: atualizacaoRows.map((item) => ({
      id: item.id,
      etapa: item.etapa,
      descricao: item.descricao,
      percentual: Number(item.percentual ?? 0),
      createdAt: toIso(item.createdAt) ?? '',
      fotosCount: item.fotos?.length ?? 0,
    })),
    checklists: checklistRows.map((checklist) => ({
      id: checklist.id,
      nome: checklist.nome,
      descricao: checklist.descricao,
      tipo: checklist.tipo,
      status: checklist.status,
      completadoEm: checklist.completadoEm ?? undefined,
      itens: checklistItems
        .filter((item) => item.checklistId === checklist.id)
        .map((item) => ({ id: item.id, titulo: item.titulo, concluida: item.concluida })),
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
    secoes,
  };
}