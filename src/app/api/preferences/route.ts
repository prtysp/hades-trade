import { prisma } from "@/lib/prisma";
import { ArtifactCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const preference = await prisma.preference.findUnique({
    where: { playerId },
    include: { categoryThresholds: true },
  });

  return NextResponse.json(preference);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { playerId, thresholds } = body;

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  // thresholds is an array of { category, minBonusPct, minLevel }
  const preference = await prisma.preference.upsert({
    where: { playerId },
    create: { playerId },
    update: {},
  });

  if (thresholds && Array.isArray(thresholds)) {
    // Delete existing thresholds and recreate
    await prisma.preferenceCategory.deleteMany({
      where: { preferenceId: preference.id },
    });

    if (thresholds.length > 0) {
      await prisma.preferenceCategory.createMany({
        data: thresholds.map((t: { category: ArtifactCategory; minBonusPct: number; minLevel: number }) => ({
          preferenceId: preference.id,
          category: t.category as ArtifactCategory,
          minBonusPct: t.minBonusPct ?? 0,
          minLevel: t.minLevel ?? 3,
        })),
      });
    }
  }

  const result = await prisma.preference.findUnique({
    where: { playerId },
    include: { categoryThresholds: true },
  });

  return NextResponse.json(result, { status: 201 });
}
