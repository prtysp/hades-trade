"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { notifyRefresh } from "@/components/NotificationProvider";
import { categoryEmojis } from "@/lib/artifact-styles";

interface InterestArtifact {
  id: string;
  artifactId: string;
  role: string;
}

interface Interest {
  id: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  player: { id: string; username: string; corporation: string };
  interestArtifacts: InterestArtifact[];
}

interface ListingArtifact {
  artifactId: string;
  artifact: { id: string; category: string; bonusPct: number; level: number };
  role: string;
}

interface InterestsListProps {
  listingId: string;
  listingArtifacts: ListingArtifact[];
}

export default function InterestsList({ listingId, listingArtifacts }: InterestsListProps) {
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptSelections, setAcceptSelections] = useState<Record<string, string[]>>({});

  const fetchInterests = useCallback(async () => {
    try {
      const res = await fetch(`/api/interests?listingId=${listingId}`);
      if (res.ok) {
        const data: Interest[] = await res.json();
        setInterests(data);
        const initialSelections: Record<string, string[]> = {};
        for (const interest of data) {
          if (interest.status === "PENDING") {
            initialSelections[interest.id] = interest.interestArtifacts
              .filter((ia) => ia.role === "INTERESTED_IN")
              .map((ia) => ia.artifactId);
          }
        }
        setAcceptSelections(initialSelections);
      }
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { fetchInterests(); }, [fetchInterests]);

  const toggleAcceptArtifact = (interestId: string, artifactId: string) => {
    setAcceptSelections((prev) => {
      const current = prev[interestId] || [];
      const updated = current.includes(artifactId)
        ? current.filter((id) => id !== artifactId)
        : [...current, artifactId];
      return { ...prev, [interestId]: updated };
    });
  };

  const getArtifactLabel = (artifactId: string) => {
    const la = listingArtifacts.find((a) => a.artifactId === artifactId);
    if (!la) return artifactId;
    return `${la.artifact.category} +${la.artifact.bonusPct}% L${la.artifact.level}`;
  };

  const getArtifactCategory = (artifactId: string) => {
    const la = listingArtifacts.find((a) => a.artifactId === artifactId);
    return la?.artifact.category || "";
  };

  const getArtifactBonus = (artifactId: string) => {
    const la = listingArtifacts.find((a) => a.artifactId === artifactId);
    return la?.artifact.bonusPct ?? 0;
  };

  const getArtifactLevel = (artifactId: string) => {
    const la = listingArtifacts.find((a) => a.artifactId === artifactId);
    return la?.artifact.level ?? 0;
  };

  const handleAccept = async (interestId: string) => {
    const selectedIds = acceptSelections[interestId] || [];
    if (selectedIds.length === 0) {
      alert("Select at least one artifact to trade");
      return;
    }
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACCEPTED",
          offeringArtifactIds: selectedIds,
        }),
      });
      if (res.ok) {
        router.refresh();
        fetchInterests();
        notifyRefresh();
      }
    } catch { /* */ }
  };

  const handleReject = async (interestId: string) => {
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
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
        {interests.map((interest) => {
          const selectedIds = acceptSelections[interest.id] || [];
          const interestedArtifacts = interest.interestArtifacts.filter(
            (ia) => ia.role === "INTERESTED_IN"
          );
          const offeringArtifacts = interest.interestArtifacts.filter(
            (ia) => ia.role === "OFFERING_IN_RETURN"
          );

          return (
            <div
              key={interest.id}
              className={`rounded-xl border p-4 ${
                interest.status === "ACCEPTED"
                  ? "border-[var(--green)]/30 bg-[var(--green-bg)]"
                  : interest.status === "REJECTED"
                  ? "border-[var(red)]/20 bg-[var(--red-bg)] opacity-60"
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
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                    interest.status === "ACCEPTED"
                      ? "bg-[var(--green-bg)] text-[var(--green)]"
                      : interest.status === "REJECTED"
                      ? "bg-[var(--red-bg)] text-[var(--red)]"
                      : "bg-[var(--amber-bg)] text-[var(--amber)]"
                  }`}
                >
                  {interest.status}
                </span>
              </div>

              {/* Artifacts the interested player wants from the listing */}
              {interestedArtifacts.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[var(--green)] mb-1">Wants from your listing:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interestedArtifacts.map((ia) => (
                      <span
                        key={ia.id}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--green)]/30 bg-[var(--green-bg)] px-2 py-0.5 text-xs text-[var(--green)]"
                      >
                        {categoryEmojis[getArtifactCategory(ia.artifactId)]}
                        {getArtifactLabel(ia.artifactId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Artifacts the interested player offers in return */}
              {offeringArtifacts.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-[var(--amber)] mb-1">Offers in return:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {offeringArtifacts.map((ia) => (
                      <span
                        key={ia.id}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--amber)]/30 bg-[var(--amber-bg)] px-2 py-0.5 text-xs text-[var(--amber)]"
                      >
                        {categoryEmojis[getArtifactCategory(ia.artifactId)]}
                        {getArtifactLabel(ia.artifactId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {interest.message && (
                <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-2.5">
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-0.5">Message:</p>
                  <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{interest.message}</p>
                </div>
              )}

              {/* Accept/Reject actions for pending interests */}
              {interest.status === "PENDING" && (
                <div className="mt-3 space-y-3">
                  {/* Partial trade selection */}
                  {interestedArtifacts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text)] mb-1.5">
                        Select artifacts to accept for this trade:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {interestedArtifacts.map((ia) => {
                          const isSelected = selectedIds.includes(ia.artifactId);
                          const cat = getArtifactCategory(ia.artifactId);
                          const bonus = getArtifactBonus(ia.artifactId);
                          const level = getArtifactLevel(ia.artifactId);
                          return (
                            <button
                              key={ia.id}
                              type="button"
                              onClick={() => toggleAcceptArtifact(interest.id, ia.artifactId)}
                              className={`rounded-lg border p-2 text-left transition ${
                                isSelected
                                  ? "border-[var(--green)] bg-[var(--green-bg)] ring-1 ring-[var(--green)]"
                                  : "border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-hover)]"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-xs">{categoryEmojis[cat]}</span>
                                <span className="text-xs font-medium text-[var(--text)]">{cat}</span>
                              </div>
                              <div className="text-xs text-[var(--text-muted)]">
                                +{bonus}% · L{level}
                              </div>
                              {isSelected && (
                                <span className="text-xs text-[var(--green)]">✓ Accepting</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {interestedArtifacts.length > 1 && (
                        <p className="mt-1.5 text-xs text-[var(--text-dim)]">
                          {selectedIds.length} of {interestedArtifacts.length} selected · remaining artifacts stay in listing
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(interest.id)}
                      disabled={selectedIds.length === 0}
                      className="rounded-lg bg-[var(--green-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--green)] hover:opacity-80 transition disabled:opacity-50"
                    >
                      ✓ Accept Trade
                    </button>
                    <button
                      onClick={() => handleReject(interest.id)}
                      className="rounded-lg bg-[var(--red-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--red)] hover:opacity-80 transition"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
