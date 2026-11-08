import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingTransactions() {
  return (
    <div className="mx-auto w-full max-w-6xl p-8" role="status">
      Loading your transactions…
      <div aria-hidden="true" className="mt-6 space-y-4"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-16 rounded-xl" /></div>
    </div>
  );
}
