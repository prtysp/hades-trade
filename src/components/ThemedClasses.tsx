"use client";

import { useTheme } from "./ThemeProvider";

export function useThemedClasses() {
  const { theme } = useTheme();

  return {
    card: `rounded-xl border ${theme.border} ${theme.bgCard} ${theme.borderHover}`,
    cardPadded: `rounded-xl border ${theme.border} ${theme.bgCard} ${theme.borderHover} p-4 sm:p-5`,
    cardPaddedLg: `rounded-xl border ${theme.border} ${theme.bgCard} ${theme.borderHover} p-4 sm:p-6`,
    textMuted: theme.textMuted,
    textDim: theme.textDim,
    accentText: theme.accentText,
    input: `w-full rounded-lg border ${theme.border} ${theme.bgInput} px-3 py-2 ${theme.text} ${theme.borderFocus} focus:outline-none`,
    btnPrimary: `rounded-lg ${theme.accent} px-4 py-2 text-sm font-semibold text-[var(--text)] ${theme.accentHover} transition`,
    btnSecondary: `rounded-lg border ${theme.border} px-3 py-1.5 text-sm font-medium ${theme.textMuted} ${theme.borderHover} transition`,
  };
}
