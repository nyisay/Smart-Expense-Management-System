import { notFound } from "next/navigation";
import { getGroup } from "@/features/groups/queries";
import { ExpenseForm } from "@/features/groups/forms";
import { GroupFormPage } from "@/features/groups/view";
import { todayInReportingTimezone } from "@/lib/dates";

export const metadata = { title: "Edit group bill | Smart Expense" };
export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = await params;
  const group = await getGroup(groupId);
  const record = group?.expenses.find((expense) => expense.id === expenseId);
  if (!group || !record) notFound();
  return (
    <GroupFormPage title="Edit group bill" back={`/groups/${group.id}`}>
      <ExpenseForm
        key={record.id}
        group={{ id: group.id, members: group.members }}
        record={record}
        today={todayInReportingTimezone()}
      />
    </GroupFormPage>
  );
}
