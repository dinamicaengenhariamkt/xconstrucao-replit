import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enderecoPublico } from '../../features/xgestao/obra-publica/endereco-publico';

const casos: Array<[string, string | null, string | null]> = [
  ['Rua X, 123 - Apto 4', null, 'Rua X'],
  ['Av. Y 1500, Bloco B', null, 'Av. Y'],
  ['Rua Z, s/n', null, 'Rua Z'],
  ['Rua Z, S/N', null, 'Rua Z'],
  ['Rua X, 123 - Apto 4 - 01234-567', null, 'Rua X'],
  ['Rua X, 123, CEP 01234567', null, 'Rua X'],
  ['01234-567 Rua das Flores, 45', null, 'Rua das Flores'],
  ['Rua das Flores, 45 - Centro', null, 'Rua das Flores, Centro'],
  ['Rua das Flores, 45, Apto 12, Vila Mariana, São Paulo - SP, 04101-000', 'São Paulo', 'Rua das Flores, Vila Mariana'],
  ['Avenida Paulista, 1000', 'Sao Paulo', 'Avenida Paulista'],
  ['Rua 25 de Março, 100', null, 'Rua 25 de Março'],
  ['Rua 7', null, 'Rua 7'],
  ['Rua das Obras', null, 'Rua das Obras'],
  ['Rua X, nº 12, casa 2', null, 'Rua X'],
  ['Rua Augusta 1500 - Sala 3', null, 'Rua Augusta'],
  ['Rua Augusta, 1500 – Consolação', null, 'Rua Augusta, Consolação'],
  // E2E-01: número colado, sem vírgula antes do complemento.
  ['Rua Augusta 1500 Bloco B', null, 'Rua Augusta'],
  ['Rua das Flores 123 apto 45', null, 'Rua das Flores'],
  ['Av. Paulista 1000 sala 12, Bela Vista', null, 'Av. Paulista, Bela Vista'],
  ['Rua das Flores 123 apto 45 - Vila Mariana', null, 'Rua das Flores, Vila Mariana'],
  ['Rua X nº 12 casa 2', null, 'Rua X'],
  ['Rua X n° 12', null, 'Rua X'],
  ['Rua X numero 12', null, 'Rua X'],
  ['Rua X número 12 fundos', null, 'Rua X'],
  ['Rua Z s/n', null, 'Rua Z'],
  ['Rua Z S/N Lote 4 Quadra 2', null, 'Rua Z'],
  ['Rua Augusta 1500A', null, 'Rua Augusta'],
  ['Rua Augusta 1.500', null, 'Rua Augusta'],
  ['Rua Augusta 1500 fundos', null, 'Rua Augusta'],
  ['Rua das Flores 45 casa 3, Centro, 01234-567', null, 'Rua das Flores, Centro'],
  // Número no nome da rua: corta a porta, não o nome.
  ['Rua 25 de Março', null, 'Rua 25 de Março'],
  ['Rua 25 de Março 300 loja 4', null, 'Rua 25 de Março'],
  ['Av. 9 de Julho', null, 'Av. 9 de Julho'],
  ['Av. 9 de Julho 1200 apto 3', null, 'Av. 9 de Julho'],
  ['Rua 7 de Setembro 300', null, 'Rua 7 de Setembro'],
  ['Rua 7 de Setembro, 300', null, 'Rua 7 de Setembro'],
  ['Rodovia SP-55 km 12', null, 'Rodovia SP-55'],
  ['Rodovia SP-55, km 12, Centro', null, 'Rodovia SP-55, Centro'],
  ['Rua 7 300', null, 'Rua 7'],
  ['Rua Casa Verde 100', null, 'Rua Casa Verde'],
  // Ambíguo: não dá para separar nome de porta, sobra só o bairro.
  ['Rua 1500, Bela Vista', null, 'Bela Vista'],
  ['123 Rua X', null, null],
  ['Quadra 5 Lote 3, Jardim América', null, 'Jardim América'],
  ['Apto 4', null, null],
  ['', null, null],
  ['   ', null, null],
];

for (const [entrada, cidade, esperado] of casos) {
  test(`enderecoPublico(${JSON.stringify(entrada)})`, () => {
    assert.equal(enderecoPublico(entrada, cidade), esperado);
  });
}

test('nunca devolve dígito de número de porta nem CEP', () => {
  for (const [entrada, cidade] of casos) {
    const r = enderecoPublico(entrada, cidade) ?? '';
    const semNomes = r
      .replace('25 de Março', '')
      .replace('9 de Julho', '')
      .replace('7 de Setembro', '')
      .replace('SP-55', '')
      .replace('Rua 7', '');
    assert.doesNotMatch(semNomes, /\d/);
  }
});

test('nunca devolve complemento nem marcador de número', () => {
  for (const [entrada, cidade] of casos) {
    const r = enderecoPublico(entrada, cidade) ?? '';
    assert.doesNotMatch(r, /\b(apto?|bloco|sala|casa \d|lote|quadra|fundos|km|s\/n|n[º°]|n[uú]mero)\b/i);
  }
});

test('null e undefined', () => {
  assert.equal(enderecoPublico(null), null);
  assert.equal(enderecoPublico(undefined), null);
});
