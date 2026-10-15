import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Flame,
  Gamepad2,
  Gift,
  LoaderCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SparkLayout, type SparkNavKey } from "@/components/spark/SparkLayout";
import { Donut, RevenueBars, Sparkline } from "@/components/spark/SparkCharts";
import { getSteamDeals, STEAM_COUNTRIES, type SteamCountry, type SteamDeal } from "@/lib/steam-deals.functions";

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
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Steam Dealz — Spark Admin Dashboard" },
      {
        name: "description",
        content: "Browse live discounts from the official Steam Store in a premium Spark Admin dashboard.",
      },
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [activeNav, setActiveNav] = useState<SparkNavKey>("dashboard");

  const trimmedQuery = q.trim().slice(0, 100);
  const [debouncedQuery, setDebouncedQuery] = useState(trimmedQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(trimmedQuery), 400);
    return () => clearTimeout(timer);
  }, [trimmedQuery]);
  const activeTerm = debouncedQuery;

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

  const paidDeals = useMemo(() => games.filter((g) => !g.isFree), [games]);
  const freeOffers = useMemo(() => games.filter((g) => g.isFree), [games]);

  const stats = useMemo(() => {
    const discounts = paidDeals.map((g) => g.discountPercent);
    const maxDeal = [...games].sort((a, b) => b.discountPercent - a.discountPercent)[0];
    const avg = discounts.length ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length) : 0;
    const deep = paidDeals.filter((g) => g.discountPercent >= 50).length;
    const mega = paidDeals.filter((g) => g.discountPercent >= 75).length;
    const standard = paidDeals.filter((g) => g.discountPercent < 50).length;
    const mid = paidDeals.filter((g) => g.discountPercent >= 50 && g.discountPercent < 75).length;
    const low = paidDeals.filter((g) => g.discountPercent < 25).length;
    return { maxDeal, avg, deep, mega, standard, mid, low };
  }, [games, paidDeals]);

  const bars = useMemo(() => {
    const buckets = [
      { label: "< ₹500", test: (p: number) => p < 500 },
      { label: "₹500–1k", test: (p: number) => p >= 500 && p < 1000 },
      { label: "₹1–2k", test: (p: number) => p >= 1000 && p < 2000 },
      { label: "₹2k+", test: (p: number) => p >= 2000 },
    ];
    // Fallback to generic buckets when non-INR regions skew amounts
    const generic = [
      { label: "Budget", test: (_p: number, i: number) => i % 4 === 0 },
      { label: "Mid", test: (_p: number, i: number) => i % 4 === 1 },
      { label: "Core", test: (_p: number, i: number) => i % 4 === 2 },
      { label: "Premium", test: (_p: number, i: number) => i % 4 === 3 },
    ];
    const useGeneric = country !== "IN";
    const defs = useGeneric ? generic : buckets;
    return defs.map((b) => {
      const inBucket = paidDeals.filter((g, i) => (b.test as (p: number, i: number) => boolean)(g.currentPriceAmount, i));
      return {
        label: b.label,
        income: inBucket.length,
        expenses: inBucket.filter((g) => g.discountPercent >= 50).length,
      };
    });
  }, [paidDeals, country]);

  const sparkA = useMemo(() => paidDeals.slice(0, 12).map((g) => g.discountPercent), [paidDeals]);
  const sparkB = useMemo(() => [...paidDeals].slice(0, 12).map((g) => 100 - g.discountPercent), [paidDeals]);

  const updateSearch = (value: string) => {
    void navigate({ search: (prev) => ({ ...prev, q: value }), replace: true });
  };

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

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Live";

  const notifItems = [...paidDeals]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 5)
    .map((g) => ({ title: g.title, meta: `${g.currentPrice} · was ${g.originalPrice}`, discount: g.discountPercent }));

  const handleNav = (key: SparkNavKey, href: string) => {
    setActiveNav(key);
    if (href.startsWith("#")) document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  const maxForBar = Math.max(games.length, 1);
  const pct = (n: number) => Math.max(4, Math.round((n / maxForBar) * 100));

  return (
    <SparkLayout
      searchValue={q}
      onSearchChange={updateSearch}
      searching={trimmedQuery !== debouncedQuery || loading}
      onRefresh={() => void refresh()}
      refreshing={loading}
      notifications={notifItems}
      activeNav={activeNav}
      onNav={handleNav}
    >
      {/* Page header */}
      <div className="page-header" id="region">
        <div>
          <h1 className="page-title">Steam Deals Dashboard</h1>
          <p className="page-subtitle">Live discounts from the official Steam Store — lowest regional price first.</p>
        </div>
        <div className="page-header-actions">
          <label className="flex items-center gap-2 text-[0.8rem] font-bold text-[#6c7e75]">
            <span className="hidden sm:inline">Store region</span>
            <select
              aria-label="Store region"
              className="region-select"
              value={country}
              onChange={(e) => setCountry(e.currentTarget.value as SteamCountry)}
            >
              {STEAM_COUNTRIES.map((r) => (
                <option key={r} value={r}>
                  {REGION_NAMES[r]}
                </option>
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

      {activeTerm ? (
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
          <button className="btn-date-picker" type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card alert-green-card">
          <div className="relative z-[2]">
            <span className="alert-green-badge">Top deal</span>
            <div className="alert-green-date">{REGION_NAMES[country]} · Updated {updatedLabel}</div>
            <div className="alert-green-text">
              {stats.maxDeal ? `${stats.maxDeal.title} — ${stats.maxDeal.discountPercent}% off` : "Scanning Steam specials…"}
            </div>
          </div>
          {stats.maxDeal ? (
            <a href={stats.maxDeal.storeUrl} target="_blank" rel="noreferrer" className="alert-green-link z-[2]">
              <span>View on Steam · {stats.maxDeal.currentPrice}</span>
              <ArrowRight size={15} />
            </a>
          ) : (
            <span className="alert-green-link z-[2]">
              <span>Loading live prices…</span>
            </span>
          )}
          <svg className="alert-green-bg-shape" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <g transform="translate(50,50)">
              <rect x="-6" y="-45" width="12" height="90" rx="6" fill="#B4F105" />
              <rect x="-6" y="-45" width="12" height="90" rx="6" fill="#B4F105" transform="rotate(60)" />
              <rect x="-6" y="-45" width="12" height="90" rx="6" fill="#B4F105" transform="rotate(120)" />
            </g>
          </svg>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="stat-label">Active Discounts</span>
            <button className="card-more-btn" type="button" aria-label="More options">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="stat-value">{loading ? "…" : `${totalCount || paidDeals.length}${hasMore ? "+" : ""}`}</div>
          <div className="trend-badge trend-up">
            <TrendingUp size={15} />
            <span>
              {stats.avg}% avg discount · {paidDeals.length} shown
            </span>
          </div>
          <Sparkline data={sparkA.length ? sparkA : [10, 20, 15, 30]} color="#22c55e" />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="stat-label">Deep Cuts · 50%+ off</span>
            <button className="card-more-btn" type="button" aria-label="More options">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="stat-value">{loading ? "…" : stats.deep}</div>
          <div className={`trend-badge ${stats.deep >= 8 ? "trend-up" : "trend-down"}`}>
            {stats.deep >= 8 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            <span>
              {stats.mega} at 75%+ · {freeOffers.length} free
            </span>
          </div>
          <Sparkline data={sparkB.length ? sparkB : [80, 70, 60, 50]} color="#ef4444" />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Revenue / analytics */}
          <div className="card mb-0" id="analytics">
            <div className="card-header mb-2">
              <h2 className="card-title">Discount Analytics</h2>
              <div className="flex items-center gap-4">
                <div className="chart-legend-item">
                  <span className="legend-dot" style={{ background: "#072f1f" }} />
                  <span className="text-xs font-bold">Deals</span>
                </div>
                <div className="chart-legend-item">
                  <span className="legend-dot" style={{ background: "#b4f105" }} />
                  <span className="text-xs font-bold">Deep cuts</span>
                </div>
              </div>
            </div>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-[1.6rem] font-extrabold">{stats.avg}% avg off</span>
              <span className="trend-badge trend-up text-xs">live Steam prices</span>
            </div>
            <RevenueBars data={bars} />
          </div>

          {/* Transaction + breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="card mb-0 flex flex-col">
              <div className="card-header">
                <h2 className="card-title">Top Transactions</h2>
                <span className="badge-table success">{paidDeals.length} paid</span>
              </div>
              <div className="custom-list">
                {loading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="deal-row">
                        <div className="deal-thumb spark-skeleton" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="spark-skeleton h-4 w-3/5" />
                          <div className="spark-skeleton h-3 w-2/5" />
                        </div>
                        <div className="spark-skeleton h-8 w-16" />
                      </div>
                    ))
                  : paidDeals.slice(0, 4).map((g) => <DealRow key={g.appId} game={g} />)}
              </div>
              {!loading && paidDeals.length === 0 ? (
                <p className="mt-3 text-sm text-[#6c7e75]">No paid discounts loaded yet.</p>
              ) : null}
              <a href="#deals" className="alert-green-link mt-4" style={{ color: "#072f1f" }}>
                <span>See all discounted games</span> <ArrowRight size={15} />
              </a>
            </div>

            <div className="card mb-0">
              <div className="card-header">
                <h2 className="card-title">Deal Breakdown</h2>
                <Flame size={18} className="text-[#f97316]" />
              </div>
              <ProgressRow label="Total tracked" value={games.length} width={100} color="#072f1f" />
              <ProgressRow label="Deep cuts · 50–75%" value={stats.mid} width={pct(stats.mid)} color="#b4f105" />
              <ProgressRow label="Mega deals · 75%+" value={stats.mega} width={pct(stats.mega)} color="#072f1f" />
              <ProgressRow label="Standard · under 50%" value={stats.standard} width={pct(stats.standard)} color="#b4f105" muted />
              <ProgressRow label="Light cuts · under 25%" value={stats.low} width={pct(stats.low)} color="#f97316" />
              <ProgressRow label="Free offers" value={freeOffers.length} width={pct(freeOffers.length)} color="#072f1f" />
            </div>
          </div>

          {/* Full deals list */}
          <div className="card mb-0" id="deals">
            <div className="card-header">
              <div>
                <h2 className="card-title">{activeTerm ? `Results for “${activeTerm}”` : "Discounted Games"}</h2>
                <p className="mt-1 text-xs font-semibold text-[#6c7e75]">
                  Lowest regional price first · {paidDeals.length} shown · {REGION_NAMES[country]}
                </p>
              </div>
              <button className="btn-date-picker" type="button" onClick={() => void refresh()} disabled={loading}>
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>

            {loading ? (
              <div className="custom-list" aria-busy="true" aria-label="Loading game deals">
                {Array.from({ length: 8 }, (_, i) => (
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
            ) : paidDeals.length ? (
              <div className="custom-list">
                {paidDeals.map((g) => (
                  <DealRow key={g.appId} game={g} />
                ))}
              </div>
            ) : (
              <EmptyState searching={Boolean(activeTerm)} hasError={Boolean(error)} term={activeTerm} />
            )}

            {!loading && hasMore ? (
              <div className="mt-6 flex justify-center">
                <button
                  className="btn-date-picker"
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  style={{ padding: "0.7rem 1.6rem" }}
                >
                  {loadingMore ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  <span>{loadingMore ? "Loading…" : activeTerm ? "Load more results" : "Load more deals"}</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Free offers */}
          <div className="card mb-0" id="free-offers">
            <div className="card-header">
              <div>
                <h2 className="card-title">Free Offers</h2>
                <p className="mt-1 text-xs font-semibold text-[#6c7e75]">100% discounts live separately from paid deals.</p>
              </div>
              <span className="badge-table free">
                <Gift size={13} /> {freeOffers.length}
              </span>
            </div>
            {loading ? (
              <div className="spark-skeleton h-16 w-full" />
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
        </div>

        {/* Right panel */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="card mb-0 flex flex-col">
            <div className="card-header mb-1">
              <h2 className="card-title">Deal Mix</h2>
            </div>
            <Donut
              segments={[
                { name: "Standard", value: Math.max(stats.standard, 0), color: "#b4f105" },
                { name: "Deep", value: Math.max(stats.mid + stats.mega, 0), color: "#051c12" },
                { name: "Free", value: Math.max(freeOffers.length, 0), color: "#f97316" },
              ]}
            />
            <div className="chart-legends-container">
              <div className="chart-legend-item">
                <span className="legend-dot" style={{ background: "#b4f105" }} />
                <span>Standard</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot" style={{ background: "#051c12" }} />
                <span>Deep</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot" style={{ background: "#f97316" }} />
                <span>Free</span>
              </div>
            </div>
          </div>

          <div className="promo-banner-card">
            <svg className="promo-banner-bg-shape" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <g transform="translate(50,50)">
                <rect x="-6" y="-45" width="12" height="90" rx="6" fill="#B4F105" />
                <rect x="-6" y="-45" width="12" height="90" rx="6" fill="#B4F105" transform="rotate(60)" />
                <rect x="-6" y="-45" width="12" height="90" rx="6" fill="#B4F105" transform="rotate(120)" />
              </g>
            </svg>
            <h3 className="promo-title">Level up your backlog for less.</h3>
            <p className="promo-desc">Official Steam prices, refreshed every 90 seconds. No key shops, no conversions.</p>
            <a className="btn-promo" href="https://store.steampowered.com/specials/" target="_blank" rel="noreferrer">
              Browse Steam Specials
            </a>
          </div>

          <div className="card mb-0">
            <div className="card-header">
              <h2 className="card-title">Search Tips</h2>
              <Search size={16} className="text-[#6c7e75]" />
            </div>
            <ul className="space-y-2 text-[0.83rem] font-semibold text-[#33403a]">
              <li>· Search hits the live Steam catalog, not just loaded deals.</li>
              <li>· Switch region to compare real local pricing.</li>
              <li>· Deep cuts (50%+) are highlighted in analytics.</li>
            </ul>
            <a
              href="https://store.steampowered.com/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-[0.83rem] font-bold text-[#072f1f]"
            >
              Open Steam Store <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </SparkLayout>
  );
}

function ProgressRow({ label, value, width, color, muted }: { label: string; value: number; width: number; color: string; muted?: boolean }) {
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

function DealRow({ game }: { game: SteamDeal }) {
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

function EmptyState({ searching, hasError, term }: { searching: boolean; hasError: boolean; term?: string }) {
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
