"use client";

import { useState, useEffect, useRef } from "react";
import { ArtifactCategory } from "@prisma/client";
import { categoryStyles, categoryEmojis } from "@/lib/artifact-styles";
import { useArtifactContext, type ArtifactItem } from "@/components/ArtifactContext";

const allCategories: ArtifactCategory[] = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];

interface PreferenceThreshold {
  category: ArtifactCategory;
  minBonusPct: number;
  minLevel: number;
}

// ─── Shared stepper component ───
function StepperInput({
  value, onChange, min, max, label, suffix,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number;
  label: string; suffix?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="flex items-center gap-0">
        <button type="button" onClick={() => onChange(clamp(value - 1))} disabled={value <= min}
          className="h-9 w-9 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">−</button>
        <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center px-2">
          <span className="text-sm font-medium text-[var(--text)] tabular-nums">{value}{suffix && <span className="text-[var(--text-muted)] ml-0.5">{suffix}</span>}</span>
        </div>
        <button type="button" onClick={() => onChange(clamp(value + 1))} disabled={value >= max}
          className="h-9 w-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+</button>
      </div>
    </div>
  );
}

// ─── Bonus-style stepper with ±1, ±10 and editable center ───
function BonusStepperInput({
  value, onChange, min, max, label, suffix,
}: {
  value: number; onChange: (v: number) => void; min: number; max: number;
  label: string; suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(String(value)); }, [value]);
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
            <input ref={inputRef} type="number" step={1} min={min} max={max} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={applyDraft}
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

// ─── Donation input with stepper-style buttons ───
function DonationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const currentTotal = parseInt(value) || 0;
  const clamp = (v: number) => Math.max(0, v);
  const formatCredits = (n: number) => n >= 1000000 ? `${n / 1000000}M` : n >= 1000 ? `${n / 1000}K` : String(n);
  const STEPS = [
    { label: "+10K", amount: 10000 },
    { label: "+50K", amount: 50000 },
    { label: "+100K", amount: 100000 },
    { label: "+1M", amount: 1000000 },
  ];

  return (
    <div className="mt-2 space-y-2.5">
      <label className="block text-xs font-medium text-[var(--text-muted)]">Suggested Donation</label>
      {/* Total display with stepper buttons */}
      <div className="flex items-center gap-0">
        <button type="button" onClick={() => onChange(String(clamp(currentTotal - 10000)))} disabled={currentTotal < 10000}
          className="h-9 w-10 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">−10K</button>
        <button type="button" onClick={() => onChange(String(clamp(currentTotal - 1000)))} disabled={currentTotal < 1000}
          className="h-9 w-9 border-y border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">−1K</button>
        <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center px-2">
          <span className={`text-sm font-semibold tabular-nums ${currentTotal > 0 ? "text-[var(--amber)]" : "text-[var(--text-dim)]"}`}>
            {currentTotal > 0 ? currentTotal.toLocaleString() : "0"}
          </span>
        </div>
        <button type="button" onClick={() => onChange(String(clamp(currentTotal + 1000)))} disabled={currentTotal > 999999000}
          className="h-9 w-9 border-y border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] transition disabled:opacity-25 disabled:cursor-not-allowed">+1K</button>
        <button type="button" onClick={() => onChange(String(clamp(currentTotal + 10000)))} disabled={currentTotal > 999990000}
          className="h-9 w-10 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+10K</button>
      </div>
      {/* Preset quick-add buttons */}
      <div className="flex items-center gap-1">
        {STEPS.map(({ label, amount }) => (
          <button key={amount} type="button" onClick={() => onChange(String(clamp(currentTotal + amount)))}
            className="h-8 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition">
            {label}
          </button>
        ))}
      </div>
      {currentTotal > 0 && (
        <button type="button" onClick={() => onChange("")} className="text-xs text-[var(--text-dim)] hover:text-[var(--red)] transition">Clear</button>
      )}
    </div>
  );
}

// ─── Expiration input with stepper-style buttons ───
function ExpirationInput({
  days, hours, minutes, onChange,
}: {
  days: number; hours: number; minutes: number;
  onChange: (d: number, h: number, m: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text)] mb-2">Expiration</label>
      <div className="space-y-2">
        {/* Days */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-12 shrink-0">Days</span>
          <div className="flex items-center gap-0 flex-1">
            <button type="button" onClick={() => onChange(Math.max(0, days - 1), hours, minutes)} disabled={days < 1}
              className="h-9 w-9 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">−</button>
            <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center px-2">
              <span className="text-sm font-medium text-[var(--text)] tabular-nums">{days}</span>
            </div>
            <button type="button" onClick={() => onChange(Math.min(365, days + 1), hours, minutes)} disabled={days >= 365}
              className="h-9 w-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+</button>
          </div>
          <button type="button" onClick={() => onChange(days + 1, hours, minutes)} disabled={days >= 365}
            className="h-9 w-10 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+1d</button>
        </div>
        {/* Hours */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-12 shrink-0">Hours</span>
          <div className="flex items-center gap-0 flex-1">
            <button type="button" onClick={() => onChange(days, Math.max(0, hours - 1), minutes)} disabled={hours < 1}
              className="h-9 w-9 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">−</button>
            <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center px-2">
              <span className="text-sm font-medium text-[var(--text)] tabular-nums">{hours}</span>
            </div>
            <button type="button" onClick={() => onChange(days, Math.min(23, hours + 1), minutes)} disabled={hours >= 23}
              className="h-9 w-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+</button>
          </div>
          <button type="button" onClick={() => onChange(days, hours + 1, minutes)} disabled={hours >= 23}
            className="h-9 w-10 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+1h</button>
        </div>
        {/* Minutes */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-12 shrink-0">Minutes</span>
          <div className="flex items-center gap-0 flex-1">
            <button type="button" onClick={() => onChange(days, hours, Math.max(0, minutes - 1))} disabled={minutes < 1}
              className="h-9 w-9 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">−</button>
            <div className="h-9 flex-1 min-w-0 border-y border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center px-2">
              <span className="text-sm font-medium text-[var(--text)] tabular-nums">{minutes}</span>
            </div>
            <button type="button" onClick={() => onChange(days, hours, Math.min(59, minutes + 1))} disabled={minutes >= 59}
              className="h-9 w-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text)] text-sm font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+</button>
          </div>
          <button type="button" onClick={() => onChange(days, hours, minutes + 1)} disabled={minutes >= 59}
            className="h-9 w-10 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] text-xs font-medium flex items-center justify-center hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition disabled:opacity-25 disabled:cursor-not-allowed">+1m</button>
        </div>
      </div>
    </div>
  );
}

// ─── Wanted preference card ───
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
        <BonusStepperInput label="Min Bonus %" suffix="%" value={value.minBonusPct} onChange={(v) => onChange({ ...value, minBonusPct: v })} min={0} max={500} />
        <div>
          <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1">Min Level</label>
          <div className="flex gap-1">
            {[3, 4, 5, 6, 7].map((lv) => (
              <button key={lv} type="button" onClick={() => onChange({ ...value, minLevel: lv })}
                className={`h-8 flex-1 rounded-lg border text-xs font-medium transition ${value.minLevel === lv ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]" : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--hover)] hover:text-[var(--text)]"}`}
              >{lv}</button>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            {[8, 9, 10, 11, 12].map((lv) => (
              <button key={lv} type="button" onClick={() => onChange({ ...value, minLevel: lv })}
                className={`h-8 flex-1 rounded-lg border text-xs font-medium transition ${value.minLevel === lv ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]" : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--hover)] hover:text-[var(--text)]"}`}
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

// ─── Main form ───
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
      <ExpirationInput days={expiresInDays} hours={expiresInHours} minutes={expiresInMinutes}
        onChange={(d, h, m) => { setExpiresInDays(d); setExpiresInHours(h); setExpiresInMinutes(m); }} />

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
          {wantingPrefs.length < 6 && (
            <WantedPrefAdd onAdd={(cat) => setWantingPrefs((p) => [...p, { category: cat, minBonusPct: 0, minLevel: 3 }])} />
          )}
          {preference.length > 0 && wantingPrefs.length === 0 && (
            <button type="button" onClick={() => setWantingPrefs(preference.map((p) => ({ category: p.category, minBonusPct: p.minBonusPct, minLevel: p.minLevel })))}
              className="w-full rounded-lg border border-[var(--blue)] bg-[var(--blue-bg)] px-3 py-2 text-xs font-medium text-[var(--blue)] hover:brightness-110 transition"
            >📋 Use my trade preferences ({preference.length} categor{preference.length > 1 ? "ies" : "y"})</button>
          )}
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
