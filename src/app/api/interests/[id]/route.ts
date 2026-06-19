import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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
    // Use the artifacts specified by the lister during accept, or fall back to what the interested player wanted
    const tradedOfferingIds =
      offeringArtifactIds && offeringArtifactIds.length > 0
        ? offeringArtifactIds
        : interest.interestArtifacts
            .filter((ia) => ia.role === "INTERESTED_IN")
            .map((ia) => ia.artifactId);

    // Remove traded artifacts from the listing
    if (tradedOfferingIds.length > 0) {
      await prisma.listingArtifact.deleteMany({
        where: {
          listingId: interest.listingId,
          artifactId: { in: tradedOfferingIds },
        },
      });
    }

    // Check remaining offering artifacts
    const remainingOfferings = await prisma.listingArtifact.count({
      where: { listingId: interest.listingId, role: "OFFERING" },
    });

    if (remainingOfferings === 0) {
      // All artifacts traded — mark listing as completed
      await prisma.listing.update({
        where: { id: interest.listingId },
        data: { status: "COMPLETED" },
      });
    } else {
      // Partial trade — listing stays active with remaining artifacts
      await prisma.listing.update({
        where: { id: interest.listingId },
        data: { updatedAt: new Date() },
      });
    }

    // Notify the interested player that their interest was accepted
    const tradedLabels = interest.listing.listingArtifacts
      .filter((la) => tradedOfferingIds.includes(la.artifactId))
      .map((la) => `${la.artifact.category} +${la.artifact.bonusPct}% Lv.${la.artifact.level}`)
      .join(", ");

    await prisma.notification.create({
      data: {
        playerId: interest.playerId,
        listingId: interest.listingId,
        message: `Your interest was accepted${tradedLabels ? `! Traded: ${tradedLabels}` : "!"}`,
      },
    });
  } else if (status === "REJECTED") {
    // Notify the interested player that their interest was rejected
    await prisma.notification.create({
      data: {
        playerId: interest.playerId,
        listingId: interest.listingId,
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
