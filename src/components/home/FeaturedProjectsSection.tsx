"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import ProjectCard from "@/components/project/ProjectCard";
import { getAllMockProjects } from "@/lib/data/mockProjects";

const featuredProjects = getAllMockProjects().slice(0, 6);

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
          {featuredProjects.map((project, i) => (
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
