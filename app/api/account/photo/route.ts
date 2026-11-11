import { connection } from "next/server";
import { auth } from "@/auth";
import { loadProfilePhoto } from "@/features/account/store";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401, headers });
  const photo = await loadProfilePhoto(session.user.id);
  if (!photo) return new Response(null, { status: 404, headers });
  return new Response(new Uint8Array(photo), { headers: { ...headers, "Content-Type": "image/webp", "Content-Disposition": 'inline; filename="profile.webp"' } });
}
