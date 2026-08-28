import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { useAuthStore } from '@features/auth/store/auth-store';
import {
  fetchWithSessionRefresh,
  SessionExpiredError,
} from '@features/auth/utils/authenticated-fetch';

const originalFetch = globalThis.fetch;
const originalRefreshToken = useAuthStore.getState().refreshToken;

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.setState({ refreshToken: originalRefreshToken });
});

describe('fetchWithSessionRefresh', () => {
  it('não renova uma sessão que ainda está válida', async () => {
    let refreshes = 0;
    let requests = 0;
    useAuthStore.setState({ refreshToken: async () => { refreshes += 1; return true; } });
    globalThis.fetch = async () => {
      requests += 1;
      return new Response(null, { status: 200 });
    };

    const response = await fetchWithSessionRefresh('/api/test');

    assert.equal(response.status, 200);
    assert.equal(requests, 1);
    assert.equal(refreshes, 0);
  });

  it('renova uma vez e repete a operação depois de 401', async () => {
    let refreshes = 0;
    let requests = 0;
    useAuthStore.setState({ refreshToken: async () => { refreshes += 1; return true; } });
    globalThis.fetch = async () => {
      requests += 1;
      return new Response(null, { status: requests === 1 ? 401 : 201 });
    };

    const response = await fetchWithSessionRefresh('/api/test', { method: 'POST' });

    assert.equal(response.status, 201);
    assert.equal(requests, 2);
    assert.equal(refreshes, 1);
  });

  it('interrompe sem repetir quando o refresh é inválido', async () => {
    let refreshes = 0;
    let requests = 0;
    useAuthStore.setState({ refreshToken: async () => { refreshes += 1; return false; } });
    globalThis.fetch = async () => {
      requests += 1;
      return new Response(null, { status: 401 });
    };

    await assert.rejects(
      () => fetchWithSessionRefresh('/api/test', { method: 'POST' }),
      SessionExpiredError,
    );
    assert.equal(requests, 1);
    assert.equal(refreshes, 1);
  });

  it('não entra em loop se a repetição ainda responder 401', async () => {
    let refreshes = 0;
    let requests = 0;
    useAuthStore.setState({ refreshToken: async () => { refreshes += 1; return true; } });
    globalThis.fetch = async () => {
      requests += 1;
      return new Response(null, { status: 401 });
    };

    await assert.rejects(
      () => fetchWithSessionRefresh('/api/test', { method: 'POST' }),
      SessionExpiredError,
    );
    assert.equal(requests, 2);
    assert.equal(refreshes, 1);
  });
});