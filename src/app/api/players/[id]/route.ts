import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      artifacts: { orderBy: { category: "asc" } },
      listings: {
        where: { status: "ACTIVE" },
        include: {
          listingArtifacts: {
            include: { artifact: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}
