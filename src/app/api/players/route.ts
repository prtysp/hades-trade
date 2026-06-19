import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const players = await prisma.player.findMany({
    include: {
      _count: { select: { artifacts: true, listings: true } },
    },
    orderBy: { username: "asc" },
  });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, corporation } = body;

  if (!username || !corporation) {
    return NextResponse.json(
      { error: "Username and corporation are required" },
      { status: 400 }
    );
  }

  try {
    const player = await prisma.player.create({
      data: { username, corporation },
    });
    return NextResponse.json(player, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }
    throw e;
  }
}
