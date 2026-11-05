import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCategories, getTransaction } from "@/features/transactions/queries";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Edit transaction | Smart Expense" };

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const record = await getTransaction(id);
  if (!record) notFound();
  const categories = await getCategories();
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={`/transactions/${id}`}
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to transaction
      </Link>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Edit transaction
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Correct your record. All amounts are in MMK.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <TransactionForm
            key={id}
            categories={categories}
            record={record}
            today={record.occurredOn}
          />
        </CardContent>
      </Card>
    </main>
  );
}
