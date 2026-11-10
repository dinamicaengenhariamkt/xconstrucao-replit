import { NextRequest, NextResponse } from 'next/server';
import { autorizarCron } from '@features/xgestao/marketing/lib/cron-auth';
import { executarRotinaDiariaXgestao } from '@features/xgestao/marketing/server/rotina-diaria';
import { getBaseUrl } from '@features/auth/api/auth-utils';
import { rotasDeTesteHabilitadas } from '@shared/lib/rotas-teste';
import { logError, logJobRun } from '@/server/lib/logger';

/**
 * XG52 — rotina diária do xgestão (e-mails do ciclo de vida, jobs do boot e
 * sincronização com o Brevo). O deploy é autoscale, então um agendador externo
 * chama esta rota uma vez por dia (ver docs/jornadas-xgestao/52-marketing-e-emails.md).
 *
 *   POST /api/cron/xgestao-diario
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Sem `CRON_SECRET` configurado responde 503 (nunca roda aberta); segredo
 * ausente ou errado, 401. Resposta: resumo com contagens, sem dado pessoal.
 */
export const dynamic = 'force-dynamic';

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const auth = autorizarCron(request.headers.get('authorization'), process.env.CRON_SECRET);
  if (auth === 'sem_secret') return json({ message: 'CRON_SECRET não configurado' }, 503);
  if (auth === 'negado') return json({ message: 'Não autorizado' }, 401);

  // Testes: restringe às contas criadas pelo spec, para não mexer no resto do banco de dev.
  let somenteUsuarios: string[] | undefined;
  if (rotasDeTesteHabilitadas()) {
    const body = (await request.json().catch(() => ({}))) as { somenteUsuarios?: unknown };
    if (Array.isArray(body.somenteUsuarios)) {
      somenteUsuarios = body.somenteUsuarios.filter((x): x is string => typeof x === 'string').slice(0, 200);
    }
  }

  const inicio = new Date();
  try {
    const resumo = await executarRotinaDiariaXgestao({ baseUrl: getBaseUrl(request), somenteUsuarios });
    await logJobRun('cron.xgestao-diario', resumo.ok ? 'ok' : 'error', {
      startedAt: inicio,
      meta: { emails: resumo.emails, brevo: resumo.brevo && { ok: resumo.brevo.ok, enviados: resumo.brevo.enviados, removidos: resumo.brevo.removidos } },
      ...(resumo.ok ? {} : { error: 'rotina com falhas parciais' }),
    }).catch(() => {});
    return json(resumo, 200);
  } catch (erro) {
    const e = erro instanceof Error ? erro : new Error(String(erro));
    await logError('error', '[cron.xgestao-diario] falhou', { stack: e.stack, route: '/api/cron/xgestao-diario' }).catch(() => {});
    await logJobRun('cron.xgestao-diario', 'error', { startedAt: inicio, error: e.message }).catch(() => {});
    return json({ ok: false, message: 'Falha na rotina diária' }, 500);
  }
}
