import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Flame,
  MoreHorizontal,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { Donut, Sparkline } from "@/components/spark/SparkCharts";
import {
  ProgressRow,
  REGION_NAMES,
  useDebouncedTerm,
  useSteamDeals,
} from "@/components/spark/deals-shared";
import { STEAM_COUNTRIES, type SteamCountry } from "@/lib/steam-deals.functions";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Steam Dealz — Live Steam Discounts, Regional Prices and Free Offers" },
      {
        name: "description",
        content: "Browse live discounts from the official Steam Store — lowest regional price first, deep cuts, free offers, and deal analytics.",
      },
      { property: "og:url", content: "https://steamdealzz.vercel.app/" },
      { property: "og:title", content: "Steam Dealz — Live Steam Discounts and Regional Prices" },
      {
        property: "og:description",
        content: "Browse live discounts from the official Steam Store — lowest regional price first, deep cuts, free offers, and deal analytics.",
      },
    ],
    links: [{ rel: "canonical", href: "https://steamdealzz.vercel.app/" }],
  }),
  component: SteamDealsPage,
});

function TickerArt({ appId, fallback, artKey }: { appId: string; fallback: string; artKey: string }) {
  const primary = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
  const [src, setSrc] = useState(primary);
  useEffect(() => {
    setSrc(primary);
  }, [primary]);
  return (
    <img
      key={artKey}
      src={src}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
      alt=""
      aria-hidden="true"
    />
  );
}

function saleRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString([], { month: "short" })} ${s.getDate()} – ${e.getDate()}`;
  }
  return `${s.toLocaleDateString([], { month: "short", day: "numeric" })} – ${e.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

/** Major Steam sales from Valve's official schedule (seasonal + fests). */
const SALE_EVENTS = [
  {
    name: "Cooking Fest",
    short: "Cooking Fest",
    start: "2026-10-12",
    end: "2026-10-19",
    url: "https://store.steampowered.com/specials/",
    blurb: "Cooking, farming and food games on sale across Steam.",
    gradient: "linear-gradient(135deg, #f97316, #7c2d12)",
  },
  {
    name: "Steam Next Fest: October 2026",
    short: "Next Fest",
    start: "2026-10-19",
    end: "2026-10-26",
    url: "https://store.steampowered.com/specials/",
    blurb: "Hundreds of free demos to try before they launch.",
    gradient: "linear-gradient(135deg, #1b78e4, #0b1e3a)",
  },
  {
    name: "Steam Scream V Fest",
    short: "Scream V",
    start: "2026-10-26",
    end: "2026-11-02",
    url: "https://store.steampowered.com/specials/",
    blurb: "Horror, spooky and scary games take over Steam.",
    gradient: "linear-gradient(135deg, #7c3aed, #12081f)",
  },
  {
    name: "Steam Winter Sale 2026",
    short: "Winter Sale",
    start: "2026-12-17",
    end: "2027-01-04",
    url: "https://steamcommunity.com/groups/steamworks/announcements/detail/493837645658461608",
    blurb: "The biggest seasonal sale of the year.",
    gradient: "linear-gradient(135deg, #38bdf8, #1e3a8a)",
  },
];

function SteamDealsPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [country, setCountry] = useState<SteamCountry>("IN");
  const { trimmedQuery, activeTerm } = useDebouncedTerm(q);
  const { games, paidDeals, freeOffers, totalCount, loading, error, refresh, hasMore } =
    useSteamDeals(country, activeTerm);

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

  const sparkA = useMemo(() => paidDeals.slice(0, 12).map((g) => g.discountPercent), [paidDeals]);
  const sparkB = useMemo(() => [...paidDeals].slice(0, 12).map((g) => 100 - g.discountPercent), [paidDeals]);

  const saleEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return SALE_EVENTS.map((s) => {
      const start = new Date(`${s.start}T00:00:00`);
      const end = new Date(`${s.end}T00:00:00`);
      return { ...s, live: start <= now && now <= end, upcoming: now < start };
    })
      .filter((s) => s.live || s.upcoming)
      .sort((a, b) => Number(b.live) - Number(a.live) || a.start.localeCompare(b.start));
  }, []);

  const [freeIdx, setFreeIdx] = useState(0);
  useEffect(() => {
    setFreeIdx(0);
  }, [country, activeTerm]);
  useEffect(() => {
    if (freeOffers.length < 2) return;
    const t = setInterval(() => setFreeIdx((i) => (i + 1) % freeOffers.length), 3500);
    return () => clearInterval(t);
  }, [freeOffers.length]);
  const freeGame = freeOffers.length ? freeOffers[freeIdx % freeOffers.length] : undefined;

  const notifItems = [...paidDeals]
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 5)
    .map((g) => ({ title: g.title, meta: `${g.currentPrice} · was ${g.originalPrice}`, discount: g.discountPercent }));

  const handleNav = (_key: string, href: string) => {
    if (href.startsWith("/#")) {
      if (window.location.pathname === "/") {
        document.querySelector(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    void navigate({ to: href as "/" | "/deals" | "/free-offers" | "/watch-list" | "/changelog" | "/top-sellers", search: { q } });
  };

  const maxForBar = Math.max(games.length, 1);
  const pct = (n: number) => Math.max(4, Math.round((n / maxForBar) * 100));

  return (
    <SparkLayout
      onRefresh={() => void refresh()}
      refreshing={loading}
      notifications={notifItems}
      activeNav="dashboard"
      onNav={handleNav}
    >
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
        </div>
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
          <button className="btn-date-picker" type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={`card alert-green-card${!loading && freeGame ? " alert-green-clickable" : ""}`}>
          <div className="alert-green-art" aria-hidden="true">
            {freeGame ? (
              <TickerArt appId={freeGame.appId} fallback={freeGame.coverUrl} artKey={`${freeGame.appId}-${freeIdx}`} />
            ) : null}
          </div>
          <div className="alert-green-shade" aria-hidden="true" />
          <div className="relative z-[2]">
            <span className="alert-green-badge">Free now</span>
            <div className="alert-green-date">
              {REGION_NAMES[country]}
              {freeOffers.length > 1 ? ` · ${Math.min(freeIdx + 1, freeOffers.length)} / ${freeOffers.length}` : null}
            </div>
            {loading ? (
              <div className="alert-green-text">Scanning Steam specials…</div>
            ) : freeGame ? (
              <div key={`${freeGame.appId}-${freeIdx}`} className="alert-green-text alert-green-ticker">
                {freeGame.title} — 100% off
              </div>
            ) : (
              <div className="alert-green-text">No free offers right now</div>
            )}
          </div>
          {loading ? (
            <span className="alert-green-link z-[2]">
              <span>Loading live prices…</span>
            </span>
          ) : freeGame ? (
            <span key={`link-${freeGame.appId}-${freeIdx}`} className="alert-green-link z-[2]">
              <span>Claim free · {freeGame.currentPrice}</span>
              <ArrowRight size={15} />
            </span>
          ) : (
            <a href="/free-offers" className="alert-green-link z-[2]">
              <span>Check free offers</span>
              <ArrowRight size={15} />
            </a>
          )}
          {!loading && freeGame ? (
            <a
              href={freeGame.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="alert-green-stretch"
              aria-label={`Claim ${freeGame.title} free on Steam`}
            />
          ) : null}
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

      {/* Main grid — dashboard only, full lists live on /deals and /free-offers */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="card mb-0" id="events">
            <div className="card-header mb-2">
              <h2 className="card-title">Steam Sale Events</h2>
              <span className="trend-badge trend-up text-xs">
                {saleEvents.some((s) => s.live) ? "sale live now" : "upcoming"}
              </span>
            </div>
            {saleEvents.length ? (
              <div className="sale-grid">
                {saleEvents.map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="sale-tile">
                    <span className="sale-banner" style={{ background: s.gradient }}>
                      {s.live ? <span className="sale-live">Live</span> : null}
                      <span className="sale-banner-name">{s.short}</span>
                      <span className="sale-banner-dates">{saleRange(s.start, s.end)}</span>
                    </span>
                    <span className="sale-title">{s.name}</span>
                    <span className="sale-desc">{s.blurb}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#6c7e75]">
                No dated sales on the calendar — fresh Steam dates land here as Valve announces them.
              </p>
            )}
            <div className="sale-foot">
              <a href="/deals" className="alert-green-link" style={{ color: "#072f1f" }}>
                <span>Browse all deals</span> <ArrowRight size={15} />
              </a>
              <a
                href="https://store.steampowered.com/specials/"
                target="_blank"
                rel="noreferrer"
                className="sale-all"
              >
                View all sale events…
              </a>
            </div>
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
              <li>· Full discount list lives on Discounted Games.</li>
              <li>· Free 100% offers live on Free Offers.</li>
              <li>· Switch region to compare real local pricing.</li>
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
