import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const STEAM_COUNTRIES = ["IN", "US", "GB", "DE", "JP", "BR", "AU", "CA", "TR"] as const;
export type SteamCountry = (typeof STEAM_COUNTRIES)[number];

export type SteamDeal = {
  appId: string;
  title: string;
  coverUrl: string;
  storeUrl: string;
  discountPercent: number;
  originalPrice: string;
  currentPrice: string;
  currentPriceAmount: number;
  isFree: boolean;
};

export type SteamEvent = {
  appId: string;
  gameTitle: string;
  title: string;
  url: string;
  date: number;
  author: string;
  coverUrl: string;
};

const NEWS_TTL_MS = 15 * 60_000;
const newsCache = new Map<string, { expiresAt: number; events: SteamEvent[] }>();

export type SteamDealsResult = {
  country: SteamCountry;
  games: SteamDeal[];
  totalCount: number;
  nextStart: number;
  hasMore: boolean;
  fetchedAt: string;
};

const PAGE_SIZE = 100;
const CACHE_TTL_MS = 90_000;
const pageCache = new Map<string, { expiresAt: number; deals: SteamDeal[]; totalCount: number }>();

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function elementText(html: string, className: string): string {
  const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(`<[^>]*class="[^"]*\\b${escapedClass}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"),
  );
  return decodeHtml((match?.[1] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function numericPrice(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!/\d/.test(cleaned)) return Number.NaN;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);
  if (decimalIndex < 0) return Number(cleaned);

  const decimals = cleaned.length - decimalIndex - 1;
  if (decimals === 0 || decimals > 2) return Number(cleaned.replace(/[.,]/g, ""));
  const integer = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
  const fraction = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, "");
  return Number(`${integer || "0"}.${fraction}`);
}

function parseDeals(html: string, requireDiscount = true): SteamDeal[] {
  const rows = html.match(
    /<a\b(?=[^>]*class="[^"]*\bsearch_result_row\b)[^>]*>[\s\S]*?<\/a>/gi,
  ) ?? [];

  return rows.flatMap((row) => {
    const appId = row.match(/data-ds-appid="(\d+)"/i)?.[1];
    const title = elementText(row, "title");
    const discountPercent = Number(row.match(/data-discount="(\d+)"/i)?.[1] ?? 0);
    const originalRaw = elementText(row, "discount_original_price");
    const currentPrice = elementText(row, "discount_final_price");
    const originalPrice = originalRaw || currentPrice;
    const originalAmount = numericPrice(originalPrice);
    const currentPriceAmount = numericPrice(currentPrice);
    const image = row.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];

    if (
      !appId ||
      !title ||
      !image ||
      !image.startsWith("https://") ||
      !image.includes("steamstatic.com") ||
      !Number.isFinite(originalAmount) ||
      !Number.isFinite(currentPriceAmount)
    ) {
      return [];
    }

    if (requireDiscount) {
      if (discountPercent <= 0 || currentPriceAmount >= originalAmount) return [];
    } else if (currentPriceAmount > originalAmount) {
      return [];
    }

    return [{
      appId,
      title,
      coverUrl: decodeHtml(image),
      storeUrl: `https://store.steampowered.com/app/${appId}/`,
      discountPercent,
      originalPrice,
      currentPrice,
      currentPriceAmount,
      isFree: currentPriceAmount === 0,
    }];
  });
}

async function getSteamPage(country: SteamCountry, start: number, term = "") {
  const termKey = term.trim().toLocaleLowerCase().slice(0, 100);
  const key = `${country}:${termKey}:${start}`;
  const cached = pageCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const params = new URLSearchParams({
    start: String(start),
    count: String(PAGE_SIZE),
    sort_by: termKey ? "_ASC" : "Price_ASC",
    cc: country,
    l: "english",
    supportedlang: "english",
    infinite: "1",
    dynamic_data: "",
    ndl: "1",
  });
  if (termKey) {
    params.set("term", term.trim().slice(0, 100));
  } else {
    params.set("query", "");
    params.set("specials", "1");
  }
  const response = await fetch(`https://store.steampowered.com/search/results/?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Steam Store returned ${response.status}.`);

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("Steam Store returned an unreadable response.");
  const data = payload as { success?: number; results_html?: string; total_count?: number };
  if (data.success !== 1 || typeof data.results_html !== "string") {
    throw new Error("Steam Store did not provide sale listings right now.");
  }

  const value = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    deals: parseDeals(data.results_html, !termKey),
    totalCount: Number.isFinite(data.total_count) ? Number(data.total_count) : 0,
  };
  if (pageCache.size >= 36) {
    const oldestKey = pageCache.keys().next().value;
    if (oldestKey) pageCache.delete(oldestKey);
  }
  pageCache.set(key, value);
  return value;
}

const inputSchema = z.object({
  country: z.enum(STEAM_COUNTRIES),
  start: z.number().int().min(0).max(10_000).multipleOf(PAGE_SIZE),
  refresh: z.boolean().optional(),
  term: z.string().trim().max(100).optional().default(""),
});

export const getSteamDeals = createServerFn({ method: "GET" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<SteamDealsResult> => {
    const term = (data.term ?? "").trim().slice(0, 100);
    const termKey = term.toLocaleLowerCase();
    if (data.refresh) {
      for (const key of [...pageCache.keys()]) {
        if (!key.startsWith(`${data.country}:`)) continue;
        if (!termKey || key === `${data.country}:${termKey}:${data.start}` || key.startsWith(`${data.country}:${termKey}:`)) {
          pageCache.delete(key);
        }
      }
    }
    const starts = termKey ? [data.start] : data.start === 0 ? [0, PAGE_SIZE, PAGE_SIZE * 2] : [data.start];
    const pages = await Promise.all(starts.map((start) => getSteamPage(data.country, start, term)));
    const uniqueDeals = new Map<string, SteamDeal>();
    for (const page of pages) {
      for (const deal of page.deals) uniqueDeals.set(deal.appId, deal);
    }
    const unordered = [...uniqueDeals.values()];
    const games = termKey
      ? unordered
      : unordered.sort(
          (first, second) => first.currentPriceAmount - second.currentPriceAmount || first.title.localeCompare(second.title),
        );
    const totalCount = pages[0]?.totalCount ?? 0;
    const nextStart = data.start + starts.length * PAGE_SIZE;

    return {
      country: data.country,
      games,
      totalCount,
      nextStart,
      hasMore: nextStart < totalCount,
      fetchedAt: new Date().toISOString(),
    };
  });

const eventsInputSchema = z.object({
  games: z
    .array(z.object({ appId: z.string().regex(/^\d{1,10}$/), title: z.string().min(1).max(200) }))
    .min(1)
    .max(8),
});

type SteamNewsItem = {
  title?: unknown;
  url?: unknown;
  author?: unknown;
  date?: unknown;
};

/** Live Steam announcements for the given games (official ISteamNews feed, cached briefly). */
export const getSteamEvents = createServerFn({ method: "GET" })
  .inputValidator((input) => eventsInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ events: SteamEvent[]; fetchedAt: string }> => {
    const key = data.games
      .map((g) => g.appId)
      .sort()
      .join(",");
    const cached = newsCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return { events: cached.events, fetchedAt: new Date().toISOString() };
    }

    const perGame = await Promise.all(
      data.games.map(async (game) => {
        try {
          const response = await fetch(
            `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${game.appId}&count=2&maxlength=0&format=json`,
            {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(8_000),
            },
          );
          if (!response.ok) return [];
          const payload: unknown = await response.json();
          const items =
            (payload as { appnews?: { newsitems?: SteamNewsItem[] } })?.appnews?.newsitems ?? [];
          return items.slice(0, 2).flatMap((item) => {
            const title = typeof item.title === "string" ? item.title.trim() : "";
            const url = typeof item.url === "string" ? item.url : "";
            const date = typeof item.date === "number" && Number.isFinite(item.date) ? item.date : 0;
            if (!title || !url.startsWith("https://")) return [];
            return [
              {
                appId: game.appId,
                gameTitle: game.title,
                title,
                url,
                date,
                author: typeof item.author === "string" ? item.author : "",
                coverUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`,
              },
            ];
          });
        } catch {
          return [];
        }
      }),
    );

    const events = perGame
      .flat()
      .sort((a, b) => b.date - a.date)
      .slice(0, 6);
    if (newsCache.size >= 24) {
      const oldestKey = newsCache.keys().next().value;
      if (oldestKey) newsCache.delete(oldestKey);
    }
    newsCache.set(key, { expiresAt: Date.now() + NEWS_TTL_MS, events });
    return { events, fetchedAt: new Date().toISOString() };
  });