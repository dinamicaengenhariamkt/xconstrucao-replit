import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustoPrevistoEquipe } from '../../features/empreiteiro/minhas-obras/components/FinanceiroTab';
import type { ObraFinanceiro } from '../../features/empreiteiro/minhas-obras/types';

const financeiro: ObraFinanceiro = {
  valorContratado: 40000,
  aditivos: 0,
  valorTotal: 40000,
  saldoReceber: 40000,
  percentualRecebido: 0,
  percentualExecutado: 0,
  receitaTotal: 0,
  custoTotal: 36086.08,
  custoPrevistoEquipe: 1500.01,
  custoPagoEquipeContratada: 1010.02,
  custoAindaDesembolsarEquipe: 490,
  custoExcedenteEquipe: 0.01,
  custoMaoDeObraForaContratos: 69.03,
  medicoes: [],
};

const html = renderToStaticMarkup(<CustoPrevistoEquipe financeiro={financeiro} />);
assert.match(html, /data-testid="custo-equipe-pago"[^>]*>R\$\s*1\.010,02/);
assert.match(html, /data-testid="custo-equipe-restante"[^>]*>R\$\s*490,00/);
assert.match(html, /data-testid="custo-equipe-excedente"/);
assert.match(html, /data-testid="custo-equipe-avulso"/);
assert.doesNotMatch(html, /R\$\s*35\.000,00/);
assert.match(html, /sm:grid-cols-3/);