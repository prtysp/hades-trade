import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    include: {
      _count: { select: { artifacts: true, listings: true } },
    },
    orderBy: { username: "asc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Players</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {players.length} registered {players.length === 1 ? "trader" : "traders"}
        </p>
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 text-center">
          <p className="text-base sm:text-lg text-[var(--text-muted)]">No players registered yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 transition hover:border-[var(--border-hover)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold text-lg shrink-0">
                  {player.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[var(--text)] truncate">{player.username}</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">{player.corporation}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs sm:text-sm text-[var(--text-muted)]">
                <span>{player._count.artifacts} artifacts</span>
                <span>{player._count.listings} listings</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
