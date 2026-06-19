export interface Theme {
  id: string;
  name: string;
  kind: "dark" | "light";
  bg: string;
  bgHeader: string;
  bgCard: string;
  bgCardHover: string;
  bgInput: string;
  border: string;
  borderHover: string;
  borderFocus: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentBg: string;
  green: string;
  greenBg: string;
  amber: string;
  amberBg: string;
  blue: string;
  blueBg: string;
  red: string;
  redBg: string;
  headerBg: string;
  headerBorder: string;
  footerBg: string;
  footerBorder: string;
  font: string;
}

export const themes: Record<string, Theme> = {
  // ── Dark themes ──────────────────────────────────────────────
  dracula: {
    id: "dracula", name: "Dracula", kind: "dark",
    bg: "bg-[#282a36]", bgHeader: "bg-[#282a36]/90", bgCard: "bg-[#44475a]/40", bgCardHover: "hover:border-[#6272a4]", bgInput: "bg-[#44475a]/60",
    border: "border-[#44475a]", borderHover: "hover:border-[#6272a4]", borderFocus: "focus:border-[#bd93f9]",
    text: "text-[#f8f8f2]", textMuted: "text-[#6272a4]", textDim: "text-[#6272a4]/70",
    accent: "bg-[#bd93f9]", accentHover: "hover:bg-[#bd93f9]/80", accentText: "text-[#bd93f9]", accentBg: "bg-[#bd93f9]/10",
    green: "text-[#50fa7b]", greenBg: "bg-[#50fa7b]/10", amber: "text-[#f1fa8c]", amberBg: "bg-[#f1fa8c]/10",
    blue: "text-[#8be9fd]", blueBg: "bg-[#8be9fd]/10", red: "text-[#ff5555]", redBg: "bg-[#ff5555]/10",
    headerBg: "bg-[#282a36]/90", headerBorder: "border-[#44475a]", footerBg: "bg-[#282a36]/60", footerBorder: "border-[#44475a]", font: "font-sans",
  },
  tokyonight: {
    id: "tokyonight", name: "Tokyo Night", kind: "dark",
    bg: "bg-[#1a1b26]", bgHeader: "bg-[#1a1b26]/90", bgCard: "bg-[#24283b]/60", bgCardHover: "hover:border-[#565f89]", bgInput: "bg-[#24283b]/80",
    border: "border-[#24283b]", borderHover: "hover:border-[#565f89]", borderFocus: "focus:border-[#7aa2f7]",
    text: "text-[#c0caf5]", textMuted: "text-[#565f89]", textDim: "text-[#565f89]/70",
    accent: "bg-[#7aa2f7]", accentHover: "hover:bg-[#7aa2f7]/80", accentText: "text-[#7aa2f7]", accentBg: "bg-[#7aa2f7]/10",
    green: "text-[#9ece6a]", greenBg: "bg-[#9ece6a]/10", amber: "text-[#e0af68]", amberBg: "bg-[#e0af68]/10",
    blue: "text-[#7dcfff]", blueBg: "bg-[#7dcfff]/10", red: "text-[#f7768e]", redBg: "bg-[#f7768e]/10",
    headerBg: "bg-[#1a1b26]/90", headerBorder: "border-[#24283b]", footerBg: "bg-[#1a1b26]/60", footerBorder: "border-[#24283b]", font: "font-sans",
  },
  gruvbox: {
    id: "gruvbox", name: "Gruvbox Dark", kind: "dark",
    bg: "bg-[#282828]", bgHeader: "bg-[#282828]/90", bgCard: "bg-[#3c3836]/60", bgCardHover: "hover:border-[#504945]", bgInput: "bg-[#3c3836]/80",
    border: "border-[#3c3836]", borderHover: "hover:border-[#504945]", borderFocus: "focus:border-[#fabd2f]",
    text: "text-[#ebdbb2]", textMuted: "text-[#a89984]", textDim: "text-[#928374]",
    accent: "bg-[#fabd2f]", accentHover: "hover:bg-[#fabd2f]/80", accentText: "text-[#fabd2f]", accentBg: "bg-[#fabd2f]/10",
    green: "text-[#b8bb26]", greenBg: "bg-[#b8bb26]/10", amber: "text-[#fabd2f]", amberBg: "bg-[#fabd2f]/10",
    blue: "text-[#83a598]", blueBg: "bg-[#83a598]/10", red: "text-[#fb4934]", redBg: "bg-[#fb4934]/10",
    headerBg: "bg-[#282828]/90", headerBorder: "border-[#3c3836]", footerBg: "bg-[#282828]/60", footerBorder: "border-[#3c3836]", font: "font-sans",
  },
  nord: {
    id: "nord", name: "Nord Dark", kind: "dark",
    bg: "bg-[#2e3440]", bgHeader: "bg-[#2e3440]/90", bgCard: "bg-[#3b4252]/50", bgCardHover: "hover:border-[#4c566a]", bgInput: "bg-[#3b4252]/70",
    border: "border-[#3b4252]", borderHover: "hover:border-[#4c566a]", borderFocus: "focus:border-[#88c0d0]",
    text: "text-[#eceff4]", textMuted: "text-[#d8dee9]", textDim: "text-[#4c566a]",
    accent: "bg-[#88c0d0]", accentHover: "hover:bg-[#88c0d0]/80", accentText: "text-[#88c0d0]", accentBg: "bg-[#88c0d0]/10",
    green: "text-[#a3be8c]", greenBg: "bg-[#a3be8c]/10", amber: "text-[#ebcb8b]", amberBg: "bg-[#ebcb8b]/10",
    blue: "text-[#81a1c1]", blueBg: "bg-[#81a1c1]/10", red: "text-[#bf616a]", redBg: "bg-[#bf616a]/10",
    headerBg: "bg-[#2e3440]/90", headerBorder: "border-[#3b4252]", footerBg: "bg-[#2e3440]/60", footerBorder: "border-[#3b4252]", font: "font-sans",
  },
  catppuccin: {
    id: "catppuccin", name: "Catppuccin Mocha", kind: "dark",
    bg: "bg-[#1e1e2e]", bgHeader: "bg-[#1e1e2e]/90", bgCard: "bg-[#313244]/50", bgCardHover: "hover:border-[#45475a]", bgInput: "bg-[#313244]/70",
    border: "border-[#313244]", borderHover: "hover:border-[#45475a]", borderFocus: "focus:border-[#cba6f7]",
    text: "text-[#cdd6f4]", textMuted: "text-[#a6adc8]", textDim: "text-[#585b70]",
    accent: "bg-[#cba6f7]", accentHover: "hover:bg-[#cba6f7]/80", accentText: "text-[#cba6f7]", accentBg: "bg-[#cba6f7]/10",
    green: "text-[#a6e3a1]", greenBg: "bg-[#a6e3a1]/10", amber: "text-[#f9e2af]", amberBg: "bg-[#f9e2af]/10",
    blue: "text-[#89b4fa]", blueBg: "bg-[#89b4fa]/10", red: "text-[#f38ba8]", redBg: "bg-[#f38ba8]/10",
    headerBg: "bg-[#1e1e2e]/90", headerBorder: "border-[#313244]", footerBg: "bg-[#1e1e2e]/60", footerBorder: "border-[#313244]", font: "font-sans",
  },
  // ── Light themes (proper contrast) ───────────────────────────
  nordLight: {
    id: "nordLight", name: "Nord Light", kind: "light",
    bg: "bg-[#eceff4]", bgHeader: "bg-[#eceff4]/95", bgCard: "bg-[#e5e9f0]/80", bgCardHover: "hover:border-[#88c0d0]", bgInput: "bg-[#ffffff]",
    border: "border-[#d8dee9]", borderHover: "hover:border-[#b4bcc8]", borderFocus: "focus:border-[#5e81ac]",
    text: "text-[#2e3440]", textMuted: "text-[#4c566a]", textDim: "text-[#928374]",
    accent: "bg-[#5e81ac]", accentHover: "hover:bg-[#5e81ac]/85", accentText: "text-[#5e81ac]", accentBg: "bg-[#5e81ac]/10",
    green: "text-[#4d7c5e]", greenBg: "bg-[#a3be8c]/20", amber: "text-[#9a6e2e]", amberBg: "bg-[#ebcb8b]/20",
    blue: "text-[#4d7a9e]", blueBg: "bg-[#81a1c1]/15", red: "text-[#9c3b42]", redBg: "bg-[#bf616a]/12",
    headerBg: "bg-[#eceff4]/95", headerBorder: "border-[#d8dee9]", footerBg: "bg-[#e5e9f0]/70", footerBorder: "border-[#d8dee9]", font: "font-sans",
  },
  gruvboxLight: {
    id: "gruvboxLight", name: "Gruvbox Light", kind: "light",
    bg: "bg-[#fbf1c7]", bgHeader: "bg-[#fbf1c7]/95", bgCard: "bg-[#f2e5bc]/80", bgCardHover: "hover:border-[#b57614]", bgInput: "bg-[#ffffff]",
    border: "border-[#d5c4a1]", borderHover: "hover:border-[#bdae93]", borderFocus: "focus:border-[#b57614]",
    text: "text-[#3c3836]", textMuted: "text-[#7c6f64]", textDim: "text-[#928374]",
    accent: "bg-[#b57614]", accentHover: "hover:bg-[#b57614]/85", accentText: "text-[#b57614]", accentBg: "bg-[#b57614]/10",
    green: "text-[#5a6616]", greenBg: "bg-[#98971a]/20", amber: "text-[#9a4a0a]", amberBg: "bg-[#d65d0e]/15",
    blue: "text-[#2a5a6a]", blueBg: "bg-[#458588]/15", red: "text-[#921a1a]", redBg: "bg-[#cc241d]/12",
    headerBg: "bg-[#fbf1c7]/95", headerBorder: "border-[#d5c4a1]", footerBg: "bg-[#f2e5bc]/70", footerBorder: "border-[#d5c4a1]", font: "font-sans",
  },
  catppuccinLight: {
    id: "catppuccinLight", name: "Catppuccin Latte", kind: "light",
    bg: "bg-[#eff1f5]", bgHeader: "bg-[#eff1f5]/95", bgCard: "bg-[#e6e9ef]/80", bgCardHover: "hover:border-[#8839ef]", bgInput: "bg-[#ffffff]",
    border: "border-[#ccd0da]", borderHover: "hover:border-[#bcc0cc]", borderFocus: "focus:border-[#8839ef]",
    text: "text-[#4c4f69]", textMuted: "text-[#5c5f77]", textDim: "text-[#9ca0b0]",
    accent: "bg-[#8839ef]", accentHover: "hover:bg-[#8839ef]/85", accentText: "text-[#8839ef]", accentBg: "bg-[#8839ef]/10",
    green: "text-[#3a7a28]", greenBg: "bg-[#40a02b]/15", amber: "text-[#a06010]", amberBg: "bg-[#df8e1d]/15",
    blue: "text-[#205ab0]", blueBg: "bg-[#1e66f5]/10", red: "text-[#a01a30]", redBg: "bg-[#d20f39]/10",
    headerBg: "bg-[#eff1f5]/95", headerBorder: "border-[#ccd0da]", footerBg: "bg-[#e6e9ef]/70", footerBorder: "border-[#ccd0da]", font: "font-sans",
  },
  tokyonightLight: {
    id: "tokyonightLight", name: "Tokyo Night Light", kind: "light",
    bg: "bg-[#e1e2e7]", bgHeader: "bg-[#e1e2e7]/95", bgCard: "bg-[#d5d7e0]/80", bgCardHover: "hover:border-[#365c99]", bgInput: "bg-[#ffffff]",
    border: "border-[#c1c4d0]", borderHover: "hover:border-[#a1a5b6]", borderFocus: "focus:border-[#365c99]",
    text: "text-[#3760bf]", textMuted: "text-[#6c7086]", textDim: "text-[#9ca0b0]",
    accent: "bg-[#365c99]", accentHover: "hover:bg-[#365c99]/85", accentText: "text-[#365c99]", accentBg: "bg-[#365c99]/10",
    green: "text-[#386e36]", greenBg: "bg-[#5a8a3a]/15", amber: "text-[#8b6a1a]", amberBg: "bg-[#b18c2a]/15",
    blue: "text-[#2a5a8a]", blueBg: "bg-[#2e78c0]/10", red: "text-[#a02a2a]", redBg: "bg-[#c03030]/10",
    headerBg: "bg-[#e1e2e7]/95", headerBorder: "border-[#c1c4d0]", footerBg: "bg-[#d5d7e0]/70", footerBorder: "border-[#c1c4d0]", font: "font-sans",
  },
};

export const fontOptions = [
  { id: "sans", name: "Sans Serif", class: "font-sans" },
  { id: "mono", name: "Monospace", class: "font-mono" },
  { id: "serif", name: "Serif", class: "font-serif" },
] as const;

export type FontId = (typeof fontOptions)[number]["id"];
