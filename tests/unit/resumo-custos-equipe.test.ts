import assert from "node:assert/strict";
import { test } from "node:test";
import { resumirCustosEquipe } from "../../features/empreiteiro/minhas-obras/lib/resumo-custos-equipe";

const dono = "dono";
const equipe = [
  { id: "ana", ativo: true, valorContrato: "1000.01" },
  { id: "bia", ativo: true, valorContrato: "500.00" },
  { id: "sem-contrato", ativo: true, valorContrato: null },
  { id: "inativo", ativo: false, valorContrato: "2000.00" },
  { id: "zero", ativo: true, valorContrato: "0.00" },
];
type Lancamento = Parameters<typeof resumirCustosEquipe>[1][number];
function lancamento(
  valor: string,
  categoria: string,
  fornecedorId: string | null,
  extras: Partial<Lancamento> = {},
): Lancamento {
  return {
    valor,
    categoria,
    fornecedorId,
    tipo: "saida",
    status: "pago",
    pagadorUserId: dono,
    recebedorUserId: null,
    ...extras,
  };
}

test("material pago a um membro e outras despesas não quitam contrato; avulso permanece fora", () => {
  const resumo = resumirCustosEquipe(equipe, [
    lancamento("1200.02", "mao_de_obra", "ana"),
    lancamento("35000.00", "material", "ana"),
    lancamento("7.03", "outras_despesas", "bia"),
    lancamento("50.02", "mao_de_obra", null),
    lancamento("19.01", "mao_de_obra", "inativo"),
    lancamento("6.00", "mao_de_obra", "sem-contrato"),
    lancamento("4.00", "mao_de_obra", "zero"),
    lancamento("100.00", "mao_de_obra", "bia", { status: "pendente" }),
    lancamento("10.00", "mao_de_obra", "bia", { status: "atrasado" }),
    lancamento("12.00", "mao_de_obra", "bia", { status: "cancelado" }),
    lancamento("500.00", "mao_de_obra", "bia", { tipo: "entrada", recebedorUserId: dono, pagadorUserId: null }),
    lancamento("8.00", "mao_de_obra", "bia", { pagadorUserId: null, recebedorUserId: null }),
  ], dono);
  assert.deepEqual(resumo, {
    custoPrevistoEquipe: 1500.01,
    custoPagoEquipeContratada: 1200.02,
    custoAindaDesembolsarEquipe: 500,
    custoExcedenteEquipe: 200.01,
    custoMaoDeObraForaContratos: 79.03,
  });
});

test("várias parcelas e centavos acumulam por prestador, não por categoria ou obra", () => {
  assert.deepEqual(resumirCustosEquipe(equipe, [
    lancamento("0.01", "mao_de_obra", "ana"),
    lancamento("0.02", "mao_de_obra", "ana"),
    lancamento("500.00", "mao_de_obra", "bia"),
  ], dono), {
    custoPrevistoEquipe: 1500.01,
    custoPagoEquipeContratada: 500.03,
    custoAindaDesembolsarEquipe: 999.98,
    custoExcedenteEquipe: 0,
    custoMaoDeObraForaContratos: 0,
  });
  assert.equal(resumirCustosEquipe(equipe, [lancamento("1", "mao_de_obra", "ana")], null).custoPagoEquipeContratada, 0);
  assert.equal(resumirCustosEquipe([], [lancamento("1", "mao_de_obra", "ana")], dono).custoPrevistoEquipe, 0);
});