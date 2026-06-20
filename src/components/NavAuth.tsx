"use client";

import { useAuth } from "./AuthProvider";
import { useNotifications } from "./NotificationProvider";
import Link from "next/link";
import { useState } from "react";

export function NavAuth() {
  const { player, loading, logout } = useAuth();
  const { unreadCount, osNotificationPermission, requestOsNotificationPermission } = useNotifications();
  const [showOsPrompt, setShowOsPrompt] = useState(false);

  const handleEnableOsNotifications = async () => {
    const granted = await requestOsNotificationPermission();
    if (granted) {
      setShowOsPrompt(false);
    }
  };

  if (loading) {
    return <span className="text-xs text-[var(--text-dim)]">…</span>;
  }

  if (!player) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link
          href="/login"
          className="text-[var(--text)] hover:text-[var(--accent-text)] transition text-xs sm:text-sm font-medium whitespace-nowrap"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-amber-500 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition whitespace-nowrap"
        >
          Register
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <div className="relative">
        <Link
          href="/notifications"
          className="relative opacity-70 hover:opacity-100 transition text-sm"
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--red)] text-[9px] font-bold text-white min-w-[16px] px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
      {osNotificationPermission !== "granted" && osNotificationPermission !== "denied" && (
        <button
          onClick={handleEnableOsNotifications}
          className="rounded-lg bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-white hover:brightness-110 transition"
          title="Enable OS notifications"
        >
          🔔 Enable OS Notifications
        </button>
      )}
      <Link
        href="/settings"
        className="opacity-70 hover:opacity-100 transition text-sm"
        title="Settings"
      >
        ⚙️
      </Link>
      <Link
        href={`/players/${player.id}`}
        className="text-[var(--text)] hover:text-[var(--accent-text)] transition text-xs sm:text-sm font-medium whitespace-nowrap max-w-[80px] sm:max-w-none truncate"
      >
        {player.username}
      </Link>
      <button
        onClick={handleLogout}
        className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition whitespace-nowrap"
      >
        Out
      </button>
    </div>
  );
}
