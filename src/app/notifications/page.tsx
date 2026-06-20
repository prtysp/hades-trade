"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useNotifications, notifyRefresh } from "@/components/NotificationProvider";

const categoryEmojis: Record<string, string> = {
  COMBAT: "🔴", TRANSPORT: "🟠", MINING: "🟡", DRONE: "🟢", WEAPON: "🔵", SHIELD: "🟣",
};

interface TradeArtifact {
  id: string; artifactId: string; category: string; bonusPct: number; level: number;
  fromPlayerId: string; toPlayerId: string; role: string;
}

interface Notification {
  id: string; message: string; read: boolean; type: string; createdAt: string;
  listingId: string | null;
  listing: {
    id: string; player: { id: string; username: string };
    listingArtifacts: { artifact: { category: string; bonusPct: number; level: number; id: string }; role: string }[];
  } | null;
  tradeId: string | null;
  trade: {
    id: string; listingId: string; listerId: string; traderId: string; status: string;
    lister: { id: string; username: string }; trader: { id: string; username: string };
    tradeArtifacts: TradeArtifact[];
  } | null;
}

// Which notification types are "listing" notifications that should get express interest
const listingNotificationTypes = new Set(["GENERAL", "PREFERENCE_MATCH"]);
// Trade notifications that need acknowledgment
const tradeActionTypes = new Set(["INTEREST_ACCEPTED", "TRADE_CONFIRMATION_NEEDED"]);

export default function NotificationsPage() {
  const { player: authPlayer, loading: authLoading } = useAuth();
  const { refresh } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [hideRead, setHideRead] = useState(false);

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

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    refresh();
  };

  const markAllRead = async () => {
    if (!playerId) return;
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId, markAllRead: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  };

  const expressInterest = async (notificationId: string, listingId: string) => {
    setActingId(notificationId);
    try {
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification?.listing) return;
      const offeringIds = notification.listing.listingArtifacts.filter((la) => la.role === "OFFERING").map((la) => la.artifact.id);
      if (!offeringIds.length) return;
      const res = await fetch("/api/interests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, offeringArtifactIds: offeringIds, message: "Interested in all artifacts!" }),
      });
      if (res.ok) { await markRead(notificationId); notifyRefresh(); setTimeout(loadNotifications, 300); }
    } catch (e) { console.error(e); }
    finally { setActingId(null); }
  };

  const acceptInterest = async (notificationId: string, listingId: string) => {
    setActingId(notificationId);
    try {
      const interestsRes = await fetch(`/api/interests?listingId=${listingId}`);
      if (!interestsRes.ok) return;
      const interests = await interestsRes.json();
      const pending = interests.find((i: any) => i.status === "PENDING");
      if (!pending) return;
      const artifactIds = (pending.offeringInterestArtifacts || []).map((a: any) => a.artifactId);
      const res = await fetch(`/api/interests/${pending.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED", offeringArtifactIds: artifactIds }),
      });
      if (res.ok) { await markRead(notificationId); notifyRefresh(); setTimeout(loadNotifications, 300); }
    } catch (e) { console.error(e); }
    finally { setActingId(null); }
  };

  const rejectInterest = async (notificationId: string, listingId: string) => {
    setActingId(notificationId);
    try {
      const interestsRes = await fetch(`/api/interests?listingId=${listingId}`);
      if (!interestsRes.ok) return;
      const interests = await interestsRes.json();
      const pending = interests.find((i: any) => i.status === "PENDING");
      if (!pending) return;
      const res = await fetch(`/api/interests/${pending.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) { await markRead(notificationId); notifyRefresh(); }
    } catch (e) { console.error(e); }
    finally { setActingId(null); }
  };

  const acknowledgeTrade = async (notificationId: string, tradeId: string) => {
    setActingId(notificationId);
    try {
      const res = await fetch("/api/notifications/acknowledge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, tradeId }),
      });
      if (res.ok) { await markRead(notificationId); notifyRefresh(); setTimeout(loadNotifications, 300); }
    } catch (e) { console.error(e); }
    finally { setActingId(null); }
  };

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

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.filter((n) => n.read).length;
  const visibleNotifications = hideRead ? notifications.filter((n) => !n.read) : notifications;
  const hiddenReadCount = hideRead ? readCount : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up!"}
            {readCount > 0 && (
              <span className="text-[var(--text-dim)]"> · {readCount} read</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {readCount > 0 && (
            <button
              onClick={() => setHideRead(!hideRead)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
            >
              {hideRead ? `Show ${readCount} read` : `Hide ${readCount} read`}
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--border-hover)] transition"
            >
              Mark all read
            </button>
          )}
        </div>
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
        <div className="space-y-2">
          {hiddenReadCount > 0 && !hideRead && (
            <button
              onClick={() => setHideRead(true)}
              className="w-full rounded-lg border border-[var(--border)]/50 bg-[var(--bg-card)]/50 px-4 py-2 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition text-center"
            >
              ▾ {hiddenReadCount} read notification{hiddenReadCount > 1 ? "s" : ""} — click to hide
            </button>
          )}

          {visibleNotifications.map((n) => {
            const isActing = actingId === n.id;
            const hasListing = !!n.listing;
            const tradeActive = !!n.trade && !["COMPLETED", "CANCELLED"].includes(n.trade?.status || "");

            const canExpressInterest = !n.read && hasListing && listingNotificationTypes.has(n.type) &&
              n.listing!.listingArtifacts.some((la) => la.role === "OFFERING");
            const canAcceptReject = !n.read && hasListing && n.type === "INTEREST_EXPRESSED";
            const canAcknowledge = !n.read && tradeActive && tradeActionTypes.has(n.type);

            const isRead = n.read;

            return (
              <div
                key={n.id}
                className={`rounded-xl border p-4 transition ${
                  isRead
                    ? "border-[var(--border)]/40 bg-[var(--bg-card)]/60"
                    : canAcknowledge
                    ? "border-[var(--green)]/40 bg-[var(--bg-card)]"
                    : canAcceptReject || canExpressInterest
                    ? "border-[var(--accent)]/40 bg-[var(--bg-card)]"
                    : "border-[var(--accent-text)]/40 bg-[var(--bg-card)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isRead ? "text-[var(--text-muted)] line-through decoration-[var(--text-dim)]/50" : "text-[var(--text)]"}`}>
                      {n.message}
                    </p>

                    {/* Trade artifact summary */}
                    {(() => {
                      const t = n.trade;
                      if (!t || !t.tradeArtifacts?.length) return null;
                      return (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--amber)] mb-0.5">You give</p>
                            <div className="flex flex-wrap gap-1">
                              {t.tradeArtifacts
                                .filter((ta) => (t.listerId === authPlayer.id && ta.role === "GIVEN") || (t.traderId === authPlayer.id && ta.role === "RECEIVED"))
                                .map((ta) => (
                                  <span key={ta.id} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--amber)]/20 bg-[var(--amber-bg)] px-1.5 py-0.5 text-[10px] text-[var(--amber)]">
                                    {categoryEmojis[ta.category]} +{ta.bonusPct}% Lv.{ta.level}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)] mb-0.5">You receive</p>
                            <div className="flex flex-wrap gap-1">
                              {t.tradeArtifacts
                                .filter((ta) => (t.listerId === authPlayer.id && ta.role === "RECEIVED") || (t.traderId === authPlayer.id && ta.role === "GIVEN"))
                                .map((ta) => (
                                  <span key={ta.id} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-bg)] px-1.5 py-0.5 text-[10px] text-[var(--green)]">
                                    {categoryEmojis[ta.category]} +{ta.bonusPct}% Lv.{ta.level}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Listing artifacts for express interest */}
                    {hasListing && canExpressInterest && (
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)] mb-0.5">Available</p>
                        <div className="flex flex-wrap gap-1">
                          {n.listing!.listingArtifacts.filter((la) => la.role === "OFFERING").map((la) => (
                            <span key={la.artifact.id} className="inline-flex items-center gap-0.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-bg)] px-1.5 py-0.5 text-[10px] text-[var(--green)]">
                              {categoryEmojis[la.artifact.category]} +{la.artifact.bonusPct}% Lv.{la.artifact.level}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      {hasListing && (
                        <>
                          <Link href={`/listings/${n.listing!.id}`} className="text-xs sm:text-sm text-[var(--amber)] hover:text-[var(--accent-text)]" onClick={(e) => e.stopPropagation()}>View listing →</Link>
                          <Link href={`/players/${n.listing!.player.id}`} className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text)]" onClick={(e) => e.stopPropagation()}>by {n.listing!.player.username}</Link>
                        </>
                      )}
                      {n.trade && !hasListing && (
                        <Link href={`/players/${authPlayer.id}`} className="text-xs sm:text-sm text-[var(--text-muted)] hover:text-[var(--text)]" onClick={(e) => e.stopPropagation()}>View trades →</Link>
                      )}
                      <span className="text-xs text-[var(--text-dim)]">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {canExpressInterest && (
                      <button onClick={(e) => { e.stopPropagation(); expressInterest(n.id, n.listing!.id); }} disabled={isActing}
                        className="rounded-lg bg-[var(--blue)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap">
                        {isActing ? "…" : "🤝 Express Interest"}
                      </button>
                    )}
                    {canAcceptReject && (
                      <div className="flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); acceptInterest(n.id, n.listing!.id); }} disabled={isActing}
                          className="rounded-lg bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap">
                          {isActing ? "…" : "✓ Accept"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); rejectInterest(n.id, n.listing!.id); }} disabled={isActing}
                          className="rounded-lg bg-[var(--red)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap">
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {canAcknowledge && (
                      <button onClick={(e) => { e.stopPropagation(); acknowledgeTrade(n.id, n.tradeId!); }} disabled={isActing}
                        className="rounded-lg bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50 whitespace-nowrap">
                        {isActing ? "…" : "✓ I've Exchanged In-Game"}
                      </button>
                    )}
                    {!n.read && !canExpressInterest && !canAcceptReject && !canAcknowledge && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition">
                        Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hideRead && readCount > 0 && (
            <button
              onClick={() => setHideRead(false)}
              className="w-full rounded-lg border border-[var(--border)]/50 bg-[var(--bg-card)]/50 px-4 py-2 text-xs text-[var(--text-dim)] hover:text-[var(--text-muted)] transition text-center"
            >
              ▴ Show {readCount} read notification{readCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
