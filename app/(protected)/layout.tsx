import { Suspense } from "react";
import { requireUser } from "@/features/auth/session";

async function ProtectedContent({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-6" role="status">Checking your session…</p>}><ProtectedContent>{children}</ProtectedContent></Suspense>;
}
