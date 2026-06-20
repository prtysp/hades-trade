"use client";

import { useState, useRef, useEffect } from "react";
import { ArtifactCategory } from "@prisma/client";
import { useArtifactContext } from "@/components/ArtifactContext";

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "⚔️", TRANSPORT: "🚀", MINING: "⛏️", DRONE: "🤖", WEAPON: "🔫", SHIELD: "🛡️",
};

const categories: ArtifactCategory[] = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];
const LEVELS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const LEVEL_ROWS = [[3, 4, 5, 6], [7, 8, 9, 10], [11, 12]];

function BonusInput({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (v: number) => Math.round(Math.max(min, Math.min(max, v)) * 10) / 10;

  const applyDraft = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onChange(clamp(parsed));
    setEditing(false);
  };

  const steps = [
    { label: "−10", delta: -10 },
    { label: "−1", delta: -1 },
    { label: "+1", delta: 1 },
    { label: "+10", delta: 10 },
  ];

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="flex items-center gap-1">
        {steps.map(({ label: sLabel, delta }) => (
          <button
            key={sLabel}
            type="button"
            onClick={() => onChange(clamp(value + delta))}
            disabled={value + delta < min || value + delta > max}
            className="h-9 w-11 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed"
          >
            {sLabel}
          </button>
        ))}
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyDraft();
            }}
            className="flex-1 min-w-0"
          >
            <input
              ref={inputRef}
              type="number"
              step={1}
              min={min}
              max={max}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={applyDraft}
              className="h-9 w-full rounded-lg border border-[var(--accent-text)] bg-[var(--bg-input)] px-2 text-sm font-medium text-[var(--text)] text-center focus:outline-none tabular-nums"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 text-sm font-medium text-[var(--text)] text-center tabular-nums hover:border-[var(--border-hover)] transition"
          >
            {value}<span className="text-[var(--text-muted)] ml-0.5">%</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StepperInput({
  value,
  onChange,
  min,
  max,
  label,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="flex items-center gap-0">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          className="h-9 w-9 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed"
        >
          −
        </button>
        <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center px-2">
          <span className="text-sm font-medium text-[var(--text)] tabular-nums">
            {value}{suffix && <span className="text-[var(--text-muted)] ml-0.5">{suffix}</span>}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="h-9 w-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

function LevelSelector({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="space-y-1">
        {LEVEL_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((lv) => {
              const selected = value === lv;
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => onChange(lv)}
                  className={`h-8 flex-1 rounded-lg border text-xs font-medium transition ${
                    selected
                      ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]"
                      : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                  }`}
                >
                  {lv}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AddArtifactForm() {
  const { artifacts, playerId, refresh } = useArtifactContext();

  const [category, setCategory] = useState<ArtifactCategory>("COMBAT");
  const [bonusPct, setBonusPct] = useState(320);
  const [level, setLevel] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (artifactId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this artifact?")) return;
    setDeleting(artifactId);
    try {
      const res = await fetch(`/api/artifacts/${artifactId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete");
      }
      await refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete artifact");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (bonusPct < 0) {
      setError("Bonus % must be a positive number");
      setSaving(false);
      return;
    }
    if (level < 3 || level > 12) {
      setError("Level must be between 3 and 12");
      setSaving(false);
      return;
    }
    if (quantity < 1 || quantity > 50) {
      setError("Quantity must be between 1 and 50");
      setSaving(false);
      return;
    }

    try {
      const promises = Array.from({ length: quantity }, () =>
        fetch("/api/artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, bonusPct, level, playerId }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error(`Failed to add ${failed.length} artifact(s)`);
      }

      setSuccess(`✓ Added ${quantity} ${category} +${bonusPct}% Lv.${level} artifact${quantity > 1 ? "s" : ""}!`);
      setQuantity(1);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category selector */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {categories.map((cat) => {
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    selected
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

        {/* Bonus %, Level, Quantity in a row */}
        <div className="grid grid-cols-3 gap-3">
          <BonusInput
            value={bonusPct}
            onChange={setBonusPct}
            min={0}
            max={500}
            label="Bonus %"
          />
          <LevelSelector value={level} onChange={setLevel} label="Level" />
          <StepperInput value={quantity} onChange={setQuantity} min={1} max={50} label="Quantity" />
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>Preview:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1 text-xs font-medium text-[var(--text)]">
            <span>{categoryEmojis[category]}</span>
            <span>{category.charAt(0)}{category.slice(1).toLowerCase()}</span>
            <span className="text-[var(--green)]">+{bonusPct}%</span>
            <span className="text-[var(--text-dim)]">Lv.{level}</span>
            {quantity > 1 && <span className="text-[var(--accent-text)]">×{quantity}</span>}
          </span>
        </div>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}
        {success && <p className="text-sm text-[var(--green)]">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Adding…" : `Add ${quantity > 1 ? `${quantity} Artifacts` : "Artifact"}`}
        </button>
      </form>

      {/* Current inventory mini-display */}
      {artifacts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--text)] mb-2">
            Inventory ({artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2.5 text-center relative group"
              >
                <button
                  type="button"
                  onClick={(e) => handleDelete(art.id, e)}
                  disabled={deleting === art.id}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[var(--red)] text-white text-xs font-bold flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-all hover:scale-110 disabled:opacity-50 z-10"
                  title="Delete artifact"
                >
                  {deleting === art.id ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
                    </svg>
                  )}
                </button>
                <div className="text-sm">{categoryEmojis[art.category]}</div>
                <div className="text-xs font-medium text-[var(--text)]">{art.category.charAt(0)}{art.category.slice(1).toLowerCase()}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  +{art.bonusPct}% · Lv.{art.level}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {artifacts.length === 0 && (
        <p className="text-sm text-[var(--text-dim)]">No artifacts in inventory yet. Add some above!</p>
      )}
    </div>
  );
}
