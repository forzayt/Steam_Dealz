import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#f4f6f5" }}>
      <div className="card mx-auto max-w-md text-center" style={{ maxWidth: 460 }}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: "#072f1f", color: "#b4f105" }}>
          Error 404
        </div>
        <h1 className="text-7xl font-extrabold">404</h1>
        <h2 className="mt-3 text-xl font-bold">Page not found</h2>
        <p className="mt-2 text-sm" style={{ color: "#6c7e75" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            search={{ q: "" }}
            className="btn-quick-action mx-auto"
            style={{ display: "inline-flex" }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#f4f6f5" }}>
      <div className="card mx-auto max-w-md text-center" style={{ maxWidth: 480 }}>
        <h1 className="text-xl font-bold tracking-tight">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#6c7e75" }}>
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-quick-action"
          >
            Try again
          </button>
          <a
            href="/"
            className="btn-date-picker"
            style={{ textDecoration: "none" }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Steam Dealz — Live Steam Discounts, Regional Prices and Free Offers" },
      {
        name: "description",
        content:
          "Steam Dealz tracks live discounts from the official Steam Store — lowest regional prices first, deep cuts up to 90% off, free offers, and a personal watch list.",
      },
      { name: "keywords", content: "steam deals, steam discounts, steam sales, cheap steam games, steam free games, steam price tracker, pc game deals" },
      { name: "author", content: "Steam Dealz" },
      { name: "robots", content: "index, follow" },
      { name: "application-name", content: "Steam Dealz" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:site_name", content: "Steam Dealz" },
      { property: "og:title", content: "Steam Dealz — Live Steam Discounts and Regional Prices" },
      { property: "og:description", content: "Live Steam Store discounts at real regional prices — deep cuts, free offers, and a personal watch list." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://steamdealzz.vercel.app/favicon-steam-512.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Steam Dealz — Live Steam Discounts and Regional Prices" },
      {
        name: "twitter:description",
        content: "Live Steam Store discounts at real regional prices — deep cuts, free offers, and a personal watch list.",
      },
      { name: "twitter:image", content: "https://steamdealzz.vercel.app/favicon-steam-512.png" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "theme-color", content: "#051c12" },
    ],
    links: [
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon-steam.png", type: "image/png" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Steam Dealz",
              url: "https://steamdealzz.vercel.app/",
              description:
                "Live discounts from the official Steam Store — lowest regional prices first, free offers, and a personal watch list.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://steamdealzz.vercel.app/deals?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
