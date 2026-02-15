import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@shared/schema";
import { storage } from "@/server/storage";
import {
  comparePassword,
  createAccessToken,
  createRefreshToken
} from "@/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados de entrada com Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const response = NextResponse.json(
        {
          error: "Dados inválidos",
          details: validation.error.errors
        },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    const { email, password } = validation.data;
    const rememberMe = body.rememberMe || false;

    // Buscar usuário por email
    const user = await storage.getUserByEmail(email);

    if (!user) {
      const response = NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    // Verificar se email foi verificado
    if (!user.emailVerified) {
      const response = NextResponse.json(
        {
          error: "EMAIL_NOT_VERIFIED",
          message: "Por favor, verifique seu email antes de fazer login"
        },
        { status: 403 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    // Verificar se usuário tem senha (pode ser OAuth)
    if (!user.password) {
      const response = NextResponse.json(
        { error: "Esta conta usa login via Google. Use o botão 'Continuar com Google'" },
        { status: 400 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    // Comparar senha
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      const response = NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    // Preparar dados do usuário (sem password)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.image,
      avatarUrl: user.avatarUrl,
    };

    // Gerar tokens JWT
    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(user.id, rememberMe);

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Prevent caching of auth responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Configurar cookies HTTP-only
    // Access Token (15 minutos)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutos
    });

    // Refresh Token (7 ou 30 dias)
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax", // Mudado de strict para lax (melhor compatibilidade)
      path: "/",
      maxAge: refreshMaxAge,
    });

    return response;

  } catch (error) {
    console.error("Erro no login:", error);
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }
}
