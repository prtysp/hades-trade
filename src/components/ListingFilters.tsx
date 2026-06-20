"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const categories = ["ALL", "COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"];
const types = [
  { value: "ALL", label: "All Types" },
  { value: "FREE", label: "🆓 Free" },
  { value: "DONATION", label: "💰 Donation" },
  { value: "TRADE", label: "🔄 Trade" },
];
const bonusOptions = [
  { value: "", label: "Any Bonus" },
  { value: "200", label: "200%+" },
  { value: "250", label: "250%+" },
  { value: "280", label: "280%+" },
  { value: "300", label: "300%+" },
  { value: "320", label: "320%+" },
];
const levelOptions = [
  { value: "", label: "Any Level" },
  { value: "5", label: "L5+" },
  { value: "8", label: "L8+" },
  { value: "10", label: "L10+" },
  { value: "12", label: "L12" },
];

export default function ListingFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const newParams = new URLSearchParams(params.toString());
      if (value && value !== "ALL") {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      router.push(`/?${newParams.toString()}`);
    },
    [params, router]
  );

  const currentType = params.get("type") || "ALL";
  const currentCategory = params.get("category") || "ALL";
  const currentMinBonus = params.get("minBonus") || "";
  const currentMinLevel = params.get("minLevel") || "";

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Type filter */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
          <select
            value={currentType}
            onChange={(e) => updateParam("type", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
          <select
            value={currentCategory}
            onChange={(e) => updateParam("category", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>

        {/* Min Bonus filter */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Min Bonus</label>
          <select
            value={currentMinBonus}
            onChange={(e) => updateParam("minBonus", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
          >
            {bonusOptions.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Min Level filter */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Min Level</label>
          <select
            value={currentMinLevel}
            onChange={(e) => updateParam("minLevel", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-[var(--text)] text-sm focus:border-[var(--border-focus)] focus:outline-none"
          >
            {levelOptions.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
