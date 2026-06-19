import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

// GET trades for the current player (as lister or trader)
export async function GET(req: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = {
    OR: [{ listerId: player.id }, { traderId: player.id }],
    ...(status ? { status: status as any } : {}),
  };

  const trades = await prisma.trade.findMany({
    where,
    include: {
      listing: { select: { id: true, description: true, priceType: true } },
      lister: { select: { id: true, username: true } },
      trader: { select: { id: true, username: true } },
      tradeArtifacts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trades);
}
