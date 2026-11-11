import { BackToDashboard } from "@/components/back-to-dashboard";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import Link from "next/link";
import { Plus, ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCategories,
  getTransactionList,
} from "@/features/transactions/queries";
import { TransactionFiltersForm } from "@/features/transactions/filters";
import { transactionFiltersSchema } from "@/features/transactions/schemas";
import { formatAmount } from "@/lib/money";
import { transactionListHref, transactionDetailHref } from "@/features/transactions/navigation";

export const metadata = { title: "Transactions | Smart Expense" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const parsed = transactionFiltersSchema.safeParse(query);
  const categories = await getCategories();
  if (!parsed.success)
    return (
      <main className="mx-auto w-full max-w-6xl p-6 py-12">
        <h1 className="text-3xl font-semibold">Transactions</h1>
        <p role="alert" className="my-5">
          These filters are invalid. Check dates, categories, types, search length,
          whole-MMK amount bounds and page numbers.
        </p>
        <Button asChild>
          <Link href="/transactions">Reset filters</Link>
        </Button>
      </main>
    );
  const filters = parsed.data;
  const result = await getTransactionList(filters);
  const returnTo = transactionListHref({ ...filters, page: result.page });
  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (key !== "page" && value !== undefined) params.set(key, String(value));
    params.set("page", String(page));
    return `/transactions?${params}`;
  };
  const hasFilters = !!(
    filters.type ||
    filters.categoryId ||
    filters.from ||
    filters.to || filters.q || filters.minAmount !== undefined || filters.maxAmount !== undefined
  );
  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 sm:px-8 sm:py-12">
      <BackToDashboard />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Personal ledger · MMK
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Transactions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep a clear record of what comes in and what goes out.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/transactions/new">
            <Plus aria-hidden="true" />
            New transaction
          </Link>
        </Button>
      </header>
      {query.deleted === "yes" && (
        <p
          role="status"
          className="rounded-lg border bg-muted/40 px-4 py-3 text-sm"
        >
          Transaction deleted.
        </p>
      )}
      <Card>
        <CardContent className="pt-5">
          <TransactionFiltersForm
            key={JSON.stringify(filters)}
            categories={categories}
            filters={filters}
          />
        </CardContent>
      </Card>
      <section aria-label="Your transactions" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">
            {hasFilters ? "Filtered records" : "All records"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {result.total} transaction{result.total === 1 ? "" : "s"}
          </p>
        </div>
        {!result.records.length ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <ReceiptText
                className="size-9 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="font-medium">
                {hasFilters
                  ? "No matching transactions"
                  : "Your ledger starts here"}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {hasFilters
                  ? "Try different dates, type, category, search text or amount bounds."
                  : "Add your first income or expense to keep your records in one place."}
              </p>
              <Button variant="outline" asChild>
                <Link href={hasFilters ? "/transactions" : "/transactions/new"}>
                  {hasFilters ? "Clear filters" : "Add a transaction"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {result.records.map((record) => (
                <Card key={record.id}>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex justify-between gap-3">
                      <Badge variant="secondary">
                        {record.type === "INCOME" ? "Income" : "Expense"}
                      </Badge>
                      <time
                        dateTime={record.occurredOn}
                        className="text-xs text-muted-foreground"
                      >
                        {record.occurredOn}
                      </time>
                    </div>
                    <p className="break-words text-lg font-semibold tabular-nums">
                      {record.type === "INCOME" ? "+" : "−"}
                      {formatAmount(record.amount)}
                    </p>
                    <p className="break-words text-sm">
                      {record.merchant || record.categoryName}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {record.categoryName}
                      </span>
                      <Button variant="outline" asChild>
                        <Link
                          href={transactionDetailHref(record.id, returnTo)}
                          aria-label={`View details for ${record.merchant || record.categoryName} on ${record.occurredOn}`}
                        >
                          View details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
              <Table className="w-full text-left text-sm">
                <TableCaption className="sr-only">
                  Your transactions, newest date first. Amounts are whole MMK.
                </TableCaption>
                <TableHeader className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <TableRow>
                    <TableHead scope="col" className="px-5 py-4 font-medium">
                      Transaction
                    </TableHead>
                    <TableHead scope="col" className="px-4 py-4 font-medium">
                      Category
                    </TableHead>
                    <TableHead scope="col" className="px-4 py-4 font-medium">
                      Date
                    </TableHead>
                    <TableHead
                      scope="col"
                      className="px-4 py-4 text-right font-medium"
                    >
                      Amount
                    </TableHead>
                    <TableHead scope="col" className="px-5 py-4">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {result.records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/20">
                      <TableCell className="max-w-64 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-muted p-2">
                            {record.type === "INCOME" ? (
                              <ArrowDownLeft
                                className="size-4"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowUpRight
                                className="size-4"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {record.merchant || record.categoryName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {record.type === "INCOME" ? "Income" : "Expense"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="secondary">{record.categoryName}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4">
                        <time dateTime={record.occurredOn}>
                          {record.occurredOn}
                        </time>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums">
                        {record.type === "INCOME" ? "+" : "−"}
                        {formatAmount(record.amount)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link
                            href={transactionDetailHref(record.id, returnTo)}
                            aria-label={`View details for ${record.merchant || record.categoryName} on ${record.occurredOn}`}
                          >
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {result.pages > 1 && (
          <nav
            aria-label="Transaction pages"
            className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"
          >
            <p className="text-sm text-muted-foreground">
              Page {result.page} of {result.pages}
            </p>
            <div className="flex gap-2">
              {result.page > 1 ? (
                <Button variant="outline" asChild>
                  <Link href={pageLink(result.page - 1)} rel="prev">
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}
              {result.page < result.pages ? (
                <Button variant="outline" asChild>
                  <Link href={pageLink(result.page + 1)} rel="next">
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
