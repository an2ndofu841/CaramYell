"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedSection from "@/components/animations/AnimatedSection";

const stats = [
  { value: 1280, suffix: "+", label: "掲載プロジェクト", icon: "🚀" },
  { value: 92, suffix: "%", label: "目標達成率", icon: "🎯" },
  { value: 4800, suffix: "万円+", label: "累計支援総額", icon: "💰" },
  { value: 30, suffix: "分~", label: "最短掲載時間", icon: "⚡" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, value);
      setCount(Math.floor(current));
      if (current >= value) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString("ja-JP")}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <AnimatedSection key={i} animation="scale" delay={i * 100}>
              <div className="text-center p-6 rounded-3xl hover:shadow-soft transition-shadow duration-300">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ fontFamily: "Fredoka One, sans-serif" }}
                >
                  <span
                    style={{
                      background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-semibold">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
