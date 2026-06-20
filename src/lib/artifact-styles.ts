import { ArtifactCategory } from "@prisma/client";

export const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
  WEAPON:   { bg: "rgba(239,68,68,0.15)",  text: "#ef4444", border: "rgba(239,68,68,0.35)" },
  COMBAT:   { bg: "rgba(34,197,94,0.15)",  text: "#22c55e", border: "rgba(34,197,94,0.3)" },
  MINING:   { bg: "rgba(168,85,247,0.15)", text: "#a855f7", border: "rgba(168,85,247,0.35)" },
  TRANSPORT:{ bg: "rgba(234,179,8,0.15)",  text: "#eab308", border: "rgba(234,179,8,0.3)" },
  DRONE:    { bg: "rgba(234,120,30,0.15)", text: "#ea781e", border: "rgba(234,120,30,0.3)" },
  SHIELD:   { bg: "rgba(59,130,246,0.15)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
};

export const categoryEmojis: Record<string, string> = {
  WEAPON: "🔴", COMBAT: "🟢", MINING: "🟣", TRANSPORT: "🟡", DRONE: "🟠", SHIELD: "🔵",
};
