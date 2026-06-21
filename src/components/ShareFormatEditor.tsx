"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ShareFormatEditorProps {
  playerId: string;
  initialFormat: string;
}

// Sample data for preview
const sampleData = {
  typeLine: "Type: Trade",
  descriptionLine: '"Looking to trade my combat arts for shields"',
  offeringLine: "🔴 COMBAT +320% L10\n🔴 COMBAT +320% L10\n🟡 TRANSPORT +280% L10",
  wantingLine: "🔵 SHIELD +300% L9+\n🟠 DRONE +340% L8+",
  urlLine: "https://hades-star.example.com/listing/abc123",
};

function applyTemplate(template: string): string {
  let result = template;
  for (const [key, value] of Object.entries(sampleData)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

const defaultTemplate = `Offering: {offeringLine}
Wanting: {wantingLine}
{urlLine}`;

export default function ShareFormatEditor({ playerId, initialFormat }: ShareFormatEditorProps) {
  const router = useRouter();
  const [format, setFormat] = useState(initialFormat || defaultTemplate);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const preview = useMemo(() => applyTemplate(format), [format]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareFormat: format }),
      });
      if (res.ok) {
        router.refresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">
          Share Message Template
        </label>
        <textarea
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--border-focus)] focus:outline-none resize-y font-mono"
          placeholder="Type your share message template here..."
        />
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          <span className="text-[10px] text-[var(--text-dim)] font-medium">Available variables:</span>
          {Object.keys(sampleData).map((key) => (
            <code key={key} className="text-[10px] text-[var(--accent-text)] bg-[var(--accent-bg)] rounded px-1 py-0.5 cursor-pointer" onClick={() => setFormat((f) => f + `{${key}}`)}>
              {"{"}{key}{"}"}
            </code>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text)] mb-1">
          Preview <span className="text-[var(--text-dim)] font-normal">(using sample data)</span>
        </label>
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg-input)] p-3 text-xs text-[var(--text)] whitespace-pre-wrap font-mono min-h-[80px]">
          {preview}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Format"}
        </button>
        <button
          type="button"
          onClick={() => setFormat(defaultTemplate)}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] transition"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
