import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowUpRight, Gamepad2, LoaderCircle, RefreshCw, Search, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getSteamDeals,
  STEAM_COUNTRIES,
  type SteamCountry,
  type SteamDeal,
} from "@/lib/steam-deals.functions";

const REGION_NAMES: Record<SteamCountry, string> = {
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

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Steam Deals — Real Steam discounts, lowest first" },
      {
        name: "description",
        content: "Browse live discounts from the official Steam Store, compare real regional prices, and find your next game for less.",
      },
      { property: "og:title", content: "Steam Deals — Official Steam Store discounts" },
      {
        property: "og:description",
        content: "Live Steam Store deals sorted by regional discounted price, with no key marketplaces or estimated currency conversions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SteamDealsPage,
});

function SteamDealsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const fetchSteamDeals = useServerFn(getSteamDeals);
  const [country, setCountry] = useState<SteamCountry>("IN");
  const [games, setGames] = useState<SteamDeal[]>([]);
  const [nextStart, setNextStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
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

    fetchSteamDeals({ data: { country, start: 0 } })
      .then((result) => {
        if (!active) return;
        setGames(result.games);
        setNextStart(result.nextStart);
        setHasMore(result.hasMore);
        setLastUpdated(result.fetchedAt);
      })
      .catch(() => {
        if (active) setError("Steam's deal list could not be reached. Please try again in a moment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [country, fetchSteamDeals]);

  const matchingGames = useMemo(() => {
    const query = q.trim().toLocaleLowerCase();
    return games.filter((game) => !query || game.title.toLocaleLowerCase().includes(query));
  }, [games, q]);
  const paidDeals = matchingGames.filter((game) => !game.isFree);
  const freeOffers = matchingGames.filter((game) => game.isFree);

  const updateSearch = (value: string) => {
    void navigate({
      search: (previous) => ({ ...previous, q: value || undefined }),
      replace: true,
    });
  };

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSteamDeals({ data: { country, start: 0, refresh: true } });
      setGames(result.games);
      setNextStart(result.nextStart);
      setHasMore(result.hasMore);
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
      const result = await fetchSteamDeals({ data: { country, start: nextStart } });
      setGames((current) => {
        const seen = new Set(current.map((game) => game.appId));
        return [...current, ...result.games.filter((game) => !seen.has(game.appId))].sort(
          (first, second) => Number(first.isFree) - Number(second.isFree) || first.currentPriceAmount - second.currentPriceAmount,
        );
      });
      setNextStart(result.nextStart);
      setHasMore(result.hasMore);
      setLastUpdated(result.fetchedAt);
    } catch {
      setError("More Steam deals could not be loaded. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="steam-page">
      <header className="steam-topbar">
        <div className="steam-width flex min-h-[4.5rem] items-center justify-between gap-4">
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label="Steam Deals home">
            <span className="steam-brand-mark" aria-hidden="true"><Gamepad2 className="size-5" /></span>
            <span className="truncate text-lg font-bold">Steam <span className="text-steam-highlight">Deals</span></span>
          </a>
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span className="size-2 rounded-full bg-steam-deal" />
            Official Store prices
          </div>
        </div>
      </header>

      <section className="steam-width pb-12 pt-10 sm:pb-16 sm:pt-14">
        <div className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-steam-highlight">
            <Tag className="size-4" /> Live Steam discounts
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Good games. Better prices.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Current discounts from the Steam Store, ordered by the lowest price in your region.
          </p>
        </div>

        <div className="steam-search mb-5 flex items-center gap-3 px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            aria-label="Search games"
            className="h-full min-w-0 flex-1 text-sm"
            type="search"
            value={q}
            onChange={(event) => updateSearch(event.currentTarget.value)}
            placeholder="Search games in loaded deals"
          />
          {q && (
            <Button variant="ghost" size="sm" onClick={() => updateSearch("")} aria-label="Clear search">
              Clear
            </Button>
          )}
        </div>

        <div className="steam-controls mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Store region</span>
            <select
              aria-label="Store region"
              className="min-w-0 flex-1 px-3 text-sm sm:w-56 sm:flex-none"
              value={country}
              onChange={(event) => setCountry(event.currentTarget.value as SteamCountry)}
            >
              {STEAM_COUNTRIES.map((region) => (
                <option key={region} value={region}>{REGION_NAMES[region]}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Live prices"}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading} aria-label="Refresh deals">
              <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="flex-1 text-foreground">{error}</div>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>Retry</Button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold">Discounted games</h2>
            <p className="mt-1 text-xs text-muted-foreground">Lowest regional price first · {paidDeals.length} shown</p>
          </div>
          <span className="text-xs text-muted-foreground">{REGION_NAMES[country]}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading game deals" aria-busy="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="steam-game-card" aria-hidden="true">
                <div className="steam-cover steam-skeleton" />
                <div className="space-y-3 p-4">
                  <div className="steam-skeleton h-4 w-4/5 rounded-sm" />
                  <div className="steam-skeleton h-3 w-2/5 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : paidDeals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paidDeals.map((game) => <GameCard key={game.appId} game={game} />)}
          </div>
        ) : (
          <EmptyState searching={Boolean(q)} hasError={Boolean(error)} />
        )}

        {!loading && hasMore && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="lg" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore && <LoaderCircle className="size-4 animate-spin" />}
              {loadingMore ? "Loading deals" : "Load more deals"}
            </Button>
          </div>
        )}

        {!loading && freeOffers.length > 0 && (
          <section className="mt-12 border-t border-border pt-8" aria-labelledby="free-offers-heading">
            <div className="mb-4">
              <h2 id="free-offers-heading" className="text-lg font-bold">Free offers</h2>
              <p className="mt-1 text-xs text-muted-foreground">100% discounts are listed separately from paid deals.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {freeOffers.map((game) => <GameCard key={game.appId} game={game} />)}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
          <p>
            Prices and discounts come from the official Steam Store for the selected region. Steam does not offer a guaranteed public bulk-deals feed, so this list covers the Store’s searchable sale results and may not include every promotion. Results are briefly cached to reduce requests; confirm the final price on Steam.
          </p>
          <p className="mt-2">Game names and artwork belong to their respective publishers. Steam and the Steam logo are trademarks of Valve Corporation.</p>
        </footer>
      </section>
    </main>
  );
}

function GameCard({ game }: { game: SteamDeal }) {
  return (
    <article className="steam-game-card flex min-w-0 flex-col">
      <a href={game.storeUrl} target="_blank" rel="noreferrer" className="group block" aria-label={`View ${game.title} on the Steam Store`}>
        <div className="steam-cover">
          <img src={game.coverUrl} alt={`${game.title} cover`} loading="lazy" />
          <span className="steam-discount-tag">-{game.discountPercent}%</span>
        </div>
      </a>
      <div className="flex min-h-32 flex-1 flex-col justify-between gap-4 p-4">
        <a href={game.storeUrl} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 text-sm font-semibold leading-5 text-card-foreground transition-colors hover:text-steam-highlight">
          <span className="line-clamp-2">{game.title}</span>
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </a>
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs text-steam-price-old line-through">{game.originalPrice}</span>
          <span className="whitespace-nowrap rounded-sm bg-steam-deal/15 px-2.5 py-1.5 text-sm font-bold text-steam-deal">{game.currentPrice}</span>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ searching, hasError }: { searching: boolean; hasError: boolean }) {
  return (
    <div className="steam-empty-dash flex flex-col items-center justify-center px-6 py-10 text-center">
      {hasError ? <AlertCircle className="mb-3 size-8 text-destructive" /> : <Gamepad2 className="mb-3 size-8 text-muted-foreground" />}
      <h3 className="font-semibold">{hasError ? "Deals unavailable" : searching ? "No matching games" : "No discounted games found"}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasError
          ? "The official Store could not be reached. You can retry, or come back shortly."
          : searching
            ? "Try another title or clear your search to see the current deals."
            : "There are no active paid discounts in the loaded Steam Store results for this region right now."}
      </p>
    </div>
  );
}