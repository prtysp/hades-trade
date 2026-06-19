"use client";

import { useState, useEffect, useCallback } from "react";
import { ArtifactCategory } from "@prisma/client";

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "⚔️",
  TRANSPORT: "🚀",
  MINING: "⛏️",
  DRONE: "🤖",
  WEAPON: "🔫",
  SHIELD: "🛡️",
};

const categories: ArtifactCategory[] = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];

interface Artifact {
  id: string;
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
}

interface AddArtifactFormProps {
  playerId: string;
  onArtifactAdded?: () => void;
}

export default function AddArtifactForm({ playerId, onArtifactAdded }: AddArtifactFormProps) {
  const [category, setCategory] = useState<ArtifactCategory>("COMBAT");
  const [bonusPct, setBonusPct] = useState("320");
  const [level, setLevel] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch current inventory
  const fetchArtifacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/artifacts?playerId=${playerId}`);
      const data = await res.json();
      setArtifacts(data);
    } catch (e) {
      console.error(e);
    }
  }, [playerId]);

  useEffect(() => {
    fetchArtifacts();
  }, [playerId, fetchArtifacts]);

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
      await fetchArtifacts();
      onArtifactAdded?.();
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

    const bonus = parseFloat(bonusPct);
    if (isNaN(bonus) || bonus < 0) {
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
      // Create all artifacts in parallel
      const promises = Array.from({ length: quantity }, () =>
        fetch("/api/artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, bonusPct: bonus, level, playerId }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error(`Failed to add ${failed.length} artifact(s)`);
      }

      setSuccess(`✓ Added ${quantity} ${category} +${bonus}% Lv.${level} artifact${quantity > 1 ? "s" : ""}!`);
      // Don't reset bonusPct/level — persist them for easy batch adding
      // Only reset quantity
      setQuantity(1);

      // Refresh inventory list
      await fetchArtifacts();

      // Notify parent to refresh
      onArtifactAdded?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Group artifacts by category+level+bonus for the inventory display
  const groupedArtifacts = artifacts.reduce<Record<string, { artifact: Artifact; count: number }>>((acc, art) => {
    const key = `${art.category}-${art.level}-${art.bonusPct}`;
    if (!acc[key]) {
      acc[key] = { artifact: art, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});

  const sortedGroups = Object.values(groupedArtifacts).sort((a, b) => {
    if (a.artifact.category !== b.artifact.category) {
      return a.artifact.category.localeCompare(b.artifact.category);
    }
    if (a.artifact.level !== b.artifact.level) {
      return b.artifact.level - a.artifact.level;
    }
    return b.artifact.bonusPct - a.artifact.bonusPct;
  });

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ArtifactCategory)}
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryEmojis[cat]} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Bonus % */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Bonus %</label>
            <input
              type="number"
              min={0}
              max={500}
              step={0.1}
              value={bonusPct}
              onChange={(e) => setBonusPct(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
            />
          </div>

          {/* Level */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Level</label>
            <input
              type="number"
              min={3}
              max={12}
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value) || 3)}
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Qty</label>
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>Adding:</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--text)]">
            {categoryEmojis[category]} {category} +{bonusPct || "0"}% Lv.{level} × {quantity}
          </span>
        </div>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}
        {success && <p className="text-sm text-[var(--green)]">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
        >
          {saving ? "Adding…" : `Add ${quantity > 1 ? `${quantity} Artifacts` : "Artifact"}`}
        </button>
      </form>

      {/* Current inventory */}
      {artifacts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--text)] mb-2">
            Your Inventory ({artifacts.length} artifact{artifacts.length !== 1 ? "s" : ""})
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
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[var(--red-bg)] text-[var(--red)] text-xs font-bold opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-red-500/40 transition flex items-center justify-center disabled:opacity-50"
                  title="Delete artifact"
                >
                  {deleting === art.id ? "…" : "×"}
                </button>
                <div className="text-sm">{categoryEmojis[art.category]}</div>
                <div className="text-xs font-medium text-[var(--text)]">{art.category}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  +{art.bonusPct}% Lv.{art.level}
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
