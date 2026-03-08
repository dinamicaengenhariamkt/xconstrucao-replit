'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import type { CandidaturaRecebida } from '../types';
import { IconPhone, IconClose, IconCheck, IconCheckCircle, IconCancel, IconGroups, IconInfo, IconStar } from '@shared/components/icons';

interface CandidaturasCardProps {
  candidaturas: CandidaturaRecebida[];
  obraOrcamento: number;
}

const STATUS_LABELS: Record<CandidaturaRecebida['status'], string> = {
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const STATUS_CLASSES: Record<CandidaturaRecebida['status'], string> = {
  em_analise: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  aprovado: 'bg-green-500/10 text-green-600 dark:text-green-400',
  rejeitado: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
};

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

interface PropostaModalProps {
  candidatura: CandidaturaRecebida;
  status: CandidaturaRecebida['status'];
  obraOrcamento: number;
  onAprovar: () => void;
  onRejeitar: () => void;
  onClose: () => void;
}

function PropostaModal({ candidatura, status, obraOrcamento, onAprovar, onRejeitar, onClose }: PropostaModalProps) {
  const diffPct = Math.round(((candidatura.valorProposto - obraOrcamento) / obraOrcamento) * 100);
  const diffSign = diffPct > 0 ? '+' : '';
  const diffColor = diffPct > 5 ? 'text-red-500' : diffPct < -5 ? 'text-green-600' : 'text-gray-500';

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              {candidatura.empreiteiro.empresa && (
                <p className="text-sm text-gray-500">{candidatura.empreiteiro.empresa}</p>
              )}
              {candidatura.empreiteiro.avaliacao && (
                <StarRating value={candidatura.empreiteiro.avaliacao} />
              )}
            </div>
          </div>
          <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0', STATUS_CLASSES[status])}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-5 mt-2">
        {/* Valor e prazo em destaque */}
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

        {/* Contato */}
        {candidatura.empreiteiro.telefone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <IconPhone className="text-base text-gray-400" />
            {candidatura.empreiteiro.telefone}
            <span className="text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">{candidatura.dataEnvio}</span>
          </div>
        )}

        {/* Descrição da empresa */}
        {candidatura.descricao && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sobre o empreiteiro</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{candidatura.descricao}</p>
          </div>
        )}

        {/* Atividades / Orçamento detalhado */}
        {candidatura.atividades && candidatura.atividades.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalhamento da proposta</p>
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

        {/* Observações de prazo */}
        {candidatura.observacoesPrazo && (
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Observações sobre o prazo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{candidatura.observacoesPrazo}</p>
          </div>
        )}

        {/* Observações financeiras */}
        {candidatura.observacoesFinanceiras && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Condições financeiras</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{candidatura.observacoesFinanceiras}</p>
          </div>
        )}

        {/* Ações */}
        {status === 'em_analise' && (
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => { onRejeitar(); onClose(); }}
            >
              <IconClose className="text-base mr-1.5" />
              Rejeitar proposta
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { onAprovar(); onClose(); }}
            >
              <IconCheck className="text-base mr-1.5" />
              Aprovar empreiteiro
            </Button>
          </div>
        )}

        {status === 'aprovado' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900/30">
            <IconCheckCircle className="text-green-600 text-xl" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Proposta aprovada — empreiteiro selecionado para esta obra.</p>
          </div>
        )}

        {status === 'rejeitado' && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <IconCancel className="text-gray-400 text-xl" />
            <p className="text-sm text-gray-500">Esta proposta foi rejeitada.</p>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export function CandidaturasCard({ candidaturas, obraOrcamento }: CandidaturasCardProps) {
  const [statuses, setStatuses] = useState<Record<string, CandidaturaRecebida['status']>>(
    () => Object.fromEntries(candidaturas.map((c) => [c.id, c.status]))
  );
  const [selected, setSelected] = useState<CandidaturaRecebida | null>(null);

  const handleAprovar = (id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: 'aprovado' }));
  };

  const handleRejeitar = (id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: 'rejeitado' }));
  };

  const emAnalise = Object.values(statuses).filter((s) => s === 'em_analise').length;

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
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
            const status = statuses[candidatura.id];
            const diffPct = Math.round(((candidatura.valorProposto - obraOrcamento) / obraOrcamento) * 100);
            const diffSign = diffPct > 0 ? '+' : '';
            const diffColor = diffPct > 5 ? 'text-red-500' : diffPct < -5 ? 'text-green-600' : 'text-gray-500';

            return (
              <div
                key={candidatura.id}
                className={cn(
                  'px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all',
                  status === 'aprovado' && 'border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10',
                  status === 'rejeitado' && 'opacity-50'
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                </div>

                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', candidatura.empreiteiro.cor)}>
                    {candidatura.empreiteiro.iniciais}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{candidatura.empreiteiro.nome}</p>
                    {candidatura.empreiteiro.empresa && (
                      <p className="text-xs text-gray-500 truncate">{candidatura.empreiteiro.empresa}</p>
                    )}
                    {candidatura.empreiteiro.avaliacao && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <IconStar className="text-amber-400 text-xs leading-none" />
                        <span className="text-[10px] text-gray-500">{candidatura.empreiteiro.avaliacao.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Valor proposto */}
                <div className="flex-shrink-0 text-right sm:text-left">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Valor Proposto</p>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatCurrency(candidatura.valorProposto)}</p>
                  <p className={cn('text-[10px] font-bold', diffColor)}>{diffSign}{diffPct}% do orçamento</p>
                </div>

                {/* Prazo */}
                <div className="flex-shrink-0 text-right sm:text-left">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Prazo</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{candidatura.prazoMeses} meses</p>
                  <p className="text-[10px] text-gray-400">{candidatura.dataEnvio}</p>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider', STATUS_CLASSES[status])}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelected(candidatura)}
                    className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    Ver proposta
                  </button>
                  {status === 'em_analise' && (
                    <>
                      <button
                        onClick={() => handleRejeitar(candidatura.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Rejeitar"
                      >
                        <IconClose className="text-base leading-none" />
                      </button>
                      <button
                        onClick={() => handleAprovar(candidatura.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                        title="Aprovar"
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
            Clique em <strong>Ver proposta</strong> para ver o detalhamento completo. Use os botões de aprovação para selecionar o empreiteiro ideal.
          </p>
        </div>
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <PropostaModal
            candidatura={selected}
            status={statuses[selected.id]}
            obraOrcamento={obraOrcamento}
            onAprovar={() => handleAprovar(selected.id)}
            onRejeitar={() => handleRejeitar(selected.id)}
            onClose={() => setSelected(null)}
          />
        )}
      </Dialog>
    </>
  );
}
