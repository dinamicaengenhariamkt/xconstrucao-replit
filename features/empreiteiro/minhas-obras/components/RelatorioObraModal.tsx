'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { Button } from '@shared/components/ui/button';
import type { MinhaObraDetalhe } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  em_execucao: 'Em Execução',
  com_atrasos: 'Com Atrasos',
  com_pendencias: 'Com Pendências',
  planejamento: 'Planejamento',
  finalizada: 'Finalizada',
};

const TAREFA_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  bloqueado: 'Bloqueado',
  concluido: 'Concluído',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

const OCORRENCIA_SEVERIDADE: Record<string, string> = {
  critico: 'Crítico',
  medio: 'Médio',
  baixo: 'Baixo',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function hoje(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RelatorioObraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra: MinhaObraDetalhe;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RelatorioObraModal({
  open,
  onOpenChange,
  obra,
}: RelatorioObraModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const ocorrenciasAbertas = obra.ocorrencias.filter((o) => o.status === 'aberto');
  const tarefasPorStatus = {
    pendente: obra.tarefas.filter((t) => t.status === 'pendente').length,
    em_andamento: obra.tarefas.filter((t) => t.status === 'em_andamento').length,
    bloqueado: obra.tarefas.filter((t) => t.status === 'bloqueado').length,
    concluido: obra.tarefas.filter((t) => t.status === 'concluido').length,
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= pageH) {
        pdf.addImage(img, 'PNG', 0, 0, imgW, imgH);
      } else {
        let yOffset = 0;
        while (yOffset < imgH) {
          pdf.addImage(img, 'PNG', 0, -yOffset, imgW, imgH);
          yOffset += pageH;
          if (yOffset < imgH) pdf.addPage();
        }
      }

      pdf.save(`relatorio-obra-${obra.id}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[920px] p-0 flex flex-col gap-0 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary text-xl">description</span>
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Relatório da Obra
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Pré-visualização — clique em &quot;Baixar PDF&quot; para exportar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview area */}
        <ScrollArea className="flex-1 bg-gray-100 dark:bg-gray-950">
          <div className="p-6">
            {/* A4-like page */}
            <div
              ref={reportRef}
              className="bg-white text-gray-900 mx-auto p-10 shadow-xl"
              style={{ width: '794px', minHeight: '1000px', fontFamily: 'system-ui, sans-serif' }}
            >
              {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
              <div className="flex items-start justify-between mb-8 pb-6" style={{ borderBottom: '2px solid #e5e7eb' }}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary, #2563eb)' }}
                    >
                      <span style={{ color: 'white', fontSize: '20px' }} className="material-symbols-outlined">
                        construction
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Obra Manager
                    </span>
                  </div>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                    {obra.titulo}
                  </h1>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{obra.endereco}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                    Tipo: {obra.tipo} — Contratante: {obra.contratante.nome}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>Relatório gerado em</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{hoje()}</p>
                </div>
              </div>

              {/* ── Status Bar ────────────────────────────────────────────────── */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { label: 'Status', value: STATUS_LABELS[obra.status] ?? obra.status },
                  { label: 'Progresso Geral', value: `${obra.progresso}%` },
                  { label: 'Início', value: obra.dataInicio },
                  { label: 'Previsão Entrega', value: obra.dataPrevisaoFim },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px' }}>
                    <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* ── Resumo Financeiro ─────────────────────────────────────────── */}
              <section className="mb-8">
                <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}>payments</span>
                  Resumo Financeiro
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    {[
                      { label: 'Valor contratado', value: formatCurrency(obra.financeiro.valorContratado) },
                      { label: 'Aditivos', value: formatCurrency(obra.financeiro.aditivos) },
                      { label: 'Valor total (com aditivos)', value: formatCurrency(obra.financeiro.valorTotal), bold: true },
                      { label: 'Saldo a receber', value: formatCurrency(obra.financeiro.saldoReceber) },
                      { label: 'Percentual recebido', value: `${obra.financeiro.percentualRecebido}%` },
                      { label: 'Percentual executado', value: `${obra.financeiro.percentualExecutado}%` },
                    ].map(({ label, value, bold }) => (
                      <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '7px 0', color: '#6b7280' }}>{label}</td>
                        <td style={{ padding: '7px 0', fontWeight: bold ? 800 : 600, textAlign: 'right', color: '#111827' }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* ── Tarefas ───────────────────────────────────────────────────── */}
              <section className="mb-8">
                <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}>task_alt</span>
                  Tarefas ({obra.tarefas.length} total)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  {[
                    { label: 'Pendentes', count: tarefasPorStatus.pendente, color: '#f59e0b' },
                    { label: 'Em Andamento', count: tarefasPorStatus.em_andamento, color: '#3b82f6' },
                    { label: 'Bloqueadas', count: tarefasPorStatus.bloqueado, color: '#ef4444' },
                    { label: 'Concluídas', count: tarefasPorStatus.concluido, color: '#10b981' },
                  ].map(({ label, count, color }) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', fontWeight: 800, color, margin: '0 0 2px' }}>{count}</p>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
                {obra.tarefas.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Título', 'Status', 'Prioridade', 'Responsável', 'Progresso'].map((h) => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '11px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {obra.tarefas.slice(0, 8).map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 8px', color: '#111827', fontWeight: 500 }}>{t.titulo}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{TAREFA_STATUS_LABELS[t.status]}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{PRIORIDADE_LABELS[t.prioridade]}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{t.responsavel}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{t.progresso ?? 0}%</td>
                        </tr>
                      ))}
                      {obra.tarefas.length > 8 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '6px 8px', color: '#9ca3af', fontStyle: 'italic', fontSize: '11px' }}>
                            + {obra.tarefas.length - 8} tarefa(s) não exibidas. Exporte o CSV para ver todas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </section>

              {/* ── Etapas ────────────────────────────────────────────────────── */}
              {obra.etapas.length > 0 && (
                <section className="mb-8">
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}>timeline</span>
                    Etapas do Cronograma
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Etapa', 'Progresso', 'Tarefas Concluídas'].map((h) => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '11px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {obra.etapas.map((etapa) => {
                        const concluidas = etapa.tarefas.filter((t) => t.concluida).length;
                        return (
                          <tr key={etapa.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '6px 8px', color: '#111827', fontWeight: 500 }}>{etapa.nome}</td>
                            <td style={{ padding: '6px 8px', color: '#6b7280' }}>{etapa.progresso}%</td>
                            <td style={{ padding: '6px 8px', color: '#6b7280' }}>
                              {concluidas}/{etapa.tarefas.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )}

              {/* ── Equipe ────────────────────────────────────────────────────── */}
              {obra.equipe.length > 0 && (
                <section className="mb-8">
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}>groups</span>
                    Equipe ({obra.equipe.filter((m) => m.ativo !== false).length} ativo(s))
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Nome', 'Função', 'Tipo', 'Telefone', 'E-mail'].map((h) => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '11px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {obra.equipe.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 8px', color: '#111827', fontWeight: 500 }}>{m.nome}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{m.papel}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280', textTransform: 'capitalize' }}>{m.tipo}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{m.telefone ?? '—'}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{m.email ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* ── Ocorrências Abertas ───────────────────────────────────────── */}
              <section className="mb-8">
                <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ef4444' }}>warning</span>
                  Ocorrências em Aberto
                </h2>
                {ocorrenciasAbertas.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#10b981', fontStyle: 'italic' }}>
                    Nenhuma ocorrência em aberto. Ótimo!
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Título', 'Severidade', 'Responsável', 'Data Abertura', 'Prazo'].map((h) => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '11px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ocorrenciasAbertas.map((oc) => (
                        <tr key={oc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 8px', color: '#111827', fontWeight: 500 }}>{oc.titulo}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{OCORRENCIA_SEVERIDADE[oc.severidade]}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{oc.responsavel}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{oc.dataAbertura}</td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>{oc.prazo ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {/* ── Rodapé ────────────────────────────────────────────────────── */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
                  Gerado pelo Obra Manager em {hoje()}
                </p>
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>
                  Confidencial — uso interno
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-5 border-t border-gray-100 dark:border-gray-800 flex flex-row justify-end gap-2 shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" size="sm" onClick={handleDownload} disabled={loading}>
            {loading ? (
              <>
                <span className="material-symbols-outlined text-sm mr-1 animate-spin">progress_activity</span>
                Gerando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm mr-1">download</span>
                Baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
