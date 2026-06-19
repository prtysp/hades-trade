"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { themes, Theme, fontOptions, FontId } from "@/lib/themes";
import { useTheme } from "./ThemeProvider";

const themeList = Object.values(themes);

function ThemePreview({ theme, selected, onSelect }: { theme: Theme; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border-2 p-3 sm:p-4 text-left transition ${
        selected
          ? "border-amber-400 ring-2 ring-amber-400/30"
          : "border-[var(--border)] hover:border-[var(--border-hover)]"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-3 w-3 rounded-full ${theme.accent}`} />
        <span className="font-medium text-[var(--text)] text-sm">{theme.name}</span>
        <span className="text-xs text-[var(--text-dim)] ml-auto">{theme.kind}</span>
      </div>
      <div className={`rounded-lg ${theme.bgCard} border ${theme.border} p-2`}>
        <div className={`h-1.5 w-12 rounded ${theme.accent} mb-1.5`} />
        <div className={`h-1 w-20 rounded ${theme.textMuted} opacity-40 mb-1`} />
        <div className={`h-1 w-16 rounded ${theme.textMuted} opacity-30`} />
      </div>
    </button>
  );
}

export default function ThemeSelector({ currentTheme, playerId }: { currentTheme: string; playerId: string }) {
  const { themeId, fontId, setThemeId, setFontId } = useTheme();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const activeTheme = themeId || currentTheme || "dracula";

  const handleThemeSelect = async (newThemeId: string) => {
    setThemeId(newThemeId);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: newThemeId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save theme");
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleFontSelect = async (font: FontId) => {
    setFontId(font);
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fontId: font }),
      });
      router.refresh();
    } catch {
      // non-critical, localStorage already updated
    }
  };

  const darkThemes = themeList.filter((t) => t.kind === "dark");
  const lightThemes = themeList.filter((t) => t.kind === "light");

  return (
    <div className="space-y-6">
      {/* Font selection */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Font</label>
        <div className="flex flex-wrap gap-2">
          {fontOptions.map((font) => (
            <button
              key={font.id}
              onClick={() => handleFontSelect(font.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                fontId === font.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--amber)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
              }`}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dark themes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Dark Themes</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {darkThemes.map((theme) => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              selected={activeTheme === theme.id}
              onSelect={() => handleThemeSelect(theme.id)}
            />
          ))}
        </div>
      </div>

      {/* Light themes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">Light Themes</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {lightThemes.map((theme) => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              selected={activeTheme === theme.id}
              onSelect={() => handleThemeSelect(theme.id)}
            />
          ))}
        </div>
      </div>

      {saving && <p className="text-sm text-[var(--text-muted)]">Saving…</p>}
      {error && <p className="text-sm text-[var(--red)]">{error}</p>}
    </div>
  );
}
