import "server-only";
import { requireUser } from "@/features/auth/session";
import { loadDashboard } from "./store";

export async function getDashboard(filters: unknown) {
  const user = await requireUser();
  return loadDashboard(user.id, filters);
}
