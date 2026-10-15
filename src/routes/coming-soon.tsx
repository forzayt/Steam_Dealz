import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, LoaderCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { DealCard, DealCardSkeleton, EmptyState, REGION_NAMES, useDebouncedTerm, useSteamDeals } from "@/components/spark/deals-shared";
import { STEAM_COUNTRIES, type SteamCountry, type SteamDeal } from "@/lib/steam-deals.functions";

function groupLabel(date?: string): string {
  const trimmed = (date ?? "").trim();
  return trimmed ? trimmed : "To be announced";
}

export const Route = createFileRoute("/coming-soon")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Coming Soon — Steam Dealz" },
      { name: "description", content: "Upcoming Steam releases in calendar order — wishlist the next big games." },
      { property: "og:url", content: "https://steamdealzz.vercel.app/coming-soon" },
      { property: "og:title", content: "Coming Soon — Steam Dealz" },
      { property: "og:description", content: "Upcoming Steam releases in calendar order — wishlist the next big games." },
    ],
    links: [{ rel: "canonical", href: "https://steamdealzz.vercel.app/coming-soon" }],
  }),
  component: ComingSoonPage,
});

function ComingSoonPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/coming-soon" });
  const [country, setCountry] = useState<SteamCountry>("IN");
  const { trimmedQuery, activeTerm, isSearching } = useDebouncedTerm(q);
  const { games, totalCount, loading, loadingMore, error, refresh, loadMore, hasMore } = useSteamDeals(
    country,
    activeTerm,
    "comingsoon",
  );

  const updateSearch = (value: string) => {
    void navigate({ search: (prev) => ({ ...prev, q: value }), replace: true });
  };

  const groups = useMemo(() => {
    const map = new Map<string, SteamDeal[]>();
    for (const g of games) {
      const key = groupLabel(g.releaseDate);
      const list = map.get(key);
      if (list) list.push(g);
      else map.set(key, [g]);
    }
    const dated = [...map.entries()].filter(([k]) => k !== "Coming soon" && k !== "To be announced");
    const undated = [...map.entries()].filter(([k]) => k === "Coming soon" || k === "To be announced");
    return [...dated, ...undated];
  }, [games]);

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
    <SparkLayout onRefresh={() => void refresh()} refreshing={loading} activeNav="comingsoon" onNav={handleNav}>
      <div className="page-header" id="region">
        <div>
          <h1 className="page-title">Coming Soon</h1>
          <p className="page-subtitle">Upcoming Steam releases · soonest first.</p>
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
            <CalendarDays size={13} /> {games.length} upcoming
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
          placeholder="Search upcoming games — try “hollow knight”"
          value={q}
          onChange={(e) => updateSearch(e.currentTarget.value)}
          aria-label="Search upcoming games"
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
            <h2 className="card-title">{activeTerm ? `Results for “${activeTerm}”` : "Release Calendar"}</h2>
            <p className="mt-1 text-xs font-semibold text-[#6c7e75]">
              {games.length} shown · {REGION_NAMES[country]}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="deal-grid" aria-busy="true" aria-label="Loading upcoming games">
            {Array.from({ length: 10 }, (_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : groups.length ? (
          <div className="flex flex-col gap-8">
            {groups.map(([date, list]) => (
              <section key={date} aria-label={`Releasing ${date}`}>
                <div className="release-date-heading">
                  <CalendarDays size={15} />
                  <span>{date}</span>
                  <span className="release-date-count">{list.length}</span>
                </div>
                <div className="deal-grid">
                  {list.map((g) => (
                    <DealCard key={g.appId} game={g} releaseDate={g.releaseDate} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState searching={Boolean(activeTerm)} hasError={Boolean(error)} term={activeTerm} />
        )}

        {!loading && hasMore ? (
          <div className="mt-6 flex justify-center">
            <button className="btn-date-picker" type="button" onClick={() => void loadMore()} disabled={loadingMore} style={{ padding: "0.7rem 1.6rem" }}>
              {loadingMore ? <LoaderCircle size={16} className="animate-spin" /> : null}
              <span>{loadingMore ? "Loading…" : "Load more upcoming"}</span>
            </button>
          </div>
        ) : null}
      </div>
    </SparkLayout>
  );
}
