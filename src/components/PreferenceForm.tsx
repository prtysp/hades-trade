"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArtifactCategory } from "@prisma/client";
import { categoryStyles, categoryEmojis } from "@/lib/artifact-styles";

const ALL_CATEGORIES: ArtifactCategory[] = [
  "COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD",
];

interface Threshold {
  category: string;
  minBonusPct: number;
  minLevel: number;
}

interface PreferenceFormProps {
  playerId: string;
  initial?: { categoryThresholds: Threshold[] };
}

// Reuse the same stepper components from AddArtifactForm
function BonusStepperInput({
  value, onChange, min, max, label, suffix,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number;
  label: string; suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const clamp = (v: number) => Math.round(Math.max(min, Math.min(max, v)) * 10) / 10;
  const applyDraft = () => { const p = parseFloat(draft); if (!isNaN(p)) onChange(clamp(p)); setEditing(false); };
  const canStep = (d: number) => value + d >= min && value + d <= max;

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="flex items-center gap-0">
        <button type="button" onClick={() => onChange(clamp(value - 10))} disabled={!canStep(-10)}
          className="h-9 w-10 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">−10</button>
        <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={!canStep(-1)}
          className="h-9 w-9 border-y border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">−1</button>
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); applyDraft(); }} className="flex-1 min-w-0">
            <input type="number" step={1} min={min} max={max} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={applyDraft}
              className="h-9 w-full border border-[var(--accent-text)] bg-[var(--bg-input)] px-2 text-sm font-medium text-[var(--text)] text-center focus:outline-none tabular-nums" />
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)}
            className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] px-2 text-sm font-medium text-[var(--text)] text-center tabular-nums hover:border-[var(--border-hover)] transition">
            {value}{suffix && <span className="text-[var(--text-muted)] ml-0.5">{suffix}</span>}
          </button>
        )}
        <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={!canStep(1)}
          className="h-9 w-9 border-y border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">+1</button>
        <button type="button" onClick={() => onChange(clamp(value + 10))} disabled={!canStep(10)}
          className="h-9 w-10 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+10</button>
      </div>
    </div>
  );
}

function LevelSelector({
  value, onChange, label,
}: {
  value: number; onChange: (v: number) => void; label: string;
}) {
  const LEVELS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const LEVEL_ROWS = [[3, 4, 5, 6, 7], [8, 9, 10, 11, 12]];
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="space-y-1">
        {LEVEL_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((lv) => (
              <button key={lv} type="button" onClick={() => onChange(lv)}
                className={`h-9 flex-1 rounded-lg border text-sm font-medium transition ${
                  value === lv
                    ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]"
                    : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >{lv}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PreferenceForm({ playerId, initial }: PreferenceFormProps) {
  const router = useRouter();
  const [thresholds, setThresholds] = useState<Threshold[]>(initial?.categoryThresholds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getThreshold = (cat: string): Threshold =>
    thresholds.find((t) => t.category === cat) ?? { category: cat, minBonusPct: 0, minLevel: 3 };

  const updateThreshold = (cat: string, field: "minBonusPct" | "minLevel", value: number) => {
    setThresholds((prev) => {
      const existing = prev.find((t) => t.category === cat);
      if (existing) return prev.map((t) => (t.category === cat ? { ...t, [field]: value } : t));
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, thresholds }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? "Failed to save preference"); }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  };

  const activeThresholds = thresholds.filter((t) => t.minBonusPct > 0 || t.minLevel > 3);
  const summary = activeThresholds.length > 0
    ? `Interested in ${activeThresholds.map((t) => {
        const parts: string[] = [t.category];
        if (t.minBonusPct > 0) parts.push(`${t.minBonusPct}%+`);
        if (t.minLevel > 3) parts.push(`L${t.minLevel}+`);
        return parts.join(" ");
      }).join(", ")}`
    : "No preference set";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--text-dim)]">
        Set minimum bonus % and level for each artifact category you want to get notified about.
        Only matching listings will trigger notifications.
      </p>

      {/* Category grid — same layout as AddArtifactForm */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Categories to watch</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = thresholds.some((th) => th.category === cat);
            return (
              <button key={cat} type="button"
                onClick={() => { if (isActive) removeThreshold(cat); else updateThreshold(cat, "minBonusPct", 0); }}
                className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  isActive
                    ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]"
                    : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >
                <span className="text-base">{categoryEmojis[cat]}</span>
                <span className="leading-none">{cat.charAt(0)}{cat.slice(1).toLowerCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active preference cards — only shown for enabled categories */}
      {thresholds.length > 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[var(--text-muted)]">Minimum thresholds</label>
          {thresholds.map((t) => (
            <div key={t.category} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{categoryEmojis[t.category]}</span>
                  <span className="text-xs font-medium text-[var(--text)]">{t.category.charAt(0)}{t.category.slice(1).toLowerCase()}</span>
                </div>
                <button type="button" onClick={() => removeThreshold(t.category)}
                  className="text-xs text-[var(--text-dim)] hover:text-[var(--red)] transition"
                >Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BonusStepperInput
                  label="Min Bonus %" suffix="%"
                  value={t.minBonusPct} onChange={(v) => updateThreshold(t.category, "minBonusPct", v)}
                  min={0} max={360}
                />
                <LevelSelector
                  label="Min Level"
                  value={t.minLevel} onChange={(v) => updateThreshold(t.category, "minLevel", v)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-[var(--bg-header)] border border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--text-muted)]">
          <span className="text-[var(--text-dim)]">Preview:</span>{" "}
          <span className="text-[var(--amber)] font-medium">{summary}</span>
        </p>
      </div>

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}

      <button type="submit" disabled={saving}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >{saving ? "Saving…" : "Save Preferences"}</button>
    </form>
  );
}
