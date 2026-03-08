'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
import { useToast } from '@shared/hooks/use-toast';
import { RelatorioObraModal } from './RelatorioObraModal';
import { CompartilharModal } from './CompartilharModal';
import type { MinhaObraDetalhe } from '../types';
import { IconDescription, IconPhotoLibrary, IconTrendingUp, IconChecklist, IconTableChart, IconShare, IconProgressActivity } from '@shared/components/icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalType = 'pdf' | 'compartilhar' | null;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RelatoriosSectionProps {
  obra: MinhaObraDetalhe;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RelatoriosSection({ obra }: RelatoriosSectionProps) {
  const { toast } = useToast();
  const [modal, setModal] = useState<ModalType>(null);
  const [exportandoFotos, setExportandoFotos] = useState(false);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleExportarTarefas = () => {
    const headers = ['Título', 'Etapa', 'Status', 'Prioridade', 'Responsável', 'Progresso (%)', 'Prazo'];
    const STATUS_LABELS: Record<string, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      bloqueado: 'Bloqueado',
      concluido: 'Concluído',
    };
    const PRIO_LABELS: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
    const rows = obra.tarefas.map((t) => [
      t.titulo,
      t.etapa,
      STATUS_LABELS[t.status] ?? t.status,
      PRIO_LABELS[t.prioridade] ?? t.prioridade,
      t.responsavel,
      String(t.progresso ?? 0),
      t.prazo,
    ]);
    downloadCSV(`tarefas-${obra.id}.csv`, headers, rows);
    toast({ title: 'Tarefas exportadas', description: `${rows.length} tarefa(s) salvas em CSV.` });
  };

  const handleExportarProgresso = () => {
    const headers = ['Etapa', 'Progresso (%)', 'Tarefas Total', 'Tarefas Concluídas'];
    const rows = obra.etapas.map((e) => {
      const concluidas = e.tarefas.filter((t) => t.concluida).length;
      return [e.nome, String(e.progresso), String(e.tarefas.length), String(concluidas)];
    });
    downloadCSV(`progresso-${obra.id}.csv`, headers, rows);
    toast({ title: 'Progresso exportado', description: `${rows.length} etapa(s) salvas em CSV.` });
  };

  const handleExportarExcel = () => {
    // Export obra summary + tarefas as CSV (Excel-compatible)
    const headers = ['Campo', 'Valor'];
    const rows: string[][] = [
      ['Obra', obra.titulo],
      ['Endereço', obra.endereco],
      ['Tipo', obra.tipo],
      ['Status', obra.status],
      ['Progresso', `${obra.progresso}%`],
      ['Início', obra.dataInicio],
      ['Previsão Entrega', obra.dataPrevisaoFim],
      ['Orçamento', String(obra.orcamento)],
      ['Valor Contratado', String(obra.financeiro.valorContratado)],
      ['Valor Pago', String(obra.valorPago)],
      ['A Receber', String(obra.aReceber)],
      ['Contratante', obra.contratante.nome],
      ['Total de Tarefas', String(obra.tarefasTotal)],
      ['Tarefas Pendentes', String(obra.tarefasPendentes)],
      ['Problemas Abertos', String(obra.problemasAbertos)],
    ];
    downloadCSV(`relatorio-completo-${obra.id}.csv`, headers, rows);
    toast({ title: 'Exportado para Excel', description: 'Resumo da obra salvo em CSV.' });
  };

  const handleExportarFotos = async () => {
    if (obra.fotos.length === 0) {
      toast({ title: 'Sem fotos', description: 'Nenhuma foto registrada nesta obra.' });
      return;
    }
    setExportandoFotos(true);
    try {
      const { zipSync } = await import('fflate');
      const files: Record<string, Uint8Array> = {};

      await Promise.all(
        obra.fotos.map(async (foto, i) => {
          try {
            const res = await fetch(foto.url);
            const buf = await res.arrayBuffer();
            const tag = foto.tag ? `-${foto.tag}` : '';
            files[`foto-${i + 1}${tag}.jpg`] = new Uint8Array(buf);
          } catch { /* skip failed photo */ }
        }),
      );

      const zipped = zipSync(files, { level: 0 }); // level:0 = store, rápido para imagens
      const blob = new Blob([zipped], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fotos-obra-${obra.id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Fotos exportadas', description: `${obra.fotos.length} foto(s) salvas em ZIP.` });
    } catch {
      toast({ title: 'Erro ao exportar', description: 'Não foi possível exportar as fotos.', variant: 'destructive' });
    } finally {
      setExportandoFotos(false);
    }
  };

  // ─── Export card definitions ────────────────────────────────────────────────

  const EXPORT_CARDS: { Icon: ComponentType<{ className?: string }>; label: string; description: string; onClick: () => void; loading?: boolean }[] = [
    {
      Icon: IconDescription,
      label: 'Gerar Relatório PDF',
      description: 'Baixe um PDF completo da obra',
      onClick: () => setModal('pdf'),
    },
    {
      Icon: exportandoFotos ? IconProgressActivity : IconPhotoLibrary,
      label: exportandoFotos ? 'Exportando...' : 'Exportar Fotos',
      description: `${obra.fotos.length} foto(s) em ZIP`,
      onClick: handleExportarFotos,
      loading: exportandoFotos,
    },
    {
      Icon: IconTrendingUp,
      label: 'Exportar Progresso',
      description: `${obra.etapas.length} etapa(s) em CSV`,
      onClick: handleExportarProgresso,
    },
    {
      Icon: IconChecklist,
      label: 'Exportar Tarefas',
      description: `${obra.tarefas.length} tarefa(s) em CSV`,
      onClick: handleExportarTarefas,
    },
  ];

  const BOTTOM_ACTIONS: { Icon: ComponentType<{ className?: string }>; label: string; onClick: () => void }[] = [
    { Icon: IconTableChart, label: 'Exportar para Excel', onClick: handleExportarExcel },
    { Icon: IconShare, label: 'Compartilhar Link', onClick: () => setModal('compartilhar') },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-primary rounded-2xl p-8 overflow-hidden relative">
        {/* SVG grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="40" id="relatorios-grid" patternUnits="userSpaceOnUse" width="40">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect fill="url(#relatorios-grid)" height="100%" width="100%" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Relatórios e Exportações</h3>
            <p className="text-white/70 text-sm mt-1">Gere documentos e exporte dados da obra</p>
          </div>

          {/* Main export cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXPORT_CARDS.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                disabled={'loading' in card && card.loading}
                className="flex flex-col items-center gap-3 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all group cursor-pointer text-center disabled:opacity-70 disabled:cursor-wait"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <card.Icon className={`text-white text-2xl ${'loading' in card && card.loading ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <span className="text-white text-sm font-bold block leading-tight">{card.label}</span>
                  <span className="text-white/60 text-[10px] block mt-1 leading-tight">{card.description}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Bottom action buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/20">
            {BOTTOM_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white text-xs font-bold hover:bg-white/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <action.Icon className="text-sm" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Modals ───────────────────────────────────────────────────────────── */}

      <RelatorioObraModal
        open={modal === 'pdf'}
        onOpenChange={(open) => { if (!open) setModal(null); }}
        obra={obra}
      />

      <CompartilharModal
        open={modal === 'compartilhar'}
        onOpenChange={(open) => { if (!open) setModal(null); }}
        obra={obra}
      />
    </>
  );
}
