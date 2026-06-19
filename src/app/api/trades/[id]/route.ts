import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

// PATCH — confirm or cancel a trade
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body; // "confirm" or "cancel"

  if (!["confirm", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const trade = await prisma.trade.findUnique({
    where: { id },
    include: { tradeArtifacts: true },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const isLister = trade.listerId === player.id;
  const isTrader = trade.traderId === player.id;

  if (!isLister && !isTrader) {
    return NextResponse.json({ error: "Not your trade" }, { status: 403 });
  }

  if (action === "cancel") {
    if (trade.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot cancel a completed trade" }, { status: 400 });
    }

    // Un-archive the artifacts so they go back to player inventories
    const allArtifactIds = trade.tradeArtifacts.map((ta) => ta.artifactId);
    await prisma.artifact.updateMany({
      where: { id: { in: allArtifactIds } },
      data: {
        archived: false,
        archivedAt: null,
        archiveReason: null,
        archiveListingId: null,
      },
    });

    // Re-add the listing owner's artifacts back to the listing
    const givenArtifacts = trade.tradeArtifacts.filter((ta) => ta.role === "GIVEN");
    for (const ga of givenArtifacts) {
      const listing = await prisma.listing.findUnique({
        where: { id: trade.listingId },
      });
      if (listing && listing.status !== "COMPLETED" && listing.status !== "CANCELLED") {
        await prisma.listingArtifact.create({
          data: {
            listingId: trade.listingId,
            artifactId: ga.artifactId,
            role: "OFFERING",
          },
        }).catch(() => {}); // Ignore duplicate errors
      }
    }

    // If listing was marked COMPLETED but had artifacts re-added, reactivate it
    const listing = await prisma.listing.findUnique({
      where: { id: trade.listingId },
    });
    if (listing && listing.status === "COMPLETED") {
      const remainingCount = await prisma.listingArtifact.count({
        where: { listingId: trade.listingId, role: "OFFERING" },
      });
      if (remainingCount > 0) {
        await prisma.listing.update({
          where: { id: trade.listingId },
          data: { status: "ACTIVE" },
        });
      }
    }

    const cancelled = await prisma.trade.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    const otherPlayerId = isLister ? trade.traderId : trade.listerId;
    await prisma.notification.create({
      data: {
        playerId: otherPlayerId,
        listingId: trade.listingId,
        message: `Trade was cancelled by ${player.username}. Your artifacts have been restored.`,
      },
    });

    return NextResponse.json(cancelled);
  }

  // Confirm flow
  if (trade.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot confirm a cancelled trade" }, { status: 400 });
  }
  if (trade.status === "COMPLETED") {
    return NextResponse.json({ error: "Trade already completed" }, { status: 400 });
  }

  // Determine new status based on who confirms
  let newStatus: "LISTER_CONFIRMED" | "TRADER_CONFIRMED" | "COMPLETED";
  if (isLister) {
    newStatus = trade.status === "TRADER_CONFIRMED" ? "COMPLETED" : "LISTER_CONFIRMED";
  } else {
    newStatus = trade.status === "LISTER_CONFIRMED" ? "COMPLETED" : "TRADER_CONFIRMED";
  }

  const updated = await prisma.trade.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
    include: { tradeArtifacts: true },
  });

  if (newStatus === "COMPLETED") {
    // Permanently delete the archived artifacts — they've been exchanged in-game.
    // The receiving player will re-add them to their inventory if they want to trade again.
    const allArtifactIds = trade.tradeArtifacts.map((ta) => ta.artifactId);
    await prisma.artifact.deleteMany({
      where: { id: { in: allArtifactIds } },
    });

    // Notify both players
    await prisma.notification.createMany({
      data: [
        {
          playerId: trade.listerId,
          listingId: trade.listingId,
          message: `Trade completed! Artifacts have been exchanged.`,
        },
        {
          playerId: trade.traderId,
          listingId: trade.listingId,
          message: `Trade completed! Artifacts have been exchanged.`,
        },
      ],
    });
  } else {
    // Notify the other party that one side confirmed
    const otherPlayerId = isLister ? trade.traderId : trade.listerId;
    await prisma.notification.create({
      data: {
        playerId: otherPlayerId,
        listingId: trade.listingId,
        message: `${player.username} confirmed the trade. Confirm to complete the exchange.`,
      },
    });
  }

  return NextResponse.json(updated);
}
