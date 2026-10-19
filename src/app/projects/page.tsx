"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import ProjectCard from "@/components/project/ProjectCard";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { useT } from "@/components/i18n/LocaleProvider";

const categories = [
  { slug: "all", name: "すべて" },
  { slug: "music", name: "音楽" },
  { slug: "art", name: "アート" },
  { slug: "game", name: "ゲーム" },
  { slug: "tech", name: "テクノロジー" },
  { slug: "video", name: "動画" },
  { slug: "food", name: "フード" },
  { slug: "fashion", name: "ファッション" },
  { slug: "social", name: "社会" },
];

const sortOptions = [
  { value: "trending", label: "注目順" },
  { value: "newest", label: "新着順" },
  { value: "ending_soon", label: "終了が近い順" },
  { value: "most_funded", label: "支援額順" },
  { value: "most_backers", label: "支援者数順" },
];

export default function ProjectsPage() {
  const t = useT();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  // 取得前は null（スケルトン表示）。ダミーを初期値にすると一瞬だけ
  // 実在しないプロジェクトが表示されてしまうため。
  const [projectsData, setProjectsData] = useState<Project[] | null>(null);
  const allProjects = projectsData ?? [];
  const isLoading = projectsData === null;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/projects?limit=100");
        const data = await res.json();
        setProjectsData(Array.isArray(data.projects) ? data.projects : []);
      } catch {
        setProjectsData([]);
      }
    })();
  }, []);

  const filteredProjects = allProjects
    .filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.categories?.slug === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "ending_soon":
          return (
            new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime()
          );
        case "most_funded":
          return b.current_amount - a.current_amount;
        case "most_backers":
          return b.backer_count - a.backer_count;
        default: // trending
          return b.share_count - a.share_count;
      }
    });

  return (
    <div className="min-h-screen bg-cream-50 pt-24 sm:pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between pb-8 border-b border-line">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.projects.title}
              {t.projects.titleAccent}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {isLoading ? " " : `${allProjects.length}${t.projects.waiting}`}
            </p>
          </div>

          {/* 検索 */}
          <div className="w-full md:max-w-sm">
            <Input
              placeholder={t.projects.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
              fullWidth
              rightElement={
                searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-ink-muted hover:text-ink transition-colors"
                    aria-label="検索語を消す"
                  >
                    <X size={16} />
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>

        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between py-6">
          {/* カテゴリーフィルター */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                aria-pressed={selectedCategory === cat.slug}
                className={cn(
                  "h-9 px-3.5 rounded-lg border text-sm font-bold transition-colors duration-150",
                  selectedCategory === cat.slug
                    ? "bg-ink border-ink text-white"
                    : "bg-white border-line text-ink-soft hover:border-line-strong hover:text-ink"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* ソート */}
          <label className="flex items-center gap-2 text-sm text-ink-muted flex-shrink-0">
            <span className="whitespace-nowrap">並び替え</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="h-9 px-3 rounded-lg border border-line-strong bg-white text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 件数 */}
        <p className="text-sm text-ink-muted mb-5 tabular-nums">
          {isLoading ? " " : `${filteredProjects.length}${t.projects.count}`}
        </p>

        {/* プロジェクトグリッド */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-white border border-line animate-pulse"
              >
                <div className="aspect-[16/10] bg-cream-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 rounded bg-cream-100" />
                  <div className="h-4 w-4/5 rounded bg-cream-100" />
                  <div className="h-1.5 w-full rounded bg-cream-100" />
                  <div className="h-3 w-2/3 rounded bg-cream-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-white px-6 py-16 text-center">
            <Search size={20} className="mx-auto mb-4 text-ink-muted" />
            <h3 className="text-lg font-bold text-ink mb-2">
              {t.projects.notFound}
            </h3>
            <p className="text-sm text-ink-muted">
              キーワードやカテゴリーを変えてお試しください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
