"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyToggle({
  label,
  description,
  checked,
  field,
}: {
  label: string;
  description: string;
  checked: boolean;
  field: string;
}) {
  const [enabled, setEnabled] = useState(checked);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const newState = !enabled;
    setEnabled(newState);
    setSaving(true);
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newState }),
      });
      router.refresh();
    } catch {
      setEnabled(!newState);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 ${
          enabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
