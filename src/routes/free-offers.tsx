import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Gift, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { DealCard, DealCardSkeleton, REGION_NAMES, useDebouncedTerm, useSteamDeals } from "@/components/spark/deals-shared";
import { STEAM_COUNTRIES, type SteamCountry } from "@/lib/steam-deals.functions";

export const Route = createFileRoute("/free-offers")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Free Offers — Steam Dealz" },
      { name: "description", content: "Free 100% Steam Store promotions, listed separately from paid deals." },
    ],
  }),
  component: FreeOffersPage,
});

function FreeOffersPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/free-offers" });
  const [country, setCountry] = useState<SteamCountry>("IN");
  const { activeTerm, isSearching } = useDebouncedTerm(q);
  const { freeOffers, paidDeals, loading, error, refresh } = useSteamDeals(country, activeTerm);

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
    void navigate({ to: href as "/" | "/deals" | "/free-offers", search: { q } });
  };

  return (
    <SparkLayout
      onRefresh={() => void refresh()}
      refreshing={loading}
      notifications={notifItems}
      activeNav="free"
      onNav={handleNav}
    >
      <div className="page-header" id="region">
        <div>
          <h1 className="page-title">Free Offers</h1>
          <p className="page-subtitle">100% discounts, listed separately from paid deals.</p>
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
          <button className="btn-quick-action" type="button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="page-search-wrapper">
        <span className="page-search-icon" aria-hidden="true">
          <Search size={17} />
        </span>
        <input
          type="search"
          className="page-search-input"
          placeholder="Search free offers — try “portal”"
          value={q}
          onChange={(e) => updateSearch(e.currentTarget.value)}
          aria-label="Search free offers"
        />
        {q ? (
          <button className="page-search-clear" type="button" onClick={() => updateSearch("")} aria-label="Clear search">
            Clear
          </button>
        ) : isSearching || loading ? (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6c7e75]">…</span>
        ) : null}
      </div>

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
            <h2 className="card-title">All Free Offers</h2>
            <p className="mt-1 text-xs font-semibold text-[#6c7e75]">
              {freeOffers.length} free in {REGION_NAMES[country]}
            </p>
          </div>
          <span className="badge-table free">
            <Gift size={13} /> {freeOffers.length}
          </span>
        </div>
        {loading ? (
          <div className="deal-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : freeOffers.length ? (
          <div className="deal-grid">
            {freeOffers.map((g) => (
              <DealCard key={g.appId} game={g} />
            ))}
          </div>
        ) : (
          <div className="spark-empty">
            <Gift size={26} className="mx-auto mb-2 text-[#6c7e75]" />
            <p className="text-sm font-bold">No free offers right now</p>
            <p className="mx-auto mt-1 max-w-md text-[0.83rem] text-[#6c7e75]">
              Free 100% promotions will appear here when Steam lists them in {REGION_NAMES[country]}.
            </p>
          </div>
        )}
      </div>
    </SparkLayout>
  );
}
