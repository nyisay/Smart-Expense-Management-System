import { BackToDashboard } from "@/components/back-to-dashboard";
import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { todayInReportingTimezone } from "@/lib/dates";
import { loadBudgets } from "@/features/budgets/store";
import { budgetMonthSchema } from "@/features/budgets/schemas";
import { BudgetView } from "@/features/budgets/view";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Monthly budgets | Smart Expense" };
export default async function BudgetsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const query = await searchParams;
  const parsed = budgetMonthSchema.safeParse(query.month ?? todayInReportingTimezone().slice(0, 7));
  if (!parsed.success) return <main className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-3xl font-semibold">Invalid budget month</h1><p role="alert">Choose a valid calendar month.</p><Link href="/budgets" className="underline">Reset month</Link></main>;
  const data = await loadBudgets(user.id, parsed.data);
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-8">
    <BackToDashboard />
    <h1 className="text-3xl font-semibold tracking-tight">Monthly category budgets</h1>
    <p className="text-sm text-muted-foreground">Full calendar month · MMK · Asia/Yangon. No rollover or prorating. Unset limits stay unbudgeted. Group expenses are excluded.</p>
    <form action="/budgets" className="flex flex-wrap items-end gap-3">
      <div className="space-y-2"><Label htmlFor="budget-month">Budget month</Label><DatePicker id="budget-month" label="Budget month" name="month" precision="month" min="1900-01" max="9999-12" defaultValue={data.month} key={data.month} required /></div>
      <Button>Choose month</Button>
    </form>
    {query.saved === "yes" && <p role="status">Budget updated. Transactions were not changed.</p>}
    <BudgetView data={data} />
  </main>;
}
