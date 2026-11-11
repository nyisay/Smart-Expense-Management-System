import Link from "next/link";
import { getReportingData } from "@/features/dashboard/queries";
import { DashboardView } from "@/features/dashboard/view";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard | Smart Expense" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getReportingData(await searchParams);
  if (!data)
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 p-6 py-12">
        <h1 className="text-3xl font-semibold">
          Dashboard filters need attention
        </h1>
        <p role="alert">
          Choose a valid date range of at most 120 calendar months and an
          available expense category.
        </p>
        <Button asChild>
          <Link href="/dashboard">Reset dashboard filters</Link>
        </Button>
      </main>
    );
  return <DashboardView data={data} />;
}
