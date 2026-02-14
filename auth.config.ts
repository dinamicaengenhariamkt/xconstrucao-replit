import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@shared/schema";
import { storage } from "@/server/storage";
import { comparePassword } from "@/server/auth";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Permite vincular conta Google a usuário existente com mesmo email
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Buscar usuário por email
        const user = await storage.getUserByEmail(email);

        if (!user || !user.password) {
          return null;
        }

        // Verificar senha
        const valid = await comparePassword(password, user.password);

        if (!valid) {
          return null;
        }

        // Verificar se email foi verificado
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // Extrair rememberMe das credentials
        const rememberMe = (credentials as any).rememberMe === true || (credentials as any).rememberMe === "true";

        // Retornar usuário (sem a senha) com rememberMe
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl || user.image,
          rememberMe, // Adicionar rememberMe ao objeto user
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Para OAuth providers
      if (account?.provider !== "credentials") {
        // Verificar se usuário já existe
        const existingUser = await storage.getUserByEmail(user.email!);

        // Auto-verificar email de usuários OAuth (Google já verifica)
        if (existingUser && !existingUser.emailVerified) {
          await storage.updateUserEmailVerified(existingUser.id, new Date());
        }

        // Se usuário existe mas é OAuth, atualizar dados
        if (existingUser) {
          // NextAuth faz o link automaticamente via accounts table
          // Aqui podemos adicionar lógica extra se necessário
          return true;
        }

        // Se é novo usuário OAuth, NextAuth criará automaticamente
        return true;
      }

      // Para Credentials, sempre permitir
      return true;
    },
    async jwt({ token, user, trigger, account }) {
      // Primeiro login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // Ajustar expiração do token baseado em "rememberMe"
        if (trigger === "signIn" && account?.provider === "credentials") {
          const rememberMe = (user as any).rememberMe === true;
          const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 dias vs 7 dias
          token.exp = Math.floor(Date.now() / 1000) + maxAge;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
} satisfies NextAuthConfig;
