import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";
import { DealCard } from "@/components/spark/deals-shared";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/watch-list")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Watch List — Steam Dealz" },
      { name: "description", content: "Games you saved to watch for price drops on the official Steam Store." },
      { property: "og:url", content: "https://steamdealzz.vercel.app/watch-list" },
      { property: "og:title", content: "Watch List — Steam Dealz" },
      { property: "og:description", content: "Games you saved to watch for price drops on the official Steam Store." },
    ],
    links: [{ rel: "canonical", href: "https://steamdealzz.vercel.app/watch-list" }],
  }),
  component: WatchListPage,
});

function WatchListPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/watch-list" });
  const { items, clear } = useWatchlist();
  const [query, setQuery] = useState(q);

  const updateSearch = (value: string) => {
    setQuery(value);
    void navigate({ search: (prev) => ({ ...prev, q: value }), replace: true });
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((g) => g.title.toLowerCase().includes(term));
  }, [items, query]);

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
    <SparkLayout onRefresh={() => {}} refreshing={false} activeNav="watchlist" onNav={handleNav}>
      <div className="page-header" id="watchlist">
        <div>
          <h1 className="page-title">Watch List</h1>
          <p className="page-subtitle">Games you saved — tap the bookmark on any deal to watch it here. Everything lives only on this device and never leaves it, so your list will not carry over to other devices.</p>
        </div>
        <div className="page-header-actions">
          <span className="badge-table success">
            <Bookmark size={13} /> {items.length} saved
          </span>
          {items.length ? (
            <button className="btn-date-picker" type="button" onClick={clear}>
              <Trash2 size={14} />
              <span>Clear all</span>
            </button>
          ) : null}
        </div>
      </div>

      {items.length ? (
        <div className="page-search-wrapper">
          <span className="page-search-icon" aria-hidden="true">
            <Search size={17} />
          </span>
          <input
            type="search"
            className="page-search-input"
            placeholder="Search your watch list"
            value={query}
            onChange={(e) => updateSearch(e.currentTarget.value)}
            aria-label="Search watch list"
          />
          {query ? (
            <button className="page-search-clear" type="button" onClick={() => updateSearch("")} aria-label="Clear search">
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="card mb-0">
        <div className="card-header">
          <div>
            <h2 className="card-title">Saved Games</h2>
            <p className="mt-1 text-xs font-semibold text-[#6c7e75]">
              {visible.length} shown · stored on this device
            </p>
          </div>
        </div>
        {visible.length ? (
          <div className="deal-grid">
            {visible.map((g) => (
              <DealCard key={g.appId} game={g} />
            ))}
          </div>
        ) : (
          <div className="spark-empty">
            <Bookmark size={26} className="mx-auto mb-2 text-[#6c7e75]" />
            <p className="text-sm font-bold">{items.length ? `No matches for “${query}”` : "Your watch list is empty"}</p>
            <p className="mx-auto mt-1 max-w-md text-[0.83rem] text-[#6c7e75]">
              {items.length
                ? "Try another title from your saved games."
                : "Browse discounted games and tap the bookmark icon on any card to keep it here."}
            </p>
            {items.length ? null : (
              <a href="/deals" className="alert-green-link mx-auto mt-4" style={{ color: "#072f1f" }}>
                <span>Browse discounted games</span>
              </a>
            )}
          </div>
        )}
      </div>
    </SparkLayout>
  );
}
