"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect } from "react";

const themeToVars: Record<string, Record<string, string>> = {
  // ── Dark themes ──
  dracula: {
    bg: "#282a36", bgHeader: "#282a36e6", bgCard: "#44475a55", bgInput: "#44475a99",
    border: "#44475a", borderHover: "#6272a4", borderFocus: "#bd93f9",
    text: "#f8f8f2", textMuted: "#6272a4", textDim: "#6272a4b3",
    accent: "#bd93f9", accentHover: "#bd93f9cc", accentText: "#bd93f9", accentBg: "#bd93f91a",
    green: "#50fa7b", greenBg: "#50fa7b1a",
    amber: "#f1fa8c", amberBg: "#f1fa8c1a",
    blue: "#8be9fd", blueBg: "#8be9fd1a",
    red: "#ff5555", redBg: "#ff55551a",
  },
  tokyonight: {
    bg: "#1a1b26", bgHeader: "#1a1b26e6", bgCard: "#24283b99", bgInput: "#24283bcc",
    border: "#24283b", borderHover: "#565f89", borderFocus: "#7aa2f7",
    text: "#c0caf5", textMuted: "#565f89", textDim: "#565f89b3",
    accent: "#7aa2f7", accentHover: "#7aa2f7cc", accentText: "#7aa2f7", accentBg: "#7aa2f71a",
    green: "#9ece6a", greenBg: "#9ece6a1a",
    amber: "#e0af68", amberBg: "#e0af681a",
    blue: "#7dcfff", blueBg: "#7dcfff1a",
    red: "#f7768e", redBg: "#f7768e1a",
  },
  gruvbox: {
    bg: "#282828", bgHeader: "#282828e6", bgCard: "#3c383699", bgInput: "#3c3836cc",
    border: "#3c3836", borderHover: "#504945", borderFocus: "#fabd2f",
    text: "#ebdbb2", textMuted: "#a89984", textDim: "#928374",
    accent: "#fabd2f", accentHover: "#fabd2fcc", accentText: "#fabd2f", accentBg: "#fabd2f1a",
    green: "#b8bb26", greenBg: "#b8bb261a",
    amber: "#fabd2f", amberBg: "#fabd2f1a",
    blue: "#83a598", blueBg: "#83a5981a",
    red: "#fb4934", redBg: "#fb49341a",
  },
  nord: {
    bg: "#2e3440", bgHeader: "#2e3440e6", bgCard: "#3b425280", bgInput: "#3b4252b3",
    border: "#3b4252", borderHover: "#4c566a", borderFocus: "#88c0d0",
    text: "#eceff4", textMuted: "#d8dee9", textDim: "#4c566a",
    accent: "#88c0d0", accentHover: "#88c0d0cc", accentText: "#88c0d0", accentBg: "#88c0d01a",
    green: "#a3be8c", greenBg: "#a3be8c1a",
    amber: "#ebcb8b", amberBg: "#ebcb8b1a",
    blue: "#81a1c1", blueBg: "#81a1c11a",
    red: "#bf616a", redBg: "#bf616a1a",
  },
  catppuccin: {
    bg: "#1e1e2e", bgHeader: "#1e1e2ee6", bgCard: "#31324480", bgInput: "#313244b3",
    border: "#313244", borderHover: "#45475a", borderFocus: "#cba6f7",
    text: "#cdd6f4", textMuted: "#a6adc8", textDim: "#585b70",
    accent: "#cba6f7", accentHover: "#cba6f7cc", accentText: "#cba6f7", accentBg: "#cba6f71a",
    green: "#a6e3a1", greenBg: "#a6e3a11a",
    amber: "#f9e2af", amberBg: "#f9e2af1a",
    blue: "#89b4fa", blueBg: "#89b4fa1a",
    red: "#f38ba8", redBg: "#f38ba81a",
  },
  // ── Light themes (high contrast) ──
  nordLight: {
    bg: "#eceff4", bgHeader: "#e5e9f0ee", bgCard: "#ffffff99", bgInput: "#ffffff",
    border: "#d8dee9", borderHover: "#b4bcc8", borderFocus: "#5e81ac",
    text: "#2e3440", textMuted: "#4c566a", textDim: "#7b889b",
    accent: "#5e81ac", accentHover: "#4c6a8a", accentText: "#5e81ac", accentBg: "#5e81ac18",
    green: "#3b6a4f", greenBg: "#a3be8c25",
    amber: "#9a6e00", amberBg: "#ebcb8b25",
    blue: "#3b6a8a", blueBg: "#81a1c118",
    red: "#9c3b42", redBg: "#bf616a18",
  },
  gruvboxLight: {
    bg: "#fbf1c7", bgHeader: "#f2e5bcee", bgCard: "#ffffff99", bgInput: "#ffffff",
    border: "#d5c4a1", borderHover: "#bdae93", borderFocus: "#af3a03",
    text: "#3c3836", textMuted: "#7c6f64", textDim: "#928374",
    accent: "#af3a03", accentHover: "#8f3a03", accentText: "#af3a03", accentBg: "#af3a0318",
    green: "#4d7c0e", greenBg: "#98971a20",
    amber: "#b57614", amberBg: "#d65d0e20",
    blue: "#076678", blueBg: "#45858818",
    red: "#9d0006", redBg: "#cc241d18",
  },
  catppuccinLight: {
    bg: "#eff1f5", bgHeader: "#e6e9efee", bgCard: "#ffffff99", bgInput: "#ffffff",
    border: "#ccd0da", borderHover: "#bcc0cc", borderFocus: "#8839ef",
    text: "#4c4f69", textMuted: "#5c5f77", textDim: "#9ca0b0",
    accent: "#8839ef", accentHover: "#7026cc", accentText: "#8839ef", accentBg: "#8839ef18",
    green: "#3a7a28", greenBg: "#40a02b18",
    amber: "#a06010", amberBg: "#df8e1d18",
    blue: "#205ab0", blueBg: "#1e66f518",
    red: "#a01a30", redBg: "#d20f3918",
  },
  tokyonightLight: {
    bg: "#e1e2e7", bgHeader: "#d5d7e0ee", bgCard: "#ffffff99", bgInput: "#ffffff",
    border: "#c1c4d0", borderHover: "#a1a5b6", borderFocus: "#365c99",
    text: "#3760bf", textMuted: "#6c7086", textDim: "#9ca0b0",
    accent: "#365c99", accentHover: "#2a4a7a", accentText: "#365c99", accentBg: "#365c9918",
    green: "#386e36", greenBg: "#5a8a3a18",
    amber: "#8b6a1a", amberBg: "#b18c2a18",
    blue: "#2a5a8a", blueBg: "#2e78c018",
    red: "#a02a2a", redBg: "#c0303018",
  },
};

export function ThemeStyles() {
  const { themeId } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const vars = themeToVars[themeId] ?? themeToVars.dracula;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(`--${key}`, value);
    }
  }, [themeId]);

  return null;
}
