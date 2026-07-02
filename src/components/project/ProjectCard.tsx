"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { Project } from "@/types";
import { calcProjectStats, formatCurrency, formatNumber } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";
import Confetti from "@/components/animations/Confetti";

interface ProjectCardProps {
  project: Project;
  featured?: boolean;
}

export default function ProjectCard({ project, featured = false }: ProjectCardProps) {
  const stats = calcProjectStats(project);
  const [hovered, setHovered] = useState(false);

  // NEW: 作成から14日以内
  const isNew =
    Date.now() - new Date(project.created_at).getTime() < 14 * 86400000;
  // HOT: featured フラグ or 達成率70%以上
  const isHot = project.featured || stats.progress_percentage >= 70;

  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      {/* カードフロート演出 */}
      <motion.div
        className="relative rounded-3xl overflow-hidden bg-white shadow-soft h-full"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{
          y: -8,
          boxShadow: "0 20px 44px rgba(232, 132, 44, 0.25)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        {/* 達成プロジェクトはホバーでコンフェッティ */}
        {stats.is_funded && <Confetti fire={hovered} pieceCount={24} />}

        {/* 画像 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-caramel-100 to-apricot/40">
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
            {isHot && (
              <Badge color="hot" size="sm">
                🔥 HOT
              </Badge>
            )}
            {isNew && !isHot && (
              <Badge color="new" size="sm">
                ✨ NEW
              </Badge>
            )}
            {stats.is_funded && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-mint">
                🎉 達成！
              </span>
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
          {/* カテゴリー & クリエイター */}
          <div className="flex items-center justify-between mb-2">
            {project.categories && (
              <span className="text-xs font-semibold text-latte">
                {project.categories.icon} {project.categories.name_ja}
              </span>
            )}
            {project.profiles && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full overflow-hidden bg-caramel-100">
                  {project.profiles.avatar_url ? (
                    <Image
                      src={project.profiles.avatar_url}
                      alt={project.profiles.display_name || ""}
                      width={16}
                      height={16}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px]">
                      {project.profiles.display_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-medium truncate max-w-[100px]">
                  {project.profiles.display_name}
                </span>
              </div>
            )}
          </div>

          {/* タイトル */}
          <h3 className="font-bold text-cocoa-700 text-sm leading-snug mb-3 line-clamp-2">
            {project.title}
          </h3>

          {/* 達成率 + プログレスバー */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg font-black text-caramel-500 leading-none">
              {stats.progress_percentage}%
            </span>
          </div>
          <ProgressBar percentage={stats.progress_percentage} className="mb-3" />

          {/* 金額・支援者・残り */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cocoa-700">
              {formatCurrency(project.current_amount)}
              <span className="text-gray-400 font-medium">
                {" "}/ {formatCurrency(project.goal_amount)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {formatNumber(project.backer_count)}人
            </span>
            {stats.days_left > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                残り{stats.days_left}日
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
