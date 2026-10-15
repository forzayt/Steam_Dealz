import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  Gift,
  Github,
  History,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  Tags,
  Trophy,
  X,
} from "lucide-react";

export type SparkNavKey = "dashboard" | "deals" | "free" | "watchlist" | "changelog" | "topsellers" | "comingsoon" | "analytics";

export function SparkLayout({
  children,
  activeNav = "dashboard",
  onNav,
}: {
  children: ReactNode;
  onRefresh: () => void;
  refreshing?: boolean;
  notifications?: { title: string; meta: string; discount: number }[];
  activeNav?: SparkNavKey;
  onNav?: (key: SparkNavKey, href: string) => void;
}) {
  const [minimized] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("steam-dealz-theme");
      if (stored) return stored === "dark";
    }
    return false;
  });
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSidebarEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (minimized) setHoverOpen(true);
  };

  const handleSidebarLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const collapsed = minimized && !hoverOpen;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      window.localStorage.setItem("steam-dealz-theme", isDark ? "dark" : "light");
    } catch {
      /* noop */
    }
  }, [isDark]);

  const go = (key: SparkNavKey, href: string) => {
    setMobileOpen(false);
    if (onNav) {
      onNav(key, href);
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (href.startsWith("/#")) {
      const id = href.slice(1);
      if (window.location.pathname === "/") document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
      else window.location.href = href;
    } else {
      window.location.href = href;
    }
  };

  const navItem = (key: SparkNavKey, href: string, icon: ReactNode, label: string, badge?: string) => (
    <li key={key}>
      <a
        href={href}
        onClick={(e) => {
          if (href.startsWith("#")) e.preventDefault();
          else if (onNav) e.preventDefault();
          go(key, href);
        }}
        className={`sidebar-menu-link${activeNav === key ? " active" : ""}`}
        title={label}
      >
        {icon}
        <span>{label}</span>
        {badge ? <span className="sidebar-menu-badge">{badge}</span> : null}
      </a>
    </li>
  );

  return (
    <div className={`spark-shell${collapsed ? " spark-minimized" : ""}`}>
      <div className={`sidebar-overlay${mobileOpen ? " show" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar — auto-expands on hover when minimized, collapses on mouse leave */}
      <aside
        className={`sidebar-wrapper${mobileOpen ? " show" : ""}`}
        id="sidebar"
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <a
          href="/"
          className="sidebar-brand"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard", "/");
          }}
        >
          <span className="sidebar-brand-mark sidebar-brand-mark--logo">
            <img src="/favicon-steam.png" alt="Steam Dealz logo" />
          </span>
          <span>Steam Dealz</span>
        </a>

        <div className="flex-1 overflow-y-auto">
          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Menu</div>
            <ul className="sidebar-menu-list">
              {navItem("dashboard", "/", <LayoutDashboard size={19} />, "Dashboard")}
            </ul>
          </div>

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Store</div>
            <ul className="sidebar-menu-list">
              {navItem("deals", "/deals", <Tags size={19} />, "Discounted Games")}
              {navItem("free", "/free-offers", <Gift size={19} />, "Free Offers")}
              {navItem("topsellers", "/top-sellers", <Trophy size={19} />, "Top Sellers")}
              {navItem("comingsoon", "/coming-soon", <CalendarDays size={19} />, "Coming Soon")}
              {navItem("watchlist", "/watch-list", <Bookmark size={19} />, "Watch List")}
            </ul>
          </div>

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Pages</div>
            <ul className="sidebar-menu-list">
              {navItem("changelog", "/changelog", <History size={19} />, "Change Log")}
            </ul>
          </div>
        </div>

        <div className="sidebar-profile">
          <img
            src="https://avatars.githubusercontent.com/u/127679210?v=4"
            alt="Administrator"
            className="sidebar-profile-img"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";
            }}
          />
          <div className="sidebar-profile-info min-w-0 flex-1">
            <div className="sidebar-profile-name">Developed by Forza</div>
            <a
              href="https://github.com/forzayt/Steam_Dealz"
              target="_blank"
              rel="noreferrer"
              className="sidebar-contribute-link"
            >
              <Github size={13} />
              <span>Contribute</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper" id="top">
        <header className="navbar-custom">
          <div className="navbar-left">
            <button className="sidebar-toggle-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation" type="button">
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <a
              href="/"
              className="navbar-brand"
              onClick={(e) => {
                e.preventDefault();
                go("dashboard", "/");
              }}
            >
              <span className="navbar-brand-mark">
                <img src="/favicon-steam.png" alt="Steam Dealz logo" />
              </span>
              <span>Steam Dealz</span>
            </a>
          </div>

          <div className="navbar-actions">
            <button
              className="navbar-action-btn"
              type="button"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setIsDark((v) => !v)}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {children}

        <footer className="footer-custom" id="about">
          <div className="footer-left">
            <span className="footer-logo">
              <img src="/favicon-steam.png" alt="Steam Dealz logo" className="footer-logo-img" /> Steam Dealz
            </span>
            <span style={{ color: "#dde5e1" }}>|</span>
            <span>© 2026 Official Steam Store prices · Valve trademarks belong to their owners</span>
          </div>
          <div>
            <ul className="footer-links">
              <li><a href="/" className="footer-link">Overview</a></li>
              <li><a href="/#events" className="footer-link">Events</a></li>
              <li><a href="/deals" className="footer-link">Discounted Games</a></li>
              <li><a href="/free-offers" className="footer-link">Free Offers <span className="status-dot" /></a></li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
