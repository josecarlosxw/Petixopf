"use client";
import * as React from "react";
import type { User } from "firebase/auth";
import { ensureAnonymousAuth } from "@/lib/firebase/client";

export function useAnonymousAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    ensureAnonymousAuth()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Falha ao autenticar.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading: !user && !error, error };
}
