"use client";

import { ReactNode } from "react";
import { useTheme } from "./ThemeProvider";

export function ThemeBody({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-full flex flex-col ${theme.bg} ${theme.text}`}>
      {children}
    </div>
  );
}
