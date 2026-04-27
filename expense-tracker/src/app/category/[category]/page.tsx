"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, ExpenseDTO } from "@/lib/types";

interface CategoryPageProps {
  params: { category: string };
}

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CategoryExpenses({ category }: { category: string }) {
  const params = useMemo(() => ({ category, sort: "date_desc" as const }), [category]);
  const { expenses, loading, error, refresh } = useExpenses(params);

  const total = useMemo(
    () =>
      expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2),
    [expenses]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink-muted">
          {loading ? "Loading expenses…" : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-2 rounded-lg border border-paper-dark bg-white text-ink text-xs hover:bg-paper transition disabled:opacity-50"
        >
          {loading ? "⟳" : "↻"} Refresh
        </button>
      </div>

      <div className="bg-ink rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(245,240,232,0.45)" }}>
          Total (All time)
        </p>
        <p className="font-display text-3xl font-bold text-paper mt-1">
          {loading ? <span className="opacity-40 text-2xl">Calculating…</span> : formatCurrency(total)}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={refresh} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      <div className="bg-paper-warm border border-paper-dark rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-paper-dark">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-4 animate-pulse">
                <div className="h-3.5 bg-paper-dark rounded w-2/3 mb-2" />
                <div className="h-2.5 bg-paper-dark rounded w-1/2 opacity-60" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-ink font-semibold">No expenses found</p>
            <p className="text-ink-muted text-sm mt-1">
              Add a new expense to see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-paper-dark">
            {expenses.map((expense) => (
              <ExpenseDetails key={expense._id} expense={expense} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExpenseDetails({ expense }: { expense: ExpenseDTO }) {
  return (
    <div className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{expense.description}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            {CATEGORY_ICONS[expense.category]} {expense.category}
          </p>
        </div>
        <span className="text-sm font-mono font-bold text-ink">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-muted">
        <div>
          <span className="font-semibold text-ink">Date:</span>{" "}
          {formatDateTime(expense.date)}
        </div>
        <div>
          <span className="font-semibold text-ink">Created:</span>{" "}
          {formatDateTime(expense.createdAt)}
        </div>
        <div>
          <span className="font-semibold text-ink">Updated:</span>{" "}
          {formatDateTime(expense.updatedAt)}
        </div>
        <div>
          <span className="font-semibold text-ink">Expense ID:</span>{" "}
          <span className="font-mono">{expense._id}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="font-semibold text-ink">Idempotency Key:</span>{" "}
          <span className="font-mono break-all">{expense.idempotencyKey}</span>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { user, checking } = useAuth();
  const rawCategory = params.category;
  const categoryName = useMemo(() => {
    try {
      return decodeURIComponent(rawCategory);
    } catch {
      return rawCategory;
    }
  }, [rawCategory]);

  const isValidCategory = CATEGORIES.includes(categoryName as (typeof CATEGORIES)[number]);
  const categoryColor = CATEGORY_COLORS[categoryName] ?? CATEGORY_COLORS["Other"];
  const categoryIcon = CATEGORY_ICONS[categoryName] ?? CATEGORY_ICONS["Other"];

  return (
    <div className="min-h-screen">
      <header className="border-b border-paper-dark bg-paper-warm/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">₹</span>
            <span className="font-display text-xl font-bold text-ink tracking-tight">
              Kharcha Manager
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow-sm transition hover:bg-ink-light"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${categoryColor}`}>
            <span className="text-base">{categoryIcon}</span>
            {categoryName}
          </span>
          <span className="text-xs text-ink-muted uppercase tracking-widest">Category details</span>
        </div>

        {!isValidCategory ? (
          <div className="bg-paper-warm border border-paper-dark rounded-2xl p-6 text-sm text-ink-muted">
            This category doesn&apos;t exist. Choose a category from the home page.
          </div>
        ) : checking ? (
          <div className="bg-paper-warm border border-paper-dark rounded-2xl p-6 text-sm text-ink-muted">
            Checking your session…
          </div>
        ) : !user ? (
          <div className="bg-paper-warm border border-paper-dark rounded-2xl p-6">
            <p className="text-ink font-semibold">Sign in to view category expenses</p>
            <p className="text-ink-muted text-sm mt-1">
              Your expenses are private and only visible after login.
            </p>
            <Link
              href="/login"
              className="inline-flex mt-4 px-4 py-2 rounded-lg bg-ink text-paper text-sm font-semibold"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <CategoryExpenses category={categoryName} />
        )}
      </main>
    </div>
  );
}
