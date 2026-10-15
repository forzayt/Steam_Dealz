import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, LoaderCircle, Search } from "lucide-react";
import { useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { DealCard, DealCardSkeleton, EmptyState, REGION_NAMES, useDebouncedTerm, useSteamDeals } from "@/components/spark/deals-shared";
import { STEAM_COUNTRIES, type SteamCountry } from "@/lib/steam-deals.functions";

export const Route = createFileRoute("/deals")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Discounted Games — Steam Dealz" },
      { name: "description", content: "All live discounted games from the official Steam Store, lowest regional price first." },
      { property: "og:url", content: "https://steamdealzz.vercel.app/deals" },
      { property: "og:title", content: "Discounted Games — Steam Dealz" },
      { property: "og:description", content: "All live discounted games from the official Steam Store, lowest regional price first." },
    ],
    links: [{ rel: "canonical", href: "https://steamdealzz.vercel.app/deals" }],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/deals" });
  const [country, setCountry] = useState<SteamCountry>("IN");
  const { trimmedQuery, activeTerm, isSearching } = useDebouncedTerm(q);
  const { paidDeals, totalCount, loading, loadingMore, error, refresh, loadMore, hasMore } = useSteamDeals(country, activeTerm);

  const updateSearch = (value: string) => {
    void navigate({ search: (prev) => ({ ...prev, q: value }), replace: true });
  };

  const notifItems = [...paidDeals]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 5)
    .map((g) => ({ title: g.title, meta: `${g.currentPrice} · was ${g.originalPrice}`, discount: g.discountPercent }));

  const handleNav = (_key: string, href: string) => {
    if (href.startsWith("/#")) {
      window.location.href = href;
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    void navigate({ to: href as "/" | "/deals" | "/free-offers" | "/watch-list" | "/changelog" | "/top-sellers" | "/coming-soon", search: { q } });
  };

  return (
    <SparkLayout
      onRefresh={() => void refresh()}
      refreshing={loading}
      notifications={notifItems}
      activeNav="deals"
      onNav={handleNav}
    >
      <div className="page-header" id="region">
        <div>
          <h1 className="page-title">Discounted Games</h1>
          <p className="page-subtitle">
            {activeTerm ? `Results for “${activeTerm}”` : "Every live paid discount"} · lowest regional price first.
          </p>
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
        </div>
      </div>

      <div className="page-search-wrapper">
        <span className="page-search-icon" aria-hidden="true">
          <Search size={17} />
        </span>
        <input
          type="search"
          className="page-search-input"
          placeholder="Search Steam games — try “elden ring”"
          value={q}
          onChange={(e) => updateSearch(e.currentTarget.value)}
          aria-label="Search Steam games"
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
            <h2 className="card-title">{activeTerm ? `Results for “${activeTerm}”` : "All Discounted Games"}</h2>
            <p className="mt-1 text-xs font-semibold text-[#6c7e75]">
              {paidDeals.length} shown · {REGION_NAMES[country]}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="deal-grid" aria-busy="true" aria-label="Loading game deals">
            {Array.from({ length: 12 }, (_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : paidDeals.length ? (
          <div className="deal-grid">
            {paidDeals.map((g) => (
              <DealCard key={g.appId} game={g} />
            ))}
          </div>
        ) : (
          <EmptyState searching={Boolean(activeTerm)} hasError={Boolean(error)} term={activeTerm} />
        )}

        {!loading && hasMore ? (
          <div className="mt-6 flex justify-center">
            <button className="btn-date-picker" type="button" onClick={() => void loadMore()} disabled={loadingMore} style={{ padding: "0.7rem 1.6rem" }}>
              {loadingMore ? <LoaderCircle size={16} className="animate-spin" /> : null}
              <span>{loadingMore ? "Loading…" : "Load more deals"}</span>
            </button>
          </div>
        ) : null}
      </div>
    </SparkLayout>
  );
}
