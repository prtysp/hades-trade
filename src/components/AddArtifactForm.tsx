"use client";

import { useState } from "react";
import { ArtifactCategory } from "@prisma/client";
import { useArtifactContext } from "@/components/ArtifactContext";

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "⚔️",
  TRANSPORT: "🚀",
  MINING: "⛏️",
  DRONE: "🤖",
  WEAPON: "🔫",
  SHIELD: "🛡️",
};

const categories: ArtifactCategory[] = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];
const LEVELS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function StepperInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  suffix?: string;
}) {
  const decrement = () => {
    const next = Math.max(min, value - step);
    onChange(Math.round(next * 10) / 10);
  };
  const increment = () => {
    const next = Math.min(max, value + step);
    onChange(Math.round(next * 10) / 10);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="flex items-center gap-0">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="h-9 w-9 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-input)] flex items-center justify-center">
          <span className="text-sm font-medium text-[var(--text)] tabular-nums">
            {value}
            {suffix && <span className="text-[var(--text-muted)] ml-0.5">{suffix}</span>}
          </span>
        </div>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="h-9 w-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
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
      <div className="flex flex-wrap gap-1">
        {LEVELS.map((lv) => {
          const selected = value === lv;
          return (
            <button
              key={lv}
              type="button"
              onClick={() => onChange(lv)}
              className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
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
          <StepperInput
            value={bonusPct}
            onChange={setBonusPct}
            min={0}
            max={500}
            step={5}
            label="Bonus %"
            suffix="%"
          />
          <LevelSelector
            value={level}
            onChange={setLevel}
            label="Level"
          />
          <StepperInput
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={50}
            label="Quantity"
          />
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
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-center relative group"
              >
                <button
                  type="button"
                  onClick={(e) => handleDelete(art.id, e)}
                  disabled={deleting === art.id}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[var(--red-bg)] text-[var(--red)] text-xs font-bold opacity-0 group-hover:opacity-100 hover:!opacity-100 transition flex items-center justify-center disabled:opacity-50"
                  title="Delete artifact"
                >
                  {deleting === art.id ? "…" : "×"}
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
