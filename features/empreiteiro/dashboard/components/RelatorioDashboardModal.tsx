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
import type {
  DashboardStats,
  FinancialOverview,
  Activity,
  ActivityType,
  EfficiencyData,
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatActivityTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'ontem';
  return `há ${Math.floor(diff / 86400)} dias`;
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  payment: 'Pagamento',
  milestone: 'Marco',
  delivery: 'Entrega',
  contract: 'Contrato',
  alert: 'Alerta',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface RelatorioDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: DashboardStats;
  financial: FinancialOverview;
  activities: Activity[];
  efficiency: EfficiencyData;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RelatorioDashboardModal({
  open,
  onOpenChange,
  stats,
  financial,
  activities,
  efficiency,
}: RelatorioDashboardModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const recentActivities = activities.slice(0, 10);

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

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`relatorio-gerencial-${date}.pdf`);
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
              <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Relatório Gerencial
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Pré-visualização — clique em &quot;Baixar PDF&quot; para exportar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview */}
        <ScrollArea className="flex-1 bg-gray-100 dark:bg-gray-950">
          <div className="p-6">
            {/* A4-like page */}
            <div
              ref={reportRef}
              className="bg-white text-gray-900 mx-auto p-10 shadow-xl"
              style={{ width: '794px', minHeight: '1000px', fontFamily: 'system-ui, sans-serif' }}
            >
              {/* ── Cabeçalho ──────────────────────────────────────────────── */}
              <div
                className="flex items-start justify-between mb-8 pb-6"
                style={{ borderBottom: '2px solid #e5e7eb' }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary, #2563eb)' }}
                    >
                      <span
                        style={{ color: 'white', fontSize: '20px' }}
                        className="material-symbols-outlined"
                      >
                        construction
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#9ca3af',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Obra Manager
                    </span>
                  </div>
                  <h1
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 4px',
                    }}
                  >
                    Relatório Gerencial de Obras
                  </h1>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    Visão consolidada de desempenho e finanças
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>
                    Relatório gerado em
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{hoje()}</p>
                </div>
              </div>

              {/* ── Visão Geral das Obras ───────────────────────────────────── */}
              <section style={{ marginBottom: '28px' }}>
                <h2
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#111827',
                    margin: '0 0 12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}
                  >
                    apartment
                  </span>
                  Visão Geral das Obras
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                  }}
                >
                  {[
                    {
                      label: 'Obras Ativas',
                      value: String(stats.obrasAtivas),
                      sub: `+${stats.obrasAtivasDelta} novos`,
                      color: '#2563eb',
                    },
                    {
                      label: 'Obras Concluídas',
                      value: String(stats.obrasConcluidas),
                      sub: stats.obrasConcluidasPeriodo,
                      color: '#10b981',
                    },
                    {
                      label: 'Valor Recebido',
                      value: formatCurrency(stats.valorRecebido),
                      sub: `+${stats.valorRecebidoDelta}% vs. mês anterior`,
                      color: '#10b981',
                    },
                    {
                      label: 'Valor Gasto',
                      value: formatCurrency(stats.valorGasto),
                      sub: stats.valorGastoPeriodo,
                      color: '#f59e0b',
                    },
                  ].map(({ label, value, sub, color }) => (
                    <div
                      key={label}
                      style={{
                        background: '#f9fafb',
                        borderRadius: '8px',
                        padding: '14px',
                        borderTop: `3px solid ${color}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: '#111827',
                          margin: '0 0 4px',
                        }}
                      >
                        {value}
                      </p>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Indicadores de Desempenho ───────────────────────────────── */}
              <section style={{ marginBottom: '28px' }}>
                <h2
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#111827',
                    margin: '0 0 12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}
                  >
                    trending_up
                  </span>
                  Indicadores de Desempenho
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                  }}
                >
                  {[
                    {
                      label: 'Margem de Lucro',
                      value: `${financial.margemLucro}%`,
                      sub:
                        financial.margemLucroTrend === 'up'
                          ? '↑ em alta'
                          : financial.margemLucroTrend === 'down'
                            ? '↓ em queda'
                            : '→ estável',
                      color: financial.margemLucroTrend === 'down' ? '#ef4444' : '#10b981',
                    },
                    {
                      label: 'Ticket Médio / Obra',
                      value: formatCurrency(financial.ticketMedio),
                      sub: `+${financial.ticketMedioDelta}% vs. período anterior`,
                      color: '#2563eb',
                    },
                    {
                      label: 'Taxa de Conclusão',
                      value: `${financial.taxaConclusao}%`,
                      sub: `+${financial.taxaConclusaoDelta}% vs. período anterior`,
                      color: '#10b981',
                    },
                    {
                      label: 'Eficiência da Semana',
                      value: `${efficiency.percentage}%`,
                      sub: efficiency.period,
                      color: efficiency.percentage >= 80 ? '#10b981' : '#f59e0b',
                    },
                  ].map(({ label, value, sub, color }) => (
                    <div
                      key={label}
                      style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px' }}
                    >
                      <p
                        style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: '22px',
                          fontWeight: 800,
                          color,
                          margin: '0 0 4px',
                        }}
                      >
                        {value}
                      </p>
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Fluxo de Caixa Mensal ───────────────────────────────────── */}
              {financial.fluxoCaixa.length > 0 && (
                <section style={{ marginBottom: '28px' }}>
                  <h2
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}
                    >
                      payments
                    </span>
                    Fluxo de Caixa Mensal
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Mês', 'Receitas', 'Despesas', 'Saldo'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '7px 10px',
                              textAlign: h === 'Mês' ? 'left' : 'right',
                              color: '#6b7280',
                              fontWeight: 600,
                              fontSize: '11px',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {financial.fluxoCaixa.map(({ mes, receitas, despesas }) => {
                        const saldo = receitas - despesas;
                        return (
                          <tr key={mes} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td
                              style={{
                                padding: '7px 10px',
                                color: '#374151',
                                fontWeight: 600,
                              }}
                            >
                              {mes}
                            </td>
                            <td
                              style={{
                                padding: '7px 10px',
                                textAlign: 'right',
                                color: '#111827',
                              }}
                            >
                              {formatCurrency(receitas)}
                            </td>
                            <td
                              style={{
                                padding: '7px 10px',
                                textAlign: 'right',
                                color: '#111827',
                              }}
                            >
                              {formatCurrency(despesas)}
                            </td>
                            <td
                              style={{
                                padding: '7px 10px',
                                textAlign: 'right',
                                fontWeight: 700,
                                color: saldo >= 0 ? '#10b981' : '#ef4444',
                              }}
                            >
                              {formatCurrency(saldo)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )}

              {/* ── Atividades Recentes ─────────────────────────────────────── */}
              {recentActivities.length > 0 && (
                <section style={{ marginBottom: '28px' }}>
                  <h2
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', color: 'var(--primary, #2563eb)' }}
                    >
                      history
                    </span>
                    Atividades Recentes (últimas {recentActivities.length})
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Tipo', 'Título', 'Obra', 'Quando'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '6px 8px',
                              textAlign: 'left',
                              color: '#6b7280',
                              fontWeight: 600,
                              fontSize: '11px',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.map((a) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>
                            {ACTIVITY_TYPE_LABELS[a.type]}
                          </td>
                          <td
                            style={{
                              padding: '6px 8px',
                              color: '#111827',
                              fontWeight: 500,
                            }}
                          >
                            {a.title}
                          </td>
                          <td style={{ padding: '6px 8px', color: '#6b7280' }}>
                            {a.obraNome ?? '—'}
                          </td>
                          <td style={{ padding: '6px 8px', color: '#9ca3af' }}>
                            {formatActivityTime(a.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* ── Rodapé ─────────────────────────────────────────────────── */}
              <div
                style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
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
                <span className="material-symbols-outlined text-sm mr-1 animate-spin">
                  progress_activity
                </span>
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
