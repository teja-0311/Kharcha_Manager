"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchExpenses } from "@/lib/api";
import { ExpenseDTO, GetExpensesParams } from "@/lib/types";

interface UseExpensesReturn {
  expenses: ExpenseDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useExpenses(params: GetExpensesParams): UseExpensesReturn {
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track latest fetch to avoid stale updates when params change rapidly
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses(params);
      if (id === fetchIdRef.current) {
        setExpenses(data);
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.category, params.sort]);

  useEffect(() => {
    load();
  }, [load]);

  return { expenses, loading, error, refresh: load };
}
