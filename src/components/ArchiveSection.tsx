"use client";

import { useState } from "react";
import Link from "next/link";
import { categoryEmojis } from "@/lib/artifact-styles";

const archiveReasonLabels: Record<string, { label: string; color: string; bg: string }> = {
  TRADED:   { label: "Traded",   color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]" },
  EXPIRED:  { label: "Expired",  color: "text-[var(--amber)]",  bg: "bg-[var(--amber-bg)]" },
  DELISTED: { label: "Deleted",  color: "text-[var(--red)]",    bg: "bg-[var(--red-bg)]" },
  DELETED:  { label: "Deleted",  color: "text-[var(--red)]",    bg: "bg-[var(--red-bg)]" },
};

const listingStatusLabels: Record<string, { label: string; color: string; bg: string; description: string }> = {
  COMPLETED: { label: "Completed", color: "text-[var(--green)]", bg: "bg-[var(--green-bg)]", description: "All artifacts traded" },
  ARCHIVED:  { label: "Expired",   color: "text-[var(--amber)]", bg: "bg-[var(--amber-bg)]", description: "Listing expired" },
  CANCELLED: { label: "Deleted",    color: "text-[var(--red)]",   bg: "bg-[var(--red-bg)]",   description: "Manually deleted" },
};

interface ArchivedArtifact {
  id: string;
  category: string;
  bonusPct: number;
  level: number;
  archivedAt: Date | string | null;
  archiveReason: string | null;
  archiveListingId: string | null;
}

interface ArchivedListing {
  id: string;
  description: string | null;
  status: string;
  priceType: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  archivedAt: Date | string | null;
  listingArtifacts: {
    artifact: { id: string; category: string; bonusPct: number; level: number };
    role: string;
  }[];
}

interface CompletedTrade {
  id: string;
  listingId: string;
  listerId: string;
  traderId: string;
  lister: { id: string; username: string };
  trader: { id: string; username: string };
  status: string;
  createdAt: string | Date;
  completedAt: string | Date | null;
  tradeArtifacts: {
    id: string;
    category: string;
    bonusPct: number;
    level: number;
    fromPlayerId: string;
    toPlayerId: string;
    role: string;
  }[];
}

interface ArchiveSectionProps {
  archivedArtifacts: ArchivedArtifact[];
  archivedListings: ArchivedListing[];
  completedTrades: CompletedTrade[];
  playerId: string;
}

export default function ArchiveSection({
  archivedArtifacts,
  archivedListings,
  completedTrades,
  playerId,
}: ArchiveSectionProps) {
  const [showArchive, setShowArchive] = useState(false);
  const [activeTab, setActiveTab] = useState<"artifacts" | "listings" | "trades">("trades");

  const totalArchived =
    archivedArtifacts.length + archivedListings.length + completedTrades.length;

  if (totalArchived === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setShowArchive(!showArchive)}
        className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-left transition hover:border-[var(--border-hover)]"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <span className="text-sm font-semibold text-[var(--text)]">
            Archive & History
          </span>
          <span className="rounded-full bg-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
            {totalArchived}
          </span>
        </div>
        <span className="text-sm text-[var(--text-muted)]">
          {showArchive ? "Hide ▲" : "Show ▼"}
        </span>
      </button>

      {showArchive && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(["trades", "listings", "artifacts"] as const).map((tab) => {
              const count =
                tab === "trades"
                  ? completedTrades.length
                  : tab === "listings"
                  ? archivedListings.length
                  : archivedArtifacts.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium transition ${
                    activeTab === tab
                      ? "border-b-2 border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-[var(--border)] px-1.5 py-0.5 text-[10px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {/* Trades tab */}
            {activeTab === "trades" && (
              <div>
                {completedTrades.length === 0 ? (
                  <p className="text-sm text-[var(--text-dim)] text-center py-4">
                    No completed trades yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {completedTrades.map((trade) => {
                      const otherPlayer =
                        trade.listerId === playerId ? trade.trader : trade.lister;
                      const myGiven = trade.tradeArtifacts.filter(
                        (ta) => ta.fromPlayerId === playerId
                      );
                      const myReceived = trade.tradeArtifacts.filter(
                        (ta) => ta.toPlayerId === playerId
                      );
                      return (
                        <div
                          key={trade.id}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  trade.status === "COMPLETED"
                                    ? "bg-[var(--green-bg)] text-[var(--green)]"
                                    : "bg-[var(--red-bg)] text-[var(--red)]"
                                }`}
                              >
                                {trade.status}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">
                                with{" "}
                                <Link
                                  href={`/players/${otherPlayer.id}`}
                                  className="text-[var(--accent-text)] hover:opacity-80"
                                >
                                  {otherPlayer.username}
                                </Link>
                              </span>
                            </div>
                            <span className="text-xs text-[var(--text-dim)]">
                              {trade.completedAt
                                ? new Date(trade.completedAt).toLocaleDateString()
                                : new Date(trade.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--amber)] mb-1">
                                Gave
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {myGiven.map((ta) => (
                                  <span
                                    key={ta.id}
                                    className="inline-flex items-center gap-0.5 rounded-full border border-[var(--amber)]/20 bg-[var(--amber-bg)] px-1.5 py-0.5 text-[10px] text-[var(--amber)]"
                                  >
                                    {categoryEmojis[ta.category]} {ta.category} +{ta.bonusPct}% Lv.{ta.level}
                                  </span>
                                ))}
                                {myGiven.length === 0 && (
                                  <span className="text-[10px] text-[var(--text-dim)]">—</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)] mb-1">
                                Received
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {myReceived.map((ta) => (
                                  <span
                                    key={ta.id}
                                    className="inline-flex items-center gap-0.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-bg)] px-1.5 py-0.5 text-[10px] text-[var(--green)]"
                                  >
                                    {categoryEmojis[ta.category]} {ta.category} +{ta.bonusPct}% Lv.{ta.level}
                                  </span>
                                ))}
                                {myReceived.length === 0 && (
                                  <span className="text-[10px] text-[var(--text-dim)]">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Listings tab */}
            {activeTab === "listings" && (
              <div>
                {archivedListings.length === 0 ? (
                  <p className="text-sm text-[var(--text-dim)] text-center py-4">
                    No archived listings.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {archivedListings.map((listing) => {
                      const statusInfo = listingStatusLabels[listing.status] || listingStatusLabels["ARCHIVED"];
                      return (
                        <Link
                          key={listing.id}
                          href={`/listings/${listing.id}`}
                          className="block rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-3 transition hover:border-[var(--border-hover)]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                                {statusInfo.label}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">{listing.priceType}</span>
                            </div>
                            <span className="text-xs text-[var(--text-dim)]">
                              {listing.archivedAt
                                ? new Date(listing.archivedAt).toLocaleDateString()
                                : new Date(listing.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-[var(--text-dim)]">{statusInfo.description}</p>
                          {listing.description && (
                            <p className="mt-1 text-xs text-[var(--text)] truncate">{listing.description}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {listing.listingArtifacts.map((la) => (
                              <span key={la.artifact.id}
                                className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                              >
                                {categoryEmojis[la.artifact.category]} {la.artifact.category} +{la.artifact.bonusPct}% Lv.{la.artifact.level}
                              </span>
                            ))}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Artifacts tab */}
            {activeTab === "artifacts" && (
              <div>
                {archivedArtifacts.length === 0 ? (
                  <p className="text-sm text-[var(--text-dim)] text-center py-4">
                    No archived artifacts.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {archivedArtifacts.map((art) => {
                      const reason = art.archiveReason
                        ? archiveReasonLabels[art.archiveReason]
                        : null;
                      return (
                        <div
                          key={art.id}
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{categoryEmojis[art.category]}</span>
                              <span className="text-xs font-medium text-[var(--text)]">
                                {art.category} +{art.bonusPct}% Lv.{art.level}
                              </span>
                            </div>
                            <span className="text-[10px] text-[var(--text-dim)]">
                              {art.archivedAt ? new Date(art.archivedAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          {reason && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${reason.color} ${reason.bg}`}>
                                {reason.label}
                              </span>
                              <span className="text-[10px] text-[var(--text-dim)]">
                                {art.archiveReason === "DELETED" && "Manually deleted"}
                                {art.archiveReason === "DELISTED" && "Removed from listing"}
                                {art.archiveReason === "TRADED" && "Traded away"}
                                {art.archiveReason === "EXPIRED" && "Listing expired"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
