import { expensePercentage } from "@/features/dashboard/aggregate";

export function budgetProgress(spent: string, limit: string | null) {
  const actual = BigInt(spent);
  if (limit === null) return { remaining: null, overspend: "0", percentage: null, progress: 0, status: "unbudgeted" as const };
  const amount = BigInt(limit);
  if (amount <= BigInt(0) || actual < BigInt(0)) throw new Error("Invalid budget amounts.");
  const difference = amount - actual;
  return {
    remaining: (difference > BigInt(0) ? difference : BigInt(0)).toString(),
    overspend: (difference < BigInt(0) ? -difference : BigInt(0)).toString(),
    percentage: expensePercentage(spent, limit),
    progress: actual >= amount ? 100 : Number(actual * BigInt(10000) / amount) / 100,
    status: actual > amount ? "over" as const : actual === amount ? "reached" as const : actual * BigInt(100) >= amount * BigInt(80) ? "approaching" as const : "within" as const,
  };
}
