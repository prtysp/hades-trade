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
  const { listingId, message } = body;

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

  const interest = await prisma.interest.create({
    data: {
      listingId,
      playerId: player.id,
      message: message?.trim() || null,
    },
    include: {
      player: { select: { id: true, username: true, corporation: true } },
    },
  });

  return NextResponse.json(interest, { status: 201 });
}
