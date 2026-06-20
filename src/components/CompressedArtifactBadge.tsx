"use client";

import { useState } from "react";
import { ArtifactCategory } from "@prisma/client";
import { categoryStyles, categoryEmojis } from "@/lib/artifact-styles";

export interface ArtifactGroup {
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
  count: number;
  artifacts: { id: string; createdAt: Date }[];
}

interface CompressedArtifactBadgeProps {
  group: ArtifactGroup;
}

export default function CompressedArtifactBadge({ group }: CompressedArtifactBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const style = categoryStyles[group.category];
  const inlineStyle = {
    backgroundColor: style.bg,
    color: style.text,
    borderColor: style.border,
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded-lg border p-3 text-left transition hover:opacity-90"
        style={inlineStyle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryEmojis[group.category]}</span>
            <span className="font-medium">{group.category}</span>
          </div>
          {group.count > 1 && (
            <span className="rounded-full border px-2 py-0.5 text-xs font-bold" style={{ borderColor: style.border }}>
              ×{group.count}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between text-sm opacity-80">
          <span>+{group.bonusPct}% · Lv.{group.level}</span>
          <span className="text-xs opacity-60">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && group.artifacts.length > 1 && (
        <div className="mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 space-y-1">
          <p className="text-xs font-medium text-[var(--text-muted)] px-1">
            {group.count} artifacts:
          </p>
          {group.artifacts.map((art) => (
            <div
              key={art.id}
              className="flex items-center justify-between rounded px-2 py-1 text-xs text-[var(--text)]"
            >
              <span>{categoryEmojis[group.category]} {group.category} +{group.bonusPct}% Lv.{group.level}</span>
              <span className="text-[var(--text-dim)]">
                {new Date(art.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
