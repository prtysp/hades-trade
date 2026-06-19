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
  const { status } = body;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const interest = await prisma.interest.findUnique({
    where: { id },
    include: { listing: { select: { playerId: true } } },
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

  // If accepted, mark the listing as completed
  if (status === "ACCEPTED") {
    await prisma.listing.update({
      where: { id: interest.listingId },
      data: { status: "COMPLETED" },
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
