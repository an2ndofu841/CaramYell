"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  delay: number;
  shape: "circle" | "star" | "heart";
}

export default function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = ["#FF6B9D", "#FFB347", "#4ECDC4", "#FFE66D", "#C3B1E1", "#74C0FC"];
    const particles: Particle[] = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 15 + 10,
      opacity: Math.random() * 0.4 + 0.1,
      delay: Math.random() * 10,
      shape: ["circle", "star", "heart"][Math.floor(Math.random() * 3)] as Particle["shape"],
    }));

    container.innerHTML = "";

    particles.forEach((p) => {
      const el = document.createElement("div");
      el.style.cssText = `
        position: fixed;
        left: ${p.x}%;
        top: ${p.y}%;
        width: ${p.size}px;
        height: ${p.size}px;
        background-color: ${p.color};
        opacity: ${p.opacity};
        border-radius: ${p.shape === "circle" ? "50%" : p.shape === "star" ? "0" : "50% 50% 0 50%"};
        transform: ${p.shape === "heart" ? "rotate(-45deg)" : p.shape === "star" ? "rotate(45deg)" : "none"};
        pointer-events: none;
        z-index: 0;
        animation: float-particle ${p.speed}s ${p.delay}s linear infinite;
      `;
      container.appendChild(el);
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
