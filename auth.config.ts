import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { storage } from "@/server/storage";
import { ensureProfileRow, getUserByEmail } from "@features/auth/api/auth-storage";

const PERSONA_COOKIE = "x_signup_persona";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Após login OAuth, redireciona para conversão JWT
      if (url.includes("/api/auth/callback")) {
        return `${baseUrl}/auth/oauth-success`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const existingUser = await getUserByEmail(user.email!);

      // Lê a persona escolhida na landing (cookie curto setado antes do signIn).
      // Default seguro = contratante.
      let intendedRole: "contratante" | "empreiteiro" = "contratante";
      try {
        const cookieStore = await cookies();
        const persona = cookieStore.get(PERSONA_COOKIE)?.value;
        if (persona === "empreiteiro" || persona === "contratante") {
          intendedRole = persona;
        }
      } catch {
        // cookies() pode não estar disponível em alguns contextos do callback
      }

      if (existingUser) {
        // Auto-verificar email (Google já garante)
        if (!existingUser.emailVerified) {
          await storage.updateUserEmailVerified(existingUser.id, new Date());
        }
        // Garante row de domínio para usuário OAuth pré-existente
        await ensureProfileRow(existingUser);
        user.role = existingUser.role;
      } else {
        // Novo usuário OAuth — DrizzleAdapter ainda vai inserir em users.
        // Marcamos a role aqui para o callback `jwt` propagar; a profile row
        // será criada no oauth-convert (após adapter persistir o user).
        user.role = intendedRole;
      }

      return true;
    },
    async jwt({ token, user }) {
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
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: { sameSite: "lax", path: "/", secure: true },
    },
    sessionToken: {
      name: "next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },
} satisfies NextAuthConfig;
