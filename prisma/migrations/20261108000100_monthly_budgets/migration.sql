CREATE TABLE "Budget" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "categoryType" "TransactionType" NOT NULL DEFAULT 'EXPENSE',
  "month" DATE NOT NULL,
  "limitMinor" BIGINT NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'MMK',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Budget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Budget_amount_range" CHECK ("limitMinor" > 0 AND "limitMinor" <= 9000000000000000),
  CONSTRAINT "Budget_version_positive" CHECK ("version" > 0),
  CONSTRAINT "Budget_expense_only" CHECK ("categoryType" = 'EXPENSE'),
  CONSTRAINT "Budget_month_start" CHECK (EXTRACT(DAY FROM "month") = 1 AND "month" >= DATE '1900-01-01')
);
CREATE UNIQUE INDEX "Budget_ownerId_categoryId_month_key" ON "Budget"("ownerId", "categoryId", "month");
CREATE INDEX "Budget_ownerId_month_idx" ON "Budget"("ownerId", "month");
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_categoryType_fkey" FOREIGN KEY ("categoryId", "categoryType") REFERENCES "Category"("id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;
