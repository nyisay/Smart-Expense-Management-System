-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('MMK');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "key" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "TransactionType" NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'MMK',
    "occurredOn" DATE NOT NULL,
    "merchant" VARCHAR(200),
    "note" VARCHAR(1000),
    "receiptId" UUID,
    "submissionKey" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "merchant" VARCHAR(200),
    "amountMinor" BIGINT,
    "currency" "Currency" NOT NULL DEFAULT 'MMK',
    "occurredOn" DATE,
    "categoryId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'MMK',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupExpense" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "payerMemberId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'MMK',
    "occurredOn" DATE NOT NULL,
    "submissionKey" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GroupExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseShare" (
    "expenseId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "owedMinor" BIGINT NOT NULL,

    CONSTRAINT "ExpenseShare_pkey" PRIMARY KEY ("expenseId","memberId")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "fromMemberId" UUID NOT NULL,
    "toMemberId" UUID NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'MMK',
    "occurredOn" DATE NOT NULL,
    "submissionKey" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthThrottle" (
    "keyHash" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("keyHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Category_id_type_key" ON "Category"("id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receiptId_key" ON "Transaction"("receiptId");

-- CreateIndex
CREATE INDEX "Transaction_ownerId_occurredOn_idx" ON "Transaction"("ownerId", "occurredOn");

-- CreateIndex
CREATE INDEX "Transaction_ownerId_categoryId_occurredOn_idx" ON "Transaction"("ownerId", "categoryId", "occurredOn");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receiptId_ownerId_key" ON "Transaction"("receiptId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_ownerId_submissionKey_key" ON "Transaction"("ownerId", "submissionKey");

-- CreateIndex
CREATE INDEX "Receipt_ownerId_createdAt_idx" ON "Receipt"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Receipt_categoryId_idx" ON "Receipt"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_id_ownerId_key" ON "Receipt"("id", "ownerId");

-- CreateIndex
CREATE INDEX "Group_ownerId_idx" ON "Group"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_id_groupId_key" ON "GroupMember"("id", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_name_key" ON "GroupMember"("groupId", "name");

-- CreateIndex
CREATE INDEX "GroupExpense_groupId_occurredOn_idx" ON "GroupExpense"("groupId", "occurredOn");

-- CreateIndex
CREATE INDEX "GroupExpense_payerMemberId_groupId_idx" ON "GroupExpense"("payerMemberId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupExpense_id_groupId_key" ON "GroupExpense"("id", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupExpense_groupId_submissionKey_key" ON "GroupExpense"("groupId", "submissionKey");

-- CreateIndex
CREATE INDEX "ExpenseShare_memberId_groupId_idx" ON "ExpenseShare"("memberId", "groupId");

-- CreateIndex
CREATE INDEX "ExpenseShare_expenseId_groupId_idx" ON "ExpenseShare"("expenseId", "groupId");

-- CreateIndex
CREATE INDEX "Settlement_groupId_occurredOn_idx" ON "Settlement"("groupId", "occurredOn");

-- CreateIndex
CREATE INDEX "Settlement_fromMemberId_groupId_idx" ON "Settlement"("fromMemberId", "groupId");

-- CreateIndex
CREATE INDEX "Settlement_toMemberId_groupId_idx" ON "Settlement"("toMemberId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_groupId_submissionKey_key" ON "Settlement"("groupId", "submissionKey");

-- CreateIndex
CREATE INDEX "AuthThrottle_expiresAt_idx" ON "AuthThrottle"("expiresAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_type_fkey" FOREIGN KEY ("categoryId", "type") REFERENCES "Category"("id", "type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiptId_ownerId_fkey" FOREIGN KEY ("receiptId", "ownerId") REFERENCES "Receipt"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupExpense" ADD CONSTRAINT "GroupExpense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupExpense" ADD CONSTRAINT "GroupExpense_payerMemberId_groupId_fkey" FOREIGN KEY ("payerMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_expenseId_groupId_fkey" FOREIGN KEY ("expenseId", "groupId") REFERENCES "GroupExpense"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_memberId_groupId_fkey" FOREIGN KEY ("memberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromMemberId_groupId_fkey" FOREIGN KEY ("fromMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toMemberId_groupId_fkey" FOREIGN KEY ("toMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

