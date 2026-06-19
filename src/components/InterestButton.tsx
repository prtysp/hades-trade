"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InterestButtonProps {
  listingId: string;
}

export default function InterestButton({ listingId }: InterestButtonProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message: message.trim() || undefined }),
      });

      if (!res.ok) {
        let msg = "Failed to express interest";
        try { const d = await res.json(); msg = d.error ?? msg; } catch { /* */ }
        throw new Error(msg);
      }

      setSuccess(true);
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-[var(--green)]/30 bg-[var(--green-bg)] p-4 text-center">
        <p className="text-sm text-[var(--green)] font-medium">✓ Interest expressed! The lister has been notified.</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[var(--accent-text)] hover:bg-[var(--accent)]/20 transition"
      >
        🤝 Express Interest
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Express Interest</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Message to the lister <span className="text-[var(--text-dim)]">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Describe what you have to offer, ask questions, etc."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text)] text-sm placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send Interest"}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setError(null); }}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--border-hover)] transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
