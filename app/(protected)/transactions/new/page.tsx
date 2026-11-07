import { randomUUID } from "node:crypto";
import Link from "next/link";
import { getCategories } from "@/features/transactions/queries";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { todayInReportingTimezone } from "@/lib/dates";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "New transaction | Smart Expense" };

export default async function NewTransactionPage() {
  const categories = await getCategories();
  const submissionKey = randomUUID();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/transactions"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to transactions
      </Link>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          New transaction
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record an income or expense in whole kyat.
        </p>
        <Link
          href="/receipts/new"
          className="mt-2 inline-block text-sm underline underline-offset-4"
        >
          Or upload a receipt for assisted entry
        </Link>
      </header>
      <Card>
        <CardContent className="pt-6">
          <TransactionForm
            key={submissionKey}
            categories={categories}
            submissionKey={submissionKey}
            today={todayInReportingTimezone()}
          />
        </CardContent>
      </Card>
    </main>
  );
}
