"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl space-y-4 p-8"><h1 className="text-2xl font-semibold">Budgets temporarily unavailable</h1><p role="alert">Your transactions are unchanged. Please try again.</p><Button onClick={reset}>Try again</Button></main>;
}
