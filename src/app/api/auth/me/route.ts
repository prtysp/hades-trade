import { NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";

export async function GET() {
  const player = await getCurrentPlayer();

  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: player.id,
    username: player.username,
    corporation: player.corporation,
    theme: player.theme,
    font: player.font,
    osNotifications: player.osNotifications,
    showInventory: player.showInventory,
    showListings: player.showListings,
    showArchived: player.showArchived,
    showPreferences: player.showPreferences,
    discordUsername: player.discordUsername,
    shareFormat: player.shareFormat,
  });
}
