import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return <div role="status" aria-label="Loading account settings" className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
    <Skeleton className="h-9 w-64" />
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]"><Skeleton className="h-80" /><div className="space-y-6"><Skeleton className="h-96" /><Skeleton className="h-64" /></div></div>
  </div>;
}
