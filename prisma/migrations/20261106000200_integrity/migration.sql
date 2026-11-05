-- Supplement Prisma's structural constraints with domain invariants.
ALTER TABLE "User" ADD CONSTRAINT "User_email_normalized"
  CHECK ("email" = lower(btrim("email")) AND length("email") > 0);
ALTER TABLE "User" ADD CONSTRAINT "User_name_nonempty" CHECK (length(btrim("name")) > 0);
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_amount_range"
  CHECK ("amountMinor" > 0 AND "amountMinor" <= 9000000000000000);
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_version_positive" CHECK ("version" > 0);
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receipt_expense"
  CHECK ("receiptId" IS NULL OR "type" = 'EXPENSE');
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_amount_range"
  CHECK ("amountMinor" IS NULL OR ("amountMinor" > 0 AND "amountMinor" <= 9000000000000000));
ALTER TABLE "Group" ADD CONSTRAINT "Group_name_nonempty" CHECK (length(btrim("name")) > 0);
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_name_nonempty" CHECK (length(btrim("name")) > 0);
CREATE UNIQUE INDEX "GroupMember_normalized_name" ON "GroupMember" ("groupId", lower(btrim("name")));
CREATE UNIQUE INDEX "GroupMember_one_self" ON "GroupMember" ("groupId") WHERE "isSelf";
ALTER TABLE "GroupExpense" ADD CONSTRAINT "GroupExpense_amount_range"
  CHECK ("amountMinor" > 0 AND "amountMinor" <= 9000000000000000);
ALTER TABLE "GroupExpense" ADD CONSTRAINT "GroupExpense_version_positive" CHECK ("version" > 0);
ALTER TABLE "ExpenseShare" ADD CONSTRAINT "ExpenseShare_amount_range"
  CHECK ("owedMinor" >= 0 AND "owedMinor" <= 9000000000000000);
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_amount_range"
  CHECK ("amountMinor" > 0 AND "amountMinor" <= 9000000000000000);
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_distinct_members" CHECK ("fromMemberId" <> "toMemberId");
ALTER TABLE "AuthThrottle" ADD CONSTRAINT "AuthThrottle_attempts_positive" CHECK ("attempts" > 0);

-- Deferred checks allow expense/share corrections in any order inside one transaction.
CREATE FUNCTION check_expense_total(expense_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE expected bigint;
DECLARE actual numeric;
BEGIN
  SELECT "amountMinor" INTO expected FROM "GroupExpense" WHERE "id" = expense_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT COALESCE(sum("owedMinor"), 0) INTO actual FROM "ExpenseShare" WHERE "expenseId" = expense_id;
  IF actual <> expected THEN
    RAISE EXCEPTION 'Expense shares must sum to the expense total' USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE FUNCTION enforce_expense_total() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM check_expense_total(NEW."id");
  RETURN NULL;
END;
$$;

CREATE FUNCTION enforce_share_total() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'DELETE' THEN PERFORM check_expense_total(NEW."expenseId"); END IF;
  IF TG_OP <> 'INSERT' THEN
    IF TG_OP = 'DELETE' OR OLD."expenseId" IS DISTINCT FROM NEW."expenseId" THEN
      PERFORM check_expense_total(OLD."expenseId");
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "GroupExpense_total_check"
  AFTER INSERT OR UPDATE ON "GroupExpense" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_expense_total();
CREATE CONSTRAINT TRIGGER "ExpenseShare_total_check"
  AFTER INSERT OR UPDATE OR DELETE ON "ExpenseShare" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION enforce_share_total();
