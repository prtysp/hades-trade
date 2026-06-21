"use client";

import { useState, useRef, useEffect } from "react";
import { categoryEmojis } from "@/lib/artifact-styles";

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

const defaultTemplate = `{typeLine}{descriptionLine}{offeringLine}{wantingLine}{urlLine}`;

function buildShareText(
  template: string,
  priceType: string,
  description: string | null,
  offering: ReturnType<typeof groupArtifacts>,
  wanting: ReturnType<typeof groupArtifacts>,
  shareUrl: string,
) {
  const typeLabel = priceType === "FREE" ? "Free" : priceType === "DONATION" ? "Donation" : "Trade";

  const formatArt = (a: { artifact: ListingArtifact["artifact"]; count: number }) =>
    `${a.count > 1 ? `${a.count}x ` : ""}${categoryEmojis[a.artifact.category] || "?"} ${a.artifact.category} +${a.artifact.bonusPct}% L${a.artifact.level}`;

  const typeLine = `Type: ${typeLabel}`;
  const descriptionLine = description ? `\n"${description}"` : "";
  const offeringLine =
    offering.length > 0
      ? `\nOffering:\n${offering.map((o) => `  • ${formatArt(o)}`).join("\n")}`
      : "";
  const wantingLine =
    wanting.length > 0
      ? `\nWanting:\n${wanting.map((w) => `  • ${formatArt(w)}`).join("\n")}`
      : "";
  const urlLine = `\n${shareUrl}`;

  let result = template;
  result = result.replace("{typeLine}", typeLine);
  result = result.replace("{descriptionLine}", descriptionLine);
  result = result.replace("{offeringLine}", offeringLine);
  result = result.replace("{wantingLine}", wantingLine);
  result = result.replace("{urlLine}", urlLine);

  return result.trim();
}

export default function ShareButton({
  listingId,
  description,
  priceType,
  listingArtifacts,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [template, setTemplate] = useState(defaultTemplate);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/listings/${listingId}`;

  const offering = groupArtifacts(listingArtifacts.filter((la) => la.role === "OFFERING"));
  const wanting = groupArtifacts(listingArtifacts.filter((la) => la.role === "WANTING"));

  const previewText = buildShareText(template, priceType, description, offering, wanting, shareUrl);

  useEffect(() => {
    if (showEditor && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showEditor]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = previewText;
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
    <div className="relative">
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

      <button
        type="button"
        onClick={() => setShowEditor(!showEditor)}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-dim)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
        title="Edit share format"
      >
        ✏️
      </button>

      {showEditor && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowEditor(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl p-3 space-y-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">Format Template</label>
              <textarea
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-xs text-[var(--text)] font-mono focus:border-[var(--border-focus)] focus:outline-none resize-none"
              />
              <p className="text-[10px] text-[var(--text-dim)] mt-1">
                Available: {"{typeLine}"} {"{descriptionLine}"} {"{offeringLine}"} {"{wantingLine}"} {"{urlLine}"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1">Preview</label>
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg-input)] p-2 text-xs text-[var(--text)] whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                {previewText}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setTemplate(defaultTemplate); }}
                className="flex-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => { copyToClipboard(); setShowEditor(false); }}
                className="flex-1 rounded-md bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-white hover:brightness-110 transition"
              >
                {copied ? "Copied!" : "Copy & Close"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
