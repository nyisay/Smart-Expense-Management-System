import "dotenv/config";
import { prisma } from "../lib/prisma";
import { developmentSeedEmail } from "./dev-seed-guard";
import { toDatabaseDate, todayInReportingTimezone } from "../lib/dates";

async function seed() {
  const email = developmentSeedEmail(process.env);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user)
    throw new Error(
      "Register the chosen local account before adding sample transactions.",
    );
  const categories = await prisma.category.findMany({
    select: { id: true, key: true },
  });
  const category = (key: string) => {
    const found = categories.find((item) => item.key === key);
    if (!found) throw new Error("Run npm run db:seed before sample seeding.");
    return found.id;
  };
  const today = toDatabaseDate(todayInReportingTimezone());
  const samples = Array.from({ length: 24 }, (_, index) => {
    const income = index % 8 === 0;
    return {
      ownerId: user.id,
      submissionKey: `de7e1000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      type: income ? ("INCOME" as const) : ("EXPENSE" as const),
      amountMinor: BigInt(income ? 500000 : 2500 + index * 500),
      categoryId: category(
        income
          ? "income-salary"
          : index % 2
            ? "expense-food"
            : "expense-travel",
      ),
      occurredOn: new Date(today.getTime() - index * 24 * 60 * 60 * 1000),
      merchant: income
        ? "Sample employer"
        : index % 2
          ? "Sample market"
          : "Sample transport",
      note: "Local development sample",
    };
  });
  const result = await prisma.transaction.createMany({
    data: samples,
    skipDuplicates: true,
  });
  console.log(
    `Added ${result.count} local sample transactions. Existing records were not changed.`,
  );
}

seed()
  .catch(() => {
    console.error(
      "Sample seed refused or failed. Check development opt-in, local database, registered account and category seed.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
