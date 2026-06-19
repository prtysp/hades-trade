"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactCategory } from "@prisma/client";

const ALL_CATEGORIES: ArtifactCategory[] = [
  "COMBAT",
  "TRANSPORT",
  "MINING",
  "DRONE",
  "WEAPON",
  "SHIELD",
];

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "⚔️",
  TRANSPORT: "🚀",
  MINING: "⛏️",
  DRONE: "🤖",
  WEAPON: "🔫",
  SHIELD: "🛡️",
};

interface Threshold {
  category: string;
  minBonusPct: number;
  minLevel: number;
}

interface PreferenceFormProps {
  playerId: string;
  initial?: {
    categoryThresholds: Threshold[];
  };
}

export default function PreferenceForm({ playerId, initial }: PreferenceFormProps) {
  const router = useRouter();
  const [thresholds, setThresholds] = useState<Threshold[]>(
    initial?.categoryThresholds ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get threshold for a specific category (or default)
  const getThreshold = (cat: string): Threshold => {
    return thresholds.find((t) => t.category === cat) ?? {
      category: cat,
      minBonusPct: 0,
      minLevel: 3,
    };
  };

  const updateThreshold = (cat: string, field: "minBonusPct" | "minLevel", value: number) => {
    setThresholds((prev) => {
      const existing = prev.find((t) => t.category === cat);
      if (existing) {
        return prev.map((t) => (t.category === cat ? { ...t, [field]: value } : t));
      }
      return [...prev, { category: cat, minBonusPct: 0, minLevel: 3, [field]: value }];
    });
  };

  const removeThreshold = (cat: string) => {
    setThresholds((prev) => prev.filter((t) => t.category !== cat));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, thresholds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save preference");
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Build human-readable summary
  const activeThresholds = thresholds.filter(
    (t) => t.minBonusPct > 0 || t.minLevel > 3
  );
  const summary =
    activeThresholds.length > 0
      ? `Interested in ${activeThresholds
          .map((t) => {
            const parts: string[] = [t.category];
            if (t.minBonusPct > 0) parts.push(`${t.minBonusPct}%+`);
            if (t.minLevel > 3) parts.push(`Lv.${t.minLevel}+`);
            return parts.join(" ");
          })
          .join(", ")}`
      : "No preference set";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--text-dim)]">
        Set minimum bonus % and level for each artifact category you&apos;re interested in.
        Leave categories empty to ignore them.
      </p>

      <div className="space-y-3">
        {ALL_CATEGORIES.map((cat) => {
          const t = getThreshold(cat);
          const isActive = thresholds.some((th) => th.category === cat);

          return (
            <div
              key={cat}
              className={`rounded-lg border p-4 transition ${
                isActive
                  ? "border-[var(--border)] bg-[var(--bg-card)]"
                  : "border-[var(--border)]/50 bg-[var(--bg-card)]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isActive) removeThreshold(cat);
                    else updateThreshold(cat, "minBonusPct", 0);
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition ${
                    isActive
                      ? "border-[var(--accent-text)] bg-[var(--accent)]/15 text-[var(--amber)]"
                      : "border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--text-muted)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    readOnly
                    className="sr-only"
                  />
                  {categoryEmojis[cat]} {cat}
                  {isActive && <span className="text-xs opacity-60">✓</span>}
                </button>
                {isActive && (
                  <button
                    type="button"
                    onClick={() => removeThreshold(cat)}
                    className="text-xs text-[var(--text-dim)] hover:text-[var(--red)] transition"
                  >
                    Remove
                  </button>
                )}
              </div>

              {isActive && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Min Bonus %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      step={10}
                      value={t.minBonusPct}
                      onChange={(e) =>
                        updateThreshold(cat, "minBonusPct", parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--border-focus)] focus:outline-none"
                      placeholder="e.g. 320"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Min Level
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={12}
                      value={t.minLevel}
                      onChange={(e) =>
                        updateThreshold(cat, "minLevel", parseInt(e.target.value) || 3)
                      }
                      className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--border-focus)] focus:outline-none"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary preview */}
      <div className="rounded-lg bg-[var(--bg-header)] border border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--text-muted)]">
          <span className="text-[var(--text-dim)]">Preview:</span>{" "}
          <span className="text-[var(--amber)] font-medium">{summary}</span>
        </p>
      </div>

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Preferences"}
      </button>
    </form>
  );
}
