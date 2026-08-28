'use client';

import { useAuthStore } from '@features/auth/store/auth-store';

/**
 * Faz uma requisição autenticada e tenta recuperar uma sessão cujo access
 * token expirou. A repetição é deliberadamente limitada a uma tentativa para
 * não transformar uma sessão inválida em loop de requests.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Sua sessão expirou. Faça login novamente para continuar.');
    this.name = 'SessionExpiredError';
  }
}

export async function fetchWithSessionRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    credentials: 'include',
  };

  const response = await fetch(input, requestInit);
  if (response.status !== 401) return response;

  const refreshed = await useAuthStore.getState().refreshToken();
  if (!refreshed) throw new SessionExpiredError();

  const retried = await fetch(input, requestInit);
  if (retried.status === 401) throw new SessionExpiredError();
  return retried;
}