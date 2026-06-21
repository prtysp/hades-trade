import { ArtifactCategory } from "@prisma/client";
import { categoryStyles, categoryEmojis } from "@/lib/artifact-styles";

interface ArtifactBadgeProps {
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
  compact?: boolean;
  count?: number;
}

export default function ArtifactBadge({ category, bonusPct, level, compact, count }: ArtifactBadgeProps) {
  const style = categoryStyles[category];
  const inlineStyle = {
    backgroundColor: style.bg,
    color: style.text,
    borderColor: style.border,
  };

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
        style={inlineStyle}
      >
        {count && count > 1 && <span className="opacity-70 mr-0.5">{count}x</span>}{categoryEmojis[category]} {category} L{level} +{bonusPct}%
      </span>
    );
  }

  return (
    <div className="rounded-lg border p-3" style={inlineStyle}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{categoryEmojis[category]}</span>
        <span className="text-xs font-semibold opacity-70">L{level}{count && count > 1 ? ` x${count}` : ""}</span>
      </div>
      <div className="mt-1 font-medium">{category}{count && count > 1 && <span className="text-xs opacity-70 ml-1">({count}x)</span>}</div>
      <div className="text-sm opacity-80">+{bonusPct}% bonus</div>
    </div>
  );
}
