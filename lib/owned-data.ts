import "server-only";
import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import { prisma } from "@/lib/prisma";
import { owned } from "./ownership";

const idSchema = z.uuid();

export async function getOwnedTransaction(id: string) {
  const user = await requireUser();
  return prisma.transaction.findFirst({
    where: owned.transaction(idSchema.parse(id), user.id),
    select: { id: true, type: true, amountMinor: true, currency: true, occurredOn: true, categoryId: true },
  });
}

export async function getOwnedReceipt(id: string) {
  const user = await requireUser();
  return prisma.receipt.findFirst({
    where: owned.receipt(idSchema.parse(id), user.id),
    select: { id: true, merchant: true, amountMinor: true, currency: true, occurredOn: true },
  });
}

export async function getOwnedGroup(id: string) {
  const user = await requireUser();
  return prisma.group.findFirst({ where: owned.group(idSchema.parse(id), user.id), select: { id: true, name: true, currency: true } });
}

export async function getOwnedGroupExpense(id: string) {
  const user = await requireUser();
  return prisma.groupExpense.findFirst({
    where: owned.groupRecord(idSchema.parse(id), user.id),
    select: { id: true, title: true, amountMinor: true, currency: true },
  });
}

export async function getOwnedSettlement(id: string) {
  const user = await requireUser();
  return prisma.settlement.findFirst({
    where: owned.groupRecord(idSchema.parse(id), user.id),
    select: { id: true, amountMinor: true, currency: true, occurredOn: true },
  });
}

export async function getOwnedGroupMember(id: string) {
  const user = await requireUser();
  return prisma.groupMember.findFirst({
    where: owned.groupRecord(idSchema.parse(id), user.id),
    select: { id: true, name: true, isSelf: true },
  });
}

export async function getOwnedExpenseShare(expenseId: string, memberId: string) {
  const user = await requireUser();
  return prisma.expenseShare.findFirst({
    where: { expenseId: idSchema.parse(expenseId), memberId: idSchema.parse(memberId), expense: { group: { ownerId: user.id } } },
    select: { expenseId: true, memberId: true, owedMinor: true },
  });
}
