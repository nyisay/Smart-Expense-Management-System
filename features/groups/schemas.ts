import { z } from "zod";
import { calendarDateSchema } from "@/lib/dates";
import { createTransactionSchema } from "@/features/transactions/schemas";
import { integerInputSchema } from "@/lib/validation";
import {
  allocateShares,
  splitInputsSchema,
  splitModeSchema,
} from "./calculations";

const name = z.string().trim().min(1, "Enter a name.").max(80);
const uuid = (message?: string) => z.uuid(message).transform((value) => value.toLowerCase());
export const createGroupSchema = z.strictObject({
  id: uuid(),
  name,
  selfName: name,
});
export const deleteGroupSchema = z.strictObject({
  groupId: uuid(),
  updatedAt: z.iso.datetime(),
  confirmed: z.literal("yes", "Confirm deletion first."),
});
export const addMemberSchema = z.strictObject({
  groupId: uuid(),
  id: uuid(),
  name,
});
const expenseFields = {
  groupId: uuid(),
  title: z.string().trim().min(1, "Enter a bill title.").max(200),
  amount: createTransactionSchema.shape.amount,
  occurredOn: calendarDateSchema,
  payerMemberId: uuid("Choose who paid."),
  mode: splitModeSchema,
  shares: splitInputsSchema,
};
function validateSplit(
  data: {
    amount: bigint;
    mode: string;
    shares: z.output<typeof splitInputsSchema>;
  },
  ctx: z.RefinementCtx,
) {
  try {
    allocateShares(data.amount, data.mode, data.shares);
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      path: ["shares"],
      message: error instanceof Error ? error.message : "Invalid shares.",
    });
  }
}
export const createExpenseSchema = z
  .strictObject({ ...expenseFields, submissionKey: uuid() })
  .superRefine(validateSplit);
export const editExpenseSchema = z
  .strictObject({
    ...expenseFields,
    id: uuid(),
    version: integerInputSchema(1, 2147483646),
  })
  .superRefine(validateSplit);
export const deleteExpenseSchema = z.strictObject({
  groupId: uuid(),
  id: uuid(),
  version: integerInputSchema(1, 2147483646),
  confirmed: z.literal("yes", "Confirm deletion first."),
});
export const settlementSchema = z
  .strictObject({
    groupId: uuid(),
    fromMemberId: uuid("Choose who repaid."),
    toMemberId: uuid("Choose who received it."),
    amount: createTransactionSchema.shape.amount,
    occurredOn: calendarDateSchema,
    submissionKey: uuid(),
    confirmed: z.literal("yes", "Confirm this repayment already happened."),
  })
  .refine((data) => data.fromMemberId !== data.toMemberId, {
    path: ["toMemberId"],
    message: "Choose two different participants.",
  });
