'use client';

interface AdminDashboardErrorProps {
  isRetrying: boolean;
  onRetry: () => void;
}

export function AdminDashboardError({ isRetrying, onRetry }: AdminDashboardErrorProps) {
  return (
    <div className="p-6 md:p-10" data-testid="admin-xgestao-error">
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/60 dark:bg-red-950/20">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Não foi possível carregar o painel xgestão
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Os dados não foram substituídos por zeros. Tente novamente para consultar a base atual.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 rounded-full bg-[#333333] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          data-testid="admin-xgestao-retry"
        >
          {isRetrying ? 'Tentando novamente…' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );
}