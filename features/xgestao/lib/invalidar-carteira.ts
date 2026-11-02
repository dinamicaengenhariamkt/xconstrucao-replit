import type { QueryClient } from '@tanstack/react-query';

/** O dashboard e Minhas Obras leem a mesma lista, não o cache do detalhe. */
export function invalidarCarteiraXgestao(client: QueryClient, obraId: string) {
  const detalhe = client.getQueryData<{ isObraPropria?: boolean }>(
    ['empreiteiro', 'minhas-obras', obraId],
  );
  if (detalhe?.isObraPropria) {
    return client.invalidateQueries({
      queryKey: ['empreiteiro', 'minhas-obras'],
      exact: true,
    });
  }
}
