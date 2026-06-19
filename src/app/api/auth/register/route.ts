import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password, corporation } = body;

  if (!username || !password || !corporation) {
    return NextResponse.json(
      { error: "Username, password, and corporation are required" },
      { status: 400 }
    );
  }

  if (username.length < 2) {
    return NextResponse.json(
      { error: "Username must be at least 2 characters" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.player.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const player = await prisma.player.create({
    data: { username, passwordHash, corporation },
  });

  const token = await createSession(player.id);
  await setSessionCookie(token);

  return NextResponse.json(
    { id: player.id, username: player.username, corporation: player.corporation },
    { status: 201 }
  );
}
