import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ArtifactCategory } from "@prisma/client";
import { getCurrentPlayer } from "@/lib/auth";

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
  const { status, offeringArtifactIds } = body;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const interest = await prisma.interest.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          listingArtifacts: { include: { artifact: true } },
        },
      },
      interestArtifacts: true,
      player: { select: { id: true, username: true } },
    },
  });

  if (!interest) {
    return NextResponse.json({ error: "Interest not found" }, { status: 404 });
  }
  if (interest.listing.playerId !== player.id) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }

  const updated = await prisma.interest.update({
    where: { id },
    data: { status },
  });

  if (status === "ACCEPTED") {
    // Determine which artifacts from the listing are being traded
    const tradedOfferingIds =
      offeringArtifactIds && offeringArtifactIds.length > 0
        ? offeringArtifactIds
        : interest.interestArtifacts
            .filter((ia) => ia.role === "INTERESTED_IN")
            .map((ia) => ia.artifactId);

    // Get the artifacts the interested player is offering in return
    const returnArtifactIds = interest.interestArtifacts
      .filter((ia) => ia.role === "OFFERING_IN_RETURN")
      .map((ia) => ia.artifactId);

    // Build trade artifact records
    const tradeArtifactsData: {
      artifactId: string;
      category: ArtifactCategory;
      bonusPct: number;
      level: number;
      fromPlayerId: string;
      toPlayerId: string;
      role: "GIVEN" | "RECEIVED";
    }[] = [];

    // Artifacts from listing owner → interested player
    for (const la of interest.listing.listingArtifacts) {
      if (tradedOfferingIds.includes(la.artifactId)) {
        tradeArtifactsData.push({
          artifactId: la.artifact.id,
          category: la.artifact.category,
          bonusPct: la.artifact.bonusPct,
          level: la.artifact.level,
          fromPlayerId: interest.listing.playerId,
          toPlayerId: interest.playerId,
          role: "GIVEN",
        });
      }
    }

    // Artifacts from interested player → listing owner (return offer)
    for (const ia of interest.interestArtifacts) {
      if (ia.role === "OFFERING_IN_RETURN") {
        // Find the actual artifact to get its details
        const returnArtifact = await prisma.artifact.findUnique({
          where: { id: ia.artifactId },
        });
        if (returnArtifact) {
          tradeArtifactsData.push({
            artifactId: returnArtifact.id,
            category: returnArtifact.category,
            bonusPct: returnArtifact.bonusPct,
            level: returnArtifact.level,
            fromPlayerId: interest.playerId,
            toPlayerId: interest.listing.playerId,
            role: "RECEIVED",
          });
        }
      }
    }

    // Create the trade record
    const trade = await prisma.trade.create({
      data: {
        listingId: interest.listingId,
        listerId: interest.listing.playerId,
        traderId: interest.playerId,
        interestId: interest.id,
        status: "PENDING",
        tradeArtifacts: {
          create: tradeArtifactsData,
        },
      },
      include: { tradeArtifacts: true },
    });

    // Remove traded artifacts from the listing
    if (tradedOfferingIds.length > 0) {
      await prisma.listingArtifact.deleteMany({
        where: {
          listingId: interest.listingId,
          artifactId: { in: tradedOfferingIds },
        },
      });
    }

    // Archive the traded artifacts from the listing owner's inventory
    for (const artifactId of tradedOfferingIds) {
      await prisma.artifact.update({
        where: { id: artifactId },
        data: {
          archived: true,
          archivedAt: new Date(),
          archiveReason: "TRADED",
          archiveListingId: interest.listingId,
        },
      });
    }

    // Archive the return artifacts from the interested player's inventory
    for (const artifactId of returnArtifactIds) {
      await prisma.artifact.update({
        where: { id: artifactId },
        data: {
          archived: true,
          archivedAt: new Date(),
          archiveReason: "TRADED",
          archiveListingId: interest.listingId,
        },
      });
    }

    // Check remaining offering artifacts in the listing
    const remainingOfferings = await prisma.listingArtifact.count({
      where: { listingId: interest.listingId, role: "OFFERING" },
    });

    if (remainingOfferings === 0) {
      await prisma.listing.update({
        where: { id: interest.listingId },
        data: { status: "COMPLETED" },
      });
    } else {
      await prisma.listing.update({
        where: { id: interest.listingId },
        data: { updatedAt: new Date() },
      });
    }

    // Notify the interested player
    const tradedLabels = interest.listing.listingArtifacts
      .filter((la) => tradedOfferingIds.includes(la.artifactId))
      .map((la) => `${la.artifact.category} +${la.artifact.bonusPct}% L${la.artifact.level}`)
      .join(", ");

    await prisma.notification.create({
      data: {
        playerId: interest.playerId,
        listingId: interest.listingId,
        tradeId: trade.id,
        type: "INTEREST_ACCEPTED",
        message: `✅ Your interest was accepted${tradedLabels ? `! Traded: ${tradedLabels}` : "!"} — exchange artifacts in-game, then acknowledge the trade.`,
      },
    });

    // Also notify the lister that a trade has been initiated
    await prisma.notification.create({
      data: {
        playerId: interest.listing.playerId,
        listingId: interest.listingId,
        tradeId: trade.id,
        type: "TRADE_CONFIRMATION_NEEDED",
        message: `Trade initiated with ${interest.player.username}. Exchange artifacts in-game and acknowledge to complete.`,
      },
    });

    return NextResponse.json({ interest: updated, trade });
  } else if (status === "REJECTED") {
    await prisma.notification.create({
      data: {
        playerId: interest.playerId,
        listingId: interest.listingId,
        type: "GENERAL",
        message: `Your interest was rejected by the lister.`,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const interest = await prisma.interest.findUnique({
    where: { id },
  });

  if (!interest) {
    return NextResponse.json({ error: "Interest not found" }, { status: 404 });
  }
  if (interest.playerId !== player.id) {
    return NextResponse.json({ error: "Not your interest" }, { status: 403 });
  }

  await prisma.interest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
