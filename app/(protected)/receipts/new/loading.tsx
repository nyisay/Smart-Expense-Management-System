import { Skeleton } from "@/components/ui/skeleton";

export default function ReceiptLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12" role="status">
      Loading receipt upload…
      <div aria-hidden="true" className="mt-6 space-y-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-12 w-48 rounded-xl" /></div>
    </main>
  );
}
