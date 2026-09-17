import { expect, test, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obraEtapas } from '@shared/db/schema';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG10 — etapas e cronograma.
 *
 * O foco é a regra que a reunião destravou sem saber: o progresso da etapa é
 * GRANDEZA DERIVADA (média das tarefas medidas). O campo digitável era segunda
 * fonte de verdade; aqui o servidor recusa na obra do xgestão e mantém o
 * comportamento do marketplace.
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 700;

function proximoCnpjValido() {
  const base = `11222333${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}

async function registrar(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: 'empreiteiro E2E etapas',
      email,
      username: uniqueUsername(label.replace(/[^a-zA-Z0-9_.]/g, '')),
      password: 'Xconstr@E2E2026!',
      role: 'empreiteiro',
      phone: '11988880000',
      cpfCnpj: proximoCnpjValido(),
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
  return email;
}

async function concederXGestao(request: APIRequestContext, email: string) {
  await loginAs(request, SEED_ADMIN_EMAIL);
  const usuarios = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, {
    data: { xgestao: true },
  });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
}

async function criarAssinanteComObra(request: APIRequestContext, label: string) {
  const email = await registrar(request, label);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await concederXGestao(request, email);
  await loginAs(request, email);

  const criada = await request.post('/api/xgestao/obras', {
    data: { nome: `Obra E2E etapas ${label}`, endereco: 'Rua do Cronograma, 50' },
  });
  expect(criada.status(), await criada.text()).toBe(201);
  const obra = (await criada.json()) as { id: string };
  return { email, obraId: obra.id };
}

const INICIO_ISO = new Date('2026-10-01T12:00:00Z').toISOString();
const FIM_ISO = new Date('2026-10-20T12:00:00Z').toISOString();

test.describe('XG10 — etapas com datas do cronograma', () => {
  test('cria etapa com início e fim, e edita as datas', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-etapa-datas');

    const criada = await request.post(`/api/obras/${obraId}/etapas`, {
      data: {
        nome: 'Fundação',
        responsavel: 'Jefferson',
        dataInicio: INICIO_ISO,
        prazo: FIM_ISO,
      },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const etapa = (await criada.json()) as { id: string };

    // Estado no banco: são estas duas datas que desenham a barra do Gantt.
    const [linha] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(linha.dataInicio, 'início persistido').toBeTruthy();
    expect(linha.prazo, 'fim persistido').toBeTruthy();
    expect(new Date(linha.dataInicio!).toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(new Date(linha.prazo!).toISOString().slice(0, 10)).toBe('2026-10-20');

    const novoFim = new Date('2026-11-05T12:00:00Z').toISOString();
    const editada = await request.patch(`/api/obras/${obraId}/etapas/${etapa.id}`, {
      data: { prazo: novoFim },
    });
    expect(editada.status(), await editada.text()).toBe(200);

    const [apos] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(new Date(apos.prazo!).toISOString().slice(0, 10)).toBe('2026-11-05');

    // Etapa sem datas continua válida — ela só não entra no gráfico.
    const semDatas = await request.post(`/api/obras/${obraId}/etapas`, {
      data: { nome: 'Acabamento' },
    });
    expect(semDatas.status(), 'datas são opcionais').toBe(201);

    await logout(request);
  });

  /*
   * XG23 — o inverso do teste que estava aqui.
   *
   * A XG10 asserava 409 `PROGRESSO_DERIVADO` no PATCH de progresso em obra
   * própria, porque o valor vinha da média das tarefas. O cliente desfez a
   * premissa: "a etapa deixa com uma barrinha manual mesmo, pra poder encher
   * ali, colocar a porcentagem que ela tá". A regra continua sendo regra — só
   * trocou de lado, e agora o que ela protege é a persistência do digitado.
   */
  test('progresso da etapa é manual na obra do xgestão: PATCH grava o valor digitado', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg23-etapa-manual');

    const criada = await request.post(`/api/obras/${obraId}/etapas`, {
      data: { nome: 'Estrutura' },
    });
    const etapa = (await criada.json()) as { id: string };

    const patch = await request.patch(`/api/obras/${obraId}/etapas/${etapa.id}`, {
      data: { progresso: 40 },
    });
    expect(patch.status(), await patch.text()).toBe(200);

    const [linha] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(linha.progresso, 'valor digitado persistido').toBe(40);

    // 100% fecha a etapa (auto-coerência que já existia)...
    await request.patch(`/api/obras/${obraId}/etapas/${etapa.id}`, { data: { progresso: 100 } });
    const [cheia] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(cheia.status, '100% ⇒ concluído').toBe('concluido');

    // ...e voltar abaixo de 100 reabre. Sem isto a etapa ficaria "Concluído"
    // exibindo 80%, contradição que só passou a ser alcançável com a barrinha.
    await request.patch(`/api/obras/${obraId}/etapas/${etapa.id}`, { data: { progresso: 80 } });
    const [reaberta] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(reaberta.status, 'etapa reaberta não fica "Concluído" com 80%').toBe('em_andamento');

    // Fora da faixa continua barrado pelo schema.
    const invalido = await request.patch(`/api/obras/${obraId}/etapas/${etapa.id}`, {
      data: { progresso: 120 },
    });
    expect(invalido.status(), 'acima de 100 → 400').toBe(400);

    await logout(request);
  });

  /*
   * XG23 — o contrato que substitui "a etapa recebe a média das tarefas".
   *
   * Era exatamente esse recálculo que o cliente chamou de bagunça: "se eu
   * conclui essa tarefa, ela conclui a etapa". Na obra própria ele foi
   * desligado, e este teste existe para que não volte sem querer — as rotas de
   * tarefa continuam ativas e há tarefas legadas nessas obras.
   */
  test('na obra própria, mexer em tarefa NÃO sobrescreve o percentual manual da etapa', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg23-etapa-preservada');

    const criada = await request.post(`/api/obras/${obraId}/etapas`, {
      data: { nome: 'Alvenaria' },
    });
    const etapa = (await criada.json()) as { id: string };

    // O dono digita o avanço que enxerga no canteiro.
    await request.patch(`/api/obras/${obraId}/etapas/${etapa.id}`, { data: { progresso: 60 } });

    // Criar tarefa na etapa não pode mexer no número.
    const tarefa = await request.post(`/api/obras/${obraId}/tarefas`, {
      data: { titulo: 'Levantar paredes', etapa: 'Alvenaria', etapaId: etapa.id },
    });
    expect(tarefa.status(), await tarefa.text()).toBe(201);
    const tarefaCriada = (await tarefa.json()) as { id: string };

    const [aposCriar] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(aposCriar.progresso, 'criar tarefa não mexe na etapa').toBe(60);

    // Concluir a tarefa também não — era este o caminho que fechava a etapa
    // inteira quando ela tinha uma tarefa só.
    const concluir = await request.patch(`/api/obras/${obraId}/tarefas/${tarefaCriada.id}`, {
      data: { status: 'concluido' },
    });
    expect(concluir.status(), await concluir.text()).toBe(200);

    const [aposConcluir] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(aposConcluir.progresso, 'concluir tarefa não fecha a etapa').toBe(60);
    expect(aposConcluir.status, 'status da etapa preservado').not.toBe('concluido');

    // Excluir a tarefa idem.
    await request.delete(`/api/obras/${obraId}/tarefas/${tarefaCriada.id}`);
    const [aposExcluir] = await db.select().from(obraEtapas).where(eq(obraEtapas.id, etapa.id));
    expect(aposExcluir.progresso, 'excluir tarefa não zera a etapa').toBe(60);

    await logout(request);
  });
});

test.describe('XG10 — saúde e KPIs da obra', () => {
  test('obra recém-criada não aparece em risco', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-saude-nova');

    const saude = await request.get(`/api/obras/${obraId}/health`);
    expect(saude.status(), await saude.text()).toBe(200);
    const health = (await saude.json()) as {
      status: string;
      factors: { financeiro: number };
    };
    // O relato da reunião: "comecei só pra encher e o negócio já está dando
    // risco". Sem contrato nem pagamento, não há desalinhamento a apontar.
    expect(health.factors.financeiro, 'fator financeiro neutro').toBe(100);
    expect(health.status, 'obra nova é saudável').toBe('saudavel');

    await logout(request);
  });

  test('tarefa em andamento não conta como pendência no card', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-kpi-andamento');

    const criada = await request.post(`/api/obras/${obraId}/tarefas`, {
      data: { titulo: 'Assentar piso', etapa: 'Acabamento' },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const tarefa = (await criada.json()) as { id: string };

    await request.patch(`/api/obras/${obraId}/tarefas/${tarefa.id}`, {
      data: { status: 'em_andamento' },
    });

    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const corpo = (await detalhe.json()) as {
      tarefasEmAndamento: number;
      tarefasPendentes: number;
      tarefasTotal: number;
    };
    // O card mostra `tarefasEmAndamento`; `tarefasPendentes` (tudo que não
    // fechou) continua existindo para o score de saúde.
    expect(corpo.tarefasEmAndamento, 'uma tarefa em execução').toBe(1);
    expect(corpo.tarefasPendentes, 'ainda não concluída').toBe(1);
    expect(corpo.tarefasTotal).toBe(1);

    await request.patch(`/api/obras/${obraId}/tarefas/${tarefa.id}`, {
      data: { status: 'concluido' },
    });
    const apos = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const corpoApos = (await apos.json()) as {
      tarefasEmAndamento: number;
      tarefasPendentes: number;
    };
    expect(corpoApos.tarefasEmAndamento, 'concluída sai do andamento').toBe(0);
    expect(corpoApos.tarefasPendentes, 'e sai das pendentes').toBe(0);

    await logout(request);
  });

  test('problemas abertos são contados por gravidade real', async ({ request }) => {
    const { obraId } = await criarAssinanteComObra(request, 'xg10-kpi-gravidade');

    for (const gravidade of ['critico', 'medio', 'medio'] as const) {
      const r = await request.post(`/api/obras/${obraId}/ocorrencias`, {
        data: {
          titulo: `Ocorrência ${gravidade}`,
          descricao: 'Descrição da ocorrência de teste E2E',
          gravidade,
        },
      });
      expect(r.status(), await r.text()).toBe(201);
    }

    const detalhe = await request.get(`/api/empreiteiro/minhas-obras/${obraId}`);
    const corpo = (await detalhe.json()) as {
      problemasAbertos: number;
      problemasPorGravidade: { critico: number; medio: number; baixo: number };
    };
    // O subtítulo do card era "1 crítico, 2 médios" fixo no código — por
    // coincidência, exatamente este cenário. Agora o número é real.
    expect(corpo.problemasAbertos).toBe(3);
    expect(corpo.problemasPorGravidade).toMatchObject({ critico: 1, medio: 2, baixo: 0 });

    await logout(request);
  });
});
