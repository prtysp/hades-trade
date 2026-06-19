"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themes, Theme, fontOptions, FontId } from "@/lib/themes";

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  fontId: FontId;
  setThemeId: (id: string) => void;
  setFontId: (id: FontId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.dracula,
  themeId: "dracula",
  fontId: "sans",
  setThemeId: () => {},
  setFontId: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  initialTheme = "dracula",
  initialFont = "sans",
}: {
  children: ReactNode;
  initialTheme?: string;
  initialFont?: FontId;
}) {
  const [themeId, setThemeId] = useState(initialTheme);
  const [fontId, setFontId] = useState<FontId>(initialFont);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme && themes[storedTheme]) {
      setThemeId(storedTheme);
    }
    const storedFont = localStorage.getItem("font") as FontId | null;
    if (storedFont && fontOptions.find((f) => f.id === storedFont)) {
      setFontId(storedFont);
    }
  }, []);

  const handleSetThemeId = (id: string) => {
    if (themes[id]) {
      setThemeId(id);
      localStorage.setItem("theme", id);
    }
  };

  const handleSetFontId = (id: FontId) => {
    setFontId(id);
    localStorage.setItem("font", id);
  };

  const theme = themes[themeId] ?? themes.dracula;
  const fontClass = fontOptions.find((f) => f.id === fontId)?.class ?? "font-sans";

  return (
    <ThemeContext.Provider value={{ theme, themeId, fontId, setThemeId: handleSetThemeId, setFontId: handleSetFontId }}>
      <div className={`${theme.font} ${fontClass}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
