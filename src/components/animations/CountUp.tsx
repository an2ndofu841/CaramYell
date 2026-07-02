"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * ビューポートに入ったら数値がカウントアップする演出。
 * デザインカンプ「カウントアップ演出」を再現。
 */
export default function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 2000,
  className,
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // easeOutExpo で減速しながら到達
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setCount(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString("ja-JP")}
      {suffix}
    </span>
  );
}
