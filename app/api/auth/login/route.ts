import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { comparePassword, createToken } from "@/server/auth";
import { loginSchema } from "@shared/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: "Email ou senha incorretos" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: "Email ou senha incorretos" }, { status: 401 });
    }

    const token = createToken(user.id);
    const { password: _, ...userData } = user;

    const response = NextResponse.json({ user: userData });
    response.cookies.set("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60, sameSite: "lax", path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
