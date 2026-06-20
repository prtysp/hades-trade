import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ArtifactRole, ListingStatus, NotificationType } from "@prisma/client";
import { archiveExpiredListings } from "@/lib/archive";

// Check if an artifact matches a player's per-category preference thresholds
function artifactMatchesPreference(
  artifact: { category: string; bonusPct: number; level: number },
  thresholds: { category: string; minBonusPct: number; minLevel: number }[]
): boolean {
  if (thresholds.length === 0) return false;
  const match = thresholds.find((t) => t.category === artifact.category);
  if (!match) return false;
  return artifact.bonusPct >= match.minBonusPct && artifact.level >= match.minLevel;
}

// Build a display label from offering artifacts
function buildListingLabel(listing: {
  listingArtifacts: { role: string; artifact: { category: string; bonusPct: number; level: number } }[];
}): string {
  const offering = listing.listingArtifacts
    .filter((la) => la.role === "OFFERING")
    .map((la) => `${la.artifact.category} +${la.artifact.bonusPct}% Lv.${la.artifact.level}`);
  const wanting = listing.listingArtifacts
    .filter((la) => la.role === "WANTING")
    .map((la) => `${la.artifact.category} +${la.artifact.bonusPct}% Lv.${la.artifact.level}`);

  const parts: string[] = [];
  if (offering.length > 0) parts.push(`Offering: ${offering.join(", ")}`);
  if (wanting.length > 0) parts.push(`Wanting: ${wanting.join(", ")}`);
  return parts.join(" · ");
}

export async function GET(req: NextRequest) {
  // Auto-archive expired listings on every read
  await archiveExpiredListings();

  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const includeArchived = searchParams.get("archived") === "true";

  // If playerId is provided, filter listings matching that player's preference
  if (playerId) {
    const preference = await prisma.preference.findUnique({
      where: { playerId },
      include: { categoryThresholds: true },
    });

    if (preference && preference.categoryThresholds.length > 0) {
      const allListings = await prisma.listing.findMany({
        where: {
          status: includeArchived
            ? { in: ["ACTIVE", "ARCHIVED"] as ListingStatus[] }
            : "ACTIVE",
          playerId: { not: playerId },
        },
        include: {
          player: { select: { id: true, username: true, corporation: true } },
          listingArtifacts: {
            include: { artifact: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const matched = allListings.filter((listing) => {
        const offerings = listing.listingArtifacts.filter(
          (la) => la.role === "OFFERING"
        );
        return offerings.some((la) =>
          artifactMatchesPreference(la.artifact, preference.categoryThresholds as any)
        );
      });

      return NextResponse.json(matched);
    }
  }

  const listings = await prisma.listing.findMany({
    where: {
      status: includeArchived
        ? { in: ["ACTIVE", "ARCHIVED"] as ListingStatus[] }
        : "ACTIVE",
    },
    include: {
      player: { select: { id: true, username: true, corporation: true } },
      listingArtifacts: {
        include: { artifact: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { description, playerId, offering, wanting, wantingPrefs, priceType, donationAmount, expiresInDays } = body;

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }
  if (!offering || offering.length === 0) {
    return NextResponse.json({ error: "At least one offering artifact is required" }, { status: 400 });
  }
  const wantsArtifacts = (wanting || []).length > 0;
  const wantingPrefsList = (wantingPrefs || []) as any[];
  const wantsPrefs = wantingPrefsList.length > 0;
  if (priceType === "TRADE" && !wantsArtifacts && !wantsPrefs) {
    return NextResponse.json({ error: "Trade listings must specify at least one wanted artifact or preference" }, { status: 400 });
  }
  let finalDescription = description || "";
  if (wantsPrefs) {
    finalDescription = (finalDescription ? finalDescription + "\n\n" : "") + "__WANTED_PREFS__" + JSON.stringify(wantingPrefsList);
  }

  const days = expiresInDays ?? 1;
  if (days <= 0) {
    return NextResponse.json({ error: "expiresInDays must be greater than 0" }, { status: 400 });
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

    // Deduplicate: remove any wanting IDs that are also in offering
    const offeringIds = [...new Set((offering || []) as string[])];
    const wantingIds = [...new Set((wanting || []) as string[])].filter((id) => !offeringIds.includes(id));

  const listing = await prisma.listing.create({
    data: {
      description: finalDescription,
      playerId,
      status: "ACTIVE",
      priceType: priceType ?? "FREE",
      donationAmount: donationAmount ? parseFloat(donationAmount) : null,
      expiresAt,
      listingArtifacts: {
        create: [
          ...offeringIds.map((artifactId: string) => ({
            artifactId,
            role: ArtifactRole.OFFERING,
          })),
          ...wantingIds.map((artifactId: string) => ({
            artifactId,
            role: ArtifactRole.WANTING,
          })),
        ],
      },
    },
    include: {
      listingArtifacts: { include: { artifact: true } },
    },
  });

  // Build a label for notifications
  const listingLabel = buildListingLabel(listing);

  // Create notifications for players whose per-category preferences match
  const offeringArtifacts = listing.listingArtifacts.filter(
    (la) => la.role === "OFFERING"
  );

  if (offeringArtifacts.length > 0) {
    const preferences = await prisma.preference.findMany({
      where: { playerId: { not: playerId } },
      include: { categoryThresholds: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifications: any[] = [];

    for (const pref of preferences) {
      if (pref.categoryThresholds.length === 0) continue;

      const matchedArtifacts = offeringArtifacts.filter((la) =>
        artifactMatchesPreference(la.artifact, pref.categoryThresholds as any)
      );

      if (matchedArtifacts.length > 0) {
        const artDescriptions = matchedArtifacts.map(
          (la) => `${la.artifact.category} +${la.artifact.bonusPct}% Lv.${la.artifact.level}`
        );
        notifications.push({
          playerId: pref.playerId,
          listingId: listing.id,
          type: NotificationType.GENERAL,
          message: `New listing (${listingLabel}) has matching artifacts: ${artDescriptions.join(", ")}`,
        });
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  }

  return NextResponse.json(listing, { status: 201 });
}
