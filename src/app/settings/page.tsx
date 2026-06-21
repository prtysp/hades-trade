import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import ThemeSelector from "@/components/ThemeSelector";
import OsNotificationToggle from "@/components/OsNotificationToggle";
import PrivacyToggle from "@/components/PrivacyToggle";
import ShareFormatEditor from "@/components/ShareFormatEditor";

export default async function SettingsPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login?redirect=/settings");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">Settings</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Customize your Hades Star Market experience</p>

      {/* Profile section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6 mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)] mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Username</label>
            <p className="text-[var(--text)]">{player.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Corporation</label>
            <p className="text-[var(--text)]">{player.corporation}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Discord Username</label>
            <p className="text-[var(--text)]">{player.discordUsername ?? <span className="text-[var(--text-dim)]">Not set</span>}</p>
            <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Optional — share your Discord for trade coordination</p>
          </div>
        </div>
        <form action="/api/settings/corporation" method="POST" className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              name="corporation"
              defaultValue={player.corporation}
              required
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
              placeholder="New corporation name"
            />
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[var(--accent-hover)] transition"
            >
              Update
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              name="discordUsername"
              defaultValue={player.discordUsername ?? ""}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
              placeholder="e.g. playername#1234 or username"
            />
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Theme section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)] mb-4">Appearance</h2>
        <ThemeSelector currentTheme={player.theme} playerId={player.id} />
      </div>

      {/* Notifications section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)] mb-4">Notifications</h2>
        <OsNotificationToggle playerId={player.id} initialEnabled={player.osNotifications} />
      </div>

      {/* Privacy section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)] mb-4">Privacy</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Control what other players can see on your profile.</p>
        <div className="space-y-3">
          <PrivacyToggle
            label="Show active inventory"
            description="Other players can see your artifacts available for trade"
            checked={player.showInventory}
            field="showInventory"
          />
          <PrivacyToggle
            label="Show active listings"
            description="Other players can see your current trade listings"
            checked={player.showListings}
            field="showListings"
          />
          <PrivacyToggle
            label="Show archived items"
            description="Other players can see your archived listings and artifacts"
            checked={player.showArchived}
            field="showArchived"
          />
          <PrivacyToggle
            label="Show trade preferences"
            description="Other players can see what artifacts you're looking for"
            checked={player.showPreferences}
            field="showPreferences"
          />
        </div>
      </div>

      {/* Share Format section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text)] mb-4">Share Format</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Customize the format used when you share a listing. Use the placeholders below to build your message.
        </p>
        <ShareFormatEditor
          playerId={player.id}
          initialFormat={player.shareFormat}
        />
      </div>
    </div>
  );
}
