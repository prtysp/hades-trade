import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { archiveExpiredListings } from "@/lib/archive";
import { getCurrentPlayer } from "@/lib/auth";
import ArtifactBadge from "@/components/ArtifactBadge";
import InterestButton from "@/components/InterestButton";
import InterestsList from "@/components/InterestsList";

const categoryEmojis: Record<string, string> = {
  COMBAT: "🔴", TRANSPORT: "🟠", MINING: "🟡", DRONE: "🟢", WEAPON: "🔵", SHIELD: "🟣",
};

const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
  COMBAT:   { bg: "rgba(184,186,38,0.15)",  text: "#b8bb26", border: "rgba(184,186,38,0.3)" },
  TRANSPORT:{ bg: "rgba(250,189,47,0.15)",  text: "#fabd2f", border: "rgba(250,189,47,0.3)" },
  MINING:   { bg: "rgba(177,98,134,0.15)", text: "#b76286", border: "rgba(177,98,134,0.3)" },
  DRONE:    { bg: "rgba(142,192,124,0.15)", text: "#8ec07c", border: "rgba(142,192,124,0.3)" },
  WEAPON:   { bg: "rgba(251,73,52,0.15)",   text: "#fb4934", border: "rgba(251,73,52,0.35)" },
  SHIELD:   { bg: "rgba(131,165,156,0.15)", text: "#83a598", border: "rgba(131,165,156,0.3)" },
};

function parseListingDescription(description: string | null): { cleanDescription: string; wantedPrefs: { category: string; minBonusPct: number; minLevel: number }[] } {
  if (!description) return { cleanDescription: "", wantedPrefs: [] };
  const marker = "__WANTED_PREFS__";
  const idx = description.indexOf(marker);
  if (idx === -1) return { cleanDescription: description, wantedPrefs: [] };
  const cleanDescription = description.substring(0, idx).trim();
  try {
    const prefs = JSON.parse(description.substring(idx + marker.length));
    return { cleanDescription, wantedPrefs: Array.isArray(prefs) ? prefs : [] };
  } catch {
    return { cleanDescription, wantedPrefs: [] };
  }
}

function timeUntilExpiry(expiresAt: Date | string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return `${Math.floor((diff / (1000 * 60)) % 60)}m`;
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentPlayer = await getCurrentPlayer();

  // Auto-archive expired
  await prisma.listing.updateMany({
    where: { id, status: "ACTIVE", expiresAt: { lte: new Date() } },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, username: true, corporation: true } },
      listingArtifacts: { include: { artifact: true } },
    },
  });

  if (!listing) notFound();

  const offering = listing.listingArtifacts.filter((la) => la.role === "OFFERING");
  const wanting = listing.listingArtifacts.filter((la) => la.role === "WANTING");
  const { cleanDescription, wantedPrefs } = parseListingDescription(listing.description);
  const isArchived = listing.status === "ARCHIVED";
  const isOwnListing = currentPlayer?.id === listing.playerId;
  const isTrade = listing.priceType === "TRADE";
  const isDonation = listing.priceType === "DONATION";

  return (
    <div>
      <Link href="/" className="mb-3 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--accent-text)] transition">
        ← Back to Listings
      </Link>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isArchived && (
                <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                  Archived
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                listing.priceType === "TRADE" ? "bg-[var(--blue-bg)] text-[var(--blue)]"
                : listing.priceType === "DONATION" ? "bg-[var(--amber-bg)] text-[var(--amber)]"
                : "bg-[var(--green-bg)] text-[var(--green)]"
              }`}>
                {listing.priceType === "TRADE" ? "🔄 Trade" : listing.priceType === "DONATION" ? "💰 Donation" : "🆓 Free"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              by{" "}
              <Link href={`/players/${listing.player.id}`} className="text-[var(--accent-text)]/80 hover:text-[var(--accent-text)]">
                {listing.player.username}
              </Link>
              {" · "}{listing.player.corporation}
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs font-medium text-[var(--text-dim)]">
              {isArchived ? `Archived ${listing.archivedAt ? new Date(listing.archivedAt).toLocaleDateString() : ""}` : `Expires in ${timeUntilExpiry(listing.expiresAt)}`}
            </span>
          </div>
        </div>

        {cleanDescription && (
          <p className="mt-4 text-sm text-[var(--text)]">{cleanDescription}</p>
        )}

        {isDonation && listing.donationAmount != null && (
          <div className="mt-3 rounded-lg border border-[var(--amber)]/30 bg-[var(--amber-bg)] p-3">
            <p className="text-xs font-medium text-[var(--amber)]">Requested Donation</p>
            <p className="text-lg font-bold text-[var(--text)]">{listing.donationAmount.toFixed(0)} credits</p>
          </div>
        )}
      </div>

      {offering.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-[var(--green)] mb-3">Offering</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {offering.map((la) => (
              <ArtifactBadge key={la.artifact.id} category={la.artifact.category} bonusPct={la.artifact.bonusPct} level={la.artifact.level} />
            ))}
          </div>
        </div>
      )}

      {isTrade && wanting.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-[var(--amber)] mb-3">Wanting</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {wanting.map((la) => (
              <ArtifactBadge key={la.artifact.id} category={la.artifact.category} bonusPct={la.artifact.bonusPct} level={la.artifact.level} />
            ))}
          </div>
        </div>
      )}

      {isTrade && wantedPrefs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-[var(--amber)] mb-3">Wanted (by preference)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {wantedPrefs.map((wp, i) => {
              const style = (categoryStyles as any)[wp.category] || categoryStyles.COMBAT;
              return (
                <div key={i} className="rounded-lg border p-3" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{categoryEmojis[wp.category] || "?"}</span>
                    <span className="text-xs font-semibold opacity-70">Lv. {wp.minLevel}{wp.minBonusPct > 0 ? ` +${wp.minBonusPct}%` : ""}</span>
                  </div>
                  <div className="mt-1 font-medium">{wp.category}</div>
                  <div className="text-sm opacity-80">{wp.minBonusPct > 0 ? `Min +${wp.minBonusPct}% bonus` : "Any bonus"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interest button or interests list */}
      <div className="mt-6">
        {isOwnListing ? (
          <InterestsList listingId={listing.id} listingArtifacts={listing.listingArtifacts} />
        ) : currentPlayer && listing.status === "ACTIVE" ? (
          <InterestButton listingId={listing.id} listingArtifacts={listing.listingArtifacts} priceType={listing.priceType} />
        ) : !currentPlayer ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              <Link href={`/login?redirect=/listings/${listing.id}`} className="text-[var(--accent-text)] hover:opacity-80">Sign in</Link>
              {" "}to express interest in this listing.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
