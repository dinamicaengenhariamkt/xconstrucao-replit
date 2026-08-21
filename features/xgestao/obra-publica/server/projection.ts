import 'server-only';

import { and, asc, desc, eq, inArray, isNull, like } from 'drizzle-orm';
import { db } from '@shared/db/db';
import {
  obraChecklistItens,
  obraChecklists,
  obraDiario,
  obraEtapas,
  obraFotos,
  obraOcorrencias,
  obras,
  userFiles,
} from '@shared/db/schema';
import type { ObraPublicaView } from '../types';
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
export async function buildObraPublicaView(obraId: string): Promise<ObraPublicaView | null> {
  const [obra] = await db
    .select({
      id: obras.id,
      titulo: obras.nome,
      status: obras.status,
      progresso: obras.progresso,
      cidade: obras.cidade,
      uf: obras.uf,
      dataPrevisao: obras.dataPrevisao,
       imagemBucketKey: userFiles.bucketKey,
    })
    .from(obras)
    .leftJoin(
      obraFotos,
      and(
        eq(obraFotos.obraId, obras.id),
        eq(obraFotos.fileId, obras.fotoCapaFileId),
        eq(obraFotos.enviadaAoContratante, true),
      ),
    )
    .leftJoin(
      userFiles,
      and(
        eq(userFiles.id, obraFotos.fileId),
        isNull(userFiles.deletedAt),
        like(userFiles.mime, 'image/%'),
      ),
    )
    .where(eq(obras.id, obraId));

  if (!obra) return null;

  const [etapas, diarioRows, ocorrenciaRows, fotoRows, checklistRows] = await Promise.all([
    db
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
    db
      .select({
        id: obraDiario.id,
        texto: obraDiario.texto,
        createdAt: obraDiario.createdAt,
      })
      .from(obraDiario)
      .where(eq(obraDiario.obraId, obraId))
      .orderBy(desc(obraDiario.createdAt)),
    db
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
    db
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
    db
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
      status: obra.status,
      progresso: obra.progresso ?? 0,
      cidade: obra.cidade,
      uf: obra.uf,
      dataPrevisao: obra.dataPrevisao,
       imagemUrl: obra.imagemBucketKey ? await signedPublicMediaUrl(obra.imagemBucketKey) : null,
      ultimaAtualizacao: mostRecent(
        diarioRows[0]?.createdAt,
        ocorrenciaRows[0]?.createdAt,
       fotoRowsWithUrls[0]?.createdAt,
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
  };
}