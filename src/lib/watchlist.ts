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
  window.dispatchEvent(new Event("steam-dealz-watchlist-changed"));
}

export function useWatchlist() {
  const [items, setItems] = useState<SteamDeal[]>(() => loadWatchlist());

  useEffect(() => {
    setItems(loadWatchlist());
    const reload = () => setItems(loadWatchlist());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("steam-dealz-watchlist-changed", reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("steam-dealz-watchlist-changed", reload);
    };
  }, []);

  const isWatched = useCallback(
    (appId: string) => items.some((g) => g.appId === appId),
    [items],
  );

  const toggle = useCallback(
    (game: SteamDeal) => {
      const next = items.some((g) => g.appId === game.appId)
        ? items.filter((g) => g.appId !== game.appId)
        : [...items, game];
      persist(next);
      setItems(next);
    },
    [items],
  );

  const remove = useCallback(
    (appId: string) => {
      const next = items.filter((g) => g.appId !== appId);
      persist(next);
      setItems(next);
    },
    [items],
  );

  const clear = useCallback(() => {
    persist([]);
    setItems([]);
  }, []);

  return { items, isWatched, toggle, remove, clear, count: items.length };
}
