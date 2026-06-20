import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const corporation = (formData.get("corporation") as string)?.trim();
  const discordUsername = (formData.get("discordUsername") as string)?.trim() || null;

  if (!corporation || corporation.length < 1) {
    return NextResponse.json({ error: "Corporation name is required" }, { status: 400 });
  }

  await prisma.player.update({
    where: { id: player.id },
    data: {
      corporation,
      ...(discordUsername !== undefined && { discordUsername }),
    },
  });

  revalidatePath("/settings");
  revalidatePath(`/players/${player.id}`);
  revalidatePath("/");

  return NextResponse.redirect(new URL("/settings", req.url));
}
