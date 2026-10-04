import { expect, type APIRequestContext } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { users } from '@shared/db/schema';
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from './helpers';

/** Cria apenas dados novos de desenvolvimento; depende dos guards do runner. */
export async function novoAssinanteHomologacao(request: APIRequestContext, label: string) {
  const email = uniqueEmail(`xg-homolog-${label}`);
  const base = `11${Date.now().toString().slice(-10)}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce((total, digit, i) => total + Number(digit) * pesos[i], 0);
    return String(soma % 11 < 2 ? 0 : 11 - soma % 11);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const cpfCnpj = `${base}${primeiro}${digito(`${base}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])}`;
  const criada = await request.post('/api/auth/register', {
    data: {
      name: `E2E Homologação ${label}`,
      email,
      username: uniqueUsername('xg_homolog'),
      password: 'Xconstr@E2E2026!',
      role: 'empreiteiro',
      phone: '11988880000',
      cpfCnpj,
      acceptTerms: true,
      website: '',
      mountedAt: Date.now() - 5_000,
    },
  });
  expect(criada.status(), await criada.text()).toBeLessThan(300);
  await loginAs(request, email);
  await completarPerfilOperacional(request, 'empreiteiro');
  await logout(request);
  await loginAs(request, SEED_ADMIN_EMAIL);
  const consulta = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  expect(consulta.status(), await consulta.text()).toBe(200);
  const { rows } = await consulta.json() as { rows: Array<{ id: string }> };
  expect(rows).toHaveLength(1);
  const userId = rows[0].id;
  const conceder = await request.patch(`/api/admin/usuarios/${userId}`, { data: { xgestao: true } });
  expect(conceder.status(), await conceder.text()).toBe(200);
  // Pré-condição da jornada de obra: conta descartável já cadastrada, verificada
  // e com perfil preenchido. Não altera onboarding nem autenticação de ninguém
  // existente, e não pretende homologar o onboarding nesta fixture.
  await db.update(users).set({ onboardingConcluido: true }).where(eq(users.id, userId));
  await logout(request);
  await loginAs(request, email);
  return { email, userId };
}