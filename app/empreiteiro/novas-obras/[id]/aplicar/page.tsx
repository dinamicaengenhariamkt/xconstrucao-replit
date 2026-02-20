'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useObraDetalhe } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import { ENABLE_MOCK } from '@features/empreiteiro/novas-obras/constants';

interface Atividade {
  id: string;
  descricao: string;
  valor: string;
  observacoes: string;
}

function generateId() {
  return `atividade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function parseCurrencyToNumber(val: string): number {
  return Number(val.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function formatCurrencyInput(val: string): string {
  const num = parseCurrencyToNumber(val);
  if (num === 0 && val === '') return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AplicarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: obra, isLoading } = useObraDetalhe(id);

  const [atividades, setAtividades] = useState<Atividade[]>([
    { id: 'atividade-inicial', descricao: '', valor: '', observacoes: '' },
  ]);
  const [prazoMeses, setPrazoMeses] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [observacoesPrazo, setObservacoesPrazo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const addAtividade = useCallback(() => {
    setAtividades(prev => [...prev, { id: generateId(), descricao: '', valor: '', observacoes: '' }]);
  }, []);

  const removeAtividade = useCallback((atividadeId: string) => {
    setAtividades(prev => prev.filter(a => a.id !== atividadeId));
  }, []);

  const updateAtividade = useCallback((atividadeId: string, field: keyof Atividade, value: string) => {
    setAtividades(prev => prev.map(a => a.id === atividadeId ? { ...a, [field]: value } : a));
  }, []);

  const totalProposta = atividades.reduce((sum, a) => sum + parseCurrencyToNumber(a.valor), 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (ENABLE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        const res = await fetch('/api/empreiteiro/candidaturas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            obraId: id,
            valorProposta: totalProposta.toString(),
            prazoEstimado: prazoMeses ? parseInt(prazoMeses) : null,
            dataInicio: dataInicio || null,
            dataTermino: dataTermino || null,
            descricao: atividades.filter(a => a.descricao).map(a => a.descricao).join('; '),
            observacoesPrazo: observacoesPrazo || null,
            atividades: JSON.stringify(atividades.filter(a => a.descricao)),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Erro ao enviar candidatura');
        }
      }
      setIsSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao enviar candidatura');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 animate-pulse space-y-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-40" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-96" />
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-10 text-center py-20">
        <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">construction</span>
        <h3 className="text-lg font-bold text-gray-500">Obra não encontrada</h3>
        <Link href="/empreiteiro/novas-obras" className="text-primary font-semibold mt-2 inline-block">Voltar para Novas Obras</Link>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="p-10 flex flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-20"
        >
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-success text-5xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3" data-testid="text-success-title">Proposta Enviada!</h2>
          <p className="text-gray-500 mb-8">Sua candidatura para <strong>{obra.titulo}</strong> foi enviada com sucesso. Você será notificado quando o contratante avaliar sua proposta.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/empreiteiro/novas-obras" className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors" data-testid="link-back-novas-obras">
              Ver mais obras
            </Link>
            <Link href={`/empreiteiro/novas-obras/${id}`} className="px-6 py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors" data-testid="link-back-detalhe">
              Voltar aos detalhes
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-10 flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <Link href={`/empreiteiro/novas-obras/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors" data-testid="link-back">
          <span className="material-symbols-outlined text-lg">arrow_back</span>Voltar
        </Link>
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/empreiteiro/novas-obras" className="text-gray-400 hover:text-primary transition-colors">Novas Obras</Link>
          <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>
          <Link href={`/empreiteiro/novas-obras/${id}`} className="text-gray-400 hover:text-primary transition-colors">{obra.titulo}</Link>
          <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>
          <span className="text-primary font-semibold">Aplicar</span>
        </nav>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2" data-testid="text-page-title">Aplicar para a Obra</h1>
        <p className="text-xl font-bold text-primary mb-1">{obra.titulo}</p>
        <p className="text-sm text-gray-500">Preencha os detalhes da sua proposta</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700" data-testid="resumo-obra">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Resumo da Obra</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: 'location_on', label: 'Local', value: obra.endereco },
            { icon: 'home_repair_service', label: 'Tipo', value: obra.tipoObra },
            { icon: 'straighten', label: 'Área', value: obra.areaTotal },
            { icon: 'attach_money', label: 'Orçamento', value: formatCurrency(obra.orcamento) },
            { icon: 'schedule', label: 'Duração', value: obra.prazo },
            { icon: 'signal_cellular_alt', label: 'Complexidade', value: obra.complexidade === 'alta' ? 'Alta' : obra.complexidade === 'media' ? 'Média' : 'Baixa' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 text-lg">{item.icon}</span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" data-testid="bloco-atividades">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Descrição das Atividades</h3>
          <p className="text-sm text-gray-500">Detalhe cada etapa da obra e o valor correspondente</p>
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {atividades.map((atividade, index) => (
              <motion.div
                key={atividade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 relative"
                data-testid={`atividade-${index}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Atividade {index + 1}</h4>
                  {atividades.length > 1 && (
                    <button onClick={() => removeAtividade(atividade.id)} className="text-red-500 hover:text-red-700 transition-colors p-1" data-testid={`button-remove-atividade-${index}`}>
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Descrição da atividade *</label>
                    <input
                      type="text"
                      placeholder="Ex.: Fundação e estrutura"
                      value={atividade.descricao}
                      onChange={(e) => updateAtividade(atividade.id, 'descricao', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
                      data-testid={`input-atividade-descricao-${index}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Valor estimado *</label>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={atividade.valor}
                      onChange={(e) => updateAtividade(atividade.id, 'valor', e.target.value)}
                      onBlur={(e) => updateAtividade(atividade.id, 'valor', formatCurrencyInput(e.target.value))}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
                      data-testid={`input-atividade-valor-${index}`}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Observações (opcional)</label>
                  <textarea
                    placeholder="Ex.: Inclui materiais, mão de obra..."
                    rows={2}
                    value={atividade.observacoes}
                    onChange={(e) => updateAtividade(atividade.id, 'observacoes', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 resize-none"
                    data-testid={`input-atividade-obs-${index}`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={addAtividade}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:border-primary/40 hover:text-primary transition-colors"
            data-testid="button-add-atividade"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-sm font-semibold">+ Adicionar atividade</span>
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" data-testid="bloco-prazo">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prazo de Execução</h3>
          <p className="text-sm text-gray-500">Informe o tempo necessário para concluir a obra</p>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Duração estimada (em meses)</label>
            <input
              type="number"
              min="1"
              placeholder="Ex.: 10"
              value={prazoMeses}
              onChange={(e) => setPrazoMeses(e.target.value)}
              className="w-full max-w-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
              data-testid="input-prazo-meses"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">ou</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Data de início</label>
              <input
                type="month"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="input-data-inicio"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Data de término</label>
              <input
                type="month"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="input-data-termino"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Observações sobre o prazo (opcional)</label>
            <textarea
              placeholder="Ex.: Prazo depende de liberação de alvará"
              rows={2}
              value={observacoesPrazo}
              onChange={(e) => setObservacoesPrazo(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400 resize-none"
              data-testid="input-obs-prazo"
            />
          </div>
        </div>
      </motion.div>

      {totalProposta > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-gray-900 p-8 rounded-xl border-l-4 border-l-primary shadow-sm" data-testid="bloco-resumo-financeiro">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resumo Financeiro</h3>
            <p className="text-sm text-gray-500">Valor total da proposta</p>
          </div>
          <div className="space-y-3 mb-6">
            {atividades.filter(a => a.descricao && parseCurrencyToNumber(a.valor) > 0).map((a, i) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Atividade {i + 1}: {a.descricao}</span>
                <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(parseCurrencyToNumber(a.valor))}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-lg font-bold text-gray-900 dark:text-white">TOTAL DA PROPOSTA</span>
            <span className="text-2xl font-extrabold text-primary" data-testid="text-total-proposta">{formatCurrency(totalProposta)}</span>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex items-center justify-end gap-4 pt-4">
        <Link
          href={`/empreiteiro/novas-obras/${id}`}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium text-sm"
          data-testid="link-cancelar"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || atividades.every(a => !a.descricao)}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-enviar-proposta"
        >
          <span className="material-symbols-outlined text-lg">send</span>
          {isSubmitting ? 'Enviando...' : 'Enviar proposta'}
        </button>
      </motion.div>
    </div>
  );
}
