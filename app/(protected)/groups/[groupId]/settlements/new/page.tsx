import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getGroup } from "@/features/groups/queries";
import { SettlementForm } from "@/features/groups/forms";
import { GroupFormPage } from "@/features/groups/view";
import { todayInReportingTimezone } from "@/lib/dates";

export const metadata = { title: "Record repayment | Smart Expense" };
export default async function NewSettlementPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const group = await getGroup((await params).groupId);
  if (!group) notFound();
  const submissionKey = randomUUID();
  return (
    <GroupFormPage
      title="Record a completed repayment"
      back={`/groups/${group.id}`}
    >
      <SettlementForm
        key={submissionKey}
        group={{ id: group.id, members: group.members }}
        submissionKey={submissionKey}
        today={todayInReportingTimezone()}
      />
    </GroupFormPage>
  );
}
