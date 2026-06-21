import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentPlayer = await getCurrentPlayer();
  const isOwnProfile = currentPlayer?.id === id;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      artifacts: { orderBy: { category: "asc" } },
      listings: {
        where: { status: "ACTIVE" },
        include: {
          listingArtifacts: {
            include: { artifact: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      preference: { include: { categoryThresholds: true } },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Filter data based on privacy settings
  const canViewInventory = isOwnProfile || player.showInventory;
  const canViewListings = isOwnProfile || player.showListings;
  const canViewPreferences = isOwnProfile || player.showPreferences;

  return NextResponse.json({
    id: player.id,
    username: player.username,
    corporation: player.corporation,
    discordUsername: player.discordUsername,
    theme: player.theme,
    font: player.font,
    osNotifications: player.osNotifications,
    showInventory: player.showInventory,
    showListings: player.showListings,
    showArchived: player.showArchived,
    showPreferences: player.showPreferences,
    shareFormat: player.shareFormat,
    createdAt: player.createdAt,
    artifacts: canViewInventory ? player.artifacts : [],
    listings: canViewListings ? player.listings : [],
    preference: canViewPreferences ? player.preference : null,
    _privacy: {
      inventoryVisible: canViewInventory,
      listingsVisible: canViewListings,
      preferencesVisible: canViewPreferences,
    },
  });
}
