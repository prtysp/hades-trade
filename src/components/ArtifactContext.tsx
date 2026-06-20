"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ArtifactCategory } from "@prisma/client";

export interface ArtifactItem {
  id: string;
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
  createdAt?: string | Date;
}

interface ArtifactContextValue {
  artifacts: ArtifactItem[];
  playerId: string;
  refresh: () => Promise<void>;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

export function useArtifactContext() {
  const ctx = useContext(ArtifactContext);
  if (!ctx) throw new Error("useArtifactContext must be used within ArtifactProvider");
  return ctx;
}

interface ArtifactProviderProps {
  playerId: string;
  initialArtifacts: ArtifactItem[];
  children: ReactNode;
}

export function ArtifactProvider({ playerId, initialArtifacts, children }: ArtifactProviderProps) {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>(initialArtifacts);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/artifacts?playerId=${playerId}`);
      const data = await res.json();
      setArtifacts(data);
    } catch (e) {
      console.error(e);
    }
  }, [playerId]);

  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <ArtifactContext.Provider value={{ artifacts, playerId, refresh }}>
      {children}
    </ArtifactContext.Provider>
  );
}
