"use client";

import Link from "next/link";
import { useArtifactContext } from "@/components/ArtifactContext";
import CreateListingForm from "@/components/CreateListingForm";
import ListingCardWithDelete from "@/components/ListingCardWithDelete";

interface Listing {
  id: string;
  description: string | null;
  priceType: string;
  donationAmount: number | null;
  expiresAt: Date | string;
  listingArtifacts: {
    artifact: { id: string; category: string; bonusPct: number; level: number };
    role: string;
  }[];
}

interface PlayerListingsClientProps {
  listings: Listing[];
  isOwnProfile: boolean;
}

export default function PlayerListingsClient({ listings, isOwnProfile }: PlayerListingsClientProps) {
  const { artifacts: _artifacts } = useArtifactContext();

  return (
    <>
      {isOwnProfile && (
        <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Create New Listing</h3>
          <CreateListingForm />
        </div>
      )}

      {listings.length === 0 ? (
        <p className="text-sm text-[var(--text-dim)]">No active listings.</p>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
          {listings.map((listing) => (
            <ListingCardWithDelete
              key={listing.id}
              listing={listing as any}
              isOwnProfile={isOwnProfile}
            />
          ))}
        </div>
      )}
    </>
  );
}
