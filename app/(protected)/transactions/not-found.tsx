import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TransactionNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 p-6 py-12">
      <h1 className="text-2xl font-semibold">Transaction not found</h1>
      <p className="text-muted-foreground">This transaction is unavailable.</p>
      <Button asChild>
        <Link href="/transactions">Back to transactions</Link>
      </Button>
    </main>
  );
}
