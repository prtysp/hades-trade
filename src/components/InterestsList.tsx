"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Interest {
  id: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  player: { id: string; username: string; corporation: string };
}

interface InterestsListProps {
  listingId: string;
}

export default function InterestsList({ listingId }: InterestsListProps) {
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    try {
      const res = await fetch(`/api/interests?listingId=${listingId}`);
      if (res.ok) setInterests(await res.json());
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { fetchInterests(); }, [fetchInterests]);

  const handleAction = async (interestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
        fetchInterests();
      }
    } catch { /* */ }
  };

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading interests…</p>;
  if (interests.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">No interests expressed yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text)] mb-3">
        Interests ({interests.length})
      </h2>
      <div className="space-y-3">
        {interests.map((interest) => (
          <div
            key={interest.id}
            className={`rounded-xl border p-4 ${
              interest.status === "ACCEPTED" ? "border-[var(--green)]/30 bg-[var(--green-bg)]"
              : interest.status === "REJECTED" ? "border-[var(--red)]/20 bg-[var(--red-bg)] opacity-60"
              : "border-[var(--border)] bg-[var(--bg-card)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {interest.player.username}
                  <span className="text-[var(--text-muted)] font-normal"> · {interest.player.corporation}</span>
                </p>
                <p className="text-xs text-[var(--text-dim)] mt-0.5">
                  {new Date(interest.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                interest.status === "ACCEPTED" ? "bg-[var(--green-bg)] text-[var(--green)]"
                : interest.status === "REJECTED" ? "bg-[var(--red-bg)] text-[var(--red)]"
                : "bg-[var(--amber-bg)] text-[var(--amber)]"
              }`}>
                {interest.status}
              </span>
            </div>

            {interest.message && (
              <p className="mt-2 text-sm text-[var(--text)] whitespace-pre-wrap">{interest.message}</p>
            )}

            {interest.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleAction(interest.id, "ACCEPTED")}
                  className="rounded-lg bg-[var(--green-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--green)] hover:opacity-80 transition"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => handleAction(interest.id, "REJECTED")}
                  className="rounded-lg bg-[var(--red-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--red)] hover:opacity-80 transition"
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
