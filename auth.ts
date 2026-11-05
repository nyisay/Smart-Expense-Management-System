import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/features/auth/service";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const env = getServerEnv();
  const secure = new URL(env.AUTH_URL).protocol === "https:";
  return {
    secret: env.AUTH_SECRET,
    trustHost: true,
    useSecureCookies: secure,
    session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
    pages: { signIn: "/login" },
    cookies: {
      sessionToken: {
        name: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
        options: { httpOnly: true, sameSite: "lax", path: "/", secure },
      },
    },
    providers: [Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      authorize: authenticate,
    })],
    callbacks: {
      async jwt({ token, user }) {
        if (user) return { sub: user.id };
        if (!token.sub) return null;
        const exists = await prisma.user.findUnique({ where: { id: token.sub }, select: { id: true } });
        return exists ? token : null;
      },
      async session({ session, token }) {
        if (session.user && token.sub) session.user.id = token.sub;
        return session;
      },
      redirect({ url }) {
        const target = new URL(url, env.AUTH_URL);
        return target.origin === new URL(env.AUTH_URL).origin &&
          ["/app", "/login", "/dashboard"].includes(target.pathname)
          ? target.href : `${env.AUTH_URL.replace(/\/$/, "")}/dashboard`;
      },
    },
    logger: {
      error() { console.error("Authentication request failed."); },
    },
  };
});
