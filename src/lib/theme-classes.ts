"use client";

import { useTheme } from "@/components/ThemeProvider";

/**
 * Returns an object of themed CSS class strings for consistent styling.
 * Use this in any client component that needs theme-aware styling.
 */
export function useThemeClasses() {
  const { theme } = useTheme();

  return {
    // ── Surfaces ──
    page: `${theme.bg} ${theme.text}`,
    card: `${theme.bgCard} ${theme.border}`,
    cardHover: theme.borderHover,
    cardPadded: `${theme.bgCard} ${theme.border} ${theme.borderHover} p-4 sm:p-5`,
    cardPaddedLg: `${theme.bgCard} ${theme.border} ${theme.borderHover} p-4 sm:p-6`,
    input: `${theme.bgInput} ${theme.border} ${theme.borderFocus} ${theme.text}`,
    header: `${theme.headerBg} ${theme.headerBorder}`,
    footer: `${theme.footerBg} ${theme.footerBorder}`,

    // ── Text ──
    text: theme.text,
    textMuted: theme.textMuted,
    textDim: theme.textDim,
    accentText: theme.accentText,

    // ── Buttons ──
    btnPrimary: `${theme.accent} ${theme.accentHover} text-slate-900`,
    btnSecondary: `${theme.border} ${theme.borderHover} ${theme.textMuted}`,
    btnDanger: "bg-red-500/20 text-red-400 hover:bg-red-500/30",

    // ── Semantic ──
    greenText: theme.green,
    greenBg: theme.greenBg,
    amberText: theme.amber,
    amberBg: theme.amberBg,
    blueText: theme.blue,
    blueBg: theme.blueBg,
    redText: theme.red,
    redBg: theme.redBg,

    // ── Combined helpers ──
    badge: (color: "green" | "amber" | "blue" | "red") => {
      const map = {
        green: `${theme.green} ${theme.greenBg}`,
        amber: `${theme.amber} ${theme.amberBg}`,
        blue: `${theme.blue} ${theme.blueBg}`,
        red: `${theme.red} ${theme.redBg}`,
      };
      return `rounded-full ${map[color]} px-2 py-0.5 text-xs font-medium`;
    },

    selectBtn: (active: boolean, color: "green" | "amber" | "blue" = "green") => {
      if (active) {
        const map = {
          green: "border-green-500 bg-green-500/20 text-green-300",
          amber: "border-amber-500 bg-amber-500/20 text-amber-300",
          blue: "border-blue-500 bg-blue-500/20 text-blue-300",
        };
        return `rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium transition ${map[color]}`;
      }
      return `rounded-lg border border-slate-600 text-slate-400 hover:border-slate-500 text-sm font-medium transition px-3 sm:px-4 py-2`;
    },
  };
}
