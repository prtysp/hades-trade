import { prisma } from "./prisma";

/**
 * Archives all listings whose expiration date has passed.
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
