"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Megaphone, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import AdminOnly from "@/components/auth/AdminOnly";

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20"
      style={{ background: "linear-gradient(160deg, #FFFBF5 0%, #FFF6E9 45%, #FFEAD0 100%)" }}
    >
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-10 right-0 w-80 h-80 rounded-full opacity-20 bubble"
          style={{ background: "linear-gradient(135deg, #F5A34B, #FFC98A)" }}
          animate={{ scale: [1, 1.08, 1], rotate: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 bubble-2"
          style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* きらきら */}
        {["⭐", "✨", "💛", "🧡"].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-xl select-none opacity-60"
            style={{ left: `${8 + i * 24}%`, top: `${12 + (i % 2) * 55}%` }}
            animate={{ y: [0, -14, 0], rotate: [-8, 8, -8] }}
            transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* 左：コピー */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6 text-cocoa-700"
              style={{ fontFamily: "var(--font-display)" }}
            >
              あなたの想いに、
              <br />
              <span className="text-gradient-candy">甘く熱いエールを。</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-base sm:text-lg text-cocoa-500/70 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              CaramYellは、クリエイターの夢や挑戦を応援する
              クラウドファンディングサービスです。
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mb-6"
            >
              <Link href="/projects">
                <Button size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
                  プロジェクトを見る
                </Button>
              </Link>
              <AdminOnly>
                <Link href="/projects/create">
                  <Button size="lg" variant="outline" heartOnHover>
                    はじめる
                  </Button>
                </Link>
              </AdminOnly>
            </motion.div>

            {/* キャンペーンバッジ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(243, 169, 60, 0.12)",
                border: "1.5px solid rgba(243, 169, 60, 0.4)",
              }}
            >
              <Star size={14} className="text-honey fill-honey" />
              <span className="text-sm font-bold text-caramel-600">
                掲載者の手数料 <span className="text-coral text-base font-black">0%</span> キャンペーン中！
              </span>
            </motion.div>
          </div>

          {/* 右：ビジュアル（メガホン＋プロジェクトカードのモック） */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden sm:block"
          >
            <div className="relative mx-auto max-w-md">
              {/* カードモック */}
              <motion.div
                className="relative z-10 bg-white rounded-3xl shadow-soft-lg p-4 rotate-2"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-caramel-100 to-apricot/60 flex items-center justify-center text-6xl mb-3">
                  👜
                </div>
                <p className="font-bold text-sm text-cocoa-700 mb-2">
                  上質な革小物を届けたい
                </p>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base font-black text-caramel-500">82%</span>
                </div>
                <ProgressBar percentage={82} className="mb-2" />
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold text-cocoa-700">¥1,230,000</span>
                  <span>残り16日</span>
                </div>
              </motion.div>

              {/* メガホン */}
              <motion.div
                className="absolute -left-10 top-1/3 z-20 w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-caramel -rotate-12"
                style={{ background: "linear-gradient(135deg, #F2807B, #E8842C)" }}
                animate={{ rotate: [-12, -6, -12], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Megaphone size={44} />
              </motion.div>

              {/* ハート */}
              {[
                { left: "-8%", top: "8%", size: 20, delay: 0 },
                { left: "88%", top: "0%", size: 26, delay: 0.6 },
                { left: "96%", top: "58%", size: 18, delay: 1.2 },
              ].map((h, i) => (
                <motion.div
                  key={i}
                  className="absolute z-20 text-coral"
                  style={{ left: h.left, top: h.top }}
                  animate={{ y: [0, -12, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: h.delay }}
                >
                  <Heart size={h.size} className="fill-current" />
                </motion.div>
              ))}

              {/* リボン */}
              <motion.div
                className="absolute -bottom-4 -right-2 z-20 px-4 py-2 rounded-full text-white text-xs font-bold rotate-6 shadow-candy"
                style={{ background: "linear-gradient(135deg, #F2807B, #F5A34B)" }}
                animate={{ rotate: [6, 2, 6] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Cheer for your passion!
              </motion.div>

              {/* 背景のカラメル溜まり */}
              <div
                className="absolute inset-x-8 bottom-0 h-8 rounded-[50%] opacity-30 blur-md"
                style={{ background: "#E8842C" }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
