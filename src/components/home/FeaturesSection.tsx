"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/animations/AnimatedSection";

const features = [
  {
    icon: "💸",
    title: "掲載者の手数料は完全0円",
    description:
      "プロジェクトオーナーへの手数料は一切ありません。出資者側に10%の手数料をご負担いただく仕組みで、夢を100%応援できます。",
    color: "#FF6B9D",
    bg: "rgba(255, 107, 157, 0.08)",
  },
  {
    icon: "⚡",
    title: "最短30分で掲載開始",
    description:
      "AIがプロジェクトの説明文・タグライン・リターン内容を自動生成。シンプルな審査フローで、アイデアがあれば今すぐ掲載できます。",
    color: "#FFB347",
    bg: "rgba(255, 179, 71, 0.08)",
  },
  {
    icon: "🎁",
    title: "アカウント不要でサクッと応援",
    description:
      "ニックネーム（任意）＋メールアドレスだけで出資OK。デジタルリターンなら住所入力も不要。気軽に応援できます。",
    color: "#4ECDC4",
    bg: "rgba(78, 205, 196, 0.08)",
  },
  {
    icon: "🤖",
    title: "AIがプロジェクト作りをサポート",
    description:
      "プロジェクトの説明文やリターン内容をAIが提案。日本語で入力するだけで、魅力的なページが自動で完成します。",
    color: "#C3B1E1",
    bg: "rgba(195, 177, 225, 0.08)",
  },
  {
    icon: "🎵",
    title: "デジタルリターンに完全対応",
    description:
      "「限定お礼ボイス」「デジタルチェキ」「限定動画URL」などデジタルコンテンツもリターンとして設定できます。",
    color: "#74C0FC",
    bg: "rgba(116, 192, 252, 0.08)",
  },
  {
    icon: "🌍",
    title: "海外決済＆AI自動翻訳",
    description:
      "Apple Pay・Google Pay・PayPalに対応。AI自動翻訳でプロジェクトページを多言語表示し、海外からの応援も受付可能。",
    color: "#FFE66D",
    bg: "rgba(255, 230, 109, 0.12)",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* 背景デコ */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
        style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-5"
        style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)", transform: "translate(-30%, 30%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
            style={{ background: "rgba(244, 123, 10, 0.1)", color: "#F47B0A" }}>
            ✨ CaramYellの特徴
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            夢を叶えるための
            <br />
            <span style={{
              background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>すべてが揃っています</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            クリエイターもサポーターも、誰もが使いやすいプラットフォームを設計しました。
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={i} animation="fade-up" delay={i * 80}>
              <motion.div
                className="p-6 rounded-3xl h-full transition-all duration-300"
                style={{ background: feature.bg, border: `2px solid ${feature.color}20` }}
                whileHover={{ y: -4, boxShadow: `0 12px 40px ${feature.color}20` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm"
                  style={{ background: `${feature.color}20` }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
