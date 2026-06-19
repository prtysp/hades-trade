"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { ArtifactCategory } from "@prisma/client";

export interface ArtifactItem {
  id: string;
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
  createdAt?: Date;
}

interface ArtifactSyncProps {
  playerId: string;
  initialArtifacts: ArtifactItem[];
  children: (artifacts: ArtifactItem[], refresh: () => Promise<void>) => ReactNode;
}

export default function ArtifactSync({ playerId, initialArtifacts, children }: ArtifactSyncProps) {
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

  // Poll for other-tab updates
  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return <>{children(artifacts, refresh)}</>;
}
