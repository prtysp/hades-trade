import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the artifact belongs to the player
  const artifact = await prisma.artifact.findUnique({ where: { id } });
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }
  if (artifact.playerId !== player.id) {
    return NextResponse.json({ error: "Not your artifact" }, { status: 403 });
  }

  // Find all listing artifacts that reference this artifact
  const listingArtifacts = await prisma.listingArtifact.findMany({
    where: { artifactId: id },
    include: { listing: { select: { id: true, status: true, playerId: true } } },
  });

  // Remove this artifact from all listings it's part of
  for (const la of listingArtifacts) {
    // Delete the listing artifact entry
    await prisma.listingArtifact.delete({ where: { id: la.id } });

    // Check if the listing now has no offering artifacts left
    const remainingOfferings = await prisma.listingArtifact.count({
      where: { listingId: la.listing.id, role: "OFFERING" },
    });

    // If no offerings left, archive the listing
    if (remainingOfferings === 0) {
      await prisma.listing.update({
        where: { id: la.listing.id },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }
  }

  // Delete the artifact itself
  await prisma.artifact.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
