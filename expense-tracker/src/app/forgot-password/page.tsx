"use client";

import Link from "next/link";
import { useState } from "react";
import { changePassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await changePassword({
        email: email.trim(),
        newPassword,
      });
      setMessage("Password updated. You can now sign in.");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-paper-warm border border-paper-dark rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-ink px-6 py-4">
          <h1 className="font-display text-2xl text-paper font-bold tracking-tight">
            Forgot password
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.6)" }}>
            Update your password using your email address.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
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
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-semibold text-sm bg-accent hover:bg-accent-hover text-white disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>

          {(message || error) && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                error
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              }`}
            >
              {error ?? message}
            </div>
          )}

          <div className="text-xs text-ink-muted text-center">
            <Link href="/login" className="underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
