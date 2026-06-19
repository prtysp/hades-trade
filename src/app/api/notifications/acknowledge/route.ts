import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

/**
 * POST — acknowledge a trade notification.
 * Confirms the trade from the notification itself, marks the notification as read,
 * and advances the trade confirmation flow.
 */
export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { notificationId, tradeId } = body;

  if (!notificationId || !tradeId) {
    return NextResponse.json(
      { error: "notificationId and tradeId are required" },
      { status: 400 }
    );
  }

  // Verify the notification belongs to this player
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.playerId !== player.id) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  // Fetch trade with scalar fields + relations in one query using $queryRaw
  const trades = await prisma.$queryRaw<
    Array<{
      id: string;
      listingId: string;
      listerId: string;
      traderId: string;
      status: string;
    }>
  >`SELECT id, listingId, "listerId", "traderId", status FROM "Trade" WHERE id = ${tradeId}`;

  if (trades.length === 0) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const trade = trades[0];
  const isLister = trade.listerId === player.id;
  const isTrader = trade.traderId === player.id;

  if (!isLister && !isTrader) {
    return NextResponse.json({ error: "Not your trade" }, { status: 403 });
  }

  if (trade.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot acknowledge a cancelled trade" }, { status: 400 });
  }
  if (trade.status === "COMPLETED") {
    return NextResponse.json({ error: "Trade already completed" }, { status: 400 });
  }

  // Fetch related data
  const [tradeArtifacts, listerData, traderData] = await Promise.all([
    prisma.tradeArtifact.findMany({ where: { tradeId } }),
    prisma.player.findUnique({ where: { id: trade.listerId }, select: { id: true, username: true } }),
    prisma.player.findUnique({ where: { id: trade.traderId }, select: { id: true, username: true } }),
  ]);

  const lister = listerData!;
  const trader = traderData!;

  // Determine new status
  let newStatus: "LISTER_CONFIRMED" | "TRADER_CONFIRMED" | "COMPLETED";
  if (isLister) {
    newStatus = trade.status === "TRADER_CONFIRMED" ? "COMPLETED" : "LISTER_CONFIRMED";
  } else {
    newStatus = trade.status === "LISTER_CONFIRMED" ? "COMPLETED" : "TRADER_CONFIRMED";
  }

  // Update trade status
  const updatedTrade = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      status: newStatus,
      ...(newStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });

  // Mark the notification as read
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  if (newStatus === "COMPLETED") {
    // Permanently delete archived artifacts — exchanged in-game
    const allArtifactIds = tradeArtifacts.map((ta) => ta.artifactId);
    if (allArtifactIds.length > 0) {
      await prisma.artifact.deleteMany({
        where: { id: { in: allArtifactIds } },
      });
    }

    // Notify both players
    await prisma.notification.createMany({
      data: [
        {
          playerId: trade.listerId,
          listingId: trade.listingId,
          tradeId: trade.id,
          type: "TRADE_COMPLETED",
          message: `✅ Trade with ${trader.username} completed! Artifacts exchanged in-game.`,
        },
        {
          playerId: trade.traderId,
          listingId: trade.listingId,
          tradeId: trade.id,
          type: "TRADE_COMPLETED",
          message: `✅ Trade with ${lister.username} completed! Artifacts exchanged in-game.`,
        },
      ],
    });
  } else {
    // First confirmation — notify the other player
    const otherPlayerId = isLister ? trade.traderId : trade.listerId;
    await prisma.notification.create({
      data: {
        playerId: otherPlayerId,
        listingId: trade.listingId,
        tradeId: trade.id,
        type: "TRADE_CONFIRMATION_NEEDED",
        message: `${player.username} confirmed the trade. Exchange artifacts in-game and acknowledge to complete.`,
      },
    });
  }

  return NextResponse.json({ trade: updatedTrade });
}
