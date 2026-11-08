import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { getTransaction } from "@/features/transactions/queries";
import { formatAmount } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteTransactionButton } from "@/features/transactions/delete-button";
import { safeReturnTo } from "@/features/transactions/navigation";

export const metadata = { title: "Transaction details | Smart Expense" };

export default async function TransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const record = await getTransaction(id);
  if (!record) notFound();
  const query = await searchParams;
  const returnTo = safeReturnTo(query.returnTo);
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={returnTo}
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to transactions
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">
        Transaction details
      </h1>
      {(query.saved === "created" || query.saved === "updated") && (
        <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
          Transaction {query.saved === "created" ? "created" : "updated"}.
        </p>
      )}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Badge variant="secondary">
              {record.type === "INCOME" ? "Income" : "Expense"}
            </Badge>
            <p className="break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {record.type === "INCOME" ? "+" : "−"}
              {formatAmount(record.amount)}
            </p>
          </div>
          <dl className="grid gap-5 border-t pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Category</dt>
              <dd className="mt-1 font-medium">{record.categoryName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Date</dt>
              <dd className="mt-1">
                <time dateTime={record.occurredOn}>{record.occurredOn}</time>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">
                Merchant or source
              </dt>
              <dd className="mt-1 break-words">
                {record.merchant || "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Note</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">
                {record.note || "No note"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link href={`/transactions/${id}/edit?${new URLSearchParams({ returnTo })}`}>
            <Pencil aria-hidden="true" />
            Edit transaction
          </Link>
        </Button>
        <DeleteTransactionButton id={id} version={record.version} returnTo={returnTo} />
      </div>
    </main>
  );
}
