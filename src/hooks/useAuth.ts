import { useCallback, useEffect, useState } from "react";
import { fetchMe, loginUser, logoutUser, registerUser } from "@/lib/api";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/lib/types";

interface UseAuthReturn {
  user: AuthUser | null;
  checking: boolean;
  submitting: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setChecking(true);
    try {
      const me = await fetchMe();
      setUser(me);
    } catch (err) {
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const me = await loginUser(payload);
      setUser(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const me = await registerUser(payload);
      setUser(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { user, checking, submitting, error, login, register, logout };
}
