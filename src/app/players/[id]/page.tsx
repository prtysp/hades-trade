import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { archiveExpiredListings } from "@/lib/archive";
import { getCurrentPlayer } from "@/lib/auth";
import ArtifactBadge from "@/components/ArtifactBadge";
import PreferenceForm from "@/components/PreferenceForm";
import CreateListingForm from "@/components/CreateListingForm";
import AddArtifactForm from "@/components/AddArtifactForm";
import ListingCardWithDelete from "@/components/ListingCardWithDelete";

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

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentPlayer = await getCurrentPlayer();

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      artifacts: { orderBy: { category: "asc" } },
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

  const unreadCount = await prisma.notification.count({ where: { playerId: id, read: false } });
  const isOwnProfile = currentPlayer?.id === id;

  const thresholds = player.preference?.categoryThresholds ?? [];
  const summary = thresholds.length > 0
    ? `Interested in ${thresholds.map((t) => {
        const parts: string[] = [t.category];
        if (t.minBonusPct > 0) parts.push(`${t.minBonusPct}%+`);
        if (t.minLevel > 3) parts.push(`Lv.${t.minLevel}+`);
        return parts.join(" ");
      }).join(", ")}`
    : null;

  return (
    <div>
      <Link href="/players" className="mb-3 inline-block text-sm text-slate-400 hover:text-amber-400 transition">
        ← Back to Players
      </Link>

      {/* Player header */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xl sm:text-2xl shrink-0">
            {player.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{player.username}</h1>
            <p className="text-sm text-slate-400">{player.corporation}</p>
          </div>
          {isOwnProfile && (
            <Link href="/notifications" className="relative rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 transition shrink-0">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount}</span>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Add Artifact */}
      {isOwnProfile && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Add Artifact to Inventory</h2>
          <AddArtifactForm playerId={id} />
        </div>
      )}

      {/* Preferences */}
      {isOwnProfile && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Trade Preference</h2>
          {summary ? (
            <div className="mb-3 text-sm text-slate-400"><span className="text-amber-400">★</span> {summary}</div>
          ) : (
            <p className="mb-3 text-sm text-slate-500">No preference set.</p>
          )}
          <PreferenceForm
            playerId={id}
            initial={player.preference ? { categoryThresholds: player.preference.categoryThresholds.map((t) => ({ category: t.category, minBonusPct: t.minBonusPct, minLevel: t.minLevel })) } : undefined}
          />
        </div>
      )}

      {/* Create Listing */}
      {isOwnProfile && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Create New Listing</h2>
          <CreateListingForm playerId={id} key={player.artifacts.length} />
        </div>
      )}

      {/* Artifacts */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">Artifacts ({player.artifacts.length})</h2>
        {player.artifacts.length === 0 ? (
          <p className="text-sm text-slate-500">{isOwnProfile ? "No artifacts yet. Add some above!" : "No artifacts yet."}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {player.artifacts.map((artifact) => (
              <ArtifactBadge key={artifact.id} category={artifact.category} bonusPct={artifact.bonusPct} level={artifact.level} />
            ))}
          </div>
        )}
      </div>

      {/* Active Listings */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-3">Active Listings ({player.listings.length})</h2>
        {player.listings.length === 0 ? (
          <p className="text-sm text-slate-500">No active listings.</p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {player.listings.map((listing) => (
              <ListingCardWithDelete key={listing.id} listing={listing as any} isOwnProfile={isOwnProfile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
