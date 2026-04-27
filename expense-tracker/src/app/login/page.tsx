"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { user, checking, submitting, error, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!checking && user) {
      router.push("/");
    }
  }, [checking, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError("Email is required.");
      return;
    }
    if (!password) {
      setLocalError("Password is required.");
      return;
    }
    if (mode === "register" && password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    if (mode === "login") {
      await login({ email: trimmedEmail, password });
    } else {
      await register({ email: trimmedEmail, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-paper-warm border border-paper-dark rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-ink px-6 py-4">
          <h1 className="font-display text-2xl text-paper font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.6)" }}>
            Sign in to keep your expenses private.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                mode === "login"
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-paper-dark"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                mode === "register"
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-paper-dark"
              }`}
            >
              Create account
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
              placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-xs underline underline-offset-4 text-ink-muted">
                Forgot password?
              </Link>
            </div>
          </div>

          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
              ⚠️ {localError ?? error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking || submitting}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-wide bg-accent hover:bg-accent-hover text-white shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>

          <div className="text-xs text-ink-muted text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow-sm transition hover:bg-ink-light"
            >
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
