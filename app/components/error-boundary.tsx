"use client";

import { useEffect } from "react";
import { Button } from "@shared/components/ui/button";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export default function ErrorBoundaryUI({ error, reset, title = "Algo deu errado" }: ErrorBoundaryProps) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
    fetch("/api/log/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message || "Unhandled client error",
        stack: error.stack,
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
        meta: { digest: error.digest },
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div
      data-testid="error-boundary-container"
      className="flex min-h-[60vh] items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            data-testid="btn-error-retry"
            onClick={reset}
            variant="default"
          >
            Tentar novamente
          </Button>
          <Button
            data-testid="btn-error-home"
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Ir para o início
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && error.message && (
          <details className="text-left mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer">Detalhes do erro (dev)</summary>
            <pre className="text-xs text-red-500 bg-red-50 dark:bg-red-950 rounded p-2 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
