import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { skipCSRFCheck } from "@auth/core";
import { db } from "@/server/db";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  ...authConfig,
  skipCSRFCheck,
});

export const { GET, POST } = handlers;
