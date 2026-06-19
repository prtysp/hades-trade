import { prisma } from "@/lib/prisma";
import ArtifactBadge from "@/components/ArtifactBadge";

export default async function ArtifactsPage() {
  const artifacts = await prisma.artifact.findMany({
    include: { player: { select: { username: true } } },
    orderBy: [{ category: "asc" }, { level: "desc" }],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">All Artifacts</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {artifacts.length} registered {artifacts.length === 1 ? "artifact" : "artifacts"}
        </p>
      </div>

      {artifacts.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 sm:p-12 text-center">
          <p className="text-base sm:text-lg text-[var(--text-muted)]">No artifacts registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {artifacts.map((artifact) => (
            <div key={artifact.id}>
              <ArtifactBadge
                category={artifact.category}
                bonusPct={artifact.bonusPct}
                level={artifact.level}
              />
              <p className="mt-1.5 text-xs text-[var(--text-dim)]">
                Owner: <span className="text-[var(--text-muted)]">{artifact.player.username}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
