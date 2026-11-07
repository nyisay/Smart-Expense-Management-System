import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getGroup } from "@/features/groups/queries";
import { ExpenseForm } from "@/features/groups/forms";
import { GroupFormPage } from "@/features/groups/view";
import { todayInReportingTimezone } from "@/lib/dates";

export const metadata = { title: "Add group expense | Smart Expense" };
export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const group = await getGroup((await params).groupId);
  if (!group) notFound();
  const submissionKey = randomUUID();
  return (
    <GroupFormPage title="Add group expense" back={`/groups/${group.id}`}>
      <ExpenseForm
        key={submissionKey}
        group={{ id: group.id, members: group.members }}
        submissionKey={submissionKey}
        today={todayInReportingTimezone()}
      />
    </GroupFormPage>
  );
}
