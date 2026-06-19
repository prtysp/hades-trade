"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  listing: {
    id: string;
    player: { username: string };
    listingArtifacts: {
      artifact: { category: string; bonusPct: number; level: number };
      role: string;
    }[];
  };
}

export default function NotificationsPage() {
  const { player: authPlayer, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const playerId = authPlayer?.id ?? null;

  const loadNotifications = useCallback(async () => {
    if (!playerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?playerId=${playerId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (!authLoading) {
      loadNotifications();
    }
  }, [authLoading, loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    loadNotifications();
  };

  const markAllRead = async () => {
    if (!playerId) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, markAllRead: true }),
    });
    loadNotifications();
  };

  if (authLoading) {
    return <p className="text-[var(--text-dim)]">Loading…</p>;
  }

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

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
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
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3 sm:p-4 transition ${
                n.read
                  ? "border-[var(--border)] bg-[var(--bg-card)]"
                  : "border-[var(--accent-text)] bg-[var(--bg-card)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? "text-[var(--text-muted)]" : "text-[var(--text)]"}`}>
                    {n.message}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Link
                      href={`/listings/${n.listing.id}`}
                      className="text-xs sm:text-sm text-[var(--amber)] hover:text-[var(--accent-text)]"
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      View listing →
                    </Link>
                    <span className="text-xs text-[var(--text-dim)]">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
                  >
                    Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
