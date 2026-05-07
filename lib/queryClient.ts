import { QueryClient, QueryFunction, MutationCache } from "@tanstack/react-query";
import { toast } from "@shared/hooks/use-toast";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Detecta o erro 403 EMAIL_NOT_VERIFIED disparado pelos guards de
 * `requireVerifiedUser` no backend. Como `apiRequest` joga `${status}: ${text}`,
 * basta procurar pelo código padronizado dentro da mensagem.
 */
function isEmailNotVerifiedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("EMAIL_NOT_VERIFIED");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  // Toast centralizado para erro 403 EMAIL_NOT_VERIFIED em qualquer mutation.
  // O banner persistente do dashboard cobre o caso "passivo"; este handler
  // cobre o caso "ativo" quando o usuário tenta executar uma ação bloqueada.
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isEmailNotVerifiedError(error)) {
        toast({
          title: "Verifique seu email",
          description:
            "Esta ação só fica disponível depois que você confirmar seu email. Use o banner no topo para reenviar o link.",
          variant: "destructive",
        });
      }
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - allow cache expiration
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
