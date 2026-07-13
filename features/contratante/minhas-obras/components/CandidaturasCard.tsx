'use client';

import { useMemo, useState } from 'react';
import { cn } from '@shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { toast } from '@shared/hooks/use-toast';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import {
  IconPhone, IconClose, IconCheck, IconCheckCircle,
  IconCancel, IconGroups, IconInfo, IconStar,
} from '@shared/components/icons';
import {
  useCandidaturasObra,
  useAceitarCandidatura,
  useRejeitarCandidatura,
} from '../hooks/use-candidaturas';
import type { CandidaturaApiRow } from '../api/candidaturas-service';

interface CandidaturasCardProps {
  obraId: string;
  obraOrcamento: number;
}

type UiStatus = 'em_analise' | 'aprovado' | 'rejeitado';

interface CandidaturaUI {
  id: string;
  empreiteiro: {
    nome: string;
    iniciais: string;
    cor: string;
    empresa?: string;
    telefone?: string;
    avaliacao?: number;
  };
  valorProposto: number;
  prazoMeses: number;
  dataEnvio: string;
  status: UiStatus;
  descricao?: string;
  atividades?: { id: string; descricao: string; valor: number; observacoes?: string }[];
  observacoesPrazo?: string;
  observacoesFinanceiras?: string;
  dataInicio?: string;
  dataTermino?: string;
  motivoRejeicao?: string;
  canceladaPeloEmpreiteiro?: boolean;
  anexos?: Array<{ id: string; originalName: string; mime: string; sizeBytes: number; url: string | null }>;
}

const STATUS_LABELS: Record<UiStatus, string> = {
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const STATUS_CLASSES: Record<UiStatus, string> = {
  em_analise: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  aprovado: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rejeitado: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
};

const AVATAR_PALETTE = [
  'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500',
  'bg-violet-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-teal-500',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mapStatus(s: CandidaturaApiRow['status']): UiStatus {
  if (s === 'pendente') return 'em_analise';
  if (s === 'aceita') return 'aprovado';
  return 'rejeitado';
}

function formatDateBR(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

/** Converte valor monetário BR (ex.: "R$ 1.500,00" ou "1500.50") para number. */
function parseBrMoney(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const stripped = v.replace(/[^\d,.]/g, '');
  if (!stripped) return 0;
  // Formato PT-BR: ponto = milhar, vírgula = decimal.
  // Se houver vírgula, remover todos os pontos (milhar) e trocar a vírgula por ponto.
  if (stripped.includes(',')) {
    return Number(stripped.replace(/\./g, '').replace(',', '.')) || 0;
  }
  // Formato numérico direto ("1500" ou "1500.50").
  return Number(stripped) || 0;
}

function parseAtividades(raw: string | null): CandidaturaUI['atividades'] {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .map((a: any) => ({
        id: String(a?.id ?? crypto.randomUUID?.() ?? String(Math.random())),
        descricao: String(a?.descricao ?? ''),
        valor: parseBrMoney(a?.valor),
        observacoes: a?.observacoes || undefined,
      }))
      .filter((a) => a.descricao);
  } catch {
    return undefined;
  }
}

function mapApiRowToUi(row: CandidaturaApiRow): CandidaturaUI {
  const nome = row.empreiteiraEmpresa || row.empreiteiroNome || 'Empreiteiro';
  const seed = row.empreiteiroUserId || row.id;
  return {
    id: row.id,
    empreiteiro: {
      nome,
      iniciais: getIniciais(nome),
      cor: AVATAR_PALETTE[hashStr(seed) % AVATAR_PALETTE.length],
      empresa: row.empreiteiraEmpresa || undefined,
      telefone: row.empreiteiraTelefone || undefined,
      avaliacao: row.empreiteiraAvaliacao ? Number(row.empreiteiraAvaliacao) : undefined,
    },
    valorProposto: Number(row.valorProposta) || 0,
    prazoMeses: row.prazoEstimado ?? 0,
    dataEnvio: formatDateBR(row.createdAt),
    status: mapStatus(row.status),
    descricao: row.descricao || undefined,
    atividades: parseAtividades(row.atividades),
    observacoesPrazo: row.observacoesPrazo || undefined,
    observacoesFinanceiras: row.observacoesFinanceiras || undefined,
    dataInicio: row.dataInicio || undefined,
    dataTermino: row.dataTermino || undefined,
    motivoRejeicao: row.motivoRejeicao || undefined,
    canceladaPeloEmpreiteiro: row.canceladaPeloEmpreiteiro,
    anexos: row.anexos?.map((a) => ({ id: a.id, originalName: a.originalName, mime: a.mime, sizeBytes: a.sizeBytes, url: a.url })) ?? [],
  };
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <IconStar
          key={star}
          className={cn('text-sm', star <= Math.round(value) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600')}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function PropostaModal({
  candidatura,
  obraOrcamento,
  onAprovar,
  onRejeitar,
  onClose,
  isSubmitting,
}: {
  candidatura: CandidaturaUI;
  obraOrcamento: number;
  onAprovar: () => void;
  onRejeitar: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const diffPct = obraOrcamento > 0
    ? Math.round(((candidatura.valorProposto - obraOrcamento) / obraOrcamento) * 100)
    : 0;
  const diffSign = diffPct > 0 ? '+' : '';
  const diffColor = diffPct > 5 ? 'text-red-500' : diffPct < -5 ? 'text-green-600' : 'text-gray-500';

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-proposta">
      <DialogHeader>
        <div className="flex items-start justify-between gap-4 pr-6">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0', candidatura.empreiteiro.cor)}>
              {candidatura.empreiteiro.iniciais}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {candidatura.empreiteiro.nome}
              </DialogTitle>
              {candidatura.empreiteiro.empresa && candidatura.empreiteiro.empresa !== candidatura.empreiteiro.nome && (
                <p className="text-sm text-gray-500">{candidatura.empreiteiro.empresa}</p>
              )}
              {candidatura.empreiteiro.avaliacao !== undefined && candidatura.empreiteiro.avaliacao > 0 && (
                <StarRating value={candidatura.empreiteiro.avaliacao} />
              )}
            </div>
          </div>
          <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0', STATUS_CLASSES[candidatura.status])}>
            {STATUS_LABELS[candidatura.status]}
          </span>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-5 mt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valor proposto</p>
            <p className="text-2xl font-extrabold text-primary">{formatCurrency(candidatura.valorProposto)}</p>
            <p className={cn('text-xs font-bold mt-1', diffColor)}>{diffSign}{diffPct}% do orçamento</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prazo de execução</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{candidatura.prazoMeses} meses</p>
            {(candidatura.dataInicio || candidatura.dataTermino) && (
              <p className="text-xs text-gray-500 mt-1">
                {candidatura.dataInicio && candidatura.dataTermino
                  ? `${candidatura.dataInicio} → ${candidatura.dataTermino}`
                  : candidatura.dataInicio || candidatura.dataTermino}
              </p>
            )}
          </div>
        </div>

        {candidatura.empreiteiro.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <IconPhone className="text-base text-gray-400" />
            {candidatura.empreiteiro.telefone}
            {candidatura.dataEnvio && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">enviada em {candidatura.dataEnvio}</span>
              </>
            )}
          </div>
        )}

        {candidatura.descricao && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo da proposta</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{candidatura.descricao}</p>
          </div>
        )}

        {candidatura.atividades && candidatura.atividades.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalhamento</p>
            <div className="flex flex-col gap-2">
              {candidatura.atividades.map((atividade) => (
                <div key={atividade.id} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{atividade.descricao}</p>
                    {atividade.observacoes && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{atividade.observacoes}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">{formatCurrency(atividade.valor)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 px-1">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Total da proposta</p>
                <p className="text-base font-extrabold text-primary">{formatCurrency(candidatura.valorProposto)}</p>
              </div>
            </div>
          </div>
        )}

        {candidatura.observacoesPrazo && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Observações sobre o prazo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{candidatura.observacoesPrazo}</p>
          </div>
        )}

        {candidatura.anexos && candidatura.anexos.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Anexos ({candidatura.anexos.length})</p>
            <div className="flex flex-col gap-2">
              {candidatura.anexos.map((anexo) => {
                const sizeKb = anexo.sizeBytes / 1024;
                const sizeLabel = sizeKb < 1024 ? `${sizeKb.toFixed(1)} KB` : `${(sizeKb / 1024).toFixed(1)} MB`;
                return (
                  <a
                    key={anexo.id}
                    href={anexo.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors',
                      anexo.url
                        ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5'
                        : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 opacity-50 pointer-events-none',
                    )}
                    data-testid={`link-anexo-${anexo.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{anexo.originalName}</p>
                      <p className="text-xs text-gray-500">{sizeLabel}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary flex-shrink-0">Baixar</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {candidatura.observacoesFinanceiras && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Condições financeiras</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{candidatura.observacoesFinanceiras}</p>
          </div>
        )}

        {candidatura.status === 'em_analise' && (
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={onRejeitar}
              disabled={isSubmitting}
              data-testid="button-rejeitar-modal"
            >
              <IconClose className="text-base mr-1.5" />
              Rejeitar proposta
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={onAprovar}
              disabled={isSubmitting}
              data-testid="button-aprovar-modal"
            >
              <IconCheck className="text-base mr-1.5" />
              Aprovar empreiteiro
            </Button>
          </div>
        )}

        {candidatura.status === 'aprovado' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/30">
            <IconCheckCircle className="text-green-600 text-xl" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Proposta aprovada — empreiteiro selecionado para esta obra.</p>
          </div>
        )}

        {candidatura.status === 'rejeitado' && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <IconCancel className="text-gray-400 text-xl" />
            <p className="text-sm text-gray-500">
              {candidatura.canceladaPeloEmpreiteiro
                ? 'O empreiteiro cancelou esta proposta.'
                : (candidatura.motivoRejeicao || 'Esta proposta foi rejeitada.')}
            </p>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export function CandidaturasCard({ obraId, obraOrcamento }: CandidaturasCardProps) {
  const { data: rows, isLoading } = useCandidaturasObra(obraId);
  const aceitar = useAceitarCandidatura(obraId);
  const rejeitar = useRejeitarCandidatura(obraId);

  const candidaturas = useMemo<CandidaturaUI[]>(
    () => (rows ?? []).map(mapApiRowToUi),
    [rows],
  );

  const [selected, setSelected] = useState<CandidaturaUI | null>(null);
  const [confirmAprovar, setConfirmAprovar] = useState<CandidaturaUI | null>(null);
  const [confirmRejeitar, setConfirmRejeitar] = useState<CandidaturaUI | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  const emAnalise = candidaturas.filter((c) => c.status === 'em_analise').length;
  const concorrentes = emAnalise > 0 ? emAnalise - 1 : 0;
  const submitting = aceitar.isPending || rejeitar.isPending;

  function handleAprovarClick(cand: CandidaturaUI) {
    setConfirmAprovar(cand);
  }
  function handleRejeitarClick(cand: CandidaturaUI) {
    setMotivoRejeicao('');
    setConfirmRejeitar(cand);
  }
  function confirmAprovarSubmit() {
    if (!confirmAprovar) return;
    const cand = confirmAprovar;
    aceitar.mutate({ id: cand.id }, {
      onSuccess: () => {
        toast({ title: 'Proposta aprovada', description: `${cand.empreiteiro.nome} foi vinculado(a) à obra.` });
        setConfirmAprovar(null);
        setSelected(null);
      },
      onError: (err: any) => {
        const msg = String(err?.message ?? '');
        const friendly =
          msg.includes('OBRA_JA_TEM_EMPREITEIRA') ? 'Esta obra já tem empreiteira contratada.' :
          msg.includes('EMPREITEIRO_SEM_PERFIL') ? 'O empreiteiro selecionado não tem perfil de empresa configurado.' :
          msg.includes('INVALID_STATE') ? 'Esta proposta não está mais pendente.' :
          'Não foi possível aprovar a proposta. Tente novamente.';
        toast({ title: 'Erro ao aprovar', description: friendly, variant: 'destructive' });
        setConfirmAprovar(null);
      },
    });
  }
  function confirmRejeitarSubmit() {
    if (!confirmRejeitar) return;
    const cand = confirmRejeitar;
    rejeitar.mutate({ id: cand.id, motivo: motivoRejeicao.trim() || undefined }, {
      onSuccess: () => {
        toast({ title: 'Proposta rejeitada', description: 'O empreiteiro será notificado.' });
        setConfirmRejeitar(null);
        setSelected(null);
      },
      onError: (err: any) => {
        const msg = String(err?.message ?? '');
        const friendly = msg.includes('INVALID_STATE')
          ? 'Esta proposta não está mais pendente.'
          : 'Não foi possível rejeitar a proposta. Tente novamente.';
        toast({ title: 'Erro ao rejeitar', description: friendly, variant: 'destructive' });
        setConfirmRejeitar(null);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6" data-testid="candidaturas-loading">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (candidaturas.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center" data-testid="candidaturas-empty">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <IconGroups className="text-xl" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Nenhuma proposta recebida ainda</h3>
        <p className="text-sm text-gray-500">
          Assim que empreiteiros se candidatarem à sua obra, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden" data-testid="candidaturas-card">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconGroups className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Propostas Recebidas</h2>
              <p className="text-xs text-gray-500">Empreiteiros interessados nesta obra</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
              {candidaturas.length} proposta{candidaturas.length !== 1 ? 's' : ''}
            </span>
            {emAnalise > 0 && (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                {emAnalise} em análise
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {candidaturas.map((candidatura, index) => {
            const status = candidatura.status;
            const diffPct = obraOrcamento > 0
              ? Math.round(((candidatura.valorProposto - obraOrcamento) / obraOrcamento) * 100)
              : 0;
            const diffSign = diffPct > 0 ? '+' : '';
            const diffColor = diffPct > 5 ? 'text-red-500' : diffPct < -5 ? 'text-green-600' : 'text-gray-500';

            return (
              <div
                key={candidatura.id}
                className={cn(
                  'px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all',
                  status === 'aprovado' && 'border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10',
                  status === 'rejeitado' && 'opacity-50',
                )}
                data-testid={`row-candidatura-${candidatura.id}`}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', candidatura.empreiteiro.cor)}>
                    {candidatura.empreiteiro.iniciais}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{candidatura.empreiteiro.nome}</p>
                    {candidatura.empreiteiro.empresa && candidatura.empreiteiro.empresa !== candidatura.empreiteiro.nome && (
                      <p className="text-xs text-gray-500 truncate">{candidatura.empreiteiro.empresa}</p>
                    )}
                    {candidatura.empreiteiro.avaliacao !== undefined && candidatura.empreiteiro.avaliacao > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <IconStar className="text-amber-400 text-xs leading-none" />
                        <span className="text-[10px] text-gray-500">{candidatura.empreiteiro.avaliacao.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right sm:text-left">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Valor Proposto</p>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(candidatura.valorProposto)}</p>
                  {obraOrcamento > 0 && (
                    <p className={cn('text-[10px] font-bold', diffColor)}>{diffSign}{diffPct}% do orçamento</p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right sm:text-left">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Prazo</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{candidatura.prazoMeses} meses</p>
                  {candidatura.dataEnvio && <p className="text-[10px] text-gray-400">{candidatura.dataEnvio}</p>}
                </div>

                <div className="flex-shrink-0">
                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider', STATUS_CLASSES[status])}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelected(candidatura)}
                    className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                    data-testid={`button-ver-${candidatura.id}`}
                  >
                    Ver proposta
                  </button>
                  {status === 'em_analise' && (
                    <>
                      <button
                        onClick={() => handleRejeitarClick(candidatura)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Rejeitar"
                        disabled={submitting}
                        data-testid={`button-rejeitar-${candidatura.id}`}
                      >
                        <IconClose className="text-base leading-none" />
                      </button>
                      <button
                        onClick={() => handleAprovarClick(candidatura)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Aprovar"
                        disabled={submitting}
                        data-testid={`button-aprovar-${candidatura.id}`}
                      >
                        <IconCheck className="text-base leading-none" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <IconInfo className="text-gray-400 text-base" />
          <p className="text-xs text-gray-500">
            Clique em <strong>Ver proposta</strong> para ver o detalhamento completo. Aprovar uma proposta vincula o empreiteiro à obra e rejeita as demais — a ação é irreversível.
          </p>
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <PropostaModal
            candidatura={selected}
            obraOrcamento={obraOrcamento}
            onAprovar={() => handleAprovarClick(selected)}
            onRejeitar={() => handleRejeitarClick(selected)}
            onClose={() => setSelected(null)}
            isSubmitting={submitting}
          />
        )}
      </Dialog>

      {/* Confirm aprovar */}
      <Dialog open={!!confirmAprovar} onOpenChange={(open) => !open && !submitting && setConfirmAprovar(null)}>
        <DialogContent data-testid="confirm-aprovar">
          <DialogHeader>
            <DialogTitle>Aprovar {confirmAprovar?.empreiteiro.nome}?</DialogTitle>
            <DialogDescription>
              Isso vai vincular este empreiteiro à obra e <strong>rejeitar automaticamente
              {concorrentes > 0 ? ` as outras ${concorrentes} proposta${concorrentes !== 1 ? 's' : ''} pendente${concorrentes !== 1 ? 's' : ''}` : ' qualquer outra proposta pendente'}</strong>.
              A obra passará a status "em andamento". <strong>Ação irreversível.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAprovar(null)} disabled={submitting}>Cancelar</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={confirmAprovarSubmit}
              disabled={submitting}
              data-testid="button-confirm-aprovar"
            >
              {aceitar.isPending ? 'Aprovando…' : 'Sim, aprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm rejeitar */}
      <Dialog open={!!confirmRejeitar} onOpenChange={(open) => !open && !submitting && setConfirmRejeitar(null)}>
        <DialogContent data-testid="confirm-rejeitar">
          <DialogHeader>
            <DialogTitle>Rejeitar proposta de {confirmRejeitar?.empreiteiro.nome}?</DialogTitle>
            <DialogDescription>
              O empreiteiro será notificado. Você pode (opcionalmente) informar um motivo abaixo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo (opcional, até 500 caracteres)"
            maxLength={500}
            value={motivoRejeicao}
            onChange={(e) => setMotivoRejeicao(e.target.value)}
            data-testid="input-motivo-rejeicao"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRejeitar(null)} disabled={submitting}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={confirmRejeitarSubmit}
              disabled={submitting}
              data-testid="button-confirm-rejeitar"
            >
              {rejeitar.isPending ? 'Rejeitando…' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
