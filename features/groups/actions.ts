"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import * as store from "./store";

export type GroupFormState = {
  message: string;
  errors?: Record<string, string[]>;
};
function failure(error: unknown): GroupFormState {
  if (error instanceof z.ZodError)
    return {
      message: "Please correct the highlighted fields.",
      errors: z.flattenError(error).fieldErrors,
    };
  return {
    message:
      error instanceof store.GroupError
        ? error.message
        : "Unable to save right now. Your entered values have been kept. Please try again.",
  };
}
function refresh(groupId: string): never {
  revalidatePath("/groups", "layout");
  redirect(`/groups/${groupId}?saved=yes`);
}

export async function deleteGroupAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  try {
    await store.deleteGroup(user.id, {
      groupId: form.get("groupId"),
      updatedAt: form.get("updatedAt"),
      confirmed: form.get("confirmed"),
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/groups", "layout");
  redirect("/groups?deleted=yes");
}
function expenseFields(form: FormData) {
  const members = form.getAll("memberId");
  const values = form.getAll("shareValue");
  if (members.length !== values.length)
    throw new store.GroupError("Each participant must have one share value.");
  return {
    groupId: form.get("groupId"),
    title: form.get("title"),
    amount: form.get("amount"),
    occurredOn: form.get("occurredOn"),
    payerMemberId: form.get("payerMemberId"),
    mode: form.get("mode"),
    shares: members.map((memberId, index) => ({
      memberId,
      value: values[index],
    })),
  };
}

export async function createGroupAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  let id: string;
  try {
    id = (
      await store.createGroup(user.id, {
        id: form.get("id"),
        name: form.get("name"),
        selfName: form.get("selfName"),
      })
    ).id;
  } catch (error) {
    return failure(error);
  }
  refresh(id);
}

export async function addMemberAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const groupId = form.get("groupId");
  try {
    await store.addMember(user.id, {
      groupId,
      id: form.get("id"),
      name: form.get("name"),
    });
  } catch (error) {
    return failure(error);
  }
  refresh(z.uuid().parse(groupId));
}

export async function createExpenseAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const groupId = form.get("groupId");
  try {
    await store.createExpense(user.id, {
      ...expenseFields(form),
      submissionKey: form.get("submissionKey"),
    });
  } catch (error) {
    return failure(error);
  }
  refresh(z.uuid().parse(groupId));
}

export async function editExpenseAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const groupId = form.get("groupId");
  try {
    await store.editExpense(user.id, {
      ...expenseFields(form),
      id: form.get("id"),
      version: form.get("version"),
    });
  } catch (error) {
    return failure(error);
  }
  refresh(z.uuid().parse(groupId));
}

export async function deleteExpenseAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const groupId = form.get("groupId");
  try {
    await store.deleteExpense(user.id, {
      groupId,
      id: form.get("id"),
      version: form.get("version"),
      confirmed: form.get("confirmed"),
    });
  } catch (error) {
    return failure(error);
  }
  refresh(z.uuid().parse(groupId));
}

export async function recordSettlementAction(
  _state: GroupFormState,
  form: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const groupId = form.get("groupId");
  try {
    await store.recordSettlement(user.id, {
      groupId,
      fromMemberId: form.get("fromMemberId"),
      toMemberId: form.get("toMemberId"),
      amount: form.get("amount"),
      occurredOn: form.get("occurredOn"),
      submissionKey: form.get("submissionKey"),
      confirmed: form.get("confirmed"),
    });
  } catch (error) {
    return failure(error);
  }
  refresh(z.uuid().parse(groupId));
}
