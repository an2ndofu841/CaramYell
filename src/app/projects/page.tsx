"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProjectCard from "@/components/project/ProjectCard";
import AnimatedSection from "@/components/animations/AnimatedSection";
import { Input } from "@/components/ui/Input";
import { Project } from "@/types";
import { cn } from "@/lib/utils";

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

// ダミーデータ（本番はSupabaseから取得）
const allProjects: Project[] = [
  {
    id: "1",
    creator_id: "u1",
    title: "世界で初めての「香りで楽しむ音楽アルバム」を作りたい！",
    slug: "scent-music-album",
    tagline: "音楽と香りを融合させた全く新しいリスニング体験を届けます",
    description: "",
    story: "",
    category_id: "cat-music",
    tags: ["音楽", "アロマ", "アート"],
    goal_amount: 1500000,
    current_amount: 1823000,
    backer_count: 342,
    currency: "JPY",
    status: "funded",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
    images: [],
    start_date: "2025-01-01",
    end_date: "2025-08-31",
    share_count: 156,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    profiles: { id: "u1", display_name: "Aoi Tanaka", total_backed: 0, total_created: 3, created_at: "", updated_at: "" },
    categories: { id: "cat-music", slug: "music", name_ja: "音楽", name_en: "Music", icon: "🎵", color: "#FF6B9D", sort_order: 1 },
  },
  {
    id: "2",
    creator_id: "u2",
    title: "障がいのある子どもたちと作る、インタラクティブ絵本アプリ",
    slug: "interactive-picture-book",
    tagline: "すべての子どもが主人公になれる物語を届けたい",
    description: "",
    story: "",
    category_id: "cat-tech",
    tags: ["教育", "インクルーシブ"],
    goal_amount: 800000,
    current_amount: 534000,
    backer_count: 218,
    currency: "JPY",
    status: "active",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    images: [],
    start_date: "2025-05-01",
    end_date: "2025-09-30",
    share_count: 89,
    created_at: "2025-05-01T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
    profiles: { id: "u2", display_name: "Haruki Sato", total_backed: 0, total_created: 1, created_at: "", updated_at: "" },
    categories: { id: "cat-tech", slug: "tech", name_ja: "テクノロジー", name_en: "Technology", icon: "💻", color: "#74C0FC", sort_order: 4 },
  },
  {
    id: "3",
    creator_id: "u3",
    title: "京都の職人技×デジタルアートで作る、動く着物コレクション",
    slug: "digital-kimono-collection",
    tagline: "300年の伝統をNFTアートとして世界へ",
    description: "",
    story: "",
    category_id: "cat-art",
    tags: ["和服", "NFT", "アート"],
    goal_amount: 2000000,
    current_amount: 880000,
    backer_count: 95,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    images: [],
    start_date: "2025-06-01",
    end_date: "2025-10-31",
    share_count: 43,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
    profiles: { id: "u3", display_name: "Yuki Yamamoto", total_backed: 0, total_created: 2, created_at: "", updated_at: "" },
    categories: { id: "cat-art", slug: "art", name_ja: "アート", name_en: "Art", icon: "🎨", color: "#C3B1E1", sort_order: 2 },
  },
  {
    id: "4",
    creator_id: "u4",
    title: "地元の素材だけで作る、サステナブルなランチボックス",
    slug: "sustainable-lunchbox",
    tagline: "地球に優しい、毎日のお昼ごはんを届けたい",
    description: "",
    story: "",
    category_id: "cat-food",
    tags: ["フード", "サステナブル", "環境"],
    goal_amount: 500000,
    current_amount: 127000,
    backer_count: 56,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    images: [],
    start_date: "2025-07-01",
    end_date: "2025-10-15",
    share_count: 22,
    created_at: "2025-07-01T00:00:00Z",
    updated_at: "2025-07-15T00:00:00Z",
    profiles: { id: "u4", display_name: "Mika Green", total_backed: 0, total_created: 1, created_at: "", updated_at: "" },
    categories: { id: "cat-food", slug: "food", name_ja: "フード", name_en: "Food", icon: "🍽️", color: "#FF9A2E", sort_order: 6 },
  },
  {
    id: "5",
    creator_id: "u5",
    title: "東北の風景を詠んだ、VR俳句体験プロジェクト",
    slug: "vr-haiku-tohoku",
    tagline: "575の言葉が、360度の世界で生き返る",
    description: "",
    story: "",
    category_id: "cat-art",
    tags: ["VR", "俳句", "文化", "東北"],
    goal_amount: 1200000,
    current_amount: 1200000,
    backer_count: 189,
    currency: "JPY",
    status: "funded",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80",
    images: [],
    start_date: "2025-04-01",
    end_date: "2025-08-31",
    share_count: 98,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
    profiles: { id: "u5", display_name: "Kenji Watanabe", total_backed: 0, total_created: 4, created_at: "", updated_at: "" },
    categories: { id: "cat-art", slug: "art", name_ja: "アート", name_en: "Art", icon: "🎨", color: "#C3B1E1", sort_order: 2 },
  },
  {
    id: "6",
    creator_id: "u6",
    title: "全盲のピアニストが語る、「光のない世界の音楽」ドキュメンタリー",
    slug: "blind-pianist-documentary",
    tagline: "見えない世界から生まれる、奇跡のような音楽の記録",
    description: "",
    story: "",
    category_id: "cat-video",
    tags: ["ドキュメンタリー", "音楽", "社会"],
    goal_amount: 3000000,
    current_amount: 2100000,
    backer_count: 412,
    currency: "JPY",
    status: "active",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80",
    images: [],
    start_date: "2025-03-01",
    end_date: "2025-09-30",
    share_count: 234,
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2025-07-01T00:00:00Z",
    profiles: { id: "u6", display_name: "Sakura Films", total_backed: 0, total_created: 2, created_at: "", updated_at: "" },
    categories: { id: "cat-video", slug: "video", name_ja: "動画・映像", name_en: "Video & Film", icon: "🎬", color: "#FFB347", sort_order: 5 },
  },
];

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = allProjects.filter((p) => {
    const matchCategory =
      selectedCategory === "all" || p.categories?.slug === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen pt-20" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 200px)" }}>
      {/* ヘッダー */}
      <div className="py-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <AnimatedSection animation="fade-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3">
              プロジェクトを
              <span style={{
                background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}> 探す</span>
            </h1>
            <p className="text-gray-500 text-lg">
              {allProjects.length}件のプロジェクトが応援を待っています
            </p>
          </AnimatedSection>

          {/* 検索 */}
          <AnimatedSection animation="fade-up" delay={100} className="mt-6">
            <Input
              placeholder="🔍 プロジェクトを検索..."
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
                      ? { background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }
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
          {filteredProjects.length}件のプロジェクト
        </p>

        {/* プロジェクトグリッド */}
        {filteredProjects.length > 0 ? (
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
              プロジェクトが見つかりませんでした
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
