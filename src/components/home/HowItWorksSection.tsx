"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search, Heart, Flag, Gift } from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";

const steps = [
  {
    step: 1,
    icon: <Search size={26} />,
    title: "プロジェクトをさがす",
    description: "あなたの心を動かすプロジェクトを見つけましょう。",
    color: "#F5A34B",
  },
  {
    step: 2,
    icon: <Heart size={26} />,
    title: "エールを贈る",
    description: "共感したプロジェクトを支援することができます。",
    color: "#F2807B",
  },
  {
    step: 3,
    icon: <Flag size={26} />,
    title: "目標を達成する",
    description: "目標金額に届いたらプロジェクトが実行されます。",
    color: "#E8842C",
  },
  {
    step: 4,
    icon: <Gift size={26} />,
    title: "リターンを受け取る",
    description: "感謝の気持ちが込められたリターンが届きます。",
    color: "#F3A93C",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-up" className="mb-10">
          <h2
            className="text-2xl sm:text-3xl font-black text-cocoa-700 flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-2xl">🍮</span>
            CaramYellのしくみ
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-2 items-stretch">
          {steps.map((step, i) => (
            <div key={step.step} className="flex items-center gap-2">
              <AnimatedSection animation="fade-up" delay={i * 120} className="flex-1 h-full">
                <motion.div
                  className="relative p-6 rounded-3xl h-full bg-cream-50 border-2 text-center"
                  style={{ borderColor: `${step.color}25` }}
                  whileHover={{ y: -4, boxShadow: `0 12px 32px ${step.color}25` }}
                >
                  {/* ステップ番号 */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
                    style={{ background: step.color }}
                  >
                    {step.step}
                  </div>

                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mt-2 mb-4 flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}CC)` }}
                  >
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-cocoa-700 text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </motion.div>
              </AnimatedSection>

              {/* 矢印（最後以外・PC表示のみ） */}
              {i < steps.length - 1 && (
                <ArrowRight
                  size={20}
                  className="hidden lg:block flex-shrink-0 text-caramel-300"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
