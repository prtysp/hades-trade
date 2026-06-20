"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useNotifications, notifyRefresh } from "@/components/NotificationProvider";

const categoryEmojis: Record<string, string> = {
  COMBAT: "⚔️", TRANSPORT: "🚀", MINING: "⛏️", DRONE: "🤖", WEAPON: "🔫", SHIELD: "🛡️",
};

interface TradeArtifact {
  id: string;
  artifactId: string;
  category: string;
  bonusPct: number;
  level: number;
  fromPlayerId: string;
  toPlayerId: string;
  role: string;
}

interface Notification {
  id: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
  listingId: string | null;
  listing: {
    id: string;
    player: { id: string; username: string };
    listingArtifacts: {
      artifact: { category: string; bonusPct: number; level: number; id: string };
      role: string;
    }[];
  } | null;
  tradeId: string | null;
  trade: {
    id: string;
    listingId: string;
    listerId: string;
    traderId: string;
    status: string;
    lister: { id: string; username: string };
    trader: { id: string; username: string };
    tradeArtifacts: TradeArtifact[];
  } | null;
}

// Which notification types get quick-action buttons
const expressInterestTypes = new Set(["GENERAL", "INTEREST_EXPRESSED"]); // listing notifications
const tradeActionTypes = new Set(["INTEREST_ACCEPTED", "TRADE_CONFIRMATION_NEEDED"]);

export default function NotificationsPage() {
  const { player: authPlayer, loading: authLoading } = useAuth();
  const { refresh } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const playerId = authPlayer?.id ?? null;

  const loadNotifications = useCallback(async () => {
    if (!playerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?playerId=${playerId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [playerId]);

  useEffect(() => { if (!authLoading) loadNotifications(); }, [authLoading, loadNotifications]);

  useEffect(() => {
    const handler = () => { if (!authLoading && playerId) { loadNotifications(); refresh(); } };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [authLoading, playerId, loadNotifications, refresh]);

  // ─── Action handlers ───

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
    refresh();
  };

  const markAllRead = async () => {
    if (!playerId) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  };

  // Express interest in all artifacts of a listing
  const expressInterest = async (notificationId: string, listingId: string) => {
    setActingId(notificationId);
    try {
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification?.listing) return;

      const offeringIds = notification.listing.listingArtifacts
        .filter((la) => la.role === "OFFERING")
        .map((la) => la.artifact.id);

      if (offeringIds.length === 0) return;

      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          offeringArtifactIds: offeringIds,
          message: "Interested in all artifacts!",
        }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
        notifyRefresh();
        setTimeout(loadNotifications, 500);
      }
    } catch (e) { console.error("Express interest failed:", e); }
    finally { setActingId(null); }
  };

  // Accept an interest notification (from the lister's perspective)
  const acceptInterest = async (notificationId: string, listingId: string) => {
    setActingId(notificationId);
    try {
      // Find the interest for this listing that is PENDING
      // We need to fetch interests for this listing first
      const interestsRes = await fetch(`/api/interests?listingId=${listingId}`);
      if (!interestsRes.ok) return;
      const interests = await interestsRes.json();
      const pending = interests.find((i: any) => i.status === "PENDING");
      if (!pending) return;

      const res = await fetch(`/api/interests/${pending.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED", offeringArtifactIds: pending.offeringInterestArtifacts?.map((a: any) => a.artifactId) || [] }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
        notifyRefresh();
        setTimeout(loadNotifications, 500);
      }
    } catch (e) { console.error("Accept interest failed:", e); }
    finally { setActingId(null); }
  };

  // Reject an interest notification
  const rejectInterest = async (notificationId: string, listingId: string) => {
    setActingId(notificationId);
    try {
      const interestsRes = await fetch(`/api/interests?listingId=${listingId}`);
      if (!interestsRes.ok) return;
      const interests = await interestsRes.json();
      const pending = interests.find((i: any) => i.status === "PENDING");
      if (!pending) return;

      const res = await fetch(`/api/interests/${pending.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
        notifyRefresh();
      }
    } catch (e) { console.error("Reject interest failed:", e); }
    finally { setActingId(null); }
  };

  // Acknowledge / confirm a trade
  const acknowledgeTrade = async (notificationId: string, tradeId: string) => {
    setActingId(notificationId);
    try {
      const res = await fetch("/api/notifications/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, tradeId }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
        notifyRefresh();
        setTimeout(loadNotifications, 500);
      }
    } catch (e) { console.error("Acknowledge failed:", e); }
    finally { setActingId(null); }
  };

  // ─── Render ───

  if (authLoading) return <p className="text-[var(--text-dim)]">Loading…</p>;
  if (!authPlayer) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 text-center">
        <p className="text-lg text-[var(--text-muted)]">Sign in to view notifications</p>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          <Link href="/login" className="text-[var(--amber)] hover:text-[var(--accent-text)]">Sign in</Link>
          {" "}or{" "}
          <Link href="/register" className="text-[var(--amber)] hover:text-[var(--accent-text)]">register</Link>
          {" "}to get started.
        </p>
      </div>
    );
  }

  const pageUnreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {pageUnreadCount > 0
              ? `${pageUnreadCount} unread notification${pageUnreadCount === 1 ? "" : "s"}`
              : "All caught up!"}
          </p>
        </div>
        {pageUnreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--border-hover)] transition self-start"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-[var(--text-dim)]">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 text-center">
          <p className="text-lg text-[var(--text-muted)]">No notifications yet.</p>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            <Link href={`/players/${authPlayer.id}`} className="text-[var(--amber)] hover:text-[var(--accent-text)]">
              Set a trade preference
            </Link>
            {" "}to get notified about matching listings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isActing = actingId === n.id;
            const hasListing = !!n.listing;
            const hasTrade = !!n.trade;
            const tradeActive = hasTrade && n.trade && !["COMPLETED", "CANCELLED"].includes(n.trade.status);

            // Determine available quick actions
            const canExpressInterest = !n.read && hasListing && expressInterestTypes.has(n.type) && n.listing && n.listing.listingArtifacts.some((la) => la.role === "OFFERING");
            const canAcceptReject = !n.read && hasListing && n.type === "INTEREST_EXPRESSED";
            const canAcknowledge = !n.read && tradeActive && tradeActionTypes.has(n.type);

            return (
              <div
                key={n.id}
                className={`rounded-xl border p-4 transition ${
                  n.read
                    ? "border-[var(--border)] bg-[var(--bg-card)]"
                    : canAcknowledge
                    ? "border-[var(--green)]/40 bg-[var(--bg-card)]"
                    : canAcceptReject || canExpressInterest
                    ? "border-[var(--accent)]/40 bg-[var(--bg-card)]"
                    : "border-[var(--accent-text)]/40 bg-[var(--bg-card)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}>
                      {n.message}
                    </p>

                    {/* Trade artifact summary */}
                    {hasTrade && n.trade!.tradeArtifacts.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--amber)] mb-0.5">You give</p>
                          <div className="flex flex-wrap gap-1">
                            {n.trade!.tradeArtifacts
                              .filter((ta) =>
                                (n.trade!.listerId === authPlayer.id && ta.role === "GIVEN") ||
                                (n.trade!.traderId === authPlayer.id && ta.role === "RECEIVED")
                              )
                              .map((ta) => (
                                <span key={ta.id} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--amber)]/20 bg-[var(--amber-bg)] px-1.5 py-0.5 text-[10px] text-[var(--amber)]">
                                  {categoryEmojis[ta.category]} {ta.category} +{ta.bonusPct}% Lv.{ta.level}
                                </span>
                              ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)] mb-0.5">You receive</p>
                          <div className="flex flex-wrap gap-1">
                            {n.trade!.tradeArtifacts
                              .filter((ta) =>
                                (n.trade!.listerId === authPlayer.id && ta.role === "RECEIVED") ||
                                (n.trade!.traderId === authPlayer.id && ta.role === "GIVEN")
                              )
                              .map((ta) => (
                                <span key={ta.id} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-bg)] px-1.5 py-0.5 text-[10px] text-[var(--green)]">
                                  {categoryEmojis[ta.category]} {ta.category} +{ta.bonusPct}% Lv.{ta.level}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Listing artifact summary for express interest */}
                    {hasListing && canExpressInterest && (
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)] mb-0.5">Offered in listing</p>
                        <div className="flex flex-wrap gap-1">
                          {n.listing!.listingArtifacts
                            .filter((la) => la.role === "OFFERING")
                            .map((la) => (
                              <span key={la.artifact.id} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-bg)] px-1.5 py-0.5 text-[10px] text-[var(--green)]">
                                {categoryEmojis[la.artifact.category]} {la.artifact.category} +{la.artifact.bonusPct}% Lv.{la.artifact.level}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      {hasListing && (
                        <>
                          <Link href={`/listings/${n.listing!.id}`} className="text-xs sm:text-sm text-[var(--amber)] hover:text-[var(--accent-text)]" onClick={(e) => e.stopPropagation()}>
                            View listing →
                          </Link>
                          <Link href={`/players/${n.listing!.player.id}`} className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
                            by {n.listing!.player.username}
                          </Link>
                        </>
                      )}
                      {hasTrade && !hasListing && (
                        <Link href={`/players/${authPlayer.id}`} className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text)]" onClick={(e) => e.stopPropagation()}>
                          View trades →
                        </Link>
                      )}
                      <span className="text-xs text-[var(--text-dim)]">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Quick action buttons */}
                    {canExpressInterest && (
                      <button
                        onClick={(e) => { e.stopPropagation(); expressInterest(n.id, n.listing!.id); }}
                        disabled={isActing}
                        className="rounded-lg bg-[var(--blue)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap"
                      >
                        {isActing ? "…" : "🤝 Express Interest"}
                      </button>
                    )}
                    {canAcceptReject && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); acceptInterest(n.id, n.listing!.id); }}
                          disabled={isActing}
                          className="rounded-lg bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap"
                        >
                          {isActing ? "…" : "✓ Accept"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); rejectInterest(n.id, n.listing!.id); }}
                          disabled={isActing}
                          className="rounded-lg bg-[var(--red)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {canAcknowledge && (
                      <button
                        onClick={(e) => { e.stopPropagation(); acknowledgeTrade(n.id, n.tradeId!); }}
                        disabled={isActing}
                        className="rounded-lg bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap"
                      >
                        {isActing ? "…" : "✓ Acknowledge"}
                      </button>
                    )}
                    {/* Read button for non-actionable unread notifications */}
                    {!n.read && !canExpressInterest && !canAcceptReject && !canAcknowledge && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
                      >
                        Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
