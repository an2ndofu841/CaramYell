"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";

const features = [
  {
    icon: "📊",
    title: "クリエイターにうれしいサポート",
    description:
      "掲載者の手数料は完全0%。AIがページ作りをサポートし、初めてでも安心のサポート体制。プロモーション支援で広がるチャンス。",
    linkLabel: "詳しく見る",
    href: "/about",
    color: "#E8842C",
    bg: "rgba(232, 132, 44, 0.06)",
  },
  {
    icon: "🤝",
    title: "みんなでつくる温かいコミュニティ",
    description:
      "応援コメントや活動報告で、支援して終わりではないつながりが生まれます。クリエイターとサポーターが一緒に夢を育てます。",
    linkLabel: "コミュニティを見る",
    href: "/projects",
    color: "#F2807B",
    bg: "rgba(242, 128, 123, 0.06)",
  },
  {
    icon: "🛡️",
    title: "はじめての方も安心",
    description:
      "ガイドや要所の丁寧な説明で、安心してはじめられます。決済はStripeで安全に処理。アカウント登録なしでも応援できます。",
    linkLabel: "はじめてガイド",
    href: "/about",
    color: "#F3A93C",
    bg: "rgba(243, 169, 60, 0.08)",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: "#FFFBF5" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
              <motion.div
                className="p-7 rounded-3xl h-full flex flex-col"
                style={{ background: feature.bg, border: `2px solid ${feature.color}20` }}
                whileHover={{ y: -4, boxShadow: `0 12px 40px ${feature.color}20` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-cocoa-700 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-full text-xs font-bold text-white btn-pop"
                  style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}CC)` }}
                >
                  {feature.linkLabel}
                  <ArrowRight size={12} />
                </Link>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
