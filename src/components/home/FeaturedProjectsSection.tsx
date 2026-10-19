"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProjectCard from "@/components/project/ProjectCard";
import type { Project } from "@/types";
import { useT } from "@/components/i18n/LocaleProvider";
import { CaramelMark } from "@/components/layout/Logo";

export default function FeaturedProjectsSection() {
  const t = useT();
  // 取得前はスケルトンを出す。ダミーを初期値にすると一瞬だけ実在しない
  // プロジェクトが表示されてしまうため。
  const [featuredProjects, setFeaturedProjects] = useState<Project[] | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/projects?sort=newest&limit=6");
        const data = await res.json();
        setFeaturedProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch {
        setFeaturedProjects([]);
      }
    })();
  }, []);

  const isLoading = featuredProjects === null;
  // 掲載中のプロジェクトが1件も無ければセクションごと隠す
  if (!isLoading && featuredProjects.length === 0) return null;

  return (
    <section className="relative -mt-8 sm:-mt-12 py-16 sm:py-20 bg-white rounded-t-[2.5rem] sm:rounded-t-[3.5rem] shadow-[0_-12px_32px_rgba(134,71,26,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2
            className="flex items-center gap-2.5 text-2xl sm:text-[28px] font-bold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <CaramelMark className="w-7 h-7 flex-shrink-0" />
            {t.home.featured}
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-caramel-50 text-sm font-bold text-caramel-700 hover:bg-caramel-100 transition-colors whitespace-nowrap"
          >
            {t.home.seeAll}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-3xl overflow-hidden border border-line animate-pulse">
                  <div className="aspect-[16/10] bg-cream-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-4/5 rounded bg-cream-100" />
                    <div className="h-1.5 w-full rounded bg-cream-100" />
                    <div className="h-3 w-2/3 rounded bg-cream-100" />
                  </div>
                </div>
              ))
            : featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
        </div>
      </div>
    </section>
  );
}
