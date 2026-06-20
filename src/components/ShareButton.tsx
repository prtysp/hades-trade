"use client";

import { useState } from "react";

interface ShareButtonProps {
  listingId: string;
  discordUsername?: string | null;
}

export default function ShareButton({ listingId, discordUsername }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDiscord, setShowDiscord] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/listings/${listingId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("textarea");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToDiscord = () => {
    if (discordUsername) {
      window.open(`https://discord.com/users/${discordUsername}`, "_blank");
    } else {
      setShowDiscord(true);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this trade listing: ${shareUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out this trade listing")}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-[var(--text)] transition flex items-center gap-1.5"
        title="Share listing"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setShowMenu(false); setShowDiscord(false); }} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-[var(--var(--border))] bg-[var(--bg-card)] shadow-xl p-2 space-y-1">
            <button
              type="button"
              onClick={() => { copyLink(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text)] transition"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Copy Link
                </>
              )}
            </button>
            <div className="border-t border-[var(--border)] pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text)] transition"
                onClick={() => setShowMenu(false)}
              >
                <span className="text-base">📱</span>
                WhatsApp
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text)] transition"
                onClick={() => setShowMenu(false)}
              >
                <span className="text-base">✈️</span>
                Telegram
              </a>
              <button
                type="button"
                onClick={() => { shareToDiscord(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text)] transition"
              >
                <span className="text-base">💬</span>
                Discord
              </button>
            </div>
          </div>

          {showDiscord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDiscord(false)}>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Discord Username Not Set</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Set your Discord username in your profile settings to enable direct Discord sharing.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDiscord(false)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:border-[var(--border-hover)] transition"
                  >
                    Close
                  </button>
                  <a
                    href="/settings"
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition"
                  >
                    Go to Settings
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
