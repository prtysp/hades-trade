import { NextResponse } from "next/server";
import { destroySession, clearSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    await destroySession(token);
    await clearSessionCookie();
  }

  return NextResponse.json({ success: true });
}
