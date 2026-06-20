"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArtifactCategory } from "@prisma/client";
import { notifyRefresh } from "@/components/NotificationProvider";

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "🔴",
  TRANSPORT: "🟠",
  MINING: "🟡",
  DRONE: "🟢",
  WEAPON: "🔵",
  SHIELD: "🟣",
};

interface ListingArtifact {
  artifact: { id: string; category: string; bonusPct: number; level: number };
  role: string;
}

interface PlayerArtifact {
  id: string;
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
}

interface InterestButtonProps {
  listingId: string;
  listingArtifacts: ListingArtifact[];
  priceType: string;
}

export default function InterestButton({ listingId, listingArtifacts, priceType }: InterestButtonProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Artifacts the listing is offering
  const offeringArtifacts = listingArtifacts.filter((la) => la.role === "OFFERING");

  // Selection state
  const [wantedIds, setWantedIds] = useState<string[]>([]);
  const [playerArtifacts, setPlayerArtifacts] = useState<PlayerArtifact[]>([]);
  const [myOfferingIds, setMyOfferingIds] = useState<string[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);

  // Load the current player's artifacts when form opens
  useEffect(() => {
    if (showForm && playerArtifacts.length === 0) {
      setLoadingArtifacts(true);
      fetch(`/api/artifacts`)
        .then((res) => res.json())
        .then((data: PlayerArtifact[]) => setPlayerArtifacts(data))
        .catch(() => {})
        .finally(() => setLoadingArtifacts(false));
    }
  }, [showForm, playerArtifacts.length]);

  const toggleWanted = (id: string) => {
    setWantedIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const toggleMyOffering = (id: string) => {
    setMyOfferingIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wantedIds.length === 0) {
      setError("Select at least one artifact you're interested in from the listing");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        listingId,
        message: message.trim() || undefined,
        offeringArtifactIds: wantedIds,
        wantingArtifactIds: myOfferingIds,
      };
      console.log("Express interest payload:", JSON.stringify(payload));

      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Express interest response status:", res.status);

      if (!res.ok) {
        let msg = "Failed to express interest";
        try {
          const d = await res.json();
          msg = d.error ?? msg;
          console.error("Express interest API error:", res.status, d);
        } catch {
          const text = await res.text();
          console.error("Express interest response text:", res.status, text);
          msg = text || msg;
        }
        throw new Error(msg);
      }

      setSuccess(true);
      setShowForm(false);
      router.refresh();
      notifyRefresh();
    } catch (err: unknown) {
      console.error("Express interest catch:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-[var(--green)]/30 bg-[var(--green-bg)] p-4 text-center">
        <p className="text-sm text-[var(--green)] font-medium">✓ Interest expressed! The lister has been notified.</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => { setShowForm(true); if (priceType !== "TRADE") setMyOfferingIds([]); }}
        className="w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[var(--accent-text)] hover:bg-[var(--accent)]/20 transition"
      >
        🤝 Express Interest
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Express Interest</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Which artifacts from the listing do you want? */}
        <div>
          <label className="block text-xs font-semibold text-[var(--green)] mb-2">
            Which artifacts are you interested in? <span className="text-[var(--red)]">*</span>
          </label>
          {offeringArtifacts.length === 0 ? (
            <p className="text-xs text-[var(--text-dim)]">No offering artifacts listed.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {offeringArtifacts.map((la) => {
                const selected = wantedIds.includes(la.artifact.id);
                return (
                  <button
                    key={la.artifact.id}
                    type="button"
                    onClick={() => toggleWanted(la.artifact.id)}
                    className={`rounded-lg border p-2.5 text-left transition ${
                      selected
                        ? "border-[var(--green)] bg-[var(--green-bg)] ring-1 ring-[var(--green)]"
                        : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{categoryEmojis[la.artifact.category as ArtifactCategory]}</span>
                        <span className="text-xs font-medium text-[var(--text)]">{la.artifact.category}</span>
                      </div>
                      {selected && <span className="text-[var(--green)] text-xs">✓</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                      +{la.artifact.bonusPct}% · Lv.{la.artifact.level}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: What do you offer in return? (only for TRADE listings) */}
        {priceType === "TRADE" && (
          <div>
            <label className="block text-xs font-semibold text-[var(--amber)] mb-2">
              What do you offer in return? <span className="text-[var(--text-dim)] font-normal">(optional)</span>
            </label>
            {loadingArtifacts ? (
              <p className="text-xs text-[var(--text-dim)]">Loading your artifacts…</p>
            ) : playerArtifacts.length === 0 ? (
              <p className="text-xs text-[var(--text-dim)]">You have no artifacts to offer.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {playerArtifacts.map((art) => {
                  const selected = myOfferingIds.includes(art.id);
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => toggleMyOffering(art.id)}
                      className={`rounded-lg border p-2.5 text-left transition ${
                        selected
                          ? "border-[var(--amber)] bg-[var(--amber-bg)] ring-1 ring-[var(--amber)]"
                          : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{categoryEmojis[art.category]}</span>
                          <span className="text-xs font-medium text-[var(--text)]">{art.category}</span>
                        </div>
                        {selected && <span className="text-[var(--amber)] text-xs">✓</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        +{art.bonusPct}% · Lv.{art.level}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Message to the lister <span className="text-[var(--text-dim)]">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Add any notes or questions…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text)] text-sm placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || wantedIds.length === 0}
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send Interest"}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setError(null); setWantedIds([]); setMyOfferingIds([]); }}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--border-hover)] transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
