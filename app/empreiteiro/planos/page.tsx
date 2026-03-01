'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import {
  RiCheckLine,
  RiCloseLine,
  RiSeedlingLine,
  RiRocketLine,
  RiBuilding4Line,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiStarFill,
} from 'react-icons/ri';

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
type PlanId = 'basico' | 'profissional' | 'enterprise';

interface Feature {
  label: string;
  basico: string | boolean;
  profissional: string | boolean;
  enterprise: string | boolean;
}

const FEATURES: Feature[] = [
  { label: 'Obras ativas simultâneas', basico: '2', profissional: '10', enterprise: 'Ilimitado' },
  { label: 'Propostas por mês', basico: '5', profissional: '30', enterprise: 'Ilimitado' },
  { label: 'Fotos no portfólio', basico: '20', profissional: '100', enterprise: 'Ilimitado' },
  { label: 'Visibilidade no diretório', basico: 'Básica', profissional: 'Destacada', enterprise: 'Premium' },
  { label: 'Destaque em novas obras', basico: false, profissional: true, enterprise: true },
  { label: 'Relatórios de desempenho', basico: false, profissional: true, enterprise: true },
  { label: 'Análises com IA', basico: false, profissional: true, enterprise: 'Avançado' },
  { label: 'Suporte', basico: 'E-mail', profissional: 'Prioritário', enterprise: 'Dedicado' },
  { label: 'Exportação de relatórios', basico: false, profissional: true, enterprise: true },
  { label: 'API de integração', basico: false, profissional: false, enterprise: true },
];

const PLANO_ATUAL: PlanId = 'profissional';

const FAQ_ITEMS = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Você pode cancelar sua assinatura a qualquer momento, sem multas ou burocracia. Seu acesso continua ativo até o fim do período pago.',
  },
  {
    q: 'O que acontece com minhas obras se eu fizer downgrade?',
    a: 'Suas obras em andamento são preservadas. Se o número de obras ativas exceder o limite do novo plano, você poderá concluir as existentes mas não poderá iniciar novas até ajustar o número.',
  },
  {
    q: 'Há suporte na migração de plano?',
    a: 'Sim. Nossa equipe de sucesso está disponível para auxiliar em qualquer mudança de plano, tirar dúvidas e garantir que a transição seja tranquila.',
  },
];

/* ─────────────────────────────────────────────
   Feature Row value renderer
───────────────────────────────────────────── */
function FeatureValue({
  value,
  highlight = false,
}: {
  value: string | boolean;
  highlight?: boolean;
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <RiCheckLine className={cn('w-5 h-5 mx-auto', highlight ? 'text-white/90' : 'text-primary')} />
    ) : (
      <RiCloseLine className="w-5 h-5 mx-auto text-gray-300 dark:text-gray-600" />
    );
  }
  return (
    <span className={cn('text-sm font-medium', highlight ? 'text-white/90' : 'text-gray-700 dark:text-gray-300')}>
      {value}
    </span>
  );
}

/* ─────────────────────────────────────────────
   FAQ Item
───────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{q}</span>
        {open ? (
          <RiArrowUpSLine className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <RiArrowDownSLine className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function PlanosPage() {
  const [anual, setAnual] = useState(false);

  const precos = {
    basico:        { mensal: null,   anual: null },
    profissional:  { mensal: 89,    anual: 71 },
    enterprise:    { mensal: 249,   anual: 199 },
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background-dark">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <RiStarFill className="w-3.5 h-3.5" />
            Planos & Preços
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Escolha o plano ideal<br className="hidden sm:block" /> para sua empresa
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Gerencie suas obras, conquiste novos contratos e cresça com as ferramentas certas.
          </p>
        </div>

        {/* ── Toggle Mensal / Anual ── */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={cn('text-sm font-medium transition-colors', !anual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
            Mensal
          </span>
          <button
            onClick={() => setAnual((v) => !v)}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none',
              anual ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
            )}
            aria-label="Alternar cobrança anual"
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                anual ? 'translate-x-6' : 'translate-x-0'
              )}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium transition-colors', anual ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
              Anual
            </span>
            {anual && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wide">
                Economize 20%
              </span>
            )}
          </div>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-16">

          {/* Básico */}
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <RiSeedlingLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Básico</p>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Para começar</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">Grátis</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Sem necessidade de cartão de crédito</p>
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="shrink-0 w-5">
                    {typeof feat.basico === 'boolean' ? (
                      feat.basico
                        ? <RiCheckLine className="w-4 h-4 text-primary" />
                        : <RiCloseLine className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    ) : (
                      <RiCheckLine className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span>
                    {typeof feat.basico === 'string' ? (
                      <><span className="font-semibold text-gray-800 dark:text-gray-200">{feat.basico}</span> {feat.label.toLowerCase()}</>
                    ) : feat.basico ? feat.label : (
                      <span className="line-through text-gray-300 dark:text-gray-600">{feat.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {PLANO_ATUAL === 'basico' ? (
              <button disabled className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-400 cursor-not-allowed">
                Plano atual
              </button>
            ) : (
              <button className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors">
                Começar grátis
              </button>
            )}
          </div>

          {/* Profissional — destacado */}
          <div className="relative bg-primary rounded-3xl shadow-2xl p-8 flex flex-col lg:scale-[1.04] lg:z-10">
            {/* Badge Mais Popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 rounded-full bg-amber-400 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                ⭐ Mais Popular
              </span>
            </div>

            {/* Plano atual badge */}
            {PLANO_ATUAL === 'profissional' && (
              <div className="absolute top-6 right-6">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wide">
                  Seu plano
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <RiRocketLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Profissional</p>
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Mais completo</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold text-white">
                  R$ {anual ? precos.profissional.anual : precos.profissional.mensal}
                </span>
                <span className="text-white/70 text-sm mb-2">/mês</span>
              </div>
              {anual && (
                <p className="text-xs text-white/60 mt-1">Cobrado anualmente (R$ {(precos.profissional.anual! * 12).toLocaleString('pt-BR')}/ano)</p>
              )}
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-center gap-3 text-sm text-white/90">
                  <div className="shrink-0 w-5">
                    {typeof feat.profissional === 'boolean' ? (
                      feat.profissional
                        ? <RiCheckLine className="w-4 h-4 text-white" />
                        : <RiCloseLine className="w-4 h-4 text-white/30" />
                    ) : (
                      <RiCheckLine className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span>
                    {typeof feat.profissional === 'string' ? (
                      <><span className="font-semibold text-white">{feat.profissional}</span> {feat.label.toLowerCase()}</>
                    ) : feat.profissional ? feat.label : (
                      <span className="line-through text-white/30">{feat.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {PLANO_ATUAL === 'profissional' ? (
              <button disabled className="w-full py-3 rounded-xl bg-white/20 text-sm font-bold text-white cursor-not-allowed">
                Plano atual
              </button>
            ) : (
              <button className="w-full py-3 rounded-xl bg-white text-sm font-extrabold text-primary hover:bg-white/90 transition-colors shadow-lg">
                Assinar agora
              </button>
            )}
          </div>

          {/* Enterprise */}
          <div className="relative rounded-3xl p-8 flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 shadow-xl">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 lg:top-6">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                Melhor ROI
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <RiBuilding4Line className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Enterprise</p>
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Para escalar</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold text-white">
                  R$ {anual ? precos.enterprise.anual : precos.enterprise.mensal}
                </span>
                <span className="text-white/50 text-sm mb-2">/mês</span>
              </div>
              {anual && (
                <p className="text-xs text-white/40 mt-1">Cobrado anualmente (R$ {(precos.enterprise.anual! * 12).toLocaleString('pt-BR')}/ano)</p>
              )}
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="shrink-0 w-5">
                    {typeof feat.enterprise === 'boolean' ? (
                      feat.enterprise
                        ? <RiCheckLine className="w-4 h-4 text-emerald-400" />
                        : <RiCloseLine className="w-4 h-4 text-white/20" />
                    ) : (
                      <RiCheckLine className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <span>
                    {typeof feat.enterprise === 'string' ? (
                      <><span className="font-semibold text-white">{feat.enterprise}</span> {feat.label.toLowerCase()}</>
                    ) : feat.enterprise ? feat.label : (
                      <span className="line-through text-white/20">{feat.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {PLANO_ATUAL === 'enterprise' ? (
              <button disabled className="w-full py-3 rounded-xl bg-white/10 text-sm font-bold text-white cursor-not-allowed">
                Plano atual
              </button>
            ) : (
              <button className="w-full py-3 rounded-xl bg-white text-sm font-extrabold text-gray-900 hover:bg-gray-100 transition-colors">
                Falar com comercial
              </button>
            )}
          </div>
        </div>

        {/* ── Feature Comparison Table ── */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Compare todos os recursos
          </h2>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
              <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Recurso</div>
              <div className="p-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Básico</div>
              <div className="p-4 text-center text-xs font-bold text-primary uppercase tracking-wider bg-primary/5">Profissional</div>
              <div className="p-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Enterprise</div>
            </div>
            {/* Rows */}
            {FEATURES.map((feat, idx) => (
              <div
                key={feat.label}
                className={cn(
                  'grid grid-cols-4 items-center',
                  idx < FEATURES.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60'
                )}
              >
                <div className="p-4 text-sm text-gray-700 dark:text-gray-300">{feat.label}</div>
                <div className="p-4 text-center">
                  <FeatureValue value={feat.basico} />
                </div>
                <div className="p-4 text-center bg-primary/[0.03] dark:bg-primary/5">
                  <FeatureValue value={feat.profissional} highlight />
                </div>
                <div className="p-4 text-center">
                  <FeatureValue value={feat.enterprise} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Perguntas frequentes
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
