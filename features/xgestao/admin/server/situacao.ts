import { sql, type SQL } from 'drizzle-orm';
import { obras } from '@shared/db/schema';

/**
 * XG36 — situação das obras xgestão para o admin, toda calculada no banco.
 *
 * - **atrasada**: previsão de término vencida e obra não concluída;
 * - **parada**: obra em andamento sem nenhum registro há N dias (configurável em
 *   `platform_settings.xgestao.diasObraParada`);
 * - **no prazo**: não concluída e não atrasada.
 *
 * "Registro" é qualquer coisa que o assinante grava na obra: diário, lançamento
 * financeiro, foto, ocorrência, documento, etapa alterada ou checklist marcado.
 * A criação da obra conta como o primeiro registro. `GREATEST` ignora `NULL`.
 */
export type SituacaoObra = 'atrasada' | 'parada' | 'no_prazo';
export const SITUACOES_OBRA: SituacaoObra[] = ['atrasada', 'parada', 'no_prazo'];

export const ultimaAtividadeObra = sql<Date>`greatest(
  ${obras.createdAt},
  (select max(d.created_at) from obra_diario d where d.obra_id = ${obras.id}),
  (select max(f.created_at) from financeiro f where f.obra_id = ${obras.id}),
  (select max(ft.created_at) from obra_fotos ft where ft.obra_id = ${obras.id}),
  (select max(o.created_at) from obra_ocorrencias o where o.obra_id = ${obras.id}),
  (select max(a.created_at) from obra_anexos a where a.obra_id = ${obras.id}),
  (select max(e.updated_at) from obra_etapas e where e.obra_id = ${obras.id}),
  (select max(m.marcado_em) from obra_checklist_marcacoes m
     join obra_checklists c on c.id = m.checklist_id where c.obra_id = ${obras.id})
)`;

/**
 * `obras.data_previsao` é TEXT (`YYYY-MM-DD`). Converte só o que tem esse formato:
 * um valor fora do padrão vira `NULL` em vez de derrubar a consulta inteira.
 */
export const previsaoObra = sql`(case when ${obras.dataPrevisao} ~ '^\\d{4}-\\d{2}-\\d{2}' then left(${obras.dataPrevisao}, 10)::date end)`;

export const obraAtrasada = sql`(${previsaoObra} < current_date and ${obras.status} <> 'concluida')`;

export function obraParada(dias: number): SQL {
  return sql`(${obras.status} = 'em_andamento' and ${ultimaAtividadeObra} < now() - make_interval(days => ${dias}))`;
}

export function condicaoSituacao(situacao: SituacaoObra, diasParada: number): SQL {
  if (situacao === 'atrasada') return obraAtrasada;
  if (situacao === 'parada') return obraParada(diasParada);
  return sql`(${obras.status} <> 'concluida' and not coalesce(${obraAtrasada}, false))`;
}
