import "next-auth";

declare module "next-auth" {
  interface User { id: string; sessionVersion?: number }
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  }
}
