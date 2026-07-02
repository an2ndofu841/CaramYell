"use client";

import CountUp from "@/components/animations/CountUp";
import CaramelDrip from "@/components/animations/CaramelDrip";

const stats = [
  { icon: "💰", label: "支援総額", value: 48000000, prefix: "¥", suffix: "" },
  { icon: "🏆", label: "プロジェクト数", value: 2345, prefix: "", suffix: " 件" },
  { icon: "🙌", label: "サポーター数", value: 98765, prefix: "", suffix: " 人" },
];

export default function StatsSection() {
  return (
    <section className="relative">
      {/* カラメルドリップで濃色帯へトランジション */}
      <CaramelDrip color="#C96A1B" className="bg-white" />

      <div style={{ background: "linear-gradient(135deg, #C96A1B 0%, #E8842C 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* ロゴ */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-2xl font-black text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CaramYell
                <span className="text-honey">✦</span>
              </span>
            </div>

            {/* 統計（カウントアップ演出） */}
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 flex-1 justify-around">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-3xl">{stat.icon}</span>
                  <div>
                    <p className="text-xs text-white/60 font-semibold mb-0.5">
                      {stat.label}
                    </p>
                    <p
                      className="text-2xl sm:text-3xl font-black text-white leading-none"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      <CountUp
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        duration={2200}
                      />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
