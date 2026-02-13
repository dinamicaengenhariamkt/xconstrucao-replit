import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { hashPassword, createToken } from "@/server/auth";
import { registerSchema } from "@shared/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, username, password, role, phone } = parsed.data;

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json({ message: "Email já cadastrado" }, { status: 409 });
    }

    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json({ message: "Nome de usuário já cadastrado" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await storage.createUser({ name, email, username, password: hashed, role, phone: phone || null });
    const token = createToken(user.id);
    const { password: _, ...userData } = user;

    const response = NextResponse.json({ user: userData }, { status: 201 });
    response.cookies.set("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60, sameSite: "lax", path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
