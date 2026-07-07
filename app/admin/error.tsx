"use client";
import ErrorBoundaryUI from "@/app/components/error-boundary";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryUI error={error} reset={reset} title="Erro na área administrativa" />;
}
