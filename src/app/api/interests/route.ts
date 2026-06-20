import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

// GET interests for a listing (for the lister)
export async function GET(req: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");

  if (listingId) {
    // Verify the listing belongs to this player
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { playerId: true },
    });
    if (!listing || listing.playerId !== player.id) {
      return NextResponse.json({ error: "Not your listing" }, { status: 403 });
    }

    const interests = await prisma.interest.findMany({
      where: { listingId },
      include: {
        player: { select: { id: true, username: true, corporation: true } },
        interestArtifacts: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(interests);
  }

  // Get all interests for listings owned by this player
  const interests = await prisma.interest.findMany({
    where: { listing: { playerId: player.id } },
    include: {
      player: { select: { id: true, username: true, corporation: true } },
      listing: { select: { id: true, description: true, priceType: true } },
      interestArtifacts: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(interests);
}

// POST — express interest in a listing
export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { listingId, message, offeringArtifactIds, wantingArtifactIds } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { playerId: true, status: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.playerId === player.id) {
    return NextResponse.json({ error: "Cannot express interest in your own listing" }, { status: 400 });
  }
  if (listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing is not active" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await prisma.interest.findUnique({
    where: { listingId_playerId: { listingId, playerId: player.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already expressed interest in this listing" }, { status: 409 });
  }

  // Build interest artifacts data
  const interestArtifacts: { artifactId: string; role: "INTERESTED_IN" | "OFFERING_IN_RETURN" }[] = [];
  if (offeringArtifactIds && offeringArtifactIds.length > 0) {
    for (const id of offeringArtifactIds) {
      interestArtifacts.push({ artifactId: id, role: "INTERESTED_IN" });
    }
  }
  if (wantingArtifactIds && wantingArtifactIds.length > 0) {
    for (const id of wantingArtifactIds) {
      interestArtifacts.push({ artifactId: id, role: "OFFERING_IN_RETURN" });
    }
  }

  let interest;
  try {
    const createData: Record<string, unknown> = {
      listingId,
      playerId: player.id,
      message: message?.trim() || null,
    };
    if (interestArtifacts.length > 0) {
      createData.interestArtifacts = { create: interestArtifacts };
    }
    interest = await prisma.interest.create({
      data: createData as Parameters<typeof prisma.interest.create>[0]["data"],
      include: {
        player: { select: { id: true, username: true, corporation: true } },
        interestArtifacts: true,
      },
    });
  } catch (createErr: unknown) {
    console.error("Interest create error:", createErr);
    const errMsg = createErr instanceof Error ? createErr.message : "Unknown error";
    // If the interestArtifacts table doesn't exist yet, retry without artifacts
    if (errMsg.includes("InterestArtifact") || errMsg.includes("relation") || errMsg.includes("table")) {
      console.log("Retrying without interestArtifacts...");
      try {
        interest = await prisma.interest.create({
          data: {
            listingId,
            playerId: player.id,
            message: message?.trim() || null,
          },
          include: {
            player: { select: { id: true, username: true, corporation: true } },
            interestArtifacts: true,
          },
        });
      } catch (retryErr: unknown) {
        console.error("Interest retry error:", retryErr);
        return NextResponse.json(
          { error: retryErr instanceof Error ? retryErr.message : "Failed to create interest" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: errMsg },
        { status: 500 }
      );
    }
  }

  // Notify the listing owner that someone expressed interest
  const listingData = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      listingArtifacts: { include: { artifact: true } },
    },
  });

  if (listingData) {
    const interestedItems = (offeringArtifactIds as string[] || []).map((id: string) => {
      const la = listingData.listingArtifacts.find((a) => a.artifactId === id);
      return la ? `${la.artifact.category} +${la.artifact.bonusPct}% L${la.artifact.level}` : id;
    });
    const offeringItems = (wantingArtifactIds as string[] || []).map((id: string) => {
      const la = listingData.listingArtifacts.find((a) => a.artifactId === id);
      return la ? `${la.artifact.category} +${la.artifact.bonusPct}% L${la.artifact.level}` : id;
    });

    const parts: string[] = [];
    parts.push(`${player.username} expressed interest in your listing`);
    if (interestedItems.length > 0) parts.push(`interested in: ${interestedItems.join(", ")}`);
    if (offeringItems.length > 0) parts.push(`offering: ${offeringItems.join(", ")}`);
    if (message?.trim()) parts.push(`message: "${message.trim()}"`);

    await prisma.notification.create({
      data: {
        playerId: listingData.playerId,
        listingId,
        type: "INTEREST_EXPRESSED",
        message: parts.join(" · "),
      },
    });
  }

  return NextResponse.json(interest, { status: 201 });
}
