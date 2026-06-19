import { ArtifactCategory } from "@prisma/client";

const categoryStyles: Record<ArtifactCategory, { bg: string; text: string; border: string }> = {
  COMBAT:   { bg: "rgba(184,186,38,0.15)",  text: "#b8bb26", border: "rgba(184,186,38,0.3)" },
  TRANSPORT:{ bg: "rgba(250,189,47,0.15)",  text: "#fabd2f", border: "rgba(250,189,47,0.3)" },
  MINING:   { bg: "rgba(177,98,134,0.15)", text: "#b76286", border: "rgba(177,98,134,0.3)" },
  DRONE:    { bg: "rgba(142,192,124,0.15)", text: "#8ec07c", border: "rgba(142,192,124,0.3)" },
  WEAPON:   { bg: "rgba(251,73,52,0.15)",   text: "#fb4934", border: "rgba(251,73,52,0.35)" },
  SHIELD:   { bg: "rgba(131,165,156,0.15)", text: "#83a598", border: "rgba(131,165,156,0.3)" },
};

const categoryEmojis: Record<ArtifactCategory, string> = {
  COMBAT: "⚔️", TRANSPORT: "🚀", MINING: "⛏️", DRONE: "🤖", WEAPON: "🔫", SHIELD: "🛡️",
};

interface ArtifactBadgeProps {
  category: ArtifactCategory;
  bonusPct: number;
  level: number;
  compact?: boolean;
}

export default function ArtifactBadge({ category, bonusPct, level, compact }: ArtifactBadgeProps) {
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
        {categoryEmojis[category]} {category} Lv.{level}
      </span>
    );
  }

  return (
    <div className="rounded-lg border p-3" style={inlineStyle}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{categoryEmojis[category]}</span>
        <span className="text-xs font-semibold opacity-70">Lv. {level}</span>
      </div>
      <div className="mt-1 font-medium">{category}</div>
      <div className="text-sm opacity-80">+{bonusPct}% bonus</div>
    </div>
  );
}
