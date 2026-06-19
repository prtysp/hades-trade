import { prisma } from "./prisma";

/**
 * Archives all listings whose expiration date has passed.
 * The associated artifacts remain in the player's active inventory
 * (they were never traded, the listing just expired).
 * Returns the number of archived listings.
 */
export async function archiveExpiredListings(): Promise<number> {
  const result = await prisma.listing.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() },
    },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  });
  return result.count;
}
