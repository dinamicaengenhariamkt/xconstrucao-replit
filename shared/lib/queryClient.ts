import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * XG10 — recupera uma resposta 401 renovando a sessão e repetindo UMA vez.
 *
 * O access token dura 15 min. Mesmo com a renovação periódica do `AuthInit`,
 * uma requisição pode pegar a janela entre a expiração e o próximo tick (aba
 * que voltou do background, rede que falhou num tick). Sem isto, essa única
 * requisição derrubava o usuário para a tela de login.
 *
 * A repetição é limitada a uma tentativa para não transformar sessão inválida
 * em loop. O refresh em si é serializado no auth-store — várias queries
 * paralelas tomando 401 juntas compartilham uma só renovação.
 *
 * Import dinâmico: o auth-store importa este módulo (`queryClient`), então um
 * import estático fecharia um ciclo entre os dois.
 */
async function retryOn401(
  doFetch: () => Promise<Response>,
): Promise<Response> {
  const res = await doFetch();
  if (res.status !== 401) return res;

  const { useAuthStore } = await import("@features/auth/store/auth-store");
  // Sem usuário em sessão o 401 é esperado (rota pública, logout em curso):
  // devolve como veio, para o chamador tratar.
  if (useAuthStore.getState().user === null) return res;

  const renovou = await useAuthStore.getState().refreshToken();
  if (!renovou) return res;

  return doFetch();
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await retryOn401(() =>
    fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    }),
  );

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await retryOn401(() =>
      fetch(queryKey.join("/") as string, {
        credentials: "include",
      }),
    );

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // 30 minutes - consistent with feature hooks
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
