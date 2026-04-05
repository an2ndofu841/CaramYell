"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/animations/AnimatedSection";

const creatorSteps = [
  {
    step: "01",
    icon: "✨",
    title: "AIと一緒に\nプロジェクトを作る",
    description: "タイトルを入力するだけでAIが説明文・リターン内容を提案。最短10分でページ完成。",
  },
  {
    step: "02",
    icon: "⚡",
    title: "審査を受ける\n（最短30分）",
    description: "シンプルな審査フローで最短30分で掲載開始。困ったことがあればサポートが即対応。",
  },
  {
    step: "03",
    icon: "🎉",
    title: "応援を集めて\n夢を叶える",
    description: "SNSで簡単シェア。海外からの支援も受付可能。目標達成で資金をまるごと受け取れます。",
  },
];

const backerSteps = [
  {
    step: "01",
    icon: "🔍",
    title: "気になる\nプロジェクトを見つける",
    description: "カテゴリーや検索で気になるプロジェクトを探そう。AI翻訳で海外プロジェクトも読めます。",
  },
  {
    step: "02",
    icon: "💝",
    title: "リターンを選んで\n応援する",
    description: "アカウント不要。メールアドレスだけで出資できます。デジタルリターンは住所入力も不要。",
  },
  {
    step: "03",
    icon: "🎁",
    title: "リターンを\n受け取る",
    description: "決済完了後、プロジェクト成功時にリターンをお届け。デジタルリターンは即時配信も可能。",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
            style={{ background: "rgba(78, 205, 196, 0.1)", color: "#4ECDC4" }}>
            📖 使い方
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            かんたん3ステップ
          </h2>
          <p className="text-lg text-gray-500">掲載者も出資者も、驚くほどシンプル</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 掲載者向け */}
          <AnimatedSection animation="slide-left">
            <div className="p-8 rounded-4xl h-full"
              style={{ background: "linear-gradient(135deg, rgba(255, 107, 157, 0.05) 0%, rgba(255, 179, 71, 0.05) 100%)", border: "2px solid rgba(255, 107, 157, 0.1)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}>
                  🚀
                </div>
                <h3 className="text-xl font-bold text-gray-800">プロジェクトを作る人</h3>
              </div>
              <div className="space-y-6">
                {creatorSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}>
                        {step.step}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1 whitespace-pre-line">{step.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* 出資者向け */}
          <AnimatedSection animation="slide-right">
            <div className="p-8 rounded-4xl h-full"
              style={{ background: "linear-gradient(135deg, rgba(78, 205, 196, 0.05) 0%, rgba(116, 192, 252, 0.05) 100%)", border: "2px solid rgba(78, 205, 196, 0.1)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)" }}>
                  💝
                </div>
                <h3 className="text-xl font-bold text-gray-800">応援する人</h3>
              </div>
              <div className="space-y-6">
                {backerSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)" }}>
                        {step.step}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1 whitespace-pre-line">{step.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
