"use client";

import Link from "next/link";
import ArtifactBadge from "./ArtifactBadge";
import DeleteButton from "./DeleteButton";
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

interface ListingArtifact {
  artifact: { id: string; category: string; bonusPct: number; level: number };
  role: string;
}

interface Listing {
  id: string;
  description: string | null;
  priceType: string;
  donationAmount: number | null;
  expiresAt: Date | string;
  listingArtifacts: ListingArtifact[];
}

function timeUntilExpiry(expiresAt: Date | string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${mins}m`;
}

/** Parse wanted prefs and clean description from a listing */
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

interface Props {
  listing: Listing;
  isOwnProfile: boolean;
}

export default function ListingCardWithDelete({ listing, isOwnProfile }: Props) {
  const off = groupArtifacts(listing.listingArtifacts.filter((la) => la.role === "OFFERING"));
  const want = groupArtifacts(listing.listingArtifacts.filter((la) => la.role === "WANTING"));
  const { cleanDescription, wantedPrefs } = parseListingDescription(listing.description);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 transition hover:border-[var(--border-hover)] relative group">
      {isOwnProfile && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <DeleteButton
            onDelete={async () => {
              await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
              window.location.reload();
            }}
            confirmMessage="Delete this listing?"
            className="opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          />
        </div>
      )}
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="flex items-center justify-between gap-2 pr-8">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            listing.priceType === "FREE" ? "bg-[var(--green-bg)] text-[var(--green)]"
            : listing.priceType === "TRADE" ? "bg-[var(--blue-bg)] text-[var(--blue)]"
            : "bg-[var(--accent)]/20 text-[var(--amber)]"
          }`}>
            {listing.priceType === "FREE" ? "🆓 Free" : listing.priceType === "TRADE" ? "🔄 Trade" : `💰 $${listing.donationAmount?.toFixed(2) ?? "?"}`}
          </span>
          <span className="text-xs text-[var(--text-dim)] shrink-0">{timeUntilExpiry(listing.expiresAt)}</span>
        </div>
        {cleanDescription && <p className="mt-2 text-xs sm:text-sm text-[var(--text)] line-clamp-2">{cleanDescription}</p>}
        {off.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--green)] mb-1">Offering</p>
            <div className="flex flex-wrap gap-1">
              {off.map((o) => <ArtifactBadge key={`${o.artifact.category}-${o.artifact.bonusPct}-${o.artifact.level}`} category={o.artifact.category as any} bonusPct={o.artifact.bonusPct} level={o.artifact.level} compact count={o.count} />)}
            </div>
          </div>
        )}
        {want.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--amber)] mb-1">Wanting</p>
            <div className="flex flex-wrap gap-1">
              {want.map((w) => <ArtifactBadge key={`${w.artifact.category}-${w.artifact.bonusPct}-${w.artifact.level}`} category={w.artifact.category as any} bonusPct={w.artifact.bonusPct} level={w.artifact.level} compact count={w.count} />)}
            </div>
          </div>
        )}
        {wantedPrefs.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--amber)] mb-1.5">Wanted (by preference)</p>
            <div className="flex flex-wrap gap-1.5">
              {wantedPrefs.map((wp, i) => (
                <WantedPrefBadge key={i} category={wp.category} minBonusPct={wp.minBonusPct} minLevel={wp.minLevel} />
              ))}
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}
