import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { getGroup } from "@/features/groups/queries";
import { MemberForm } from "@/features/groups/forms";
import { GroupFormPage } from "@/features/groups/view";

export const metadata = { title: "Add participant | Smart Expense" };
export default async function NewMemberPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const group = await getGroup((await params).groupId);
  if (!group) notFound();
  const id = randomUUID();
  return (
    <GroupFormPage
      title="Add participant or guest"
      back={`/groups/${group.id}`}
    >
      <MemberForm key={id} groupId={group.id} id={id} />
    </GroupFormPage>
  );
}
