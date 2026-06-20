"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./NotificationProvider";

export default function OsNotificationToggle({
  playerId,
  initialEnabled,
}: {
  playerId: string;
  initialEnabled: boolean;
}) {
  const { osNotificationPermission, requestOsNotificationPermission } =
    useNotifications();
  const [enabled, setEnabled] = useState(
    initialEnabled && osNotificationPermission === "granted"
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const newState = !enabled;

    if (newState) {
      const granted = await requestOsNotificationPermission();
      if (!granted) return;
    }

    setEnabled(newState);
    setSaving(true);
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ osNotifications: newState }),
      });
      router.refresh();
    } catch {
      setEnabled(!newState);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">
          OS Notifications
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Get native desktop/mobile notifications when you receive new trade
          interests or matches.
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 ${
          enabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
