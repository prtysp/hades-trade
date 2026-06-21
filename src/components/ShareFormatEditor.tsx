"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ShareFormatEditorProps {
  playerId: string;
  initialFormat: string;
  initialLabelOffer: string;
  initialLabelWant: string;
}

export default function ShareFormatEditor({
  playerId,
  initialFormat,
  initialLabelOffer,
  initialLabelWant,
}: ShareFormatEditorProps) {
  const router = useRouter();
  const [format, setFormat] = useState(initialFormat);
  const [labelOffer, setLabelOffer] = useState(initialLabelOffer);
  const [labelWant, setLabelWant] = useState(initialLabelWant);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareFormat: format, shareLabelOffer: labelOffer, shareLabelWant: labelWant }),
      });
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Offering label</label>
          <input
            type="text"
            value={labelOffer}
            onChange={(e) => setLabelOffer(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-sm text-[var(--text)] focus:border-[var(--border-focus)] focus:outline-none"
            placeholder="Offering"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Wanting label</label>
          <input
            type="text"
            value={labelWant}
            onChange={(e) => setLabelWant(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-sm text-[var(--text)] focus:border-[var(--border-focus)] focus:outline-none"
            placeholder="Wanting"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Message format</label>
        <textarea
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs text-[var(--text)] font-mono focus:border-[var(--border-focus)] focus:outline-none resize-none"
        />
        <p className="text-[10px] text-[var(--text-dim)] mt-1">
          Placeholders: {"{typeLine}"} {"{descriptionLine}"} {"{offeringLine}"} {"{wantingLine}"} {"{urlLine}"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Format"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFormat("{typeLine}{descriptionLine}{offeringLine}{wantingLine}{urlLine}");
            setLabelOffer("Offering");
            setLabelWant("Wanting");
          }}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
