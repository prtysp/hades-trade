"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [corporation, setCorporation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, corporation }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Registration failed");
      }

      window.location.href = "/";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm sm:max-w-md">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2">Create Account</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Join Hades Star Market to start trading artifacts</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              autoComplete="username"
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-3 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Corporation</label>
            <input
              type="text"
              value={corporation}
              onChange={(e) => setCorporation(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-3 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
              placeholder="Your corporation name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-3 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-3 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
              placeholder="Confirm your password"
            />
          </div>

          {error && <p className="text-sm text-[var(--red)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--amber)] hover:text-[var(--accent-text)] transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
