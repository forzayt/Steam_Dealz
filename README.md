# Steam Dealz

Live discounted games from the official Steam Store, sorted lowest regional price first. No paid APIs, no key shops, no mock data — just real Steam prices with region selection.

Built with TanStack Start + React 19 + Vite + Tailwind CSS.

## What it does

- Lists **only games with a genuine active discount** from `store.steampowered.com`
- Sorts **lowest discounted price → highest** by default
- Shows title, cover image, original price, current price, discount %, and Steam Store link
- **Region selector** with real regional Steam pricing (not currency conversion): IN, US, GB, DE, JP, BR, AU, CA, TR (defaults to `IN`)
- **Search** against live Steam results (debounced, `?q=` in URL)
- **Free 100% offers listed separately** on `/free-offers`
- Loading skeletons, empty states, and error/retry states throughout

## Routes

| Route | Description |
| --- | --- |
| `/` | Dashboard: top deal, active-discount stats, discount analytics, top transactions, deal breakdown |
| `/deals` | Full paid-discount list, lowest price first, with search + load-more pagination |
| `/free-offers` | Free (100% off) promotions only |

## Data source & limitations

Steam provides no guaranteed public bulk-deals API, so this app uses a practical free strategy:

- Server function `getSteamDeals` in `src/lib/steam-deals.functions.ts` calls the public Steam Store search endpoint:
  `https://store.steampowered.com/search/results/?specials=1&sort_by=Price_ASC&cc=<country>&...&infinite=1`
- Search terms use Steam's `term` query instead of `specials`.
- Response HTML (`search_result_row`) is parsed server-side for app ID, title, `data-discount`, original/final price, and capsule image.
- Strict filtering: rows without a valid Steam CDN image, unparsable prices, or `final >= original` (or `discount <= 0` in browse mode) are dropped.
- Caching: each `country:term:start` page is cached in-memory for **90s** (max 36 entries); `Refresh` bypasses the cache. The first browse page fans out to 3×100 results to fill the dashboard quickly.
- Limitations: results depend on Steam's unofficial search endpoint (rate limits / markup changes can break parsing), pagination uses Steam's `total_count`, and prices are per-region as returned by Steam.

## Tech stack

- TanStack Start / TanStack Router (file-based routes in `src/routes/`)
- TanStack Query, React 19, Vite 8
- Tailwind CSS 4, shadcn-style `src/components/ui`, Lucide icons
- Zod-validated server functions, Vitest + Testing Library

## Development

Requires Node.js — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Other scripts:

```sh
npm run build      # production build
npm run preview    # preview production build
npm run lint       # eslint
npm run format     # prettier --write .
npm test           # vitest run
```

## Project structure

- `src/routes/` — `/`, `/deals`, `/free-offers`, `__root.tsx` app shell
- `src/lib/steam-deals.functions.ts` — `getSteamDeals` server function, Steam parsing, 90s page cache
- `src/components/spark/` — `SparkLayout`, charts, `useSteamDeals` / `useDebouncedTerm` / `DealRow` shared UI
- `src/server.ts` — SSR entry wrapper with catastrophic-error page fallback
- `src/test/` — routing test (`vitest run`)

## Build with Lovable

This project was built with [Lovable](https://lovable.dev). Continue developing it in the [Lovable editor](https://lovable.dev/projects/ab84e75b-2140-4c0a-bd8f-ddedb0728ceb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
