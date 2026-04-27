"use client";

import Link from "next/link";
import { useState } from "react";
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { useAuth } from "@/hooks/useAuth";
import type { ExpenseDTO } from "@/lib/types";

export default function HomePage() {
  const { user, checking, submitting, error, logout } = useAuth();

  // Increment to signal ExpenseList to refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseAdded = (_expense: ExpenseDTO) => {
    setRefreshTrigger((n) => n + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <header className="border-b border-paper-dark bg-paper-warm/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">₹</span>
            <span className="font-display text-xl font-bold text-ink tracking-tight">
              Kharcha Manager
            </span>
          </div>
          <div className="flex items-center gap-3">
            {checking ? (
              <span className="text-xs text-ink-muted">Checking session…</span>
            ) : user ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-paper-dark bg-white/70 px-2 py-1 shadow-sm">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper text-xs font-semibold">
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="text-xs text-ink-muted hidden sm:block">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow-sm transition hover:bg-ink-light disabled:opacity-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow-sm transition hover:bg-ink-light"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-tight">
            Where&apos;s your
            <br />
            <span className="text-accent">money going?</span>
          </h1>
          <p className="text-ink-muted mt-2 text-base font-light">
            Record and review your personal expenses with clarity.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-6">
            ⚠️ {error}
          </div>
        )}

        {checking ? (
          <div className="bg-paper-warm border border-paper-dark rounded-2xl p-6 text-sm text-ink-muted">
            Checking your session…
          </div>
        ) : !user ? (
          <div className="bg-paper-warm border border-paper-dark rounded-2xl p-6">
            <p className="text-ink font-semibold">Sign in to continue</p>
            <p className="text-ink-muted text-sm mt-1">
              Your privacy matters to us.
              Expenses are private and only visible after login.
            </p>
            <Link
              href="/login"
              className="inline-flex mt-4 px-4 py-2 rounded-lg bg-ink text-paper text-sm font-semibold"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            {/* Left: Form */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <AddExpenseForm onSuccess={handleExpenseAdded} />
            </div>

            {/* Right: List */}
            <div>
              <ExpenseList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 mt-8 border-t border-paper-dark">
        <p className="text-xs text-ink-muted text-center">
          Kharcha Manager
        </p>
      </footer>
    </div>
  );
}
