import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";
import { themes, fontOptions } from "@/lib/themes";

export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { themeId, fontId, osNotifications, showInventory, showListings, showArchived, showPreferences } = body;

  const data: Record<string, string | boolean> = {};

  if (themeId && themes[themeId]) {
    data.theme = themeId;
  }

  if (fontId && fontOptions.find((f) => f.id === fontId)) {
    data.font = fontId;
  }

  if (typeof osNotifications === "boolean") {
    data.osNotifications = osNotifications;
  }
  if (typeof showInventory === "boolean") {
    data.showInventory = showInventory;
  }
  if (typeof showListings === "boolean") {
    data.showListings = showListings;
  }
  if (typeof showArchived === "boolean") {
    data.showArchived = showArchived;
  }
  if (typeof showPreferences === "boolean") {
    data.showPreferences = showPreferences;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.player.update({
    where: { id: player.id },
    data,
  });

  return NextResponse.json({ success: true });
}
