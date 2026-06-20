"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notifyRefresh } from "@/components/NotificationProvider";

const categoryEmojis: Record<string, string> = {
  COMBAT: "⚔️", TRANSPORT: "🚀", MINING: "⛏️", DRONE: "🤖", WEAPON: "🔫", SHIELD: "🛡️",
};

interface TradeArtifact {
  id: string;
  artifactId: string;
  category: string;
  bonusPct: number;
  level: number;
  fromPlayerId: string;
  toPlayerId: string;
  role: string;
}

interface Trade {
  id: string;
  listingId: string;
  listerId: string;
  traderId: string;
  lister: { id: string; username: string };
  trader: { id: string; username: string };
  status: "PENDING" | "LISTER_CONFIRMED" | "TRADER_CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: string | Date;
  completedAt: string | Date | null;
  tradeArtifacts: TradeArtifact[];
}

interface TradeCardProps {
  trade: Trade;
  currentPlayerId: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:          { label: "Awaiting Your Confirmation", color: "text-[var(--amber)]", bg: "bg-[var(--amber-bg)]" },
  LISTER_CONFIRMED:  { label: "Lister Confirmed — Awaiting You", color: "text-[var(--blue)]", bg: "bg-[var(--blue-bg)]" },
  TRADER_CONFIRMED:  { label: "Trader Confirmed — Awaiting You", color: "text-[var(--blue)]", bg: "bg-[var(--blue-bg)]" },
  COMPLETED:        { label: "Completed", color: "text-[var(--green)]", bg: "bg-[var(--green-bg)]" },
  CANCELLED:        { label: "Cancelled", color: "text-[var(--red)]", bg: "bg-[var(--red-bg)]" },
};

export default function TradeCard({ trade, currentPlayerId }: TradeCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isLister = trade.listerId === currentPlayerId;
  const otherPlayer = isLister ? trade.trader : trade.lister;
  const myArtifacts = trade.tradeArtifacts.filter(
    (ta) => (isLister && ta.role === "GIVEN") || (!isLister && ta.role === "RECEIVED")
  );
  const theirArtifacts = trade.tradeArtifacts.filter(
    (ta) => (isLister && ta.role === "RECEIVED") || (!isLister && ta.role === "GIVEN")
  );

  const status = statusConfig[trade.status];
  const canConfirm =
    (isLister && (trade.status === "PENDING" || trade.status === "TRADER_CONFIRMED")) ||
    (!isLister && (trade.status === "PENDING" || trade.status === "LISTER_CONFIRMED"));
  const canCancel = trade.status !== "COMPLETED" && trade.status !== "CANCELLED";
  const awaitingOther =
    (isLister && trade.status === "LISTER_CONFIRMED") ||
    (!isLister && trade.status === "TRADER_CONFIRMED");

  const handleAction = async (action: "confirm" | "cancel") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
        notifyRefresh();
      }
    } catch { /* */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${
      trade.status === "COMPLETED" ? "border-[var(--green)]/20 bg-[var(--green-bg)]/30" :
      trade.status === "CANCELLED" ? "border-[var(--red)]/20 bg-[var(--red-bg)]/30 opacity-60" :
      "border-[var(--border)] bg-[var(--bg-card)]"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}>
              {status.label}
            </span>
            <span className="text-xs text-[var(--text-dim)]">
              {new Date(trade.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text)]">
            with{" "}
            <Link href={`/players/${otherPlayer.id}`} className="text-[var(--accent-text)] hover:opacity-80">
              {otherPlayer.username}
            </Link>
          </p>
        </div>
        {trade.status === "COMPLETED" && trade.completedAt && (
          <span className="text-xs text-[var(--text-dim)] shrink-0">
            Completed {new Date(trade.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Artifact exchange summary */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--amber)] mb-1">You give:</p>
          <div className="flex flex-wrap gap-1">
            {myArtifacts.map((ta) => (
              <span key={ta.id} className="inline-flex items-center gap-1 rounded-full border border-[var(--amber)]/30 bg-[var(--amber-bg)] px-2 py-0.5 text-xs text-[var(--amber)]">
                {categoryEmojis[ta.category]} {ta.category} +{ta.bonusPct}% Lv.{ta.level}
              </span>
            ))}
            {myArtifacts.length === 0 && <span className="text-xs text-[var(--text-dim)]">Nothing</span>}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--green)] mb-1">You receive:</p>
          <div className="flex flex-wrap gap-1">
            {theirArtifacts.map((ta) => (
              <span key={ta.id} className="inline-flex items-center gap-1 rounded-full border border-[var(--green)]/30 bg-[var(--green-bg)] px-2 py-0.5 text-xs text-[var(--green)]">
                {categoryEmojis[ta.category]} {ta.category} +{ta.bonusPct}% Lv.{ta.level}
              </span>
            ))}
            {theirArtifacts.length === 0 && <span className="text-xs text-[var(--text-dim)]">Nothing</span>}
          </div>
        </div>
      </div>

      {/* Action buttons for pending trades */}
      {trade.status !== "COMPLETED" && trade.status !== "CANCELLED" && (
        <div className="mt-3 space-y-2">
          {canConfirm && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("confirm")}
                disabled={loading}
                className="rounded-lg bg-[var(--green-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--green)] hover:opacity-80 transition disabled:opacity-50"
              >
✓ I've Exchanged In-Game
              </button>
              {canCancel && (
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={loading}
                  className="rounded-lg bg-[var(--red-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--red)] hover:opacity-80 transition disabled:opacity-50"
                >
                  ✕ Cancel
                </button>
              )}
            </div>
          )}
          {awaitingOther && (
            <p className="text-xs text-[var(--text-dim)]">
              ⏳ You confirmed. Waiting for {otherPlayer.username} to confirm the in-game exchange.
            </p>
          )}
          {trade.status === "PENDING" && (
            <p className="text-xs text-[var(--text-dim)]">
              💡 Exchange artifacts in-game, then confirm here. Both players must confirm to complete the trade.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
