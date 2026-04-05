"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Clock, Users } from "lucide-react";
import { Project } from "@/types";
import { calcProjectStats, formatCurrency, formatNumber } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

export default function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const stats = calcProjectStats(project);

  const categoryColors: Record<string, "pink" | "caramel" | "mint" | "lavender" | "lemon" | "sky" | "gray"> = {
    music: "pink",
    art: "lavender",
    game: "mint",
    tech: "sky",
    video: "caramel",
    food: "caramel",
    fashion: "pink",
    photo: "mint",
    social: "sky",
    other: "lemon",
  };

  const categoryColor = project.categories?.slug
    ? categoryColors[project.categories.slug] || "gray"
    : "gray";

  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      <Card hover className={featured ? "h-full" : ""} padding="none">
        {/* 画像 */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-caramel-100 to-candy-lemon/50">
          <div className={featured ? "aspect-[16/9]" : "aspect-[4/3]"}>
            {project.main_image_url ? (
              <Image
                src={project.main_image_url}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {project.categories?.icon || "🌟"}
              </div>
            )}
          </div>

          {/* バッジ類 */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {project.featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}>
                ✨ 注目
              </span>
            )}
            {stats.is_funded && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-green-500">
                🎉 達成！
              </span>
            )}
            {project.categories && (
              <Badge color={categoryColor} size="sm">
                {project.categories.icon} {project.categories.name_ja}
              </Badge>
            )}
          </div>

          {/* 残り日数 */}
          {stats.days_left > 0 && (
            <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 flex items-center gap-1">
              <Clock size={11} className="text-caramel-600" />
              <span className="text-xs font-bold text-caramel-700">
                残り{stats.days_left}日
              </span>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {/* クリエイター */}
          {project.profiles && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-caramel-100">
                {project.profiles.avatar_url ? (
                  <Image
                    src={project.profiles.avatar_url}
                    alt={project.profiles.display_name || ""}
                    width={20}
                    height={20}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {project.profiles.display_name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {project.profiles.display_name}
              </span>
            </div>
          )}

          {/* タイトル */}
          <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">
            {project.title}
          </h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.tagline}</p>

          {/* プログレス */}
          <ProgressBar percentage={stats.progress_percentage} className="mb-3" />

          {/* 統計 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-sm font-bold text-caramel-600">
                {stats.progress_percentage}%
              </p>
              <p className="text-xs text-gray-400">達成率</p>
            </div>
            <div className="text-center border-x border-caramel-100">
              <p className="text-sm font-bold text-gray-800">
                {formatCurrency(project.current_amount)}
              </p>
              <p className="text-xs text-gray-400">集まった金額</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-0.5">
                <Users size={12} className="text-gray-400" />
                {formatNumber(project.backer_count)}
              </p>
              <p className="text-xs text-gray-400">人が応援</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
