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
      className={`rounded-md bg-[var(--red-bg)] px-2 py-1 text-xs font-medium text-[var(--red)] hover:bg-[var(--red-bg)] transition disabled:opacity-50 ${className}`}
      title="Delete"
    >
      {deleting ? "…" : "✕"}
    </button>
  );
}
