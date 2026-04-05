import { notFound } from "next/navigation";
import ProjectDetailClient from "./ProjectDetailClient";
import { Project, Reward } from "@/types";

// ダミーデータ（本番はSupabaseから取得）
const getProject = (slug: string): Project | null => {
  const projects: Record<string, Project> = {
    "scent-music-album": {
      id: "1",
      creator_id: "u1",
      title: "世界で初めての「香りで楽しむ音楽アルバム」を作りたい！",
      slug: "scent-music-album",
      tagline: "音楽と香りを融合させた全く新しいリスニング体験を届けます",
      description: `音楽を耳だけで楽しむ時代は終わった。

私たちは、音楽と香りを同時に体験できる、世界初の「オルファクトリー・アルバム」を制作します。

アルバムを再生すると同時に専用のアロマデバイスが起動し、楽曲のムードに合わせた香りが部屋に広がります。
雨音のトラックには森と土の香り。情熱的なバラードには深紅のバラの香り。

音楽体験に革命を起こす、全く新しいアルバムプロジェクトです。`,
      story: `**このプロジェクトを始めたきっかけ**

私は幼い頃から音楽と香りへの強い関心を持っていました。音楽を聴くとき、なぜか特定の色や香りが頭に浮かぶ「共感覚」を持つ私にとって、音楽と嗅覚を結びつけることは自然なアイデアでした。

3年間の研究開発を経て、音楽に連動してリアルタイムで香りを生成できるデバイスのプロトタイプが完成しました。

このプロジェクトでは、10曲入りのアルバムと専用アロマデバイスをセットにして、世界中のリスナーにお届けします。`,
      category_id: "cat-music",
      tags: ["音楽", "アロマ", "アート", "テクノロジー"],
      goal_amount: 1500000,
      current_amount: 1823000,
      backer_count: 342,
      currency: "JPY",
      status: "funded",
      featured: true,
      main_image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
      ],
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      start_date: "2025-01-01",
      end_date: "2025-08-31",
      share_count: 156,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-06-01T00:00:00Z",
      profiles: {
        id: "u1",
        display_name: "Aoi Tanaka",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        bio: "音楽家・アロマセラピスト。感覚を超えた音楽体験を追求しています。",
        total_backed: 12,
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
      rewards: [
        {
          id: "r1",
          project_id: "1",
          title: "感謝のメッセージ＋名前をライナーノーツに掲載",
          description: "心を込めたお礼メッセージをお届けします。また、アルバムのライナーノーツにあなたのお名前を掲載します。",
          amount: 1000,
          quantity_total: undefined,
          quantity_claimed: 89,
          reward_type: "digital",
          needs_address: false,
          estimated_delivery_date: "2025-09-30",
          sort_order: 1,
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "r2",
          project_id: "1",
          title: "限定お礼ボイス＋デジタルアルバム先行配信",
          description: "制作者Aoiによる、あなた宛ての限定音声メッセージをお届け。さらにデジタルアルバムを発売日より1週間早く受け取れます。",
          amount: 3000,
          quantity_total: 200,
          quantity_claimed: 167,
          reward_type: "digital",
          needs_address: false,
          estimated_delivery_date: "2025-09-23",
          sort_order: 2,
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "r3",
          project_id: "1",
          title: "アロマデバイス＋CD＋限定香水セット",
          description: "専用アロマデバイス、フィジカルCD、アルバムの世界観を表現した限定香水（3種）のフルセット。",
          amount: 15000,
          quantity_total: 100,
          quantity_claimed: 78,
          reward_type: "physical",
          needs_address: true,
          estimated_delivery_date: "2025-11-30",
          sort_order: 3,
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "r4",
          project_id: "1",
          title: "【VIP】レコーディングスタジオ見学＋サイン入りフルセット",
          description: "東京のスタジオでのレコーディング見学招待、直筆サイン入りフルセット、打ち上げパーティへのご招待。",
          amount: 50000,
          quantity_total: 10,
          quantity_claimed: 8,
          reward_type: "experience",
          needs_address: true,
          estimated_delivery_date: "2025-10-31",
          sort_order: 4,
          created_at: "2025-01-01T00:00:00Z",
        },
      ],
    },
  };
  return projects[slug] || null;
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
