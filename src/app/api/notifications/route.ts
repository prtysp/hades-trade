import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const unreadOnly = searchParams.get("unread") === "true";

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      playerId,
      ...(unreadOnly ? { read: false } : {}),
    },
    include: {
      listing: {
        include: {
          player: { select: { id: true, username: true } },
          listingArtifacts: {
            include: { artifact: true },
          },
        },
      },
      trade: {
        select: {
          id: true,
          listingId: true,
          listerId: true,
          traderId: true,
          status: true,
          createdAt: true,
          completedAt: true,
          lister: { select: { id: true, username: true } },
          trader: { select: { id: true, username: true } },
          tradeArtifacts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { notificationId, playerId, markAllRead, acknowledgeTradeId } = body;

  if (markAllRead && playerId) {
    await prisma.notification.updateMany({
      where: { playerId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "notificationId or (markAllRead + playerId) required" },
    { status: 400 }
  );
}
