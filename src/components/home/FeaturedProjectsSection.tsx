"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import ProjectCard from "@/components/project/ProjectCard";
import { Project } from "@/types";

// ダミーデータ（本番はSupabaseから取得）
const dummyProjects: Project[] = [
  {
    id: "1",
    creator_id: "u1",
    title: "上質な革小物を届けたい - ハンドメイドブランドの挑戦",
    slug: "handmade-leather-goods",
    tagline: "一つひとつ手作業で仕上げる、長く愛せる革小物",
    description: "職人歴20年の技術で、毎日使いたくなる革小物を作ります。",
    story: "",
    category_id: "cat-fashion",
    tags: ["ハンドメイド", "革小物", "ファッション"],
    goal_amount: 1500000,
    current_amount: 1230000,
    backer_count: 1234,
    currency: "JPY",
    status: "active",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=800&q=80",
    images: [],
    start_date: "2026-05-01",
    end_date: "2026-07-18",
    share_count: 156,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    profiles: {
      id: "u1",
      display_name: "Aoi Tanaka",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      total_backed: 0,
      total_created: 3,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-fashion",
      slug: "fashion",
      name_ja: "ファッション",
      name_en: "Fashion",
      icon: "👜",
      color: "#F2807B",
      sort_order: 7,
    },
  },
  {
    id: "2",
    creator_id: "u2",
    title: "小さな焼き菓子屋さんをオープンしたい",
    slug: "small-bakery-open",
    tagline: "地元の素材で作る、心あたたまる焼き菓子のお店",
    description: "地元食材にこだわった焼き菓子専門店を開業します。",
    story: "",
    category_id: "cat-food",
    tags: ["フード", "開業", "焼き菓子"],
    goal_amount: 1500000,
    current_amount: 975000,
    backer_count: 856,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80",
    images: [],
    start_date: "2026-06-20",
    end_date: "2026-07-04",
    share_count: 89,
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u2",
      display_name: "Haruki Sato",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      total_backed: 0,
      total_created: 1,
      created_at: "2024-06-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-food",
      slug: "food",
      name_ja: "フード",
      name_en: "Food",
      icon: "🍪",
      color: "#F5A34B",
      sort_order: 6,
    },
  },
  {
    id: "3",
    creator_id: "u3",
    title: "オリジナル文具ブランドを育てて世界に届けたい",
    slug: "original-stationery-brand",
    tagline: "書くことが楽しくなる、こだわりの文具シリーズ",
    description: "デザインと使い心地にこだわった文具ブランドを立ち上げます。",
    story: "",
    category_id: "cat-art",
    tags: ["文具", "デザイン", "ものづくり"],
    goal_amount: 1500000,
    current_amount: 705600,
    backer_count: 612,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&q=80",
    images: [],
    start_date: "2026-06-01",
    end_date: "2026-08-04",
    share_count: 43,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u3",
      display_name: "Yuki Yamamoto",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      total_backed: 0,
      total_created: 2,
      created_at: "2024-03-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-art",
      slug: "art",
      name_ja: "アート",
      name_en: "Art",
      icon: "✒️",
      color: "#C9A87C",
      sort_order: 2,
    },
  },
  {
    id: "4",
    creator_id: "u4",
    title: "こだわりのカメラバッグを開発・製品化したい",
    slug: "camera-bag-development",
    tagline: "撮影者目線で設計した、機能美あふれるカメラバッグ",
    description: "プロカメラマンと共同開発する理想のカメラバッグ。",
    story: "",
    category_id: "cat-tech",
    tags: ["カメラ", "プロダクト", "ものづくり"],
    goal_amount: 1500000,
    current_amount: 567000,
    backer_count: 463,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
    images: [],
    start_date: "2026-05-15",
    end_date: "2026-08-12",
    share_count: 31,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u4",
      display_name: "Ren Kimura",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
      total_backed: 0,
      total_created: 1,
      created_at: "2024-08-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-tech",
      slug: "tech",
      name_ja: "テクノロジー",
      name_en: "Technology",
      icon: "📷",
      color: "#8FD4C4",
      sort_order: 4,
    },
  },
];

export default function FeaturedProjectsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-16 sm:py-20" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-up" className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-cocoa-700 flex items-center gap-2"
              style={{ fontFamily: "var(--font-display)" }}>
              <span className="text-2xl">🔥</span>
              注目のプロジェクト
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* カルーセル操作 */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scroll("left")}
                aria-label="前へ"
                className="w-9 h-9 rounded-full bg-white border-2 border-caramel-100 flex items-center justify-center text-caramel-500 hover:bg-caramel-50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="次へ"
                className="w-9 h-9 rounded-full bg-white border-2 border-caramel-100 flex items-center justify-center text-caramel-500 hover:bg-caramel-50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-sm font-bold text-caramel-500 hover:text-caramel-600 transition-colors whitespace-nowrap"
            >
              すべて見る
              <ArrowRight size={14} />
            </Link>
          </div>
        </AnimatedSection>

        {/* カルーセル */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {dummyProjects.map((project, i) => (
            <div
              key={project.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
            >
              <AnimatedSection animation="fade-up" delay={i * 80}>
                <ProjectCard project={project} />
              </AnimatedSection>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
