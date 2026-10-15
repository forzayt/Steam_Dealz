import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, LoaderCircle, Search, Trophy } from "lucide-react";
import { useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { DealCard, DealCardSkeleton, EmptyState, REGION_NAMES, useDebouncedTerm, useSteamDeals } from "@/components/spark/deals-shared";
import { STEAM_COUNTRIES, type SteamCountry } from "@/lib/steam-deals.functions";

export const Route = createFileRoute("/top-sellers")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Top Sellers — Steam Dealz" },
      { name: "description", content: "The global top-selling games on the official Steam Store, ranked live." },
      { property: "og:url", content: "https://steamdealzz.vercel.app/top-sellers" },
      { property: "og:title", content: "Top Sellers — Steam Dealz" },
      { property: "og:description", content: "The global top-selling games on the official Steam Store, ranked live." },
    ],
    links: [{ rel: "canonical", href: "https://steamdealzz.vercel.app/top-sellers" }],
  }),
  component: TopSellersPage,
});

function TopSellersPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/top-sellers" });
  const [country, setCountry] = useState<SteamCountry>("IN");
  const { trimmedQuery, activeTerm, isSearching } = useDebouncedTerm(q);
  const { games, totalCount, loading, loadingMore, error, refresh, loadMore, hasMore } = useSteamDeals(
    country,
    activeTerm,
    "topsellers",
  );

  const updateSearch = (value: string) => {
    void navigate({ search: (prev) => ({ ...prev, q: value }), replace: true });
  };

  const handleNav = (_key: string, href: string) => {
    if (href.startsWith("/#")) {
      window.location.href = href;
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    void navigate({
      to: href as "/" | "/deals" | "/free-offers" | "/watch-list" | "/changelog" | "/top-sellers" | "/coming-soon",
      search: { q },
    });
  };

  return (
    <SparkLayout onRefresh={() => void refresh()} refreshing={loading} activeNav="topsellers" onNav={handleNav}>
      <div className="page-header" id="region">
        <div>
          <h1 className="page-title">Top Sellers</h1>
          <p className="page-subtitle">The best-selling games on Steam right now · ranked live.</p>
        </div>
        <div className="page-header-actions">
          <label className="flex items-center gap-2 text-[0.8rem] font-bold text-[#6c7e75]">
            <span className="hidden sm:inline">Store region</span>
            <select aria-label="Store region" className="region-select" value={country} onChange={(e) => setCountry(e.currentTarget.value as SteamCountry)}>
              {STEAM_COUNTRIES.map((r) => (
                <option key={r} value={r}>{REGION_NAMES[r]}</option>
              ))}
            </select>
          </label>
          <span className="badge-table success">
            <Trophy size={13} /> {games.length} ranked
          </span>
        </div>
      </div>

      <div className="page-search-wrapper">
        <span className="page-search-icon" aria-hidden="true">
          <Search size={17} />
        </span>
        <input
          type="search"
          className="page-search-input"
          placeholder="Search top sellers — try “baldur”"
          value={q}
          onChange={(e) => updateSearch(e.currentTarget.value)}
          aria-label="Search top sellers"
        />
        {q ? (
          <button className="page-search-clear" type="button" onClick={() => updateSearch("")} aria-label="Clear search">
            Clear
          </button>
        ) : isSearching || loading ? (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6c7e75]">…</span>
        ) : null}
      </div>

      {trimmedQuery ? (
        <p className="mb-4 text-xs font-semibold text-[#6c7e75]" aria-live="polite">
          {totalCount > 0
            ? `${totalCount} Steam result${totalCount === 1 ? "" : "s"} for “${activeTerm}” in ${REGION_NAMES[country]}`
            : `No Steam results for “${activeTerm}” in ${REGION_NAMES[country]}`}
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="card mb-6 flex items-start gap-3" style={{ borderLeft: "4px solid #ef4444" }}>
          <AlertCircle size={20} className="mt-0.5 flex-none text-[#ef4444]" />
          <div className="flex-1 text-sm font-semibold">{error}</div>
          <button className="btn-date-picker" type="button" onClick={() => void refresh()}>Retry</button>
        </div>
      ) : null}

      <div className="card mb-0">
        <div className="card-header">
          <div>
            <h2 className="card-title">{activeTerm ? `Results for “${activeTerm}”` : "Global Top Sellers"}</h2>
            <p className="mt-1 text-xs font-semibold text-[#6c7e75]">
              {games.length} shown · {REGION_NAMES[country]}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="deal-grid" aria-busy="true" aria-label="Loading top sellers">
            {Array.from({ length: 10 }, (_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : games.length ? (
          <div className="deal-grid">
            {games.map((g, i) => (
              <DealCard key={g.appId} game={g} rank={activeTerm ? undefined : i + 1} />
            ))}
          </div>
        ) : (
          <EmptyState searching={Boolean(activeTerm)} hasError={Boolean(error)} term={activeTerm} />
        )}

        {!loading && hasMore ? (
          <div className="mt-6 flex justify-center">
            <button className="btn-date-picker" type="button" onClick={() => void loadMore()} disabled={loadingMore} style={{ padding: "0.7rem 1.6rem" }}>
              {loadingMore ? <LoaderCircle size={16} className="animate-spin" /> : null}
              <span>{loadingMore ? "Loading…" : "Load more sellers"}</span>
            </button>
          </div>
        ) : null}
      </div>
    </SparkLayout>
  );
}
