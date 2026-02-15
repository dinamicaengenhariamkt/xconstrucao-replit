import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { storage } from "@/server/storage";

export default {
  providers: [
    // Google OAuth - Mantido apenas para autenticação via Google
    // Autenticação com email/senha agora usa /api/auth/login diretamente
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Após login OAuth, redirecionar para página de conversão JWT
      if (url.includes("/api/auth/callback")) {
        return `${baseUrl}/auth/oauth-success`;
      }
      // Permite redirect relativo ou para baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      // Para Google OAuth
      if (account?.provider === "google") {
        // Verificar se usuário já existe
        const existingUser = await storage.getUserByEmail(user.email!);

        // Auto-verificar email de usuários OAuth (Google já verifica)
        if (existingUser && !existingUser.emailVerified) {
          await storage.updateUserEmailVerified(existingUser.id, new Date());
        }

        // Buscar role do usuário existente ou usar default
        if (existingUser) {
          user.role = existingUser.role;
        } else {
          // Novo usuário OAuth - será criado automaticamente com role padrão "contratante"
          user.role = "contratante";
        }

        return true;
      }

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
    newUser: "/auth/oauth-success",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  trustHost: true,
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
} satisfies NextAuthConfig;
