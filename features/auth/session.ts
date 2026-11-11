import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  // Auth.js can generate fresh crypto values while reading/refreshing its JWT.
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, profilePhotoId: true },
  });
  if (!user) redirect("/login");
  return user;
}
