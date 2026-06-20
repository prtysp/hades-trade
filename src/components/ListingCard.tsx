import Link from "next/link";
import ArtifactBadge from "./ArtifactBadge";
import { categoryStyles, categoryEmojis } from "@/lib/artifact-styles";

function WantedPrefBadge({ category, minBonusPct, minLevel }: { category: string; minBonusPct: number; minLevel: number }) {
  const style = categoryStyles[category as keyof typeof categoryStyles] || categoryStyles.COMBAT;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
    >
      {categoryEmojis[category as keyof typeof categoryEmojis] || "?"} {category} L{minLevel} +{minBonusPct}%
    </span>
  );
}

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

interface ListingArtifact {
  artifact: { id: string; category: string; bonusPct: number; level: number };
  role: "OFFERING" | "WANTING";
}

interface Listing {
  id: string;
  description: string | null;
  player: { id: string; username: string; corporation: string };
  priceType: string;
  donationAmount: number | null;
  status: string;
  expiresAt: Date | string;
  archivedAt: Date | string | null;
  listingArtifacts: ListingArtifact[];
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

function PriceBadge({ priceType, donationAmount }: { priceType: string; donationAmount: number | null }) {
  if (priceType === "TRADE") {
    return (
      <span className="rounded-full bg-[var(--blue-bg)] px-2 py-0.5 text-xs font-medium text-[var(--blue)]">
        🔄 Trade
      </span>
    );
  }
  if (priceType === "DONATION") {
    return (
      <span className="rounded-full bg-[var(--amber-bg)] px-2 py-0.5 text-xs font-medium text-[var(--amber)]">
        💰 Donation
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--green-bg)] px-2 py-0.5 text-xs font-medium text-[var(--green)]">
      🆓 Free
    </span>
  );
}

function groupArtifacts(artifacts: ListingArtifact[]) {
  const map = new Map<string, { artifact: ListingArtifact["artifact"]; count: number }>();
  for (const la of artifacts) {
    const key = `${la.artifact.category}-${la.artifact.bonusPct}-${la.artifact.level}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { artifact: la.artifact, count: 1 });
    }
  }
  return Array.from(map.values());
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const offering = groupArtifacts(listing.listingArtifacts.filter((la) => la.role === "OFFERING"));
  const wanting = groupArtifacts(listing.listingArtifacts.filter((la) => la.role === "WANTING"));
  const { cleanDescription, wantedPrefs } = parseListingDescription(listing.description);
  const isArchived = listing.status === "ARCHIVED";
  const isTrade = listing.priceType === "TRADE";
  const isDonation = listing.priceType === "DONATION";

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 transition hover:border-[var(--border-hover)] ${isArchived ? "opacity-50" : ""}`}>
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isArchived && (
              <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">Archived</span>
            )}
            <PriceBadge priceType={listing.priceType} donationAmount={listing.donationAmount} />
          </div>
          <span className="shrink-0 text-xs text-[var(--text-dim)]">
            {isArchived ? `Archived ${listing.archivedAt ? new Date(listing.archivedAt).toLocaleDateString() : ""}` : timeUntilExpiry(listing.expiresAt)}
          </span>
        </div>

        <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
          by{" "}
          <span className="text-[var(--accent-text)]/80 hover:text-[var(--accent-text)]">
            {listing.player.username}
          </span>
        </p>

        {cleanDescription && (
          <p className="mt-2 text-xs sm:text-sm text-[var(--text)] line-clamp-2">{cleanDescription}</p>
        )}

        {offering.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--green)] mb-1.5">Offering</p>
            <div className="flex flex-wrap gap-1.5">
              {offering.map((o) => (
                <ArtifactBadge key={`${o.artifact.category}-${o.artifact.bonusPct}-${o.artifact.level}`} category={o.artifact.category as any} bonusPct={o.artifact.bonusPct} level={o.artifact.level} compact count={o.count} />
              ))}
            </div>
          </div>
        )}

        {isTrade && wanting.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--amber)] mb-1.5">Wanting</p>
            <div className="flex flex-wrap gap-1.5">
              {wanting.map((w) => (
                <ArtifactBadge key={`${w.artifact.category}-${w.artifact.bonusPct}-${w.artifact.level}`} category={w.artifact.category as any} bonusPct={w.artifact.bonusPct} level={w.artifact.level} compact count={w.count} />
              ))}
            </div>
          </div>
        )}

        {isTrade && wantedPrefs.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--amber)] mb-1.5">Wanted (by preference)</p>
            <div className="flex flex-wrap gap-1.5">
              {wantedPrefs.map((wp, i) => (
                <WantedPrefBadge key={i} category={wp.category} minBonusPct={wp.minBonusPct} minLevel={wp.minLevel} />
              ))}
            </div>
          </div>
        )}

        {isDonation && listing.donationAmount != null && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--amber)] mb-1">Requested Donation</p>
            <p className="text-sm text-[var(--text)] font-semibold">{listing.donationAmount.toFixed(0)} credits</p>
          </div>
        )}
      </Link>
    </div>
  );
}
