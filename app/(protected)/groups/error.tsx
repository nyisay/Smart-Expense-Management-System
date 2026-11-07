"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function GroupsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6 py-12">
      <h1 className="text-2xl font-semibold">
        Groups are temporarily unavailable
      </h1>
      <p role="alert">We couldn’t load these records. Please try again.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/groups">Back to groups</Link>
        </Button>
      </div>
    </main>
  );
}
