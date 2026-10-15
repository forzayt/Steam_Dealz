import { useCallback, useEffect, useState } from "react";

import type { SteamDeal } from "@/lib/steam-deals.functions";

const STORAGE_KEY = "steam-dealz-watchlist";

export function loadWatchlist(): SteamDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SteamDeal =>
        !!item &&
        typeof item === "object" &&
        typeof (item as SteamDeal).appId === "string" &&
        typeof (item as SteamDeal).title === "string",
    );
  } catch {
    return [];
  }
}

function persist(items: SteamDeal[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full or unavailable — watchlist stays in memory */
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<SteamDeal[]>(() => loadWatchlist());

  useEffect(() => {
    setItems(loadWatchlist());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadWatchlist());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isWatched = useCallback(
    (appId: string) => items.some((g) => g.appId === appId),
    [items],
  );

  const toggle = useCallback((game: SteamDeal) => {
    setItems((current) => {
      const next = current.some((g) => g.appId === game.appId)
        ? current.filter((g) => g.appId !== game.appId)
        : [...current, game];
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((appId: string) => {
    setItems((current) => {
      const next = current.filter((g) => g.appId !== appId);
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persist([]);
    setItems([]);
  }, []);

  return { items, isWatched, toggle, remove, clear, count: items.length };
}
