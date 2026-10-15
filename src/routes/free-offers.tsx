import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, ChevronDown, Gift, RefreshCw } from "lucide-react";
import { useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { DealRow, REGION_NAMES, useDebouncedTerm, useSteamDeals } from "@/components/spark/deals-shared";
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
  const { freeOffers, paidDeals, loading, error, lastUpdated, refresh } = useSteamDeals(country, activeTerm);

  const updateSearch = (value: string) => {
    void navigate({ search: (prev) => ({ ...prev, q: value }), replace: true });
  };

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Live";

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
      searchValue={q}
      onSearchChange={updateSearch}
      searching={isSearching || loading}
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
          <span className="btn-date-picker" title="Last synced">
            <CalendarDays size={16} />
            <span>Updated {updatedLabel}</span>
            <ChevronDown size={14} />
          </span>
          <button className="btn-quick-action" type="button" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
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
          <div className="custom-list">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="deal-row">
                <div className="deal-thumb spark-skeleton" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="spark-skeleton h-4 w-3/5" />
                  <div className="spark-skeleton h-3 w-2/5" />
                </div>
                <div className="spark-skeleton h-8 w-20" />
              </div>
            ))}
          </div>
        ) : freeOffers.length ? (
          <div className="custom-list">
            {freeOffers.map((g) => (
              <DealRow key={g.appId} game={g} />
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
