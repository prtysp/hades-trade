"use client";

import { useState, useEffect } from "react";
import { ArtifactCategory } from "@prisma/client";
import { useArtifactContext, type ArtifactItem } from "@/components/ArtifactContext";

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "⚔️",
  TRANSPORT: "🚀",
  MINING: "⛏️",
  DRONE: "🤖",
  WEAPON: "🔫",
  SHIELD: "🛡️",
};

const allCategories: ArtifactCategory[] = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];

interface PreferenceThreshold {
  category: ArtifactCategory;
  minBonusPct: number;
  minLevel: number;
}

const DONATION_PRESETS = [1000, 10000, 50000, 100000];

function DonationInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const currentTotal = parseInt(value) || 0;

  const addPreset = (amount: number) => {
    const newTotal = currentTotal + amount;
    onChange(String(newTotal));
  };

  const removePreset = (amount: number) => {
    const newTotal = Math.max(0, currentTotal - amount);
    onChange(newTotal > 0 ? String(newTotal) : "");
  };

  const formatCredits = (n: number) => {
    if (n >= 1000) return `${n / 1000}K`;
    return String(n);
  };

  // Count how many of each preset fit into the current total
  const getPresetCount = (amount: number) => {
    if (currentTotal <= 0) return 0;
    return Math.floor(currentTotal / amount);
  };

  return (
    <div className="mt-2 space-y-2.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">Suggested Donation</label>

      {/* Running total */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5">
        <span className="text-xs text-[var(--text-muted)]">Total</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${currentTotal > 0 ? "text-[var(--amber)]" : "text-[var(--text-dim)]"}`}>
            {currentTotal > 0 ? currentTotal.toLocaleString() : "0"}
            <span className="text-[var(--text-muted)] ml-1 text-xs">credits</span>
          </span>
          {currentTotal > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-[var(--text-dim)] hover:text-[var(--red)] transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Preset chips — additive */}
      <div className="grid grid-cols-4 gap-1.5">
        {DONATION_PRESETS.map((amount) => {
          const count = getPresetCount(amount);
          const isActive = count > 0;
          return (
            <div key={amount} className="relative">
              <button
                type="button"
                onClick={() => addPreset(amount)}
                className={`w-full rounded-lg border px-2 py-2.5 text-xs font-medium transition flex flex-col items-center gap-0.5 ${
                  isActive
                    ? "border-[var(--amber)] bg-[var(--amber-bg)] text-[var(--amber)]"
                    : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >
                <span className="text-sm leading-none">+{formatCredits(amount)}</span>
                {isActive && (
                  <span className="text-[10px] leading-none opacity-70">×{count}</span>
                )}
              </button>
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePreset(amount); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center shadow hover:brightness-110 transition"
                >
                  −
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--text-muted)] shrink-0">Custom:</span>
        <input
          type="number"
          min={0}
          step={100}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 25000"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
        />
        <span className="text-xs text-[var(--text-muted)] shrink-0">credits</span>
      </div>
    </div>
  );
}

export default function CreateListingForm() {
  const { artifacts, playerId } = useArtifactContext();
  const [preference, setPreference] = useState<PreferenceThreshold[]>([]);
  const [description, setDescription] = useState("");
  const [offering, setOffering] = useState<string[]>([]);
  const [wanting, setWanting] = useState<string[]>([]);
  const [priceType, setPriceType] = useState<"FREE" | "DONATION" | "TRADE">("FREE");
  const [donationAmount, setDonationAmount] = useState("");
  const [usePrefForTrade, setUsePrefForTrade] = useState<boolean | null>(null);

  const [expiresInDays, setExpiresInDays] = useState(1);
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [expiresInMinutes, setExpiresInMinutes] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/preferences?playerId=${playerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.categoryThresholds) {
          setPreference(data.categoryThresholds);
        }
      })
      .catch(console.error);
  }, [playerId]);

  const toggleOffering = (id: string) => {
    setOffering((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const toggleWanting = (id: string) => {
    setWanting((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const handlePriceTypeChange = (type: "FREE" | "DONATION" | "TRADE") => {
    setPriceType(type);
    if (type !== "TRADE") {
      setWanting([]);
      setUsePrefForTrade(null);
    } else if (preference.length > 0 && usePrefForTrade === null) {
      setUsePrefForTrade(true);
    }
  };

  // Build wanting list from preference thresholds — creates virtual "wanted" entries
  const applyPreferenceToWanting = () => {
    // For each preference threshold, find matching artifacts from player's inventory
    const wantedIds: string[] = [];
    for (const pref of preference) {
      const match = artifacts.find(
        (art) => art.category === pref.category && art.bonusPct >= pref.minBonusPct && art.level >= pref.minLevel
      );
      if (match) wantedIds.push(match.id);
    }
    setWanting(wantedIds);
  };

  const totalMinutes = expiresInDays * 24 * 60 + expiresInHours * 60 + expiresInMinutes;

  const formatExpiration = () => {
    if (totalMinutes <= 0) return "Invalid";
    const d = Math.floor(totalMinutes / (24 * 60));
    const h = Math.floor((totalMinutes % (24 * 60)) / 60);
    const m = totalMinutes % 60;
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offering.length === 0) {
      setError("You must select at least one artifact to offer");
      return;
    }
    if (totalMinutes <= 0) {
      setError("Expiration must be at least 1 minute");
      return;
    }
    if (priceType === "TRADE" && wanting.length === 0) {
      setError("You must specify at least one artifact you want in a trade");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          playerId,
          offering,
          wanting: priceType === "TRADE" ? wanting : [],
          priceType,
          donationAmount: priceType === "DONATION" ? donationAmount : undefined,
          expiresInDays: totalMinutes / (24 * 60),
        }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to create listing";
        try { const data = await res.json(); errorMsg = data.error ?? errorMsg; } catch { /* empty */ }
        throw new Error(errorMsg);
      }

      const newListing = await res.json();
      window.location.href = `/listings/${newListing.id}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // For trade: get the categories from preferences
  const tradeCategories = preference.length > 0
    ? preference.map((p) => p.category)
    : allCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Price type */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Trade Type</label>
        <div className="flex flex-wrap gap-2">
          {(["FREE", "DONATION", "TRADE"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handlePriceTypeChange(type)}
              className={`rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium transition ${
                priceType === type
                  ? type === "FREE" ? "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green)]"
                    : type === "DONATION" ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--amber)]"
                    : "border-[var(--blue)] bg-[var(--blue-bg)] text-[var(--blue)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
              }`}
            >
              {type === "FREE" ? "🆓 Free" : type === "DONATION" ? "💰 Corp Donation" : "🔄 Trade"}
            </button>
          ))}
        </div>
        {priceType === "DONATION" && (
          <DonationInput
            value={donationAmount}
            onChange={setDonationAmount}
          />
        )}
      </div>

      {/* Expiration */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Expiration</label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Days</label>
            <input type="number" min={0} max={365} value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Hours</label>
            <input type="number" min={0} max={23} value={expiresInHours}
              onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Minutes</label>
            <input type="number" min={0} max={59} value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none" />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-dim)]">
          Auto-archives after <span className="text-[var(--amber)] font-medium">{formatExpiration()}</span>
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Description <span className="text-[var(--text-dim)] font-normal">(optional)</span>
        </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          placeholder="Add any notes about this trade…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none" />
      </div>

      {/* Offering — always required */}
      <div>
        <label className="block text-sm font-medium text-[var(--green)] mb-2">
          Artifacts You&apos;re Offering <span className="text-[var(--red)]">*</span>
        </label>
        {artifacts.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No artifacts to offer. Add some to your inventory first.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {artifacts.map((art) => {
                const selected = offering.includes(art.id);
                return (
                  <button key={art.id} type="button" onClick={() => toggleOffering(art.id)}
                    className={`rounded-lg border p-2.5 text-left transition ${
                      selected ? "border-[var(--green)] bg-[var(--green-bg)] ring-1 ring-[var(--green)]" : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{categoryEmojis[art.category]}</span>
                        <span className="text-xs font-medium text-[var(--text)]">{art.category}</span>
                      </div>
                      {selected && <span className="text-[var(--green)] text-xs">✓</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-muted)]">+{art.bonusPct}% · Lv.{art.level}</div>
                  </button>
                );
              })}
            </div>
            {offering.length > 0 && <p className="mt-1.5 text-xs text-[var(--text-dim)]">{offering.length} selected</p>}
          </>
        )}
      </div>

      {/* Trade: wanted artifacts — only for TRADE type */}
      {priceType === "TRADE" && (
        <div className="rounded-lg border border-[var(--blue)]/30 bg-[var(--blue-bg)] p-3 sm:p-4">
          <h3 className="text-sm font-medium text-[var(--blue)] mb-2">🔄 What do you want in exchange?</h3>

          {preference.length > 0 && usePrefForTrade === null && (
            <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <p className="text-xs text-[var(--text)] mb-2">Use your trade preferences as a starting point?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setUsePrefForTrade(true); applyPreferenceToWanting(); }}
                  className="rounded-lg border border-[var(--blue)] bg-[var(--blue-bg)] px-3 py-1.5 text-xs font-medium text-[var(--blue)] hover:bg-[var(--blue-bg)] transition">
                  Yes, use preferences
                </button>
                <button type="button" onClick={() => setUsePrefForTrade(false)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--border-hover)] transition">
                  No, choose manually
                </button>
              </div>
            </div>
          )}

          {(usePrefForTrade === false || preference.length === 0) && (
            <>
              <p className="text-xs text-[var(--text-muted)] mb-2">Select categories you want (any bonus/level):</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allCategories.map((cat) => {
                  const selected = wanting.some((id) => artifacts.find((a) => a.id === id)?.category === cat);
                  return (
                    <button key={cat} type="button"
                      onClick={() => {
                        // Toggle: if any artifact of this category is in wanting, remove all of this category; otherwise add first match
                        const existing = wanting.filter((id) => artifacts.find((a) => a.id === id)?.category === cat);
                        if (existing.length > 0) {
                          setWanting((prev) => prev.filter((id) => !existing.includes(id)));
                        } else {
                          const match = artifacts.find((a) => a.category === cat);
                          if (match) setWanting((prev) => [...prev, match.id]);
                        }
                      }}
                      className={`rounded-lg border p-2.5 text-left transition ${
                        selected ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent-text)]" : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"
                      }`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{categoryEmojis[cat]}</span>
                        <span className="text-xs font-medium text-[var(--text)]">{cat}</span>
                      </div>
                      {selected && <span className="text-xs text-[var(--amber)] mt-0.5 block">✓ Selected</span>}
                    </button>
                  );
                })}
              </div>
              {wanting.length > 0 && <p className="mt-1.5 text-xs text-[var(--text-dim)]">{wanting.length} category{wanting.length > 1 ? "s" : ""} wanted</p>}
            </>
          )}

          {usePrefForTrade === true && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[var(--text-muted)]">Based on your preferences:</p>
                <button type="button" onClick={() => setUsePrefForTrade(false)}
                  className="text-xs text-[var(--blue)] hover:text-[var(--blue)] transition">Edit manually</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {preference.map((pref) => {
                  const match = artifacts.find(
                    (a) => a.category === pref.category && a.bonusPct >= pref.minBonusPct && a.level >= pref.minLevel
                  );
                  const selected = match ? wanting.includes(match.id) : false;
                  return (
                    <button key={pref.category} type="button"
                      onClick={() => {
                        if (!match) return;
                        toggleWanting(match.id);
                      }}
                      disabled={!match}
                      className={`rounded-lg border p-2.5 text-left transition ${
                        !match ? "border-[var(--border)]/50 bg-[var(--bg-card)] opacity-40 cursor-not-allowed"
                        : selected ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent-text)]"
                        : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"
                      }`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{categoryEmojis[pref.category]}</span>
                        <span className="text-xs font-medium text-[var(--text)]">{pref.category}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {match ? `+${match.bonusPct}% Lv.${match.level}` : "No match"}
                      </div>
                      {selected && <span className="text-xs text-[var(--amber)]">✓</span>}
                    </button>
                  );
                })}
              </div>
              {wanting.length > 0 && <p className="mt-1.5 text-xs text-[var(--text-dim)]">{wanting.length} wanted</p>}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}

      <button type="submit" disabled={saving || offering.length === 0}
        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50">
        {saving ? "Creating…" : "Create Listing"}
      </button>
    </form>
  );
}
