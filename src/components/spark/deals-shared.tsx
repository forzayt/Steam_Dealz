import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, AlertCircle, Bookmark, ExternalLink, Gamepad2, MoreHorizontal } from "lucide-react";

import { getSteamDeals, type SteamCountry, type SteamDeal } from "@/lib/steam-deals.functions";
import { useWatchlist } from "@/lib/watchlist";

export const REGION_NAMES: Record<SteamCountry, string> = {
  IN: "India · INR",
  US: "United States · USD",
  GB: "United Kingdom · GBP",
  DE: "Germany · EUR",
  JP: "Japan · JPY",
  BR: "Brazil · BRL",
  AU: "Australia · AUD",
  CA: "Canada · CAD",
  TR: "Türkiye · TRY",
};

export function useSteamDeals(country: SteamCountry, activeTerm: string) {
  const fetchSteamDeals = useServerFn(getSteamDeals);
  const [games, setGames] = useState<SteamDeal[]>([]);
  const [nextStart, setNextStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setGames([]);
    setNextStart(0);
    setHasMore(false);
    setTotalCount(0);
    fetchSteamDeals({ data: { country, start: 0, term: activeTerm } })
      .then((result) => {
        if (!active) return;
        setGames(result.games);
        setNextStart(result.nextStart);
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
        setLastUpdated(result.fetchedAt);
      })
      .catch(() => {
        if (active)
          setError(
            activeTerm
              ? `No Steam results for “${activeTerm}” could be reached. Please try again.`
              : "Steam's deal list could not be reached. Please try again in a moment.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [country, activeTerm, fetchSteamDeals]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSteamDeals({ data: { country, start: 0, refresh: true, term: activeTerm } });
      setGames(result.games);
      setNextStart(result.nextStart);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setLastUpdated(result.fetchedAt);
    } catch {
      setError("Steam's deal list could not be refreshed. Your last results are still available.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    setError("");
    try {
      const result = await fetchSteamDeals({ data: { country, start: nextStart, term: activeTerm } });
      setGames((current) => {
        const seen = new Set(current.map((g) => g.appId));
        const fresh = result.games.filter((g) => !seen.has(g.appId));
        if (activeTerm) return [...current, ...fresh];
        return [...current, ...fresh].sort(
          (a, b) => Number(a.isFree) - Number(b.isFree) || a.currentPriceAmount - b.currentPriceAmount,
        );
      });
      setNextStart(result.nextStart);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setLastUpdated(result.fetchedAt);
    } catch {
      setError("More Steam deals could not be loaded. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const paidDeals = useMemo(() => games.filter((g) => !g.isFree), [games]);
  const freeOffers = useMemo(() => games.filter((g) => g.isFree), [games]);

  return { games, paidDeals, freeOffers, nextStart, hasMore, totalCount, loading, loadingMore, error, setError, lastUpdated, refresh, loadMore };
}

export function useDebouncedTerm(q: string) {
  const trimmed = q.trim().slice(0, 100);
  const [debounced, setDebounced] = useState(trimmed);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), 400);
    return () => clearTimeout(t);
  }, [trimmed]);
  return { trimmedQuery: trimmed, activeTerm: debounced, isSearching: trimmed !== debounced };
}

export function DealRow({ game }: { game: SteamDeal }) {
  return (
    <article className="deal-row">
      <a href={game.storeUrl} target="_blank" rel="noreferrer" className="deal-thumb" aria-label={`View ${game.title} on Steam`}>
        <img src={game.coverUrl} alt={`${game.title} cover`} loading="lazy" />
        {game.discountPercent > 0 ? <span className="deal-discount">-{game.discountPercent}%</span> : null}
      </a>
      <div className="deal-info">
        <div className="deal-name">
          <a href={game.storeUrl} target="_blank" rel="noreferrer">
            {game.title}
          </a>
          <ArrowUpRight size={14} className="flex-none text-[#9aa9a1]" />
        </div>
        <p className="deal-sub">
          {game.discountPercent > 0 ? (
            <>
              <s>{game.originalPrice}</s>
              <span>·</span>
              <span>Steam price</span>
            </>
          ) : (
            "Steam price"
          )}
        </p>
      </div>
      <span className={`deal-price${game.isFree ? " free" : ""}`}>{game.currentPrice}</span>
    </article>
  );
}

function portraitUrl(game: SteamDeal): string {
  if (!game.appId) return game.coverUrl;
  return `https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/library_600x900.jpg`;
}

export function WatchButton({ game }: { game: SteamDeal }) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(game.appId);
  return (
    <button
      type="button"
      className={`deal-card-watch${watched ? " active" : ""}`}
      aria-pressed={watched}
      aria-label={watched ? `Remove ${game.title} from watch list` : `Add ${game.title} to watch list`}
      title={watched ? "Remove from watch list" : "Add to watch list"}
      onClick={() => toggle(game)}
    >
      <Bookmark size={15} fill={watched ? "currentColor" : "none"} />
    </button>
  );
}

export function DealCard({ game }: { game: SteamDeal }) {
  const portrait = portraitUrl(game);
  const [src, setSrc] = useState(portrait);
  useEffect(() => {
    setSrc(portrait);
  }, [portrait]);

  return (
    <article className="deal-card">
      <a
        href={game.storeUrl}
        target="_blank"
        rel="noreferrer"
        className="deal-card-media"
        aria-label={`View ${game.title} on Steam`}
      >
        <img
          src={src}
          onError={() => {
            if (src !== game.coverUrl) setSrc(game.coverUrl);
          }}
          alt={`${game.title} cover`}
          loading="lazy"
        />
        {game.discountPercent > 0 ? <span className="deal-discount">-{game.discountPercent}%</span> : null}
        {game.isFree ? <span className="deal-free">FREE</span> : null}
      </a>
      <div className="deal-card-body">
        <div className="deal-card-top">
          <h3 className="deal-card-title" title={game.title}>
            <a href={game.storeUrl} target="_blank" rel="noreferrer">
              {game.title}
            </a>
          </h3>
          <div className="flex flex-none items-center gap-0.5">
            <WatchButton game={game} />
            <a
              href={game.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="deal-card-more"
              aria-label={`More options for ${game.title}`}
              title="View on Steam"
            >
              <MoreHorizontal size={16} />
            </a>
          </div>
        </div>
        <p className="deal-card-meta">
          {game.discountPercent > 0 ? (
            <>
              <s>{game.originalPrice}</s>
              <span aria-hidden="true">·</span>
              <span>Steam price</span>
            </>
          ) : (
            "Steam price"
          )}
        </p>
        <div className="deal-card-foot">
          <span className={`deal-price${game.isFree ? " free" : ""}`}>{game.currentPrice}</span>
          <a
            href={game.storeUrl}
            target="_blank"
            rel="noreferrer"
            className="deal-card-open"
            aria-label={`Open ${game.title} store page`}
          >
            <ExternalLink size={13} />
            <span>Store</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="deal-card" aria-hidden="true">
      <div className="deal-card-media spark-skeleton" />
      <div className="deal-card-body">
        <div className="spark-skeleton h-4 w-4/5" />
        <div className="spark-skeleton h-3 w-3/5" />
        <div className="spark-skeleton h-7 w-20" />
      </div>
    </div>
  );
}

export function ProgressRow({ label, value, width, color, muted }: { label: string; value: number; width: number; color: string; muted?: boolean }) {
  return (
    <div className="progress-container">
      <div className="progress-label-row">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value}</span>
      </div>
      <div className="progress" role="progressbar" aria-label={label} aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${Math.min(100, width)}%`, background: color, opacity: muted ? 0.55 : 1 }} />
      </div>
    </div>
  );
}

export function EmptyState({ searching, hasError, term }: { searching: boolean; hasError: boolean; term?: string }) {
  return (
    <div className="spark-empty">
      {hasError ? (
        <AlertCircle size={28} className="mx-auto mb-2 text-[#ef4444]" />
      ) : (
        <Gamepad2 size={28} className="mx-auto mb-2 text-[#6c7e75]" />
      )}
      <h3 className="font-bold">{hasError ? "Deals unavailable" : searching ? `No results for “${term}”` : "No discounted games found"}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#6c7e75]">
        {hasError
          ? "The official Store could not be reached. Retry or come back shortly."
          : searching
            ? "Steam found nothing for that title in this region. Try another spelling."
            : "No active paid discounts in the loaded Steam results for this region right now."}
      </p>
    </div>
  );
}
