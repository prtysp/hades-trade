import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { archiveExpiredListings } from "@/lib/archive";
import { getCurrentPlayer } from "@/lib/auth";
import PreferenceForm from "@/components/PreferenceForm";
import CreateListingForm from "@/components/CreateListingForm";
import AddArtifactForm from "@/components/AddArtifactForm";
import ListingCardWithDelete from "@/components/ListingCardWithDelete";
import CompressedArtifactBadge, { type ArtifactGroup } from "@/components/CompressedArtifactBadge";
import TradeCard from "@/components/TradeCard";
import ArchiveSection from "@/components/ArchiveSection";

function timeUntilExpiry(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${mins}m`;
}

function groupArtifacts(artifacts: { id: string; category: string; bonusPct: number; level: number; createdAt: Date }[]): ArtifactGroup[] {
  const map = new Map<string, ArtifactGroup>();
  for (const art of artifacts) {
    const key = `${art.category}-${art.bonusPct}-${art.level}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.artifacts.push({ id: art.id, createdAt: art.createdAt });
    } else {
      map.set(key, {
        category: art.category as any,
        bonusPct: art.bonusPct,
        level: art.level,
        count: 1,
        artifacts: [{ id: art.id, createdAt: art.createdAt }],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (b.level !== a.level) return b.level - a.level;
    return b.bonusPct - a.bonusPct;
  });
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentPlayer = await getCurrentPlayer();

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      artifacts: { orderBy: [{ category: "asc" }, { level: "desc" }] },
      listings: {
        where: { status: "ACTIVE" },
        include: { listingArtifacts: { include: { artifact: true } } },
        orderBy: { createdAt: "desc" },
      },
      preference: { include: { categoryThresholds: true } },
    },
  });

  if (!player) notFound();
  await archiveExpiredListings();

  const isOwnProfile = currentPlayer?.id === id;

  // Separate active and archived artifacts
  const activeArtifacts = player.artifacts.filter((a) => !a.archived);
  const archivedArtifacts = player.artifacts.filter((a) => a.archived);
  const artifactGroups = groupArtifacts(activeArtifacts);

  // Fetch trades
  const trades = isOwnProfile
    ? await prisma.trade.findMany({
        where: {
          OR: [{ listerId: id }, { traderId: id }],
        },
        include: {
          lister: { select: { id: true, username: true } },
          trader: { select: { id: true, username: true } },
          tradeArtifacts: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const pendingTrades = trades.filter(
    (t) => !["COMPLETED", "CANCELLED"].includes(t.status)
  );
  const completedTrades = trades.filter(
    (t) => ["COMPLETED", "CANCELLED"].includes(t.status)
  );

  // Fetch archived listings (completed/archived/cancelled)
  const archivedListings = await prisma.listing.findMany({
    where: {
      playerId: id,
      status: { in: ["COMPLETED", "ARCHIVED", "CANCELLED"] },
    },
    include: { listingArtifacts: { include: { artifact: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { playerId: id, read: false },
  });

  const thresholds = player.preference?.categoryThresholds ?? [];
  const summary =
    thresholds.length > 0
      ? `Interested in ${thresholds
          .map((t) => {
            const parts: string[] = [t.category];
            if (t.minBonusPct > 0) parts.push(`${t.minBonusPct}%+`);
            if (t.minLevel > 3) parts.push(`Lv.${t.minLevel}+`);
            return parts.join(" ");
          })
          .join(", ")}`
      : null;

  return (
    <div>
      <Link
        href="/players"
        className="mb-3 inline-block text-sm text-slate-400 hover:text-amber-400 transition"
      >
        ← Back to Players
      </Link>

      {/* Player header */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xl sm:text-2xl shrink-0">
            {player.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              {player.username}
            </h1>
            <p className="text-sm text-slate-400">{player.corporation}</p>
          </div>
          {isOwnProfile && (
            <Link
              href="/notifications"
              className="relative rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 transition shrink-0"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Add Artifact */}
      {isOwnProfile && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Add Artifact to Inventory
          </h2>
          <AddArtifactForm playerId={id} />
        </div>
      )}

      {/* Preferences */}
      {isOwnProfile && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Trade Preference
          </h2>
          {summary ? (
            <div className="mb-3 text-sm text-slate-400">
              <span className="text-amber-400">★</span> {summary}
            </div>
          ) : (
            <p className="mb-3 text-sm text-slate-500">No preference set.</p>
          )}
          <PreferenceForm
            playerId={id}
            initial={
              player.preference
                ? {
                    categoryThresholds:
                      player.preference.categoryThresholds.map((t) => ({
                        category: t.category,
                        minBonusPct: t.minBonusPct,
                        minLevel: t.minLevel,
                      })),
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Create Listing */}
      {isOwnProfile && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Create New Listing
          </h2>
          <CreateListingForm
            playerId={id}
            key={activeArtifacts.length}
          />
        </div>
      )}

      {/* Active Artifacts — compressed */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">
          Artifacts ({activeArtifacts.length})
        </h2>
        {artifactGroups.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isOwnProfile
              ? "No artifacts yet. Add some above!"
              : "No artifacts yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {artifactGroups.map((group) => (
              <CompressedArtifactBadge
                key={`${group.category}-${group.bonusPct}-${group.level}`}
                group={group}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending Trades */}
      {isOwnProfile && pendingTrades.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Pending Trades ({pendingTrades.length})
          </h2>
          <div className="space-y-3">
            {pendingTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                currentPlayerId={currentPlayer!.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Listings */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">
          Active Listings ({player.listings.length})
        </h2>
        {player.listings.length === 0 ? (
          <p className="text-sm text-slate-500">No active listings.</p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {player.listings.map((listing) => (
              <ListingCardWithDelete
                key={listing.id}
                listing={listing as any}
                isOwnProfile={isOwnProfile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archive / History Section */}
      {isOwnProfile && (
        <ArchiveSection
          archivedArtifacts={archivedArtifacts}
          archivedListings={archivedListings}
          completedTrades={completedTrades}
          playerId={id}
        />
      )}
    </div>
  );
}
