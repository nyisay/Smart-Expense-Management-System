import "dotenv/config";
import { prisma } from "../lib/prisma";

async function seed() {
  const categories = [
    { key: "income-salary", name: "Salary", type: "INCOME" },
    { key: "income-other", name: "Other income", type: "INCOME" },
    { key: "expense-food", name: "Food", type: "EXPENSE" },
    { key: "expense-travel", name: "Travel", type: "EXPENSE" },
    { key: "expense-housing", name: "Housing", type: "EXPENSE" },
    { key: "expense-other", name: "Other expense", type: "EXPENSE" },
  ] as const;
  await prisma.$transaction(categories.map((category) => prisma.category.upsert({
    where: { key: category.key }, create: category, update: {},
  })));
}

seed().then(() => console.log("Category seed complete."))
  .catch(() => { console.error("Category seed failed; check database configuration."); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
