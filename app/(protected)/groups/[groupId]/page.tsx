import { notFound } from "next/navigation";
import { getGroup } from "@/features/groups/queries";
import { GroupDetail } from "@/features/groups/view";

export const metadata = { title: "Group balances | Smart Expense" };
export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await getGroup(groupId);
  if (!group) notFound();
  return <GroupDetail group={group} />;
}
