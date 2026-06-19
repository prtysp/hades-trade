import { prisma } from "@/lib/prisma";
import { archiveExpiredListings } from "@/lib/archive";
import { getCurrentPlayer } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";
import ListingFilters from "@/components/ListingFilters";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    category?: string;
    minBonus?: string;
    minLevel?: string;
  }>;
}) {
  await archiveExpiredListings();
  const player = await getCurrentPlayer();
  const params = await searchParams;

  // Build filter
  const where: any = { status: "ACTIVE" };

  // Filter by listing type
  if (params.type && ["FREE", "DONATION", "TRADE"].includes(params.type)) {
    where.priceType = params.type;
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      player: { select: { id: true, username: true, corporation: true } },
      listingArtifacts: { include: { artifact: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Post-filter by category and bonus/level (since these are on related artifacts)
  let filtered = listings;

  if (params.category && params.category !== "ALL") {
    filtered = filtered.filter((l) =>
      l.listingArtifacts.some(
        (la) => la.role === "OFFERING" && la.artifact.category === params.category
      )
    );
  }

  const minBonus = params.minBonus ? parseFloat(params.minBonus) : null;
  const minLevel = params.minLevel ? parseInt(params.minLevel) : null;

  if (minBonus !== null) {
    filtered = filtered.filter((l) =>
      l.listingArtifacts.some(
        (la) => la.role === "OFFERING" && la.artifact.bonusPct >= minBonus
      )
    );
  }

  if (minLevel !== null) {
    filtered = filtered.filter((l) =>
      l.listingArtifacts.some(
        (la) => la.role === "OFFERING" && la.artifact.level >= minLevel
      )
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Trade Listings</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {filtered.length} active trade {filtered.length === 1 ? "listing" : "listings"}
          </p>
        </div>
        {player && (
          <Link
            href={`/players/${player.id}`}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[var(--accent-hover)] transition text-center"
          >
            + Create Listing
          </Link>
        )}
      </div>

      <ListingFilters />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 text-center">
          <p className="text-base sm:text-lg text-[var(--text-muted)]">No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
