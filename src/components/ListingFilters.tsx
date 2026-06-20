"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { categoryEmojis } from "@/lib/artifact-styles";

const ALL_CATEGORIES = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"] as const;
const ALL_TYPES = [
  { value: "FREE", label: "🆓 Free" },
  { value: "DONATION", label: "💰 Donation" },
  { value: "TRADE", label: "🔄 Trade" },
] as const;

export default function ListingFilters() {
  const router = useRouter();
  const params = useSearchParams();

  // Parse multi-value params from URL
  const parseList = (key: string): string[] => {
    const val = params.get(key);
    if (!val) return [];
    return val.split(",").filter(Boolean);
  };

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => parseList("types"));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => parseList("categories"));
  const [minBonus, setMinBonus] = useState<number>(() => parseInt(params.get("minBonus") || "0"));
  const [minLevel, setMinLevel] = useState<number>(() => parseInt(params.get("minLevel") || "3"));

  // Debounced URL update
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newParams = new URLSearchParams();

      if (selectedTypes.length > 0 && selectedTypes.length < ALL_TYPES.length) {
        newParams.set("types", selectedTypes.join(","));
      }
      if (selectedCategories.length > 0 && selectedCategories.length < ALL_CATEGORIES.length) {
        newParams.set("categories", selectedCategories.join(","));
      }
      if (minBonus > 0) {
        newParams.set("minBonus", String(minBonus));
      }
      if (minLevel > 3) {
        newParams.set("minLevel", String(minLevel));
      }

      const newUrl = `/?${newParams.toString()}`;
      const currentUrl = `/?${params.toString()}`;
      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [selectedTypes, selectedCategories, minBonus, minLevel, params, router]);

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const clearAll = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setMinBonus(0);
    setMinLevel(3);
  };

  const hasFilters = selectedTypes.length > 0 || selectedCategories.length > 0 || minBonus > 0 || minLevel > 3;

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4 space-y-3">
      {/* Clear button */}
      {hasFilters && (
        <div className="flex justify-end">
          <button type="button" onClick={clearAll}
            className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition">
            Clear all filters
          </button>
        </div>
      )}

      {/* Type filter — multi-select chips */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Trade Type</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map(({ value, label }) => {
            const selected = selectedTypes.includes(value);
            return (
              <button key={value} type="button" onClick={() => toggleType(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  selected
                    ? value === "FREE" ? "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green)]"
                      : value === "DONATION" ? "border-[var(--amber)] bg-[var(--amber-bg)] text-[var(--amber)]"
                      : "border-[var(--blue)] bg-[var(--blue-bg)] text-[var(--blue)]"
                    : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >{label}</button>
            );
          })}
        </div>
      </div>

      {/* Category filter — multi-select chips */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat);
            return (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  selected
                    ? "border-[var(--accent-text)] bg-[var(--accent-bg)] text-[var(--accent-text)]"
                    : "border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)]"
                }`}
              >
                <span>{categoryEmojis[cat]}</span>
                <span>{cat.charAt(0)}{cat.slice(1).toLowerCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Min Bonus — range slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">Min Bonus</label>
          <span className="text-xs font-medium text-[var(--text)] tabular-nums">
            {minBonus > 0 ? `${minBonus}%+` : "Any"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={minBonus}
          onChange={(e) => setMinBonus(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[var(--accent)]
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-card)]
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-[var(--bg-card)] [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-0.5">
          <span>Any</span>
          <span>500%+</span>
        </div>
      </div>

      {/* Min Level — range slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">Min Level</label>
          <span className="text-xs font-medium text-[var(--text)] tabular-nums">
            {minLevel > 3 ? `L${minLevel}+` : "Any"}
          </span>
        </div>
        <input
          type="range"
          min={3}
          max={12}
          step={1}
          value={minLevel}
          onChange={(e) => setMinLevel(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[var(--accent)]
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-card)]
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-[var(--bg-card)] [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-0.5">
          <span>L3</span>
          <span>L12</span>
        </div>
      </div>
    </div>
  );
}
