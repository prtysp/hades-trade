"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Login failed");
      }

      const redirectTo = searchParams.get("redirect") ?? "/";
      window.location.href = redirectTo;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-3 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
          placeholder="Enter your username"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-[var(--border)] bg-slate-800 px-3 py-2.5 text-[var(--text)] placeholder-[var(--text-dim)] focus:border-[var(--border-focus)] focus:outline-none"
          placeholder="Enter your password"
        />
      </div>

      {error && <p className="text-sm text-[var(--red)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm sm:max-w-md">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2">Sign In</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Welcome back to Hades Star Market</p>

        <Suspense fallback={<p className="text-sm text-[var(--text-dim)]">Loading…</p>}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--amber)] hover:text-[var(--accent-text)] transition">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
