"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import ProjectCard from "@/components/project/ProjectCard";
import type { Project } from "@/types";
import { useT } from "@/components/i18n/LocaleProvider";

export default function FeaturedProjectsSection() {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
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
              {t.home.featured}
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
              {t.home.seeAll}
              <ArrowRight size={14} />
            </Link>
          </div>
        </AnimatedSection>

        {/* カルーセル */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? // 読み込み中はカード型のスケルトン
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
                >
                  <div className="rounded-3xl overflow-hidden bg-white shadow-soft animate-pulse">
                    <div className="aspect-[4/3] bg-caramel-100" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 w-1/3 rounded-full bg-caramel-100" />
                      <div className="h-4 w-4/5 rounded-full bg-caramel-100" />
                      <div className="h-2 w-full rounded-full bg-caramel-100" />
                      <div className="h-3 w-2/3 rounded-full bg-caramel-100" />
                    </div>
                  </div>
                </div>
              ))
            : featuredProjects.map((project, i) => (
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
