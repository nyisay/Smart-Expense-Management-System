"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ReceiptPageError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">
        Receipt upload is temporarily unavailable
      </h1>
      <p role="alert">Please retry or enter your expense manually.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/transactions/new">Enter manually</Link>
        </Button>
      </div>
    </main>
  );
}
