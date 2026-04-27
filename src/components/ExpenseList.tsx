"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { deleteExpense, updateExpense } from "@/lib/api";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  ExpenseDTO,
} from "@/lib/types";

interface ExpenseListProps {
  // When a new expense is added from the form, parent passes it here
  // so we can trigger a refresh
  refreshTrigger: number;
}

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PIE_COLORS = [
  "#F8B4B4", // soft coral
  "#FAD7A0", // peach
  "#A7D8F5", // pastel blue
  "#C7B9F1", // lavender
  "#BFE6C4", // mint
];

const PIE_CENTER = 60;
const PIE_RADIUS = 52;

function polarToCartesian(angle: number) {
  return {
    x: PIE_CENTER + PIE_RADIUS * Math.cos(angle - Math.PI / 2),
    y: PIE_CENTER + PIE_RADIUS * Math.sin(angle - Math.PI / 2),
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return [
    `M ${PIE_CENTER} ${PIE_CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export default function ExpenseList({ refreshTrigger }: ExpenseListProps) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<"date_desc" | "date_asc">("date_desc");
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<string>(CATEGORIES[0]);
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const params = useMemo(
    () => ({ category: categoryFilter, sort }),
    [categoryFilter, sort]
  );

  const { expenses, loading, error, refresh } = useExpenses(params);

  // Refresh when parent signals a new expense was added
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    refresh();
  }, [refreshTrigger, refresh]);

  useEffect(() => {
    if (!editingExpense) return;
    setEditAmount(editingExpense.amount);
    setEditCategory(editingExpense.category);
    setEditDescription(editingExpense.description);
    setEditDate(editingExpense.date.split("T")[0] ?? "");
    setEditError(null);
  }, [editingExpense]);

  // Total of current visible list — computed client-side from returned data
  const total = useMemo(
    () =>
      expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2),
    [expenses]
  );

  // Per-category breakdown for summary view
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + parseFloat(e.amount);
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [expenses]);

  const pieData = useMemo(() => {
    const items = categoryBreakdown.map(([cat, amt], index) => ({
      category: cat,
      amount: amt,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    if (totalAmount <= 0) {
      return { totalAmount: 0, slices: [] as Array<typeof items[number] & { start: number; end: number }> };
    }
    let cursor = 0;
    const slices = items.map((item) => {
      const start = (cursor / totalAmount) * Math.PI * 2;
      cursor += item.amount;
      const end = (cursor / totalAmount) * Math.PI * 2;
      return { ...item, start, end };
    });
    return { totalAmount, slices };
  }, [categoryBreakdown]);

  const hoveredSlice = useMemo(
    () => pieData.slices.find((slice) => slice.category === hoveredCategory) ?? null,
    [hoveredCategory, pieData.slices]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="bg-paper-warm border border-paper-dark rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          {/* Category filter */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
              Filter by Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat]} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
              Sort by Date
            </label>
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as "date_desc" | "date_asc")
              }
              className="w-full px-3 py-2 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-paper-dark bg-white text-ink text-sm hover:bg-paper transition disabled:opacity-50 self-end"
            title="Refresh"
          >
            {loading ? "⟳" : "↻"} Refresh
          </button>
        </div>
      </div>

      {/* Total + Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total */}
        <div className="bg-ink rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted" style={{ color: "rgba(245,240,232,0.45)" }}>
            Total
          </p>
          <p className="font-display text-3xl font-bold text-paper mt-1">
            {loading ? (
              <span className="opacity-40 text-2xl">Calculating…</span>
            ) : (
              formatCurrency(total)
            )}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.4)" }}>
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            {categoryFilter !== "all" ? ` in ${categoryFilter}` : ""}
          </p>
        </div>

        {/* Top categories */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-paper-warm border border-paper-dark rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">
              Top Categories
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <svg
                  viewBox="0 0 120 120"
                  className="h-40 w-40"
                  role="img"
                  aria-label="Top categories chart"
                >
                  {pieData.slices.length === 1 ? (
                    <circle
                      cx={PIE_CENTER}
                      cy={PIE_CENTER}
                      r={PIE_RADIUS}
                      fill={pieData.slices[0].color}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                      onMouseEnter={() => setHoveredCategory(pieData.slices[0].category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onFocus={() => setHoveredCategory(pieData.slices[0].category)}
                      onBlur={() => setHoveredCategory(null)}
                      onClick={() =>
                        router.push(
                          `/category/${encodeURIComponent(pieData.slices[0].category)}`
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(
                            `/category/${encodeURIComponent(pieData.slices[0].category)}`
                          );
                        }
                      }}
                    >
                      <title>
                        {pieData.slices[0].category}: {formatCurrency(pieData.slices[0].amount.toFixed(2))}
                      </title>
                    </circle>
                  ) : (
                    pieData.slices.map((slice) => (
                      <path
                        key={slice.category}
                        d={describeArc(slice.start, slice.end)}
                        fill={slice.color}
                        className="cursor-pointer transition-opacity hover:opacity-90"
                        onMouseEnter={() => setHoveredCategory(slice.category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        onFocus={() => setHoveredCategory(slice.category)}
                        onBlur={() => setHoveredCategory(null)}
                        onClick={() =>
                          router.push(`/category/${encodeURIComponent(slice.category)}`)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(
                              `/category/${encodeURIComponent(slice.category)}`
                            );
                          }
                        }}
                      >
                        <title>
                          {slice.category}: {formatCurrency(slice.amount.toFixed(2))}
                        </title>
                      </path>
                    ))
                  )}
                </svg>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                {(hoveredSlice || categoryFilter !== "all") && (
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {hoveredSlice
                        ? `${CATEGORY_ICONS[hoveredSlice.category]} ${hoveredSlice.category}`
                        : `${CATEGORY_ICONS[categoryFilter] ?? ""} ${categoryFilter}`}
                    </p>
                    <p className="text-sm font-mono font-semibold text-ink mt-1">
                      {hoveredSlice
                        ? formatCurrency(hoveredSlice.amount.toFixed(2))
                        : formatCurrency(pieData.totalAmount.toFixed(2))}
                    </p>
                  </div>
                )}
              </div>
              </div>
              <div className="text-xs text-ink-muted space-y-2">
                <p>Hover a slice to see the amount.</p>
                <p>Click a slice to view that category.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button onClick={refresh} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-paper-warm border border-paper-dark rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 bg-paper-dark border-b border-paper-dark">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-xs font-bold uppercase tracking-widest text-ink-muted">
            <span>Description</span>
            <span className="hidden sm:block">Category</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-paper-dark">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-4 animate-pulse">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                  <div>
                    <div className="h-3.5 bg-paper-dark rounded w-3/5 mb-1.5" />
                    <div className="h-2.5 bg-paper-dark rounded w-2/5 opacity-60" />
                  </div>
                  <div className="hidden sm:block h-5 bg-paper-dark rounded-full w-20" />
                  <div className="h-3 bg-paper-dark rounded w-16" />
                  <div className="h-4 bg-paper-dark rounded w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-ink font-semibold">No expenses found</p>
            <p className="text-ink-muted text-sm mt-1">
              {categoryFilter !== "all"
                ? "Try a different category filter"
                : "Add your first expense above"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-paper-dark">
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense._id}
                expense={expense}
                onClick={() => setEditingExpense(expense)}
              />
            ))}
          </div>
        )}
      </div>

      {editingExpense && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg bg-paper-warm border border-paper-dark rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-paper-dark flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-muted uppercase tracking-widest">
                  Edit expense
                </p>
                <p className="text-sm font-semibold text-ink mt-1">
                  {editingExpense.description}
                </p>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-ink-muted hover:text-ink text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!editingExpense) return;
                setEditError(null);

                const parsedAmount = parseFloat(editAmount);
                if (isNaN(parsedAmount) || parsedAmount <= 0) {
                  setEditError("Please enter a valid positive amount.");
                  return;
                }
                if (!editDescription.trim()) {
                  setEditError("Please enter a description.");
                  return;
                }
                if (!editDate) {
                  setEditError("Please select a date.");
                  return;
                }

                setSaving(true);
                try {
                  await updateExpense(editingExpense._id, {
                    amount: parsedAmount.toFixed(2),
                    category: editCategory,
                    description: editDescription.trim(),
                    date: editDate,
                  });
                  setEditingExpense(null);
                  refresh();
                } catch (err) {
                  setEditError(
                    err instanceof Error ? err.message : "Update failed."
                  );
                } finally {
                  setSaving(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg font-mono text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition cursor-pointer"
                  required
                />
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
                  ⚠️ {editError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!editingExpense || deleting) return;
                    const confirmed = window.confirm(
                      "Delete this expense? This cannot be undone."
                    );
                    if (!confirmed) return;
                    setDeleting(true);
                    setEditError(null);
                    try {
                      await deleteExpense(editingExpense._id);
                      setEditingExpense(null);
                      refresh();
                    } catch (err) {
                      setEditError(
                        err instanceof Error ? err.message : "Delete failed."
                      );
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                  disabled={saving || deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="px-4 py-2 rounded-lg border border-paper-dark bg-white text-ink text-sm hover:bg-paper transition"
                    disabled={saving || deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-sm disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseRow({
  expense,
  onClick,
}: {
  expense: ExpenseDTO;
  onClick: () => void;
}) {
  const colorClass =
    CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS["Other"];

  return (
    <div
      className="px-4 py-3.5 hover:bg-paper transition-colors duration-100 animate-fade-in cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
        {/* Description + category (mobile) */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">
            {expense.description}
          </p>
          <p className="text-xs text-ink-muted mt-0.5 sm:hidden">
            {CATEGORY_ICONS[expense.category]} {expense.category}
          </p>
        </div>

        {/* Category pill (desktop) */}
        <div className="hidden sm:block">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}
          >
            {CATEGORY_ICONS[expense.category]}
            {expense.category}
          </span>
        </div>

        {/* Date */}
        <span className="text-xs text-ink-muted whitespace-nowrap tabular-nums">
          {formatDate(expense.date)}
        </span>

        {/* Amount */}
        <span className="text-sm font-mono font-bold text-ink text-right whitespace-nowrap">
          {formatCurrency(expense.amount)}
        </span>
      </div>
    </div>
  );
}
