"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { categoryEmojis } from "@/lib/artifact-styles";
import * as Slider from "@radix-ui/react-slider";
import { X } from "lucide-react";

const ALL_CATEGORIES = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"] as const;
const ALL_TYPES = [
  { value: "FREE", label: "🆓 Free" },
  { value: "DONATION", label: "💰 Donation" },
  { value: "TRADE", label: "🔄 Trade" },
] as const;

const categoryColors: Record<string, string> = {
  COMBAT: "#22c55e",
  TRANSPORT: "#eab308",
  MINING: "#a855f7",
  DRONE: "#ea781e",
  WEAPON: "#ef4444",
  SHIELD: "#3b82f6",
};

function ToggleChip({
  label,
  selected,
  onClick,
  color,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
      style={{
        borderColor: selected ? (color || "var(--accent)") : "var(--border)",
        backgroundColor: selected ? (color || "var(--accent)") + "22" : "var(--bg-input)",
        color: selected ? (color || "var(--accent-text)") : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

function SliderFilter({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  formatDisplay,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  formatDisplay: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>
        <span className="text-xs font-medium text-[var(--text)] tabular-nums">{formatDisplay(value)}</span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <Slider.Track className="relative grow rounded-full h-2" style={{ backgroundColor: "var(--border)" }}>
          <Slider.Range className="absolute rounded-full h-full" style={{ backgroundColor: "var(--accent)" }} />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 rounded-full border-2 shadow-lg cursor-pointer hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          style={{ backgroundColor: "var(--accent)", borderColor: "var(--bg-card)" }}
          aria-label={label}
        />
      </Slider.Root>
      <div className="flex justify-between text-[10px] text-[var(--text-dim)] mt-0.5">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

export default function ListingFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const parseList = (key: string): string[] => {
    const val = params.get(key);
    if (!val) return [];
    return val.split(",").filter(Boolean);
  };

  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => parseList("types"));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => parseList("categories"));
  const [minBonus, setMinBonus] = useState<number>(() => parseInt(params.get("minBonus") || "0"));
  const [minLevel, setMinLevel] = useState<number>(() => parseInt(params.get("minLevel") || "3"));

  useEffect(() => {
    const timeout = setTimeout(() => {
      const newParams = new URLSearchParams();
      if (selectedTypes.length > 0 && selectedTypes.length < ALL_TYPES.length) {
        newParams.set("types", selectedTypes.join(","));
      }
      if (selectedCategories.length > 0 && selectedCategories.length < ALL_CATEGORIES.length) {
        newParams.set("categories", selectedCategories.join(","));
      }
      if (minBonus > 0) newParams.set("minBonus", String(minBonus));
      if (minLevel > 3) newParams.set("minLevel", String(minLevel));
      const newUrl = `/?${newParams.toString()}`;
      const currentUrl = `/?${params.toString()}`;
      if (newUrl !== currentUrl) router.replace(newUrl, { scroll: false });
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
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">Filters</span>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Type toggles */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Type</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map(({ value, label }) => (
            <ToggleChip key={value} label={label} selected={selectedTypes.includes(value)} onClick={() => toggleType(value)} />
          ))}
        </div>
      </div>

      {/* Category toggles */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => (
            <ToggleChip
              key={cat}
              label={`${categoryEmojis[cat]} ${cat.charAt(0)}${cat.slice(1).toLowerCase()}`}
              selected={selectedCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
              color={categoryColors[cat]}
            />
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-3">
        <SliderFilter
          label="Min Bonus"
          value={minBonus}
          onChange={setMinBonus}
          min={0}
          max={360}
          step={10}
          formatValue={(v) => `${v}%`}
          formatDisplay={(v) => (v > 0 ? `${v}%+` : "Any")}
        />
        <SliderFilter
          label="Min Level"
          value={minLevel}
          onChange={setMinLevel}
          min={3}
          max={12}
          step={1}
          formatValue={(v) => `L${v}`}
          formatDisplay={(v) => (v > 3 ? `L${v}+` : "Any")}
        />
      </div>
    </div>
  );
}
