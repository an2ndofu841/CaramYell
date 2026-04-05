"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #2D1B4E 0%, #1a0f2e 100%)",
        }}
      />

      {/* 装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["🍬", "⭐", "🎀", "✨", "🍭", "💫", "🌸"].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-30 select-none"
            style={{
              left: `${5 + i * 15}%`,
              top: `${20 + Math.sin(i * 1.2) * 40}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [-10, 10, -10],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <AnimatedSection animation="scale">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "rgba(255, 107, 157, 0.2)",
              border: "1px solid rgba(255, 107, 157, 0.4)",
            }}
          >
            <Sparkles size={16} className="text-candy-pink" />
            <span className="text-sm font-bold text-candy-pink">
              今すぐ始めよう
            </span>
          </div>

          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6"
            style={{ fontFamily: "Fredoka One, sans-serif" }}
          >
            あなたの夢を、
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #FF6B9D, #FFB347, #FFE66D)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              世界中で応援してもらおう
            </span>
          </h2>

          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            手数料0%・最短30分掲載・AIサポートで、
            <br />
            夢を形にするのはこれまで以上にかんたんです。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/projects/create">
              <Button size="xl" icon={<Sparkles size={20} />}>
                無料でプロジェクトを作る
              </Button>
            </Link>
            <Link href="/projects">
              <button className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold text-white/80 border-2 border-white/20 hover:bg-white/10 hover:text-white transition-all duration-200">
                プロジェクトを見る
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>

          <p className="text-sm text-white/30 mt-6">
            クレジットカード不要 · アカウント登録なしで応援可能 · いつでもキャンセルOK
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
