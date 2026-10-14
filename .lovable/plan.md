# Steam Deals

Build the home page as a focused, responsive dark Steam-deal finder.

## User experience
- Show live discounted Steam games with title, cover, original/current prices, discount, and official store link.
- Default to India with a region selector that uses Steam's actual regional prices; include several available Steam regions.
- Add URL-backed game search, lowest-price-first ordering, refresh, loading, empty, and recoverable error states.
- Keep free-to-play/100%-off items separate from paid discounted deals so free offers do not distort price sorting.
- Explain the source and practical coverage/caching limitations without implying Steam provides a guaranteed bulk-deals API.

## Technical approach
- Query Steam's free Store search-results endpoint server-side, scoped to an allow-listed region, requesting sale results sorted by ascending price.
- Parse Steam's current result markup into a small serializable game DTO and independently verify positive discount and current price below original price.
- Use a TanStack server function and a short isolate-local cache to avoid excessive repeat requests; present failures in the page.
- Add page-specific metadata and the app's dark Steam-inspired design tokens, then validate the route and live preview.
