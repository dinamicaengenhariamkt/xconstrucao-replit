/**
 * Service para buscar atividades recentes — J07 (Task #83).
 * Lê do feed real `/api/atividades` (backend já aplica gate por persona)
 * e adapta para o shape `Activity` consumido por <RecentActivities>.
 */

import type { Activity, ActivityType, DashboardPeriodo } from '../types';
import type { AtividadeFeedItem } from '@features/atividades/hooks/use-atividades';
import { toAtividadeDisplay } from '@features/atividades/hooks/use-atividades';
import type { AtividadeTipo } from '@shared/db/schema';

const PERIODO_TO_DAYS: Record<DashboardPeriodo, number> = {
  '7dias': 7,
  '30dias': 30,
  '3meses': 90,
  '12meses': 365,
};

const TIPO_TO_ACTIVITY_TYPE: Record<AtividadeTipo, ActivityType> = {
  obra_publicada: 'contract',
  candidatura_criada: 'contract',
  candidatura_aceita: 'milestone',
  candidatura_rejeitada: 'alert',
  candidatura_cancelada: 'alert',
  medicao_criada: 'milestone',
  medicao_aprovada: 'milestone',
  medicao_contestada: 'alert',
  diario_postado: 'delivery',
  ocorrencia_aberta: 'alert',
  ocorrencia_resolvida: 'milestone',
  lancamento_criado: 'payment',
  lancamento_quitado: 'payment',
};

const COLOR_MAP: Record<string, Activity['color']> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  purple: 'primary',
  amber: 'amber',
  primary: 'primary',
};

export async function getRecentActivities(
  periodo: DashboardPeriodo = '12meses',
): Promise<Activity[]> {
  const res = await fetch(`/api/atividades?limit=50`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar atividades recentes');
  const data: { items: AtividadeFeedItem[] } = await res.json();
  const cutoff = Date.now() - PERIODO_TO_DAYS[periodo] * 86_400_000;
  return data.items
    .map((item) => {
      const d = toAtividadeDisplay(item, 'empreiteiro');
      const timestamp = new Date(d.createdAt);
      return {
        id: d.id,
        type: TIPO_TO_ACTIVITY_TYPE[item.tipo] ?? 'milestone',
        icon: d.icon,
        color: COLOR_MAP[d.color] ?? 'info',
        title: d.titulo,
        description: d.descricao,
        timestamp,
        obraId: d.obraId ?? undefined,
        obraNome: d.obraNome ?? undefined,
      } satisfies Activity;
    })
    .filter((a) => a.timestamp.getTime() >= cutoff);
}
