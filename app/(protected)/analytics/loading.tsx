import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return <div role="status" aria-label="Loading analytics" className="mx-auto w-full max-w-7xl space-y-6 p-6 py-10"><p className="text-sm text-muted-foreground">Loading your analysis…</p><Skeleton aria-hidden="true" className="h-10 w-48" /><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton aria-hidden="true" key={item} className="h-32" />)}</div><Skeleton aria-hidden="true" className="h-96" /></div>;
}
