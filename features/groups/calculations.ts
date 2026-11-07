import { z } from "zod";
import { MAX_AMOUNT_MINOR } from "@/lib/money";

export const splitModeSchema = z.enum(["AMOUNT", "PERCENT"]);
export const splitInputsSchema = z
  .array(
    z.strictObject({
      memberId: z.uuid().transform((value) => value.toLowerCase()),
      value: z.string().max(20),
    }),
  )
  .min(1)
  .max(50)
  .refine(
    (shares) =>
      new Set(shares.map((share) => share.memberId)).size === shares.length,
    "Each participant may appear only once.",
  );

export function allocateShares(total: bigint, mode: unknown, input: unknown) {
  if (total <= BigInt(0) || total > MAX_AMOUNT_MINOR)
    throw new Error("Enter a positive bill total within the supported limit.");
  const shares = splitInputsSchema.parse(input);
  const splitMode = splitModeSchema.parse(mode);
  if (splitMode === "AMOUNT") {
    const result = shares.map(({ memberId, value }) => {
      if (
        !/^(0|[1-9]\d{0,15})$/.test(value) ||
        BigInt(value) > MAX_AMOUNT_MINOR
      )
        throw new Error("Shares must be nonnegative whole-kyat amounts.");
      return { memberId, owedMinor: BigInt(value) };
    });
    if (
      result.reduce((sum, share) => sum + share.owedMinor, BigInt(0)) !== total
    )
      throw new Error("Share amounts must equal the bill total exactly.");
    return result;
  }
  const weights = shares.map(({ memberId, value }) => {
    if (!/^(0|[1-9]\d{0,2})(?:\.\d{1,2})?$/.test(value))
      throw new Error(
        "Percentages must be between 0 and 100 with at most two decimal places.",
      );
    const [whole, decimal = ""] = value.split(".");
    const weight = BigInt(whole) * BigInt(100) + BigInt(decimal.padEnd(2, "0"));
    if (weight > BigInt(10000))
      throw new Error("Percentages must be between 0 and 100.");
    return {
      memberId,
      weight,
      owedMinor: (total * weight) / BigInt(10000),
      remainder: (total * weight) % BigInt(10000),
    };
  });
  if (
    weights.reduce((sum, share) => sum + share.weight, BigInt(0)) !==
    BigInt(10000)
  )
    throw new Error("Percentages must total exactly 100.00%.");
  let remaining =
    total - weights.reduce((sum, share) => sum + share.owedMinor, BigInt(0));
  // Largest remainder first; stable member UUID order breaks ties independent of form order.
  const ranked = [...weights].sort((a, b) =>
    a.remainder === b.remainder
      ? a.memberId.localeCompare(b.memberId)
      : a.remainder > b.remainder
        ? -1
        : 1,
  );
  for (const share of ranked) {
    if (remaining === BigInt(0)) break;
    share.owedMinor += BigInt(1);
    remaining -= BigInt(1);
  }
  return weights.map(({ memberId, owedMinor }) => ({ memberId, owedMinor }));
}

type Expense = {
  payerMemberId: string;
  amountMinor: bigint;
  shares: { memberId: string; owedMinor: bigint }[];
};
type Repayment = {
  fromMemberId: string;
  toMemberId: string;
  amountMinor: bigint;
};

export function calculateBalances(
  memberIds: string[],
  expenses: Expense[],
  settlements: Repayment[],
) {
  const balances = new Map(
    memberIds.map((id) => [
      id,
      {
        id,
        paid: BigInt(0),
        owed: BigInt(0),
        sent: BigInt(0),
        received: BigInt(0),
      },
    ]),
  );
  const member = (id: string) => {
    const record = balances.get(id);
    if (!record)
      throw new Error("Ledger references an unavailable participant.");
    return record;
  };
  for (const expense of expenses) {
    member(expense.payerMemberId).paid += expense.amountMinor;
    for (const share of expense.shares)
      member(share.memberId).owed += share.owedMinor;
  }
  for (const settlement of settlements) {
    member(settlement.fromMemberId).sent += settlement.amountMinor;
    member(settlement.toMemberId).received += settlement.amountMinor;
  }
  const result = [...balances.values()].map((balance) => ({
    ...balance,
    net: balance.paid - balance.owed + balance.sent - balance.received,
  }));
  if (
    result.reduce((sum, balance) => sum + balance.net, BigInt(0)) !== BigInt(0)
  )
    throw new Error("Group balances must sum to zero.");
  return result.map((balance) => ({
    id: balance.id,
    paid: balance.paid.toString(),
    owed: balance.owed.toString(),
    sent: balance.sent.toString(),
    received: balance.received.toString(),
    net: balance.net.toString(),
  }));
}

export function repaymentPlan(balances: { id: string; net: string }[]) {
  const debtors = balances
    .filter((member) => BigInt(member.net) < BigInt(0))
    .map((member) => ({ id: member.id, remaining: -BigInt(member.net) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const creditors = balances
    .filter((member) => BigInt(member.net) > BigInt(0))
    .map((member) => ({ id: member.id, remaining: BigInt(member.net) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (
    balances.reduce((sum, balance) => sum + BigInt(balance.net), BigInt(0)) !==
    BigInt(0)
  )
    throw new Error("Group balances must sum to zero.");
  const plan: { fromMemberId: string; toMemberId: string; amount: string }[] =
    [];
  let creditor = 0;
  for (const debtor of debtors) {
    while (debtor.remaining > BigInt(0)) {
      const recipient = creditors[creditor];
      const amount =
        debtor.remaining < recipient.remaining
          ? debtor.remaining
          : recipient.remaining;
      plan.push({
        fromMemberId: debtor.id,
        toMemberId: recipient.id,
        amount: amount.toString(),
      });
      debtor.remaining -= amount;
      recipient.remaining -= amount;
      if (recipient.remaining === BigInt(0)) creditor++;
    }
  }
  return plan;
}
