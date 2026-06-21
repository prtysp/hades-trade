"use client";

import { useState } from "react";
import { categoryEmojis } from "@/lib/artifact-styles";
import { useAuth } from "@/components/AuthProvider";

interface ListingArtifact {
  artifact: { id: string; category: string; bonusPct: number; level: number };
  role: string;
}

interface ShareButtonProps {
  listingId: string;
  description: string | null;
  priceType: string;
  listingArtifacts: ListingArtifact[];
}

function groupArtifacts(artifacts: ListingArtifact[]) {
  const map = new Map<string, { artifact: ListingArtifact["artifact"]; role: string; count: number }>();
  for (const la of artifacts) {
    const key = `${la.artifact.category}-${la.artifact.bonusPct}-${la.artifact.level}-${la.role}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { artifact: la.artifact, role: la.role, count: 1 });
    }
  }
  return Array.from(map.values());
}

export default function ShareButton({
  listingId,
  description,
  priceType,
  listingArtifacts,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { player } = useAuth();

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/listings/${listingId}`;

  const offering = groupArtifacts(listingArtifacts.filter((la) => la.role === "OFFERING"));
  const wanting = groupArtifacts(listingArtifacts.filter((la) => la.role === "WANTING"));

  const formatArt = (a: { artifact: ListingArtifact["artifact"]; count: number }) =>
    `${a.count > 1 ? `${a.count}x ` : ""}${categoryEmojis[a.artifact.category] || "?"} ${a.artifact.category} +${a.artifact.bonusPct}% L${a.artifact.level}`;

  const typeLabel = priceType === "FREE" ? "Free" : priceType === "DONATION" ? "Donation" : "Trade";

  // Use player's custom format or fall back to default
  const template = player?.shareFormat || "{typeLine}{descriptionLine}{offeringLine}{wantingLine}{urlLine}";
  const labelOffer = player?.shareLabelOffer || "Offering";
  const labelWant = player?.shareLabelWant || "Wanting";

  const typeLine = `Type: ${typeLabel}`;
  const descriptionLine = description ? `\n"${description}"` : "";
  const offeringLine =
    offering.length > 0
      ? `\n${labelOffer}:\n${offering.map((o) => `  • ${formatArt(o)}`).join("\n")}`
      : "";
  const wantingLine =
    wanting.length > 0
      ? `\n${labelWant}:\n${wanting.map((w) => `  • ${formatArt(w)}`).join("\n")}`
      : "";
  const urlLine = `\n${shareUrl}`;

  let shareText = template;
  shareText = shareText.replace("{typeLine}", typeLine);
  shareText = shareText.replace("{descriptionLine}", descriptionLine);
  shareText = shareText.replace("{offeringLine}", offeringLine);
  shareText = shareText.replace("{wantingLine}", wantingLine);
  shareText = shareText.replace("{urlLine}", urlLine);
  shareText = shareText.trim();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition flex items-center gap-1.5"
      title="Copy shareable listing text"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012-2v1"/></svg>
          Share
        </>
      )}
    </button>
  );
}
