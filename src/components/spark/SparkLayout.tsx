import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  Gamepad2,
  Gift,
  LayoutDashboard,
  LifeBuoy,
  Maximize,
  Menu,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Tags,
  X,
} from "lucide-react";

export type SparkNavKey = "dashboard" | "deals" | "free" | "analytics";

export function SparkLayout({
  children,
  searchValue,
  onSearchChange,
  searching,
  onRefresh,
  refreshing,
  notifications,
  activeNav = "dashboard",
  onNav,
}: {
  children: ReactNode;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searching?: boolean;
  onRefresh: () => void;
  refreshing?: boolean;
  notifications: { title: string; meta: string; discount: number }[];
  activeNav?: SparkNavKey;
  onNav?: (key: SparkNavKey, href: string) => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(t)) setShowProfile(false);
      if (createRef.current && !createRef.current.contains(t)) setShowCreate(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* noop */
    }
  };

  const go = (key: SparkNavKey, href: string) => {
    setMobileOpen(false);
    if (onNav) {
      onNav(key, href);
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItem = (key: SparkNavKey, href: string, icon: ReactNode, label: string, badge?: string) => (
    <li key={key}>
      <a
        href={href}
        onClick={(e) => {
          if (href.startsWith("#")) e.preventDefault();
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
    <div className={`spark-shell${minimized ? " spark-minimized" : ""}`}>
      <div className={`sidebar-overlay${mobileOpen ? " show" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar-wrapper${mobileOpen ? " show" : ""}`} id="sidebar">
        <a
          href="#top"
          className="sidebar-brand"
          onClick={(e) => {
            e.preventDefault();
            go("dashboard", "#top");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="sidebar-brand-mark">
            <Gamepad2 size={20} strokeWidth={2.4} />
          </span>
          <span>Steam Dealz</span>
        </a>

        <div className="flex-1 overflow-y-auto">
          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Menu</div>
            <ul className="sidebar-menu-list">
              {navItem("dashboard", "#top", <LayoutDashboard size={19} />, "Dashboard")}
            </ul>
          </div>

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Store</div>
            <ul className="sidebar-menu-list">
              {navItem("deals", "#deals", <Tags size={19} />, "Discounted Games")}
              {navItem("free", "#free-offers", <Gift size={19} />, "Free Offers")}
              {navItem("analytics", "#analytics", <BarChart3 size={19} />, "Analytics")}
            </ul>
          </div>

          <div className="sidebar-menu-section">
            <div className="sidebar-menu-title">Pages</div>
            <ul className="sidebar-menu-list">
              <li>
                <a
                  href="https://store.steampowered.com/specials/"
                  target="_blank"
                  rel="noreferrer"
                  className="sidebar-menu-link"
                  title="Official Steam Specials"
                >
                  <ExternalLink size={19} />
                  <span>Steam Specials</span>
                </a>
              </li>
              <li>
                <button type="button" className="sidebar-menu-link" title="Store region" onClick={() => go("deals", "#region")}>
                  <Settings size={19} />
                  <span>Store Region</span>
                </button>
              </li>
              <li>
                <a href="#about" onClick={(e) => { e.preventDefault(); go("dashboard", "#about"); }} className="sidebar-menu-link" title="Help">
                  <LifeBuoy size={19} />
                  <span>Help & Docs</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebar-profile">
          <img
            src="/avatar.png"
            alt="Administrator"
            className="sidebar-profile-img"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";
            }}
          />
          <div className="sidebar-profile-info min-w-0 flex-1">
            <div className="sidebar-profile-name">Deal Hunter</div>
            <div className="sidebar-profile-email">hunter@steamdealz.gg</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper" id="top">
        <header className="navbar-custom">
          <div className="navbar-left">
            <button
              className="btn-desktop-toggle"
              onClick={() => setMinimized((v) => !v)}
              aria-label="Minimize sidebar"
              type="button"
            >
              {minimized ? <Minimize2 size={18} /> : <Menu size={18} />}
            </button>
            <button className="sidebar-toggle-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation" type="button">
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>

            <div className="relative" ref={createRef}>
              <button className="btn-quick-action" type="button" onClick={() => setShowCreate((v) => !v)}>
                <Plus size={15} strokeWidth={3} />
                <span>Create</span>
                <ChevronDown size={14} />
              </button>
              {showCreate ? (
                <div className="spark-pop" style={{ top: "calc(100% + 8px)", left: 0, width: 230 }}>
                  <div className="spark-pop-header">Quick actions</div>
                  <button
                    className="spark-pop-item"
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      onRefresh();
                    }}
                  >
                    <RefreshCw size={16} /> Refresh deals
                  </button>
                  <a className="spark-pop-item" href="#deals" onClick={() => setShowCreate(false)}>
                    <Tags size={16} /> Browse discounts
                  </a>
                  <a
                    className="spark-pop-item"
                    href="https://store.steampowered.com/specials/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowCreate(false)}
                  >
                    <ExternalLink size={16} /> Steam Specials <ArrowUpRight size={13} />
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          <div className="navbar-search-wrapper">
            <input
              type="search"
              className="navbar-search-input"
              placeholder="Search anything — try “elden ring”"
              value={searchValue}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              aria-label="Search Steam games"
            />
            <span className="navbar-search-btn" aria-hidden="true">
              <Search size={17} />
            </span>
            {searching ? (
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6c7e75]">…</span>
            ) : null}
          </div>

          <div className="navbar-actions">
            <button className="navbar-action-btn" aria-label="Toggle fullscreen" type="button" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
            </button>

            <div className="relative" ref={notifRef}>
              <button
                className="navbar-action-btn"
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotif((v) => !v);
                  setShowProfile(false);
                }}
              >
                <Bell size={18} />
                {notifications.length ? <span className="navbar-action-badge" /> : null}
              </button>
              {showNotif ? (
                <div className="spark-pop" style={{ top: "calc(100% + 10px)", right: 0, width: 320 }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #e9efef" }}>
                    <h6 className="m-0 text-sm font-bold">Top discounts</h6>
                    <span className="text-xs font-bold text-[#072f1f]">{notifications.length} live</span>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-[#6c7e75]">No deals loaded yet.</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.title} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: "1px solid #eef2f0" }}>
                          <div
                            className="grid size-9 flex-none place-items-center rounded-full text-xs font-extrabold"
                            style={{ background: "#072f1f", color: "#b4f105" }}
                          >
                            -{n.discount}%
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.8rem] font-bold leading-5">{n.title}</p>
                            <span className="text-xs text-[#6c7e75]">{n.meta}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <a href="#deals" onClick={() => setShowNotif(false)} className="block px-4 py-3 text-center text-[0.8rem] font-bold text-[#072f1f]">
                    View all deals
                  </a>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                className="navbar-profile-btn"
                type="button"
                onClick={() => {
                  setShowProfile((v) => !v);
                  setShowNotif(false);
                }}
              >
                <img
                  src="/avatar.png"
                  alt="Profile"
                  className="navbar-profile-img"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";
                  }}
                />
                <span className="navbar-profile-name hidden md:inline">Deal Hunter</span>
                <ChevronDown size={14} className="text-[#6c7e75]" />
              </button>
              {showProfile ? (
                <div className="spark-pop" style={{ top: "calc(100% + 10px)", right: 0, width: 210 }}>
                  <div className="spark-pop-header">Welcome!</div>
                  <a className="spark-pop-item" href="#analytics" onClick={() => setShowProfile(false)}>
                    <BarChart3 size={16} /> Analytics
                  </a>
                  <a className="spark-pop-item" href="#region" onClick={() => setShowProfile(false)}>
                    <Settings size={16} /> Store region
                  </a>
                  <a
                    className="spark-pop-item"
                    href="https://store.steampowered.com/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowProfile(false)}
                  >
                    <ExternalLink size={16} /> Steam Store
                  </a>
                </div>
              ) : null}
            </div>

            <button
              className="btn-quick-action md:hidden"
              type="button"
              onClick={onRefresh}
              title="Refresh"
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {children}

        <footer className="footer-custom" id="about">
          <div className="footer-left">
            <span className="footer-logo">
              <Gamepad2 size={15} /> Steam Dealz
            </span>
            <span style={{ color: "#dde5e1" }}>|</span>
            <span>© 2026 Official Steam Store prices · Valve trademarks belong to their owners</span>
          </div>
          <div>
            <ul className="footer-links">
              <li><a href="#top" className="footer-link">Overview</a></li>
              <li><a href="#analytics" className="footer-link">Statistics</a></li>
              <li><a href="#deals" className="footer-link">Help & Documentation</a></li>
              <li><a href="#top" className="footer-link">Status <span className="status-dot" /></a></li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
