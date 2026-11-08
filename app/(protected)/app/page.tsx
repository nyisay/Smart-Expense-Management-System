import { requireUser } from "@/features/auth/session";
import { logoutAction } from "@/features/auth/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function ApplicationPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h1 className="text-2xl font-semibold">Smart Expense Management</h1>
          <h2 className="text-lg font-medium">Account settings</h2>
          <div className="max-w-xs"><ThemeSwitcher /></div>
          <p className="mt-4 break-words">
            Signed in as {user.name} ({user.email}).
          </p>
          <p className="mt-2">
            Your account is ready. Manage your income and expenses in your personal ledger.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href="/transactions">View transactions</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard">Open dashboard</Link></Button>
          </div>
          <form action={logoutAction} className="border-t pt-5">
            <Button variant="outline">Sign out</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
