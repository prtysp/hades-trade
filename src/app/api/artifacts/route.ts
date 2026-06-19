import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const category = searchParams.get("category");

  const where = {
    ...(playerId ? { playerId } : {}),
    ...(category ? { category: category as "COMBAT" | "TRANSPORT" | "MINING" | "DRONE" | "WEAPON" | "SHIELD" } : {}),
  };

  const artifacts = await prisma.artifact.findMany({
    where,
    include: { player: { select: { username: true, corporation: true } } },
    orderBy: [{ category: "asc" }, { level: "desc" }],
  });

  return NextResponse.json(artifacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, bonusPct, level, playerId } = body;

  if (!category || bonusPct == null || !level || !playerId) {
    return NextResponse.json(
      { error: "category, bonusPct, level, and playerId are required" },
      { status: 400 }
    );
  }

  if (level < 3 || level > 12) {
    return NextResponse.json(
      { error: "Level must be between 3 and 12" },
      { status: 400 }
    );
  }

  const artifact = await prisma.artifact.create({
    data: {
      category,
      bonusPct: parseFloat(bonusPct),
      level: parseInt(level),
      playerId,
    },
  });

  return NextResponse.json(artifact, { status: 201 });
}
