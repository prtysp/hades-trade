import { PrismaClient, ArtifactCategory, ArtifactRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories: ArtifactCategory[] = [
  "COMBAT",
  "TRANSPORT",
  "MINING",
  "DRONE",
  "WEAPON",
  "SHIELD",
];

function randomCategory(): ArtifactCategory {
  return categories[Math.floor(Math.random() * categories.length)];
}

function randomLevel(): number {
  return Math.floor(Math.random() * 10) + 3;
}

function randomBonus(): number {
  return parseFloat((Math.random() * 50 + 1).toFixed(1));
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.listingArtifact.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.preferenceCategory.deleteMany();
  await prisma.preference.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.player.deleteMany();

  const defaultPassword = await hash("password123", 12);

  const players = await Promise.all([
    prisma.player.create({
      data: { username: "StarBlazer", passwordHash: defaultPassword, corporation: "Red Galaxy" },
    }),
    prisma.player.create({
      data: { username: "NebulaHunter", passwordHash: defaultPassword, corporation: "Blue Dwarf" },
    }),
    prisma.player.create({
      data: { username: "VoidWalker", passwordHash: defaultPassword, corporation: "Dark Matter Inc" },
    }),
    prisma.player.create({
      data: { username: "CosmicTrader", passwordHash: defaultPassword, corporation: "Stellar Exchange" },
    }),
  ]);

  // Per-category preferences
  const sbPref = await prisma.preference.create({
    data: { playerId: players[0].id },
  });
  await prisma.preferenceCategory.createMany({
    data: [
      { preferenceId: sbPref.id, category: "COMBAT", minBonusPct: 320, minLevel: 10 },
      { preferenceId: sbPref.id, category: "WEAPON", minBonusPct: 280, minLevel: 9 },
    ],
  });

  const nhPref = await prisma.preference.create({
    data: { playerId: players[1].id },
  });
  await prisma.preferenceCategory.createMany({
    data: [
      { preferenceId: nhPref.id, category: "MINING", minBonusPct: 200, minLevel: 8 },
      { preferenceId: nhPref.id, category: "DRONE", minBonusPct: 150, minLevel: 7 },
    ],
  });

  const vwPref = await prisma.preference.create({
    data: { playerId: players[2].id },
  });
  await prisma.preferenceCategory.createMany({
    data: [
      { preferenceId: vwPref.id, category: "SHIELD", minBonusPct: 180, minLevel: 6 },
      { preferenceId: vwPref.id, category: "TRANSPORT", minBonusPct: 250, minLevel: 8 },
    ],
  });

  const ctPref = await prisma.preference.create({
    data: { playerId: players[3].id },
  });
  await prisma.preferenceCategory.createMany({
    data: [
      { preferenceId: ctPref.id, category: "COMBAT", minBonusPct: 300, minLevel: 10 },
      { preferenceId: ctPref.id, category: "WEAPON", minBonusPct: 300, minLevel: 10 },
      { preferenceId: ctPref.id, category: "SHIELD", minBonusPct: 300, minLevel: 10 },
    ],
  });

  // Create artifacts for each player
  for (const player of players) {
    const artifactCount = Math.floor(Math.random() * 6) + 4;
    for (let i = 0; i < artifactCount; i++) {
      await prisma.artifact.create({
        data: {
          category: randomCategory(),
          bonusPct: randomBonus(),
          level: randomLevel(),
          playerId: player.id,
        },
      });
    }
  }

  // Create listings with expiration dates (no titles)
  for (const player of players) {
    const playerArtifacts = await prisma.artifact.findMany({
      where: { playerId: player.id },
    });

    if (playerArtifacts.length < 2) continue;

    const listingCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < listingCount; i++) {
      const shuffled = [...playerArtifacts].sort(() => Math.random() - 0.5);
      const offeringCount = Math.floor(Math.random() * 2) + 1;
      const offering = shuffled.slice(0, offeringCount);
      const wanting = shuffled.slice(offeringCount, offeringCount + 2);

      const priceRoll = Math.random();
      const priceType = priceRoll < 0.33 ? "FREE" : priceRoll < 0.66 ? "DONATION" : "TRADE";
      const expiresInDays = [0.5, 1, 1, 3, 7, 14][Math.floor(Math.random() * 6)];
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

      const listing = await prisma.listing.create({
        data: {
          description: `Trade offer by ${player.username} — ${offering.length} artifact${offering.length > 1 ? "s" : ""} available`,
          playerId: player.id,
          status: "ACTIVE",
          priceType,
          donationAmount: priceType === "DONATION" ? Math.floor(Math.random() * 50 + 5) : null,
          expiresAt,
        },
      });

      for (const art of offering) {
        await prisma.listingArtifact.create({
          data: {
            listingId: listing.id,
            artifactId: art.id,
            role: ArtifactRole.OFFERING,
          },
        });
      }

      // Only add wanting artifacts for TRADE type
      if (priceType === "TRADE") {
        for (const art of wanting) {
          await prisma.listingArtifact.create({
            data: {
              listingId: listing.id,
              artifactId: art.id,
              role: ArtifactRole.WANTING,
            },
          });
        }
      }
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
