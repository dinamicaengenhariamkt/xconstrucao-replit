import { NextRequest, NextResponse } from "next/server";
import { verifyEmailVerificationToken } from "@/server/auth";
import { storage } from "@/server/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_missing", request.url)
      );
    }

    const result = verifyEmailVerificationToken(token);

    if (!result) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=token_invalid", request.url)
      );
    }

    // Verificar se usuário existe
    const user = await storage.getUser(result.userId);
    if (!user) {
      return NextResponse.redirect(
        new URL("/verificar-email?error=user_not_found", request.url)
      );
    }

    // Verificar se email já foi verificado
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL("/verificar-email?success=already_verified", request.url)
      );
    }

    // Atualizar emailVerified
    await storage.updateUserEmailVerified(result.userId, new Date());

    return NextResponse.redirect(
      new URL("/verificar-email?success=verified", request.url)
    );
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return NextResponse.redirect(
      new URL("/verificar-email?error=server_error", request.url)
    );
  }
}
