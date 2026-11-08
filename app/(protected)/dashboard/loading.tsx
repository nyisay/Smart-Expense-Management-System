import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 p-6 py-10"
      role="status"
      aria-label="Loading dashboard"
    >
      <p className="text-sm text-muted-foreground">
        Loading your financial overview…
      </p>
      <Skeleton aria-hidden="true" className="h-10 w-52 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton aria-hidden="true" key={item} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton aria-hidden="true" className="h-96 rounded-xl" />
        <Skeleton aria-hidden="true" className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
