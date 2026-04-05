"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Heart, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ background: "linear-gradient(160deg, #FFFBF5 0%, #FFF5E6 40%, #FFE8C8 100%)" }}
    >
      {/* 背景の装飾バブル */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-30"
          style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-56 h-56 rounded-full opacity-20"
          style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)" }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full opacity-15"
          style={{ background: "#C3B1E1" }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        {/* 浮遊するキャンディ要素 */}
        {["🍬", "⭐", "🎀", "✨", "🍭", "💫", "🌸", "🎵"].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl select-none"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + Math.sin(i) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [-10, 10, -10],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* タグ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: "rgba(255, 107, 157, 0.1)",
            border: "2px solid rgba(255, 107, 157, 0.3)",
          }}
        >
          <Sparkles size={16} className="text-candy-pink" />
          <span className="text-sm font-bold text-candy-pink">
            掲載者の手数料 完全0円 🎉
          </span>
        </motion.div>

        {/* メインタイトル */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-4"
          style={{ fontFamily: "Fredoka One, sans-serif" }}
        >
          <span
            className="block text-5xl sm:text-6xl md:text-8xl font-bold"
            style={{
              background: "linear-gradient(135deg, #FF6B9D 0%, #FFB347 50%, #4ECDC4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CaramYell
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 mb-4"
        >
          みんなで夢を叶える、
          <br className="sm:hidden" />
          <span className="text-caramel-500">世界一やさしい</span>クラウドファンディング
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base sm:text-lg text-gray-500 mb-10 max-w-2xl mx-auto"
        >
          アカウント登録なしで出資OK・最短30分で掲載スタート・
          <br className="hidden sm:block" />
          AIがプロジェクト作りをサポート。手数料は一切いただきません。
        </motion.p>

        {/* CTAボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/projects/create">
            <Button size="xl" icon={<Sparkles size={20} />}>
              プロジェクトを作る（無料）
            </Button>
          </Link>
          <Link href="/projects">
            <button className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold text-gray-700 bg-white shadow-soft hover:shadow-soft-lg transition-all duration-300 btn-pop">
              プロジェクトを見る
              <ArrowRight size={20} />
            </button>
          </Link>
        </motion.div>

        {/* 信頼バッジ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12"
        >
          {[
            { icon: "🔒", text: "安全な決済" },
            { icon: "⚡", text: "最短30分掲載" },
            { icon: "💳", text: "手数料0%" },
            { icon: "🌍", text: "海外決済対応" },
            { icon: "🤖", text: "AI支援" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-500 font-semibold">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 下部の波形 */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none" style={{ display: "block" }}>
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
            fill="white"
            opacity="0.5"
          />
          <path
            d="M0,60 C360,20 720,80 1080,40 C1260,20 1380,60 1440,60 L1440,80 L0,80 Z"
            fill="white"
            opacity="0.3"
          />
        </svg>
      </div>
    </section>
  );
}
