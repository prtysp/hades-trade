"use client";

import { useState } from "react";

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  confirmMessage?: string;
  className?: string;
}

export default function DeleteButton({ onDelete, confirmMessage = "Delete this item?", className = "" }: DeleteButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className={`h-8 w-8 rounded-lg bg-[var(--red)] text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Delete"
    >
      {deleting ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
          <path d="M7 1a6 6 0 1 1-4.24 1.76" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 4h10M5 4V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M3 4v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4M6 7v3M8 7v3" />
        </svg>
      )}
    </button>
  );
}
