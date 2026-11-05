import { requireUser } from "@/features/auth/session";
import { logoutAction } from "@/features/auth/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ApplicationPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Smart Expense Management</h1>
      <p className="mt-4">Signed in as {user.name} ({user.email}).</p>
      <p className="mt-2">Your account is ready. Manage your income and expenses in your personal ledger.</p>
      <Button asChild className="mt-5"><Link href="/transactions">View transactions</Link></Button>
      <Button asChild variant="outline" className="ml-3 mt-5"><Link href="/dashboard">Open dashboard</Link></Button>
      <form action={logoutAction} className="mt-6"><button className="rounded border px-4 py-2">Sign out</button></form>
    </main>
  );
}
