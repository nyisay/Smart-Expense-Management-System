"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6 py-12">
      <h1 className="text-2xl font-semibold">
        Your dashboard is temporarily unavailable
      </h1>
      <p role="alert" className="text-muted-foreground">
        We couldn’t load your financial overview. Please try again.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/transactions">View transactions</Link>
        </Button>
      </div>
    </main>
  );
}
