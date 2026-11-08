import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div role="status" className="mx-auto w-full max-w-6xl p-8">Loading monthly budgets…<div aria-hidden="true" className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div></div>;
}
