import 'server-only';

import { and, eq, gte, inArray, max, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, userPreferencias, users, xgestaoEmailsEnviados } from '@shared/db/schema';
import { sendXgestaoCicloEmail } from '@shared/lib/email';
import { markOverduePagamentos } from '@features/financeiro/mark-overdue-job';
import { notificarInadimplentesExpirando } from '@features/planos/aviso-expiracao-job';
import { expirarTestesVencidos, TESTE_PROVIDER } from '@features/xgestao/teste/server/teste-service';
import { aplicarTrocasVencidas, reprocessarAjustesPendentes } from '@features/xgestao/server/troca-marcas';
import { listarAssinantesDetalhados } from '@features/xgestao/admin/server/assinantes';
import { tierLabel } from '@features/xgestao/admin/plano-label';
import { bloqueioDoTeste } from '@features/xgestao/lib/acesso-plano';
import { emailEnabledFromPrefs } from '@features/notificacoes/preferences';
import { marketingAtivo } from '../lib/consentimento';
import {
  aplicarTeto,
  contaForaDaRotina,
  diaSp,
  emailsDoDia,
  tetoDiario,
  type EmailPlanejado,
  type LinhaRotinaEmail,
  type TipoEmailXgestao,
} from '../lib/regras-emails';
import { conteudoEmail, dataBrSp, ehMarketing, primeiroNome } from '../lib/textos-emails';
import { criarTokenDescadastro, urlDescadastro, urlDescadastroUmClique } from '../lib/token-descadastro';
import { sincronizarContatosBrevo, type ResultadoSyncBrevo } from './brevo-contatos';

/**
 * XG52 — rotina diária do xgestão, chamada por `POST /api/cron/xgestao-diario`.
 * O deploy é autoscale (sem processo contínuo), então quem dispara é um
 * agendador externo (Scheduled Deployment do Replit ou cron). Idempotente:
 * pode rodar várias vezes no dia sem repetir e-mail.
 *
 * 1. jobs que antes só rodavam no boot (atrasos, aviso de expiração, testes
 *    vencidos, trocas de plano);
 * 2. e-mails do ciclo de vida (`regras-emails.ts`), com teto diário;
 * 3. sincronização da lista do Brevo com quem deu opt-in.
 */

/** Revogações recentes reenviadas ao Brevo para remoção (cobre dias sem rotina). */
const DIAS_REMOCAO_BREVO = 45;
const DIA_MS = 24 * 60 * 60 * 1000;

export interface ResumoRotinaDiaria {
  ok: boolean;
  executadaEm: string;
  jobs: Record<string, { ok: boolean; total?: number; erro?: string }>;
  emails: {
    contasAvaliadas: number;
    planejados: number;
    jaEnviados: number;
    enviados: number;
    adiadosPeloTeto: number;
    falhas: number;
    semTokenDescadastro: number;
    teto: number;
    enviadosHojeAntes: number;
    porTipo: Partial<Record<TipoEmailXgestao, number>>;
  };
  brevo: ResultadoSyncBrevo | null;
}

async function rodarJob(nome: string, jobs: ResumoRotinaDiaria['jobs'], fn: () => Promise<number | void>) {
  try {
    const total = await fn();
    jobs[nome] = { ok: true, ...(typeof total === 'number' ? { total } : {}) };
  } catch (erro) {
    jobs[nome] = { ok: false, erro: erro instanceof Error ? erro.message : String(erro) };
  }
}

/** Início do dia em São Paulo (UTC-3, sem horário de verão desde 2019). */
function inicioDoDiaSp(agora: Date): Date {
  return new Date(`${diaSp(agora)}T00:00:00-03:00`);
}

export async function executarRotinaDiariaXgestao(opcoes: {
  baseUrl: string;
  agora?: Date;
  /** Só nos testes (rotas de teste habilitadas): restringe a estas contas. */
  somenteUsuarios?: string[];
  /**
   * Só a confirmação de cancelamento, sem jobs nem Brevo. A rota de cancelar
   * chama na hora; a mesma linha de idempotência impede o reenvio pela rotina.
   */
  apenasCancelamento?: boolean;
}): Promise<ResumoRotinaDiaria> {
  const agora = opcoes.agora ?? new Date();
  const jobs: ResumoRotinaDiaria['jobs'] = {};
  const completa = !opcoes.apenasCancelamento;

  // 1. Jobs do boot. Cada um isolado: a falha de um não impede os outros.
  if (completa) {
  await rodarJob('mark-overdue', jobs, async () => {
    const r = await markOverduePagamentos();
    if (!r.ok) throw new Error(r.error ?? 'falhou');
    return r.updated;
  });
  await rodarJob('aviso-expiracao', jobs, async () => {
    const r = await notificarInadimplentesExpirando();
    if (!r.ok) throw new Error(r.error ?? 'falhou');
    return r.notified;
  });
  await rodarJob('testes-vencidos', jobs, () => expirarTestesVencidos());
  await rodarJob('trocas-vencidas', jobs, () => aplicarTrocasVencidas());
  await rodarJob('ajustes-troca', jobs, () => reprocessarAjustesPendentes());
  }

  // 2. Contas e situação, pela mesma leitura do admin CRM (contas internas fora).
  const detalhes = await listarAssinantesDetalhados({ agora, userIds: opcoes.somenteUsuarios });
  const ids = detalhes.map((d) => d.userId);
  const [extras, ultimosTestes, jaEnviadosRows, [{ hoje }]] = await Promise.all([
    ids.length === 0 ? [] : db
      .select({
        id: users.id,
        role: users.role,
        ativo: users.ativo,
        consentimentoEm: users.marketingConsentimentoEm,
        revogadoEm: users.marketingRevogadoEm,
        notificacoes: userPreferencias.notificacoes,
      })
      .from(users)
      .leftJoin(userPreferencias, eq(userPreferencias.userId, users.id))
      .where(inArray(users.id, ids)),
    ids.length === 0 ? [] : db
      .select({ userId: assinaturas.userId, fim: max(assinaturas.renovaEm) })
      .from(assinaturas)
      .where(and(inArray(assinaturas.userId, ids), eq(assinaturas.persona, 'xgestao'), eq(assinaturas.gatewayProvider, TESTE_PROVIDER)))
      .groupBy(assinaturas.userId),
    ids.length === 0 ? [] : db
      .select({ userId: xgestaoEmailsEnviados.userId, tipo: xgestaoEmailsEnviados.tipo, referencia: xgestaoEmailsEnviados.referencia })
      .from(xgestaoEmailsEnviados)
      .where(inArray(xgestaoEmailsEnviados.userId, ids)),
    db
      .select({ hoje: sql<number>`count(*)::int` })
      .from(xgestaoEmailsEnviados)
      .where(gte(xgestaoEmailsEnviados.enviadoEm, inicioDoDiaSp(agora))),
  ]);
  const extraPorId = new Map(extras.map((e) => [e.id, e]));
  const fimTestePorId = new Map(ultimosTestes.map((t) => [t.userId, t.fim]));
  const jaEnviados = new Set(jaEnviadosRows.map((r) => `${r.userId}|${r.tipo}|${r.referencia}`));

  const linhas: LinhaRotinaEmail[] = [];
  for (const d of detalhes) {
    const extra = extraPorId.get(d.userId);
    if (!extra) continue;
    const fimTeste = fimTestePorId.get(d.userId) ?? null;
    const saidaEm = d.situacao.codigo !== 'somente_leitura'
      ? null
      : d.saida?.em ? new Date(d.saida.em) : fimTeste ? bloqueioDoTeste(fimTeste) : null;
    linhas.push({
      userId: d.userId,
      email: d.email,
      nome: d.nome,
      role: extra.role,
      ativo: extra.ativo,
      contaInterna: d.contaInterna,
      marketing: { consentimentoEm: extra.consentimentoEm, revogadoEm: extra.revogadoEm },
      avisosAssinatura: emailEnabledFromPrefs(extra.notificacoes, 'email_prazo'),
      situacao: { codigo: d.situacao.codigo, ate: d.situacao.ate, diasRestantes: d.situacao.diasRestantes },
      cancelamentoPedidoEm: d.cancelamento?.pedidoEm ?? null,
      entradaEm: new Date(d.entradaEm),
      obrasGerenciadas: d.obrasGerenciadas,
      saidaEm,
    });
  }
  const linhaPorId = new Map(linhas.map((l) => [l.userId, l]));

  const planejados = linhas
    .flatMap((l) => emailsDoDia(l, agora))
    .filter((p) => completa || p.tipo === 'cancelamento_confirmado');
  const pendentes = planejados.filter((p) => !jaEnviados.has(`${p.userId}|${p.tipo}|${p.referencia}`));
  const teto = tetoDiario();
  const { enviar, adiados } = aplicarTeto(pendentes, teto, hoje);

  const porTipo: Partial<Record<TipoEmailXgestao, number>> = {};
  let enviados = 0;
  let falhas = 0;
  let semToken = 0;
  for (const email of enviar) {
    const linha = linhaPorId.get(email.userId)!;
    const r = await enviarUm(email, linha, opcoes.baseUrl);
    if (r === 'enviado') {
      enviados += 1;
      porTipo[email.tipo] = (porTipo[email.tipo] ?? 0) + 1;
    } else if (r === 'sem_token') semToken += 1;
    else if (r === 'falha') falhas += 1;
  }

  // 3. Brevo: só quem aceitou entra; quem revogou nos últimos dias sai.
  const limiteRemocao = agora.getTime() - DIAS_REMOCAO_BREVO * DIA_MS;
  const ativos = linhas.filter((l) => !contaForaDaRotina(l) && marketingAtivo(l.marketing));
  const revogados = linhas.filter((l) => !marketingAtivo(l.marketing) && l.marketing.revogadoEm && l.marketing.revogadoEm.getTime() >= limiteRemocao);
  const brevo = !completa ? null : await sincronizarContatosBrevo(
    ativos.map((l) => {
      const d = detalhes.find((x) => x.userId === l.userId)!;
      return {
        email: l.email,
        situacao: l.situacao.codigo,
        plano: d.plano.emTeste ? `${tierLabel(d.plano.tier)} (teste)` : tierLabel(d.plano.tier),
        fimTeste: d.plano.emTeste && d.plano.renovaEm ? diaSp(d.plano.renovaEm) : null,
      };
    }),
    revogados.map((l) => l.email),
  );

  return {
    ok: Object.values(jobs).every((j) => j.ok) && falhas === 0,
    executadaEm: agora.toISOString(),
    jobs,
    emails: {
      contasAvaliadas: linhas.length,
      planejados: planejados.length,
      jaEnviados: planejados.length - pendentes.length,
      enviados,
      adiadosPeloTeto: adiados.length,
      falhas,
      semTokenDescadastro: semToken,
      teto,
      enviadosHojeAntes: hoje,
      porTipo,
    },
    brevo,
  };
}

/**
 * Reserva a linha de idempotência ANTES de enviar (duas rotinas ao mesmo
 * tempo não mandam o mesmo e-mail). Se o envio falhar, a reserva é desfeita
 * e o aviso volta a ser tentado na próxima rodada.
 */
async function enviarUm(
  email: EmailPlanejado,
  linha: LinhaRotinaEmail,
  baseUrl: string,
): Promise<'enviado' | 'corrida' | 'sem_token' | 'falha'> {
  const [reserva] = await db
    .insert(xgestaoEmailsEnviados)
    .values({ userId: email.userId, tipo: email.tipo, referencia: email.referencia })
    .onConflictDoNothing()
    .returning({ id: xgestaoEmailsEnviados.id });
  if (!reserva) return 'corrida';
  const desfazer = () => db.delete(xgestaoEmailsEnviados).where(eq(xgestaoEmailsEnviados.id, reserva.id)).catch(() => {});

  const marketing = ehMarketing(email.tipo);
  let token: string | null = null;
  if (marketing) {
    token = criarTokenDescadastro(email.userId);
    if (!token) {
      await desfazer();
      return 'sem_token';
    }
  }
  const data = email.tipo === 'volta_7d' || email.tipo === 'volta_30d'
    ? dataBrSp(linha.saidaEm)
    : email.tipo === 'cancelamento_confirmado' || email.tipo.startsWith('teste_') || email.tipo === 'cobranca_atraso'
      ? dataBrSp(linha.situacao.ate)
      : null;
  const texto = conteudoEmail(email.tipo, { nome: primeiroNome(linha.nome), data });
  const base = baseUrl.replace(/\/$/, '');
  try {
    await sendXgestaoCicloEmail(linha.email, {
      tipo: email.tipo,
      assunto: texto.assunto,
      props: {
        titulo: texto.titulo,
        paragrafos: texto.paragrafos,
        botaoTexto: texto.botao.texto,
        botaoLink: `${base}${texto.botao.caminho}`,
        rodape: texto.rodape,
        descadastroUrl: token ? urlDescadastro(base, token) : null,
      },
      listUnsubscribeUrl: token ? urlDescadastroUmClique(base, token) : null,
    });
    return 'enviado';
  } catch (erro) {
    console.error(`[xgestao-rotina] falha ao enviar ${email.tipo} userId=${email.userId}:`, erro instanceof Error ? erro.message : erro);
    await desfazer();
    return 'falha';
  }
}
