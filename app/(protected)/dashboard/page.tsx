import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { dashboardFilterSchema } from "@/features/dashboard/filters";
import { getDashboard } from "@/features/dashboard/queries";
import { DashboardView } from "@/features/dashboard/view";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard | Smart Expense" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const parsed = dashboardFilterSchema().safeParse(await searchParams);
  const available =
    parsed.success &&
    (!parsed.data.categoryId ||
      (await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, type: "EXPENSE" },
        select: { id: true },
      })));
  if (!parsed.success || !available)
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
  const data = await getDashboard(parsed.data);
  return <DashboardView data={data} />;
}
