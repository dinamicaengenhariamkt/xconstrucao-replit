'use client';

import { cn } from '@shared/lib/utils';
import {
  IconDownload,
  IconWarning,
  IconFolderOpen,
  IconDescription,
  IconEngineering,
  IconAnalytics,
  IconFactCheck,
  IconDomain,
  IconTaskAlt,
} from '@shared/components/icons';
import type { ComponentType } from 'react';
import type { ObraDocumento } from '../types';

const CATEGORIA_CONFIG: Record<
  ObraDocumento['categoria'],
  { label: string; Icon: ComponentType<{ className?: string }>; iconeBg: string }
> = {
  contrato:  { label: 'Contratos',         Icon: IconDescription,  iconeBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  art_rrt:   { label: 'ART / RRT',         Icon: IconEngineering,  iconeBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  planta:    { label: 'Plantas e Projetos', Icon: IconAnalytics,   iconeBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  relatorio: { label: 'Relatórios',        Icon: IconTaskAlt,      iconeBg: 'bg-success/20 text-success dark:bg-success/10' },
  alvara:    { label: 'Alvarás',           Icon: IconDomain,       iconeBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  laudo:     { label: 'Laudos Técnicos',   Icon: IconFactCheck,    iconeBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
};

const CATEGORIAS_ORDEM: ObraDocumento['categoria'][] = [
  'contrato', 'art_rrt', 'planta', 'relatorio', 'alvara', 'laudo',
];

const STATUS_BADGE: Record<NonNullable<ObraDocumento['status']>, { label: string; classes: string }> = {
  assinado: { label: 'Assinado', classes: 'text-success bg-success/10 dark:bg-success/20' },
  valido:   { label: 'Válido',   classes: 'text-success bg-success/10 dark:bg-success/20' },
  vencendo: { label: 'Vencendo', classes: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  novo:     { label: 'Novo',     classes: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
};

function DocumentoRow({ doc }: { doc: ObraDocumento }) {
  const cfg = CATEGORIA_CONFIG[doc.categoria];
  const isVencendo = doc.status === 'vencendo';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-colors group',
        isVencendo
          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      <div className={cn('p-2 rounded-lg flex-shrink-0', cfg.iconeBg)}>
        <cfg.Icon className="text-[20px]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.nome}</p>
        {doc.observacoes && (
          <p className="text-xs text-gray-500 truncate">{doc.observacoes}</p>
        )}
        <p
          className={cn(
            'text-xs mt-0.5',
            isVencendo ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-400',
          )}
        >
          {doc.tamanho ? `${doc.tamanho} · ` : ''}
          {doc.data}
          {doc.venceEmDias && ` · vence em ${doc.venceEmDias} dias`}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {doc.status && !isVencendo && (
          <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', STATUS_BADGE[doc.status].classes)}>
            {STATUS_BADGE[doc.status].label}
          </span>
        )}
        <button
          type="button"
          onClick={() => window.open('#', '_blank')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Baixar ${doc.nome}`}
          data-testid={`contratante-doc-download-${doc.id}`}
        >
          <IconDownload className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}

interface TabDocumentosProps {
  documentos?: ObraDocumento[];
}

export function TabDocumentos({ documentos = [] }: TabDocumentosProps) {
  const docsVencendo = documentos.filter((d) => d.status === 'vencendo');
  const gruposPorCategoria = CATEGORIAS_ORDEM.map((cat) => ({
    categoria: cat,
    docs: documentos.filter((d) => d.categoria === cat),
  })).filter((g) => g.docs.length > 0);

  return (
    <div
      className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
      data-testid="contratante-tab-documentos"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documentos da Obra</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {documentos.length} documento{documentos.length !== 1 ? 's' : ''} compartilhado
          {documentos.length !== 1 ? 's' : ''} pelo empreiteiro · somente leitura.
        </p>
      </div>

      {docsVencendo.length > 0 && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
          <IconWarning className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {docsVencendo.length} documento{docsVencendo.length !== 1 ? 's' : ''} com validade próxima do vencimento
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {docsVencendo.map((d) => d.nome).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {documentos.length === 0 ? (
        <div className="text-center py-16">
          <IconFolderOpen className="text-gray-300 dark:text-gray-600 text-6xl mb-3 block" />
          <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
            Nenhum documento compartilhado
          </p>
          <p className="text-sm text-gray-400 mt-1">
            O empreiteiro ainda não anexou contratos, projetos ou laudos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {gruposPorCategoria.map(({ categoria, docs }) => {
            const cfg = CATEGORIA_CONFIG[categoria];
            return (
              <div key={categoria}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('p-1 rounded', cfg.iconeBg)}>
                    <cfg.Icon className="text-[16px]" />
                  </span>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {cfg.label}
                  </h4>
                  <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {docs.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {docs.map((doc) => (
                    <DocumentoRow key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
