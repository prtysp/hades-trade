"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { categoryEmojis } from "@/lib/artifact-styles";
import * as Slider from "@radix-ui/react-slider";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X, Check } from "lucide-react";

const ALL_CATEGORIES = ["COMBAT", "TRANSPORT", "MINING", "DRONE", "WEAPON", "SHIELD"] as const;
const ALL_TYPES = [
  { value: "FREE", label: "🆓 Free" },
  { value: "DONATION", label: "💰 Donation" },
  { value: "TRADE", label: "🔄 Trade" },
] as const;

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  emojiMap,
}: {
  label: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  emojiMap?: Record<string, string>;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-input)] !bg-[var(--bg-input)] px-2.5 py-1.5 text-sm text-[var(--text)] hover:border-[var(--border-hover)] transition"
        >
          <span className="truncate">
            <span className="text-[var(--text-muted)] mr-1">{label}:</span>
            {displayText}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
        >
          <div className="z-[9999] w-56 rounded-lg border border-[var(--border)] shadow-xl p-1.5" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const value = typeof opt === "string" ? opt : opt.value;
              const displayLabel = typeof opt === "string" ? opt : opt.label;
              const isSelected = selected.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(value)}
                  className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                    isSelected
                      ? "bg-[var(--accent-bg)] text-[var(--accent-text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text)]"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-[var(--accent)] border-[var(--accent)]"
                        : "border-[var(--border)]"
                    }`}
                    style={!isSelected ? { backgroundColor: "var(--bg-input)" } : undefined}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  {emojiMap?.[value] && <span>{emojiMap[value]}</span>}
                  <span className="truncate">{displayLabel}</span>
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="pt-1.5 mt-1.5 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-center text-[10px] text-[var(--text-dim)] hover:text-[var(--text)] transition py-0.5"
              >
                Clear selection
              </button>
            </div>
          )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
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
        <span className="text-xs font-medium text-[var(--text)] tabular-nums">
          {formatDisplay(value)}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <Slider.Track
          className="relative grow rounded-full h-2"
          style={{ backgroundColor: "var(--border)" }}
        >
          <Slider.Range
            className="absolute rounded-full h-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
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

  const clearAll = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setMinBonus(0);
    setMinLevel(3);
  };

  const hasFilters =
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    minBonus > 0 ||
    minLevel > 3;

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">Filters</span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MultiSelectDropdown
          label="Type"
          options={ALL_TYPES as unknown as { value: string; label: string }[]}
          selected={selectedTypes}
          onChange={setSelectedTypes}
        />
        <MultiSelectDropdown
          label="Category"
          options={ALL_CATEGORIES as unknown as string[]}
          selected={selectedCategories}
          onChange={setSelectedCategories}
          emojiMap={categoryEmojis}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SliderFilter
          label="Min Bonus"
          value={minBonus}
          onChange={setMinBonus}
          min={0}
          max={500}
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
