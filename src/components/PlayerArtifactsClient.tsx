"use client";

import { useArtifactContext } from "@/components/ArtifactContext";
import AddArtifactForm from "@/components/AddArtifactForm";
import CompressedArtifactBadge from "@/components/CompressedArtifactBadge";
import type { ArtifactGroup } from "@/components/CompressedArtifactBadge";

function groupArtifacts(artifacts: { id: string; category: string; bonusPct: number; level: number; createdAt?: string | Date }[]): ArtifactGroup[] {
  const map = new Map<string, ArtifactGroup>();
  for (const art of artifacts) {
    const key = `${art.category}-${art.bonusPct}-${art.level}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.artifacts.push({ id: art.id, createdAt: art.createdAt ? new Date(art.createdAt) : new Date() });
    } else {
      map.set(key, {
        category: art.category as any,
        bonusPct: art.bonusPct,
        level: art.level,
        count: 1,
        artifacts: [{ id: art.id, createdAt: art.createdAt ? new Date(art.createdAt) : new Date() }],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (b.level !== a.level) return b.level - a.level;
    return b.bonusPct - a.bonusPct;
  });
}

export default function PlayerArtifactsClient() {
  const { artifacts } = useArtifactContext();
  const groups = groupArtifacts(artifacts);

  return (
    <>
      <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Add Artifact to Inventory</h3>
        <AddArtifactForm />
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No artifacts yet. Add some above!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {groups.map((group) => (
            <CompressedArtifactBadge
              key={`${group.category}-${group.bonusPct}-${group.level}`}
              group={group}
            />
          ))}
        </div>
      )}
    </>
  );
}
