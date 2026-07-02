"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface ConfettiProps {
  /** trueになった瞬間に紙吹雪を発射 */
  fire: boolean;
  pieceCount?: number;
}

const COLORS = ["#F2807B", "#E8842C", "#F5A34B", "#FFC98A", "#8FD4C4", "#FFE0A8"];

/**
 * 目標達成時のコンフェッティ（紙吹雪）演出。
 * デザインカンプ「目標達成！コンフェッティ演出」を再現。
 * ライブラリを使わない軽量実装。
 */
export default function Confetti({ fire, pieceCount = 40 }: ConfettiProps) {
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    if (fire) setBurstId((n) => n + 1);
  }, [fire]);

  const pieces = useMemo(() => {
    if (burstId === 0) return [];
    return Array.from({ length: pieceCount }, (_, i) => ({
      id: `${burstId}-${i}`,
      x: (Math.random() - 0.5) * 320,
      rotate: Math.random() * 720 - 360,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      delay: Math.random() * 0.25,
      isCircle: Math.random() > 0.5,
    }));
  }, [burstId, pieceCount]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-1/3"
          style={{
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: [0, -80 - Math.random() * 60, 180],
            opacity: [1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: 1.6 + Math.random() * 0.6,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
