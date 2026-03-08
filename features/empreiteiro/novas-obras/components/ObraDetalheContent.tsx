'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@shared/lib/utils';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import { useChatStore } from '@features/empreiteiro/xchat/store/chat-store';
import type { ObraDetalhe } from '../types';
import type { ComponentType } from 'react';
import { IconHome, IconSquareFoot, IconWorkspacePremium, IconDescription, IconCalendarMonth, IconSchedule, IconPayments, IconVerified, IconAnalytics, IconExpandMore, IconInfo, IconDownload, IconCheckCircle, IconMail, IconChat, IconMap, IconLock, IconLocationOn, IconOpenInNew, IconTrendingUp, IconWarning, IconConstruction, IconPictureAsPdf, IconTableChart, IconComment, IconFolder, IconChecklist, IconPerson } from '@shared/components/icons';

interface ObraDetalheContentProps {
  obra: ObraDetalhe;
}

const ETAPA_PALETTE = [
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600' },
  { bg: 'bg-success/10', text: 'text-success' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600' },
];

type IconComponent = ComponentType<{ className?: string }>;

const DOC_CONFIG: Record<string, { Icon: IconComponent; iconBg: string; iconText: string }> = {
  PDF: { Icon: IconPictureAsPdf, iconBg: 'bg-red-100 dark:bg-red-900/30', iconText: 'text-red-600' },
  XLSX: { Icon: IconTableChart, iconBg: 'bg-green-100 dark:bg-green-900/30', iconText: 'text-success' },
  DEFAULT: { Icon: IconDescription, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600' },
};

const ETAPA_ICON_MAP: Record<string, IconComponent> = {
  construction: IconConstruction,
  engineering: IconConstruction,
  description: IconDescription,
  home: IconHome,
  check_circle: IconCheckCircle,
  warning: IconWarning,
};

function SectionCard({ title, subtitle, Icon, children }: { title: string; subtitle?: string; Icon: IconComponent; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-[0_4px_15px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="text-primary" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {subtitle && <p className="text-sm text-gray-500 ml-12">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function ObraDetalheContent({ obra }: ObraDetalheContentProps) {
  const router = useRouter();
  const { addEphemeralConversation, sendMessage } = useChatStore();

  const handleEnviarMensagem = useCallback(() => {
    const newConv = {
      id: `conv-nova-${obra.id}-${Date.now()}`,
      participantName: obra.contratante.nome,
      participantInitials: obra.contratante.iniciais,
      participantColor: obra.contratante.cor,
      obraNome: obra.titulo,
      obraId: obra.id,
      lastMessage: `Olá! Vi a obra "${obra.titulo}" e gostaria de obter mais informações.`,
      lastMessageTime: 'agora',
      unreadCount: 0,
      isActive: true,
    };
    addEphemeralConversation(newConv);
    sendMessage(newConv.id, `Olá! Vi a obra "${obra.titulo}" e gostaria de obter mais informações.`);
    router.push('/empreiteiro/chat');
  }, [obra, addEphemeralConversation, sendMessage, router]);

  const addressLocked = !['aprovado', 'em_execucao'].includes(obra.applicationStatus ?? '');

  const acabamento = obra.complexidade === 'alta' ? 'Alto Padrão' : obra.complexidade === 'media' ? 'Médio Padrão' : 'Padrão';

  const sinapiEstimativaTotal = obra.sinapi
    ? obra.sinapi.custoPorM2 * parseFloat(obra.areaTotal.replace(/[^\d]/g, ''))
    : null;

  const sinapiStatusConfig = {
    acima: { label: 'Acima da referência SINAPI', Icon: IconTrendingUp, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
    dentro: { label: 'Dentro da referência SINAPI', Icon: IconCheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-success' },
    abaixo: { label: 'Abaixo da referência SINAPI', Icon: IconWarning, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700' },
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── BLOCO 1: Informações Gerais ── */}
      <SectionCard title="Informações Gerais" subtitle="Detalhes do projeto" Icon={IconInfo}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex-shrink-0">
              <IconHome />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tipo de Obra</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.tipoObra}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg flex-shrink-0">
              <IconSquareFoot />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Área Construída</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.areaTotal}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg flex-shrink-0">
              <IconWorkspacePremium />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Acabamento</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{acabamento}</p>
            </div>
          </div>
          {obra.situacaoProjeto && (
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-success/10 text-success rounded-lg flex-shrink-0">
                <IconDescription />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Situação Projeto</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.situacaoProjeto}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-lg flex-shrink-0">
              <IconCalendarMonth />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Data de Início</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.inicioPrevisto ?? 'A definir'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg flex-shrink-0">
              <IconSchedule />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Duração Estimada</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.prazo}</p>
            </div>
          </div>
        </div>

        {/* Faixa de Orçamento + SINAPI */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-success/10 text-success rounded-lg flex-shrink-0">
              <IconPayments />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Faixa de Orçamento</p>
                {obra.sinapi && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-info/10 text-info text-[10px] font-bold rounded-full uppercase tracking-wider">
                    <IconVerified className="text-xs" />
                    Referência SINAPI
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-success">{formatCurrency(obra.orcamento)}</p>

              {obra.sinapi && (
                <details className="mt-3 group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-info hover:text-info/80 transition-colors list-none select-none">
                    <IconAnalytics className="text-sm" />
                    Ver análise SINAPI detalhada
                    <IconExpandMore className="text-sm transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <IconInfo className="text-info" />
                      <p className="text-xs text-gray-500">
                        Valores baseados na tabela SINAPI ({obra.sinapi.referenciaMes}) para a região de {obra.sinapi.regiao}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: `Custo médio SINAPI/m² (${acabamento})`, value: formatCurrency(obra.sinapi.custoPorM2) },
                        { label: 'Área do projeto', value: obra.areaTotal },
                        { label: 'Estimativa SINAPI total', value: sinapiEstimativaTotal ? formatCurrency(sinapiEstimativaTotal) : '—', bold: true },
                        { label: 'Faixa proposta pelo contratante', value: formatCurrency(obra.orcamento), color: 'text-success', bold: true },
                      ].map(({ label, value, bold, color }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                          <span className={cn('text-sm', bold ? 'font-bold' : 'font-semibold', color ?? 'text-gray-900 dark:text-white')}>{value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Status</span>
                        {(() => {
                          const cfg = sinapiStatusConfig[obra.sinapi!.statusVsSinapi];
                          return (
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider', cfg.bg, cfg.text)}>
                              <cfg.Icon className="text-xs" />
                              {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {obra.sinapi.breakdown.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Estimativa SINAPI por etapa</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {obra.sinapi.breakdown.map((item) => (
                            <div key={item.etapa} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 rounded-lg">
                              <span className="text-xs text-gray-600 dark:text-gray-400">{item.etapa}</span>
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.valor)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
                      <IconInfo className="text-amber-600 text-sm mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        Valores SINAPI são referenciais e podem variar conforme especificações do projeto, condições do terreno e mercado local. Fonte: Caixa Econômica Federal / IBGE.
                      </p>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── BLOCO 2: Escopo e Fases Previstas ── */}
      <SectionCard title="Escopo e Fases Previstas" subtitle="Atividades planejadas pelo contratante" Icon={IconChecklist}>
        <div className="flex flex-col gap-4">
          {obra.etapas.map((etapa, index) => {
            const palette = ETAPA_PALETTE[index % ETAPA_PALETTE.length];
            const EtapaIcon = ETAPA_ICON_MAP[etapa.icone ?? ''] ?? IconConstruction;
            return (
              <div key={etapa.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', palette.bg)}>
                  <EtapaIcon className={palette.text} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{etapa.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{etapa.descricao}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Prazo</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{etapa.prazo}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── BLOCO 3: Documentos Disponíveis ── */}
      <SectionCard title="Documentos Disponíveis" subtitle="Arquivos fornecidos pelo contratante" Icon={IconFolder}>
        <div className="flex flex-col gap-3">
          {obra.documentos.map((doc) => {
            const cfg = DOC_CONFIG[doc.tipo] ?? DOC_CONFIG.DEFAULT;
            return (
              <a
                key={doc.id}
                href={doc.url}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                data-testid={`doc-${doc.id}`}
              >
                <div className={cn('p-2.5 rounded-lg flex-shrink-0', cfg.iconBg, cfg.iconText)}>
                  <cfg.Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{doc.nome}</p>
                  <p className="text-xs text-gray-400">{doc.tipo} · {doc.tamanho}</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <IconDownload className="text-sm" />
                  Baixar
                </button>
              </a>
            );
          })}
        </div>
      </SectionCard>

      {/* ── BLOCO 4: Observações e Requisitos ── */}
      <SectionCard title="Observações e Requisitos" subtitle="Informações adicionais fornecidas pelo contratante" Icon={IconComment}>
        {obra.observacoes && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{obra.observacoes}</p>
          </div>
        )}
        {obra.requisitos.length > 0 && (
          <ul className="flex flex-col gap-3">
            {obra.requisitos.map((req, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400" data-testid={`requisito-${index}`}>
                <IconCheckCircle className="text-success text-lg flex-shrink-0 mt-0.5" />
                {req}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ── BLOCO 5: Contato do Contratante ── */}
      <SectionCard title="Contato do Contratante" subtitle="Para dúvidas ou agendamento de visita técnica" Icon={IconPerson}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold', obra.contratante.cor)}>
              {obra.contratante.iniciais}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{obra.contratante.nome}</p>
              <p className="text-sm text-gray-500">Contratante</p>
            </div>
          </div>

          {obra.contratante.email && (
            <div className="flex-1">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <IconMail className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{obra.contratante.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleEnviarMensagem}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <IconChat />
              Enviar Mensagem
            </button>
            <span className="text-[10px] text-gray-400 font-medium">via xchat</span>
          </div>
        </div>
      </SectionCard>

      {/* ── BLOCO 6: Localização da Obra ── */}
      <SectionCard title="Localização da Obra" subtitle={addressLocked ? 'Localização aproximada' : 'Endereço completo do terreno'} Icon={IconLocationOn}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Placeholder do mapa */}
          <div className="lg:col-span-2 aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
              <div className="text-center">
                <IconMap className="text-gray-400 text-6xl" />
                <p className="text-sm text-gray-500 mt-2">Mapa da localização</p>
              </div>
            </div>
            {addressLocked && (
              <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                <IconLock className="text-gray-400 text-4xl" />
                <p className="text-xs text-gray-500 font-medium">Disponível após aprovação</p>
              </div>
            )}
          </div>

          {/* Endereço + ações */}
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <IconLocationOn className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">
                    {addressLocked ? 'Localização Geral' : 'Endereço Completo'}
                  </p>
                  {/* rua — blurred when locked */}
                  {obra.localizacao.rua && (
                    <p className={cn('text-sm font-semibold text-gray-900 dark:text-white', addressLocked && 'blur-sm opacity-30 select-none pointer-events-none')}>
                      {obra.localizacao.rua}
                    </p>
                  )}
                  {/* bairro + cidade+estado — always visible */}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{obra.localizacao.bairro}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{obra.localizacao.cidade} - {obra.localizacao.estado}</p>
                  {/* CEP — blurred when locked */}
                  {obra.localizacao.cep && (
                    <p className={cn('text-sm text-gray-600 dark:text-gray-400', addressLocked && 'blur-sm opacity-30 select-none pointer-events-none')}>
                      CEP: {obra.localizacao.cep}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {addressLocked ? (
              <button
                disabled
                className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                title="Disponível após aprovação da candidatura"
              >
                <IconLock />
                Abrir no Google Maps
              </button>
            ) : (
              <button
                onClick={() => {
                  const q = encodeURIComponent(`${obra.localizacao.rua ?? ''} ${obra.localizacao.bairro} ${obra.localizacao.cidade} ${obra.localizacao.estado}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                }}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <IconOpenInNew />
                Abrir no Google Maps
              </button>
            )}

            {addressLocked && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-start gap-2">
                  <IconInfo className="text-amber-600 text-base mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    O endereço exato será disponibilizado após aprovação da candidatura.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

    </div>
  );
}
