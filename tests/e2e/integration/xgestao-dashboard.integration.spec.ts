import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

/**
 * XG28 — o contrato de dados da tabela do dashboard.
 *
 * As jornadas XG27 e XG28 acrescentaram seis campos à listagem
 * (`progressoDisponivel`, `diasAtraso`, `custoReal`, `consumoOrcamento`,
 * `ocorrenciasAbertas`, `statusObra`) e **nenhum teste os cobria**: os specs
 * existentes assertam apenas `id`, `temContratante` e `isObraPropria`. Como
 * toda a tabela é alimentada por eles, um `null` ou um campo renomeado no
 * servidor quebraria a tela sem nada ficar vermelho.
 *
 * O que este arquivo protege, além da presença dos campos, são as duas
 * decisões que a XG27 tomou e que um refactor desatento desfaz sem perceber:
 * obra sem orçamento devolve `consumoOrcamento: null` (e **não** 0, que
 * pareceria folga total), e obra sem cronograma devolve
 * `progressoDisponivel: false` (e **não** 0%, que foi o bug relatado pelo
 * cliente).
 */

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
let cnpjSequence = 1;

function proximoCnpjValido() {
  const base = `11222444${String(cnpjSequence++).padStart(4, '0')}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base}${primeiro}${segundo}`;
}

async function registrarEmpreiteiro(request: APIRequestContext, label: string) {
  const email = uniqueEmail(label);
  const response = await request.post('/api/auth/register', {
    data: {
      name: 'empreiteiro dashboard E2E',
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
  expect(usuarios.status()).toBe(200);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, {
    data: { xgestao: true },
  });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
}

interface ObraDaListagem {
  id: string;
  titulo: string;
  isObraPropria: boolean;
  progressoDisponivel: boolean;
  diasAtraso: number;
  custoReal: number;
  consumoOrcamento: number | null;
  ocorrenciasAbertas: number;
  statusObra?: string;
  dataPrevisaoFim: string;
}

test.describe('xgestão — dados da tabela do dashboard', () => {
  test('a listagem entrega todos os campos que a tabela do dashboard exibe', async ({ request }) => {
    const email = await registrarEmpreiteiro(request, 'xg28-dashboard');
    await loginAs(request, email);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, email);
    await loginAs(request, email);

    try {
      // Obra sem orçamento e sem cronograma: é o caso que gerou o relato do
      // cliente, e o que mais facilmente volta a regredir.
      const semDados = await request.post('/api/xgestao/obras', {
        data: { nome: 'E2E xg28 obra sem dados', endereco: 'Rua do Dashboard, 1' },
      });
      expect(semDados.status(), await semDados.text()).toBe(201);

      const lista = await request.get('/api/empreiteiro/minhas-obras');
      expect(lista.status(), await lista.text()).toBe(200);
      const obras = (await lista.json()) as ObraDaListagem[];

      const obra = obras.find((item) => item.titulo === 'E2E xg28 obra sem dados');
      expect(obra, 'a obra recém-criada deve aparecer na listagem').toBeDefined();

      // Cada coluna da tabela precisa do seu campo — a asserção existe para o
      // dia em que alguém renomear um deles no servidor.
      expect(obra).toMatchObject({
        isObraPropria: true,
        diasAtraso: expect.any(Number),
        custoReal: expect.any(Number),
        ocorrenciasAbertas: expect.any(Number),
        progressoDisponivel: expect.any(Boolean),
      });
      expect(typeof obra?.statusObra, 'statusObra alimenta a coluna Status').toBe('string');

      // XG27 — sem orçamento lançado não há denominador. `null` é o que faz a
      // coluna dizer "não lançado" em vez de pintar um verde de folga total.
      expect(obra?.consumoOrcamento, 'sem orçamento o consumo é null, nunca 0').toBeNull();

      // XG27 — sem etapa não há cronograma para medir. `false` é o que impede
      // a tela de afirmar "0% executado", que foi exatamente a queixa.
      expect(obra?.progressoDisponivel, 'sem cronograma o progresso não está disponível').toBe(false);

      // Obra nova não nasce atrasada nem com ocorrência.
      expect(obra?.diasAtraso).toBe(0);
      expect(obra?.ocorrenciasAbertas).toBe(0);
    } finally {
      await logout(request);
    }
  });

  test('obra com orçamento lançado passa a reportar consumo numérico', async ({ request }) => {
    const email = await registrarEmpreiteiro(request, 'xg28-orcamento');
    await loginAs(request, email);
    await completarPerfilOperacional(request, 'empreiteiro');
    await logout(request);
    await concederXGestao(request, email);
    await loginAs(request, email);

    try {
      const criada = await request.post('/api/xgestao/obras', {
        data: { nome: 'E2E xg28 obra com orçamento', endereco: 'Rua do Orçamento, 100' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id } = (await criada.json()) as { id: string };

      // O orçamento não entra na criação — é campo de edição, como a XG22
      // estabeleceu. O PATCH é o caminho real do produto.
      const editada = await request.patch(`/api/obras/${id}`, {
        data: { valorTotal: '100000' },
      });
      expect(editada.status(), await editada.text()).toBe(200);

      const lista = await request.get('/api/empreiteiro/minhas-obras');
      const obras = (await lista.json()) as ObraDaListagem[];
      const obra = obras.find((item) => item.titulo === 'E2E xg28 obra com orçamento');

      // Com denominador, o consumo deixa de ser `null` e vira número — é a
      // diferença entre a coluna dizer "não lançado" e dizer "0% do orçamento".
      expect(obra?.consumoOrcamento, 'com orçamento o consumo é numérico').toBe(0);
    } finally {
      await logout(request);
    }
  });
});
