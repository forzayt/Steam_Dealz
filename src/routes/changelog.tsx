import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ExternalLink, GitBranch, GitCommitHorizontal, Github, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SparkLayout } from "@/components/spark/SparkLayout";

const REPO = "forzayt/Steam_Dealz";

type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

type CommitItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date?: string } | null;
  };
  author?: { login?: string; avatar_url?: string } | null;
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const Route = createFileRoute("/changelog")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Change Log — Steam Dealz" },
      { name: "description", content: "Live contributors and commit history of Steam Dealz, straight from GitHub." },
      { property: "og:url", content: "https://steamdealzz.vercel.app/changelog" },
      { property: "og:title", content: "Change Log — Steam Dealz" },
      { property: "og:description", content: "Live contributors and commit history of Steam Dealz, straight from GitHub." },
    ],
    links: [{ rel: "canonical", href: "https://steamdealzz.vercel.app/changelog" }],
  }),
  component: ChangelogPage,
});

function ChangelogPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/changelog" });
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [contribRes, commitRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=24`, {
          headers: { Accept: "application/vnd.github+json" },
        }),
        fetch(`https://api.github.com/repos/${REPO}/commits?per_page=20`, {
          headers: { Accept: "application/vnd.github+json" },
        }),
      ]);
      if (contribRes.status === 403 || commitRes.status === 403) {
        throw new Error("GitHub API rate limit reached. Please try again in a little while.");
      }
      if (!contribRes.ok || !commitRes.ok) {
        throw new Error("GitHub did not return the repository activity right now.");
      }
      const [contribData, commitData] = (await Promise.all([
        contribRes.json(),
        commitRes.json(),
      ])) as [unknown, unknown];
      setContributors(Array.isArray(contribData) ? (contribData as Contributor[]) : []);
      setCommits(Array.isArray(commitData) ? (commitData as CommitItem[]) : []);
    } catch {
      setError("Live GitHub activity could not be loaded. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    <SparkLayout onRefresh={() => void load()} refreshing={loading} activeNav="changelog" onNav={handleNav}>
      <div className="page-header" id="changelog">
        <div>
          <h1 className="page-title">Change Log</h1>
          <p className="page-subtitle">Live contributors and commits, straight from GitHub.</p>
        </div>
        <div className="page-header-actions">
          <span className="badge-table success">
            <Users size={13} /> {contributors.length} contributors
          </span>
          <a
            className="btn-date-picker"
            style={{ textDecoration: "none" }}
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={14} />
            <span>View repo</span>
          </a>
        </div>
      </div>

      {error ? (
        <div role="alert" className="card mb-6 flex items-start gap-3" style={{ borderLeft: "4px solid #ef4444" }}>
          <AlertCircle size={20} className="mt-0.5 flex-none text-[#ef4444]" />
          <div className="flex-1 text-sm font-semibold">{error}</div>
          <button className="btn-date-picker" type="button" onClick={() => void load()}>Retry</button>
        </div>
      ) : null}

      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Contributors</h2>
          <GitBranch size={16} className="text-[#6c7e75]" />
        </div>
        {loading ? (
          <div className="contrib-grid" aria-busy="true" aria-label="Loading contributors">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="contrib-card">
                <div className="contrib-avatar spark-skeleton" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="spark-skeleton h-4 w-3/4" />
                  <div className="spark-skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : contributors.length ? (
          <div className="contrib-grid">
            {contributors.map((c) => (
              <a
                key={c.login}
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                className="contrib-card"
                title={`${c.login} on GitHub`}
              >
                <img src={c.avatar_url} alt={`${c.login} avatar`} loading="lazy" className="contrib-avatar" />
                <div className="min-w-0 flex-1">
                  <div className="contrib-name">{c.login}</div>
                  <div className="contrib-commits">
                    {c.contributions} commit{c.contributions === 1 ? "" : "s"}
                  </div>
                </div>
                <ExternalLink size={14} className="flex-none text-[#6c7e75]" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#6c7e75]">No contributors found yet.</p>
        )}
      </div>

      <div className="card mb-0">
        <div className="card-header">
          <h2 className="card-title">Recent Commits</h2>
          <GitCommitHorizontal size={16} className="text-[#6c7e75]" />
        </div>
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading commits">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="spark-skeleton h-4 w-4/5" />
                <div className="spark-skeleton h-3 w-2/5" />
              </div>
            ))}
          </div>
        ) : commits.length ? (
          <div className="commit-list">
            {commits.map((c) => {
              const message = c.commit.message.split("\n")[0] ?? c.sha;
              const author = c.author?.login ?? c.commit.author?.name ?? "unknown";
              return (
                <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer" className="commit-row">
                  {c.author?.avatar_url ? (
                    <img src={c.author.avatar_url} alt={`${author} avatar`} loading="lazy" className="commit-avatar" />
                  ) : (
                    <span className="commit-avatar commit-avatar--fallback">
                      <GitCommitHorizontal size={16} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="commit-message">{message}</span>
                    <span className="commit-meta">
                      {author} · {timeAgo(c.commit.author?.date)} · {c.sha.slice(0, 7)}
                    </span>
                  </span>
                  <ExternalLink size={14} className="commit-open" />
                </a>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#6c7e75]">No commits found yet.</p>
        )}
      </div>
    </SparkLayout>
  );
}
