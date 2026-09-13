'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { IconCalendarMonth } from '@shared/components/icons';
import { useObraEtapas, type ObraEtapaApi } from '@features/obras/medicoes/hooks/use-obra-j06';

/**
 * XG10 — cronograma da obra em gráfico de Gantt.
 *
 * "Se conseguisse um gráfico Gantt, aí ficaria legal... você coloca as datas,
 * aí você amarra um com o outro" (12:52). A aba que se chamava Cronograma era,
 * na verdade, o cadastro de etapas; esta é o cronograma de fato.
 *
 * Desenhado em SVG inline, sem biblioteca: o repo evita dependência nova
 * quando o traçado é simples (barras num eixo de tempo), e uma lib de Gantt
 * completa traria arrasto, dependências e um bundle grande que ninguém pediu.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

/** Altura de cada linha do gráfico, em px. */
const LINHA_H = 34;
const BARRA_H = 18;
/** Largura da coluna de nomes à esquerda. */
const COL_NOMES = 150;
/** Largura mínima por dia — o SVG rola horizontalmente quando não cabe. */
const MIN_PX_DIA = 8;

const STATUS_COR: Record<ObraEtapaApi['status'], string> = {
  pendente: '#94a3b8',
  em_andamento: '#3b82f6',
  bloqueado: '#ef4444',
  concluido: '#10b981',
};

const STATUS_LABEL: Record<ObraEtapaApi['status'], string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  bloqueado: 'Bloqueado',
  concluido: 'Concluído',
};

interface EtapaComDatas {
  etapa: ObraEtapaApi;
  inicio: Date;
  fim: Date;
}

function meiaNoite(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatarDiaMes(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Só entram no gráfico etapas com as duas datas. Uma etapa sem início ou sem
 * fim não tem barra que a represente honestamente — inventar uma data (hoje,
 * ou +30 dias) desenharia um cronograma que ninguém planejou.
 */
function comDatas(etapas: ObraEtapaApi[]): EtapaComDatas[] {
  return etapas
    .flatMap((etapa) => {
      if (!etapa.dataInicio || !etapa.prazo) return [];
      const inicio = meiaNoite(new Date(etapa.dataInicio));
      const fim = meiaNoite(new Date(etapa.prazo));
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return [];
      // Fim antes do início: trata como marco de um dia em vez de barra negativa.
      return [{ etapa, inicio, fim: fim < inicio ? inicio : fim }];
    })
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

export function CronogramaGanttCard({ obraId }: { obraId: string }) {
  const { data: etapas = [], isLoading } = useObraEtapas(obraId);

  const plotadas = useMemo(() => comDatas(etapas), [etapas]);
  const semDatas = etapas.length - plotadas.length;

  const grafico = useMemo(() => {
    if (plotadas.length === 0) return null;

    const inicioMin = plotadas.reduce((min, p) => (p.inicio < min ? p.inicio : min), plotadas[0].inicio);
    const fimMax = plotadas.reduce((max, p) => (p.fim > max ? p.fim : max), plotadas[0].fim);
    // +1 para o último dia ter largura própria (barra inclui o dia final).
    const totalDias = Math.max(1, Math.round((fimMax.getTime() - inicioMin.getTime()) / DIA_MS) + 1);

    const pxDia = Math.max(MIN_PX_DIA, Math.min(28, Math.round(760 / totalDias)));
    const larguraGrade = totalDias * pxDia;
    const largura = COL_NOMES + larguraGrade;
    const altura = plotadas.length * LINHA_H + 34;

    const xDe = (d: Date) => COL_NOMES + ((d.getTime() - inicioMin.getTime()) / DIA_MS) * pxDia;

    // Marcas de tempo: uma a cada ~7 dias, para não empilhar rótulos.
    const passo = totalDias <= 14 ? 1 : totalDias <= 60 ? 7 : 30;
    const marcas: { x: number; label: string }[] = [];
    for (let i = 0; i <= totalDias; i += passo) {
      const d = new Date(inicioMin.getTime() + i * DIA_MS);
      marcas.push({ x: COL_NOMES + i * pxDia, label: formatarDiaMes(d) });
    }

    const hoje = meiaNoite(new Date());
    const hojeVisivel = hoje >= inicioMin && hoje <= fimMax;

    return { inicioMin, totalDias, pxDia, largura, altura, xDe, marcas, hoje, hojeVisivel };
  }, [plotadas]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IconCalendarMonth className="w-5 h-5 text-primary" />
            Cronograma
          </CardTitle>
          <CardDescription>
            Linha do tempo das etapas. As datas são definidas na aba Etapas.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
          ) : plotadas.length === 0 || !grafico ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {etapas.length === 0
                  ? 'Nenhuma etapa cadastrada ainda.'
                  : 'Nenhuma etapa tem início e fim previstos.'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Informe as duas datas na aba Etapas para a etapa aparecer no cronograma.
              </p>
            </div>
          ) : (
            <>
              {/* Rolagem horizontal: cronograma longo não pode espremer a barra
                  nem estourar a largura da página no celular. */}
              <div className="overflow-x-auto -mx-2 px-2">
                <svg
                  width={grafico.largura}
                  height={grafico.altura}
                  role="img"
                  aria-label={`Cronograma com ${plotadas.length} etapas`}
                  data-testid="gantt-svg"
                  className="min-w-full"
                >
                  {/* Eixo de tempo */}
                  {grafico.marcas.map((m, i) => (
                    <g key={i}>
                      <line
                        x1={m.x}
                        y1={22}
                        x2={m.x}
                        y2={grafico.altura}
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-800"
                        strokeWidth={1}
                      />
                      <text
                        x={m.x}
                        y={14}
                        fontSize={10}
                        textAnchor="middle"
                        fill="currentColor"
                        className="text-gray-500"
                      >
                        {m.label}
                      </text>
                    </g>
                  ))}

                  {/* Marcador de hoje */}
                  {grafico.hojeVisivel && (
                    <line
                      x1={grafico.xDe(grafico.hoje)}
                      y1={22}
                      x2={grafico.xDe(grafico.hoje)}
                      y2={grafico.altura}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      data-testid="gantt-hoje"
                    />
                  )}

                  {plotadas.map(({ etapa, inicio, fim }, idx) => {
                    const y = 30 + idx * LINHA_H;
                    const x = grafico.xDe(inicio);
                    // +1 dia: a barra cobre o dia final inteiro.
                    const largura = Math.max(
                      grafico.pxDia,
                      grafico.xDe(fim) + grafico.pxDia - x,
                    );
                    const cor = STATUS_COR[etapa.status];
                    return (
                      <g key={etapa.id} data-testid={`gantt-etapa-${etapa.id}`}>
                        <text
                          x={0}
                          y={y + BARRA_H / 2 + 4}
                          fontSize={11}
                          fill="currentColor"
                          className="text-gray-700 dark:text-gray-300"
                        >
                          {etapa.nome.length > 20 ? `${etapa.nome.slice(0, 19)}…` : etapa.nome}
                        </text>

                        {/* Trilho da etapa */}
                        <rect x={x} y={y} width={largura} height={BARRA_H} rx={4} fill={cor} opacity={0.25} />
                        {/* Avanço medido */}
                        <rect
                          x={x}
                          y={y}
                          width={(largura * Math.min(100, Math.max(0, etapa.progresso))) / 100}
                          height={BARRA_H}
                          rx={4}
                          fill={cor}
                        />
                        <title>
                          {`${etapa.nome}\n${STATUS_LABEL[etapa.status]} · ${etapa.progresso}%\n${formatarDiaMes(inicio)} a ${formatarDiaMes(fim)}`}
                        </title>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                {(Object.keys(STATUS_COR) as ObraEtapaApi['status'][]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COR[s] }} />
                    {STATUS_LABEL[s]}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-0.5 bg-amber-500" />
                  Hoje
                </span>
              </div>

              {semDatas > 0 && (
                <p className={cn('text-xs text-amber-600 mt-3')} data-testid="gantt-sem-datas">
                  {semDatas} {semDatas === 1 ? 'etapa ainda não tem' : 'etapas ainda não têm'} início
                  e fim definidos — {semDatas === 1 ? 'ela não aparece' : 'elas não aparecem'} no gráfico.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
