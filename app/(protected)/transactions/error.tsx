"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TransactionError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 p-6 py-12">
      <h1 className="text-2xl font-semibold">
        Transactions are temporarily unavailable
      </h1>
      <p role="alert" className="text-muted-foreground">
        We couldn’t load this page. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/transactions">Back to transactions</Link>
        </Button>
      </div>
    </main>
  );
}
