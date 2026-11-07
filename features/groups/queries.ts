import "server-only";
import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import { listGroups, loadGroup } from "./store";

export async function getGroups() {
  const user = await requireUser();
  return listGroups(user.id);
}

export async function getGroup(id: unknown) {
  const user = await requireUser();
  const parsed = z.uuid().safeParse(id);
  return parsed.success ? loadGroup(user.id, parsed.data) : null;
}
