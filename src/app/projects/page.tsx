"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ProjectCard from "@/components/project/ProjectCard";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { useT } from "@/components/i18n/LocaleProvider";

const categories = [
  { slug: "all", name: "すべて", icon: "🌟" },
  { slug: "music", name: "音楽", icon: "🎵" },
  { slug: "art", name: "アート", icon: "🎨" },
  { slug: "game", name: "ゲーム", icon: "🎮" },
  { slug: "tech", name: "テクノロジー", icon: "💻" },
  { slug: "video", name: "動画", icon: "🎬" },
  { slug: "food", name: "フード", icon: "🍽️" },
  { slug: "fashion", name: "ファッション", icon: "👗" },
  { slug: "social", name: "社会", icon: "🌍" },
];

const sortOptions = [
  { value: "trending", label: "🔥 トレンド" },
  { value: "newest", label: "🆕 新着順" },
  { value: "ending_soon", label: "⏰ 終了間近" },
  { value: "most_funded", label: "💰 支援額順" },
  { value: "most_backers", label: "👥 応援数順" },
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
    <div className="min-h-screen pt-20" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 200px)" }}>
      {/* ヘッダー */}
      <div className="py-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <AnimatedSection animation="fade-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3">
              {t.projects.title}
              <span style={{
                background: "linear-gradient(135deg, #F2807B, #F5A34B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>{t.projects.titleAccent}</span>
            </h1>
            <p className="text-gray-500 text-lg">
              {allProjects.length}{t.projects.waiting}
            </p>
          </AnimatedSection>

          {/* 検索 */}
          <AnimatedSection animation="fade-up" delay={100} className="mt-6">
            <Input
              placeholder={`🔍 ${t.projects.searchPlaceholder}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-base shadow-soft"
              rightElement={
                searchQuery ? (
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                ) : undefined
              }
            />
          </AnimatedSection>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* フィルター */}
        <AnimatedSection animation="fade-up" className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* カテゴリーフィルター */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                    selectedCategory === cat.slug
                      ? "text-white shadow-candy"
                      : "bg-white text-gray-600 shadow-soft hover:shadow-soft-lg"
                  )}
                  style={
                    selectedCategory === cat.slug
                      ? { background: "linear-gradient(135deg, #F2807B, #F5A34B)" }
                      : {}
                  }
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* ソート */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-4 py-2 rounded-full border-2 border-caramel-100 bg-white text-sm font-semibold text-gray-600 outline-none focus:border-candy-pink transition-colors cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </AnimatedSection>

        {/* 件数 */}
        <p className="text-sm text-gray-400 font-medium mb-6">
          {isLoading ? " " : `${filteredProjects.length}${t.projects.count}`}
        </p>

        {/* プロジェクトグリッド */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden bg-white shadow-soft animate-pulse"
              >
                <div className="aspect-[4/3] bg-caramel-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/3 rounded-full bg-caramel-100" />
                  <div className="h-4 w-4/5 rounded-full bg-caramel-100" />
                  <div className="h-2 w-full rounded-full bg-caramel-100" />
                  <div className="h-3 w-2/3 rounded-full bg-caramel-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, i) => (
              <AnimatedSection key={project.id} animation="fade-up" delay={i * 50}>
                <ProjectCard project={project} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              {t.projects.notFound}
            </h3>
            <p className="text-gray-400">
              キーワードやカテゴリーを変えて試してみてください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
