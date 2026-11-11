import "server-only";
import { requireUser } from "@/features/auth/session";
import { loadDashboard } from "./store";
import { dashboardFilterSchema } from "./filters";
import { prisma } from "@/lib/prisma";

export async function getReportingData(input: unknown) {
  const user = await requireUser();
  const parsed = dashboardFilterSchema().safeParse(input);
  if (!parsed.success) return null;
  if (parsed.data.categoryId) {
    const available = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, type: "EXPENSE" },
      select: { id: true },
    });
    if (!available) return null;
  }
  return loadDashboard(user.id, parsed.data);
}
