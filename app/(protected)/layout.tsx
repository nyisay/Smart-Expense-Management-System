import { Suspense } from "react";
import { requireUser } from "@/features/auth/session";
import { ApplicationShell } from "@/components/application-shell";

async function ProtectedContent({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <ApplicationShell user={{ name: user.name, email: user.email, profilePhotoId: user.profilePhotoId }}>{children}</ApplicationShell>;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-6" role="status">Checking your session…</p>}><ProtectedContent>{children}</ProtectedContent></Suspense>;
}
