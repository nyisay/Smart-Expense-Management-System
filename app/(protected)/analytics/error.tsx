"use client";

import { Button } from "@/components/ui/button";

export default function AnalyticsError({ reset }: { reset: () => void }) {
  return <main className="mx-auto w-full max-w-3xl space-y-4 p-6 py-12"><h1 className="text-2xl font-semibold">Your analytics are temporarily unavailable</h1><p role="alert" className="text-muted-foreground">We couldn’t load this analysis. Please try again.</p><Button onClick={reset}>Try again</Button></main>;
}
