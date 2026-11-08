import { Skeleton } from "@/components/ui/skeleton";

export default function GroupsLoading() {
  return (
    <main role="status" className="mx-auto max-w-5xl p-6 py-12">
      Loading group records…
      <div aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-2"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
    </main>
  );
}
