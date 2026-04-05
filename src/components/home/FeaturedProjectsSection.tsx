import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import ProjectCard from "@/components/project/ProjectCard";
import { Project } from "@/types";

// ダミーデータ（本番はSupabaseから取得）
const dummyProjects: Project[] = [
  {
    id: "1",
    creator_id: "u1",
    title: "世界で初めての「香りで楽しむ音楽アルバム」を作りたい！",
    slug: "scent-music-album",
    tagline: "音楽と香りを融合させた全く新しいリスニング体験を届けます",
    description: "音楽を耳だけで楽しむ時代は終わった。香りと音楽を同時に楽しむ、革命的なアルバムプロジェクト。",
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
      id: "cat-music",
      slug: "music",
      name_ja: "音楽",
      name_en: "Music",
      icon: "🎵",
      color: "#FF6B9D",
      sort_order: 1,
    },
  },
  {
    id: "2",
    creator_id: "u2",
    title: "障がいのある子どもたちと作る、インタラクティブ絵本アプリ",
    slug: "interactive-picture-book",
    tagline: "すべての子どもが主人公になれる物語を届けたい",
    description: "AI生成イラストとARを組み合わせた、インクルーシブな絵本アプリを開発中。",
    story: "",
    category_id: "cat-tech",
    tags: ["教育", "インクルーシブ", "テクノロジー"],
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
      id: "cat-tech",
      slug: "tech",
      name_ja: "テクノロジー",
      name_en: "Technology",
      icon: "💻",
      color: "#74C0FC",
      sort_order: 4,
    },
  },
  {
    id: "3",
    creator_id: "u3",
    title: "京都の職人技×デジタルアートで作る、動く着物コレクション",
    slug: "digital-kimono-collection",
    tagline: "300年の伝統をNFTアートとして世界へ",
    description: "京都の老舗和装店と現代デジタルアーティストがコラボ。動くデジタル着物を世界に届けます。",
    story: "",
    category_id: "cat-art",
    tags: ["和服", "NFT", "アート", "伝統"],
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
      icon: "🎨",
      color: "#C3B1E1",
      sort_order: 2,
    },
  },
];

export default function FeaturedProjectsSection() {
  return (
    <section className="py-20" style={{ background: "linear-gradient(180deg, #FFFBF5 0%, white 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-up" className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(255, 107, 157, 0.1)", color: "#FF6B9D" }}>
              🌟 注目のプロジェクト
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
              今すぐ応援できる
              <br />
              <span style={{
                background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>熱いプロジェクト</span>
            </h2>
          </div>
          <Link
            href="/projects"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-caramel-600 hover:text-caramel-700 transition-colors whitespace-nowrap"
          >
            すべて見る
            <ArrowRight size={16} />
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyProjects.map((project, i) => (
            <AnimatedSection key={project.id} animation="fade-up" delay={i * 100}>
              <ProjectCard project={project} />
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection animation="fade-up" delay={300} className="text-center mt-10 sm:hidden">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-caramel-600 bg-caramel-50 hover:bg-caramel-100 transition-colors"
          >
            すべてのプロジェクトを見る
            <ArrowRight size={16} />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
}
