"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";

export default function VerificarEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const email = searchParams.get("email");

  // Estados: pending (aguardando verificação), verified (sucesso), error (falha)
  const getStatus = () => {
    if (success === "verified") return "verified";
    if (success === "already_verified") return "verified";
    if (error) return "error";
    return "pending";
  };

  const status = getStatus();

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Erro ao reenviar email:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "verified" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email Verificado!</CardTitle>
              <CardDescription>
                Sua conta foi ativada com sucesso. Você já pode fazer login.
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Erro na Verificação</CardTitle>
              <CardDescription>
                {error === "token_invalid" && "Link de verificação inválido ou expirado."}
                {error === "token_missing" && "Link de verificação incompleto."}
                {error === "user_not_found" && "Usuário não encontrado."}
                {error === "server_error" && "Erro no servidor. Tente novamente."}
              </CardDescription>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
              <CardDescription>
                Enviamos um email de confirmação para <strong>{email}</strong>.
                Por favor, clique no link do email para ativar sua conta.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "verified" && (
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Fazer Login
            </Button>
          )}

          {status === "error" && email && (
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                "Solicitar Novo Link"
              )}
            </Button>
          )}

          {status === "pending" && (
            <>
              {resendSuccess && (
                <p className="text-sm text-green-600 text-center">
                  ✓ Email reenviado com sucesso!
                </p>
              )}

              <Button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  "Reenviar Email"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Não recebeu? Verifique sua caixa de spam ou solicite um novo email.
              </p>
            </>
          )}

          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="w-full"
          >
            Voltar para Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
