import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auto-archive if expired
  await prisma.listing.updateMany({
    where: { id, status: "ACTIVE", expiresAt: { lte: new Date() } },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, username: true, corporation: true } },
      listingArtifacts: { include: { artifact: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
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

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.playerId !== player.id) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.playerId !== player.id) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body;

  if (!["ACTIVE", "COMPLETED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
