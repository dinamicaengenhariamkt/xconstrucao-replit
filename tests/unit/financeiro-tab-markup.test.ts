import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

test('card da equipe renderiza subtotais contratuais, não material, em layout responsivo', () => {
  // Render React via tsx, fora do adaptador de módulos do runner de testes.
  execFileSync('node', ['node_modules/tsx/dist/cli.mjs', 'tests/render/custo-equipe.render.tsx'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
});