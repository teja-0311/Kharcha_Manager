"use client";

import { useState, useId } from "react";
import { v4 as uuidv4 } from "uuid";
import { createExpense } from "@/lib/api";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/types";
import type { ExpenseDTO } from "@/lib/types";

interface AddExpenseFormProps {
  onSuccess: (expense: ExpenseDTO) => void;
}

export default function AddExpenseForm({ onSuccess }: AddExpenseFormProps) {
  const formId = useId();
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Stable idempotency key per form "session" — regenerated after success.
  // Stored in state so it survives re-renders but is fresh per submission intent.
  const [idempotencyKey, setIdempotencyKey] = useState(() => uuidv4());

  const reset = () => {
    setAmount("");
    setDescription("");
    setDate(today);
    setCategory(CATEGORIES[0]);
    setIdempotencyKey(uuidv4()); // new key for next submission
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    // Client-side validation
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setSubmitting(true);
    try {
      const expense = await createExpense({
        idempotencyKey,
        amount: parsedAmount.toFixed(2),
        category,
        description,
        date,
      });
      setSuccess(true);
      onSuccess(expense);
      setTimeout(reset, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-paper-warm border border-paper-dark rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-ink px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">➕</span>
        <div>
          <h2 className="font-display text-xl text-paper font-bold tracking-tight">
            Add Expense
          </h2>
          <p className="text-ink-muted text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.5)" }}>
            All fields required
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Amount */}
        <div>
          <label
            htmlFor={`${formId}-amount`}
            className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5"
          >
            Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-mono text-sm font-semibold">
              ₹
            </span>
            <input
              id={`${formId}-amount`}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-paper-dark rounded-lg font-mono text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor={`${formId}-category`}
            className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5"
          >
            Category
          </label>
          <select
            id={`${formId}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor={`${formId}-desc`}
            className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5"
          >
            Description
          </label>
          <input
            id={`${formId}-desc`}
            type="text"
            placeholder="What did you spend on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={500}
            className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
          />
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor={`${formId}-date`}
            className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-1.5"
          >
            Date
          </label>
          <input
            id={`${formId}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            required
            className="w-full px-3 py-2.5 bg-white border border-paper-dark rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition cursor-pointer"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 ${
            success
              ? "bg-jade text-white cursor-default"
              : submitting
              ? "bg-ink-light text-paper-dark cursor-not-allowed"
              : "bg-accent hover:bg-accent-hover text-white shadow-sm hover:shadow-md active:scale-[0.98]"
          }`}
        >
          {success ? "✓ Saved!" : submitting ? "Saving…" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
