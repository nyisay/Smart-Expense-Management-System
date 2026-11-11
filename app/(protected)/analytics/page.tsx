import Link from "next/link";
import { getReportingData } from "@/features/dashboard/queries";
import { AnalyticsView } from "@/features/analytics/view";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Analytics | Smart Expense" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getReportingData(await searchParams);
  if (!data) return <main className="mx-auto w-full max-w-3xl space-y-5 p-6 py-12"><h1 className="text-3xl font-semibold">Analytics filters need attention</h1><p role="alert">Choose a valid date range of at most 120 calendar months and an available expense category.</p><Button asChild><Link href="/analytics">Reset analytics filters</Link></Button></main>;
  return <AnalyticsView data={data} />;
}
