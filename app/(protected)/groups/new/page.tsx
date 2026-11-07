import { randomUUID } from "node:crypto";
import { requireUser } from "@/features/auth/session";
import { NewGroupForm } from "@/features/groups/forms";
import { GroupFormPage } from "@/features/groups/view";

export const metadata = { title: "Create group | Smart Expense" };
export default async function NewGroupPage() {
  const user = await requireUser();
  const id = randomUUID();
  return (
    <GroupFormPage title="Create a group" back="/groups">
      <NewGroupForm key={id} id={id} selfName={user.name} />
    </GroupFormPage>
  );
}
