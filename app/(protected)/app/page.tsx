import { requireUser } from "@/features/auth/session";
import { loadProfile } from "@/features/account/store";
import { AccountView } from "@/features/account/view";

export const metadata = { title: "Account settings | Smart Expense" };

export default async function ApplicationPage() {
  const user = await requireUser();
  return <AccountView profile={await loadProfile(user.id)} />;
}
