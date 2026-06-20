"use client";

import { useState, useEffect } from "react";
import { ArtifactCategory } from "@prisma/client";
import { categoryStyles, categoryEmojis } from "@/lib/artifact-styles";
import { useArtifactContext, type ArtifactItem } from "@/components/ArtifactContext";
const allCategories: ArtifactCategory[] = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];

interface PreferenceThreshold {
  category: ArtifactCategory;
  minBonusPct: number;
  minLevel: number;
}

const DONATION_PRESETS = [1000, 10000, 50000, 100000];

function DonationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const currentTotal = parseInt(value) || 0;
  const addPreset = (amount: number) => onChange(String(currentTotal + amount));
  const removePreset = (amount: number) => onChange(Math.max(0, currentTotal - amount) > 0 ? String(Math.max(0, currentTotal - amount)) : "");
  const formatCredits = (n: number) => n >= 1000 ? `${n / 1000}K` : String(n);
  const getPresetCount = (amount: number) => currentTotal > 0 ? Math.floor(currentTotal / amount) : 0;

  return (
    <div className="mt-2 space-y-2.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">Suggested Donation</label>
      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5">
        <span className="text-xs text-[var(--text-muted)]">Total</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tabular-nums ${currentTotal > 0 ? "text-[var(--amber)]" : "text-[var(--text-dim)]"}`}>
            {currentTotal > 0 ? currentTotal.toLocaleString() : "0"}<span className="text-[var(--text-muted)] ml-1 text-xs">credits</span>
          </span>
          {currentTotal > 0 && <button type="button" onClick={() => onChange("")} className="text-xs text-[var(--text-dim)] hover:text-[var(--red)] transition">Clear</button>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {DONATION_PRESETS.map((amount) => {
          const count = getPresetCount(amount);
          return (
            <div key={amount} className="relative">
              <button type="button" onClick={() => addPreset(amount)}
                className={`w-full rounded-lg border px-2 py-2.5 text-xs font-medium transition flex flex-col items-center gap-0.5 ${count > 0 ? "border-[var(--amber)] bg-[var(--amber-bg)] text-[var(--amber)]" : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"}`}
              ><span className="text-sm leading-none">+{formatCredits(amount)}</span>{count > 0 && <span className="text-[10px] leading-none opacity-70">×{count}</span>}</button>
              {count > 0 && <button type="button" onClick={(e) => { e.stopPropagation(); removePreset(amount); }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center shadow hover:brightness-110 transition">−</button>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--text-muted)] shrink-0">Custom:</span>
        <input type="number" min={0} step={100} value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. 25000"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none" />
        <span className="text-xs text-[var(--text-muted)] shrink-0">credits</span>
      </div>
    </div>
  );
}

function WantedPrefCard({ value, onChange, onRemove }: {
  value: { category: ArtifactCategory; minBonusPct: number; minLevel: number };
  onChange: (v: { category: ArtifactCategory; minBonusPct: number; minLevel: number }) => void;
  onRemove: () => void;
}) {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const cat = value.category;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{categoryEmojis[cat]}</span>
          <span className="text-xs font-medium text-[var(--text)]">{cat.charAt(0)}{cat.slice(1).toLowerCase()}</span>
        </div>
        <button type="button" onClick={onRemove} className="text-xs text-[var(--text-dim)] hover:text-[var(--red)] transition">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Min Bonus %</label>
          <div className="flex items-center gap-0">
            <button type="button" onClick={() => onChange({ ...value, minBonusPct: clamp(value.minBonusPct - 10, 0, 500) })} disabled={value.minBonusPct < 10}
              className="h-8 w-8 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">−10</button>
            <button type="button" onClick={() => onChange({ ...value, minBonusPct: clamp(value.minBonusPct - 1, 0, 500) })} disabled={value.minBonusPct < 1}
              className="h-8 w-7 border-y border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">−1</button>
            <div className="h-8 flex-1 border-y border-[var(--border)] bg-[var(--bg-input)] flex items-center justify-center">
              <span className="text-xs font-medium text-[var(--text)] tabular-nums">{value.minBonusPct}<span className="text-[var(--text-muted)] ml-0.5">%</span></span>
            </div>
            <button type="button" onClick={() => onChange({ ...value, minBonusPct: clamp(value.minBonusPct + 1, 0, 500) })} disabled={value.minBonusPct > 499}
              className="h-8 w-7 border-y border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">+1</button>
            <button type="button" onClick={() => onChange({ ...value, minBonusPct: clamp(value.minBonusPct + 10, 0, 500) })} disabled={value.minBonusPct > 490}
              className="h-8 w-8 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+10</button>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Min Level</label>
          <div className="flex gap-1">
            {[3, 4, 5, 6, 7].map((lv) => (
              <button key={lv} type="button" onClick={() => onChange({ ...value, minLevel: lv })}
                className={`h-8 flex-1 rounded-lg border text-xs font-medium transition ${value.minLevel === lv ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]" : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"}`}
              >{lv}</button>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {[8, 9, 10, 11, 12].map((lv) => (
              <button key={lv} type="button" onClick={() => onChange({ ...value, minLevel: lv })}
                className={`h-8 flex-1 rounded-lg border text-xs font-medium transition ${value.minLevel === lv ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]" : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"}`}
              >{lv}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WantedPrefAdd({ onAdd }: { onAdd: (cat: ArtifactCategory) => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
      >+ Add wanted category</button>
    );
  }
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Select category</label>
      <div className="grid grid-cols-3 gap-1.5">
        {allCategories.map((cat) => (
          <button key={cat} type="button" onClick={() => { onAdd(cat); setOpen(false); }}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
          ><span>{categoryEmojis[cat]}</span><span>{cat.charAt(0)}{cat.slice(1).toLowerCase()}</span></button>
        ))}
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
  const [wantingPrefs, setWantingPrefs] = useState<{ category: ArtifactCategory; minBonusPct: number; minLevel: number }[]>([]);
  const [priceType, setPriceType] = useState<"FREE" | "DONATION" | "TRADE">("FREE");
  const [donationAmount, setDonationAmount] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(1);
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [expiresInMinutes, setExpiresInMinutes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/preferences?playerId=${playerId}`).then((r) => r.json()).then((d) => { if (d?.categoryThresholds) setPreference(d.categoryThresholds); }).catch(console.error);
  }, [playerId]);

  const toggleOffering = (id: string) => setOffering((p) => p.includes(id) ? p.filter((a) => a !== id) : [...p, id]);
  const toggleWanting = (id: string) => setWanting((p) => p.includes(id) ? p.filter((a) => a !== id) : [...p, id]);

  const totalMinutes = expiresInDays * 24 * 60 + expiresInHours * 60 + expiresInMinutes;
  const formatExpiration = () => {
    if (totalMinutes <= 0) return "Invalid";
    const d = Math.floor(totalMinutes / (24 * 60));
    const h = Math.floor((totalMinutes % (24 * 60)) / 60);
    const m = totalMinutes % 60;
    return [d > 0 && `${d}d`, h > 0 && `${h}h`, m > 0 && `${m}m`].filter(Boolean).join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offering.length === 0) { setError("You must select at least one artifact to offer"); return; }
    if (totalMinutes <= 0) { setError("Expiration must be at least 1 minute"); return; }
    if (priceType === "TRADE" && wanting.length === 0 && wantingPrefs.length === 0) { setError("You must specify at least one artifact or preference you want in a trade"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description, playerId, offering,
          wanting: priceType === "TRADE" ? wanting : [],
          wantingPrefs: priceType === "TRADE" ? wantingPrefs : [],
          priceType,
          donationAmount: priceType === "DONATION" ? donationAmount : undefined,
          expiresInDays: totalMinutes / (24 * 60),
        }),
      });
      if (!res.ok) { let msg = "Failed to create listing"; try { const d = await res.json(); msg = d.error ?? msg; } catch {/**/} throw new Error(msg); }
      const newListing = await res.json();
      window.location.href = `/listings/${newListing.id}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Price type */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Trade Type</label>
        <div className="flex flex-wrap gap-2">
          {(["FREE", "DONATION", "TRADE"] as const).map((type) => (
            <button key={type} type="button" onClick={() => { setPriceType(type); if (type !== "TRADE") { setWanting([]); setWantingPrefs([]); } }}
              className={`rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium transition ${priceType === type ? (type === "FREE" ? "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green)]" : type === "DONATION" ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--amber)]" : "border-[var(--blue)] bg-[var(--blue-bg)] text-[var(--blue)]") : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"}`}
            >{type === "FREE" ? "🆓 Free" : type === "DONATION" ? "💰 Corp Donation" : "🔄 Trade"}</button>
          ))}
        </div>
        {priceType === "DONATION" && <DonationInput value={donationAmount} onChange={setDonationAmount} />}
      </div>

      {/* Expiration */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Expiration</label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Days</label><input type="number" min={0} max={365} value={expiresInDays} onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none" /></div>
          <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Hours</label><input type="number" min={0} max={23} value={expiresInHours} onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none" /></div>
          <div><label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Minutes</label><input type="number" min={0} max={59} value={expiresInMinutes} onChange={(e) => setExpiresInMinutes(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-2 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none" /></div>
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-dim)]">Auto-archives after <span className="text-[var(--amber)] font-medium">{formatExpiration()}</span></p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">Description <span className="text-[var(--text-dim)] font-normal">(optional)</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Add any notes about this trade…" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none" />
      </div>

      {/* Offering */}
      <div>
        <label className="block text-sm font-medium text-[var(--green)] mb-2">Artifacts You&apos;re Offering <span className="text-[var(--red)]">*</span></label>
        {artifacts.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">No artifacts to offer. Add some to your inventory first.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {artifacts.map((art) => {
                const selected = offering.includes(art.id);
                return (
                  <button key={art.id} type="button" onClick={() => toggleOffering(art.id)}
                    className={`rounded-lg border p-2.5 text-left transition ${selected ? "border-[var(--green)] bg-[var(--green-bg)] ring-1 ring-[var(--green)]" : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><span className="text-sm">{categoryEmojis[art.category]}</span><span className="text-xs font-medium text-[var(--text)]">{art.category}</span></div>
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

      {/* Trade: wanted */}
      {priceType === "TRADE" && (
        <div className="rounded-lg border border-[var(--blue)]/30 bg-[var(--blue-bg)] p-3 sm:p-4 space-y-3">
          <h3 className="text-sm font-medium text-[var(--blue)]">🔄 What do you want in exchange?</h3>

          {/* Wanted preference cards */}
          {wantingPrefs.length > 0 && (
            <div className="space-y-2">
              {wantingPrefs.map((wp, i) => (
                <WantedPrefCard key={i} value={wp}
                  onChange={(v) => setWantingPrefs((p) => { const n = [...p]; n[i] = v; return n; })}
                  onRemove={() => setWantingPrefs((p) => p.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          )}

          {/* Add wanted pref */}
          {wantingPrefs.length < 6 && (
            <WantedPrefAdd onAdd={(cat) => setWantingPrefs((p) => [...p, { category: cat, minBonusPct: 0, minLevel: 3 }])} />
          )}

          {/* Use preferences shortcut */}
          {preference.length > 0 && wantingPrefs.length === 0 && (
            <button type="button" onClick={() => setWantingPrefs(preference.map((p) => ({ category: p.category, minBonusPct: p.minBonusPct, minLevel: p.minLevel })))}
              className="w-full rounded-lg border border-[var(--blue)] bg-[var(--blue-bg)] px-3 py-2 text-xs font-medium text-[var(--blue)] hover:brightness-110 transition"
            >📋 Use my trade preferences ({preference.length} categor{preference.length > 1 ? "ies" : "y"})</button>
          )}

          {/* Manual inventory selection */}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">Or select specific artifacts from your inventory:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allCategories.map((cat) => {
                const selected = wanting.some((id) => artifacts.find((a) => a.id === id)?.category === cat);
                return (
                  <button key={cat} type="button"
                    onClick={() => {
                      const existing = wanting.filter((id) => artifacts.find((a) => a.id === id)?.category === cat);
                      if (existing.length > 0) setWanting((p) => p.filter((id) => !existing.includes(id)));
                      else { const match = artifacts.find((a) => a.category === cat); if (match) setWanting((p) => [...p, match.id]); }
                    }}
                    className={`rounded-lg border p-2.5 text-left transition ${selected ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent-text)]" : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"}`}
                  >
                    <div className="flex items-center gap-1.5"><span className="text-sm">{categoryEmojis[cat]}</span><span className="text-xs font-medium text-[var(--text)]">{cat}</span></div>
                    {selected && <span className="text-xs text-[var(--amber)] mt-0.5 block">✓ Selected</span>}
                  </button>
                );
              })}
            </div>
            {wanting.length > 0 && <p className="mt-1.5 text-xs text-[var(--text-dim)]">{wanting.length} selected</p>}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}

      <button type="submit" disabled={saving || offering.length === 0}
        className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >{saving ? "Creating…" : "Create Listing"}</button>
    </form>
  );
}
