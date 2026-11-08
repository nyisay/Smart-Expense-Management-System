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
      <div className="h-10 w-52 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
