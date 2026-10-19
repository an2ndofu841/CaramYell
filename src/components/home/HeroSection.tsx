"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";
import { BACKER_FEE_PERCENT } from "@/lib/config/fees";
import CaramelGlow from "@/components/decor/CaramelGlow";
import CaramelCubes from "@/components/decor/CaramelCubes";
import { CaramelMark } from "@/components/layout/Logo";

export default function HeroSection() {
  const t = useT();

  const facts = [
    { value: "0%", label: "掲載者の手数料", note: `サービス手数料は支援者側の${BACKER_FEE_PERCENT}%のみ` },
    { value: "登録不要", label: "支援者の手続き", note: "メールアドレスだけで支援できます" },
    { value: "事務所単位", label: "掲載のしかた", note: "所属タレントの企画をまとめて管理" },
  ];

  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 bg-cream-gradient">
      <CaramelGlow />
      {/* 積み重ねたキャラメルの挿絵。見出しと重ならない広い画面でだけ出す */}
      <CaramelCubes className="hidden lg:block absolute right-[max(2rem,calc(50%-36rem))] top-28 w-[340px] animate-fade-in" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2 mb-6 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white/80 border border-line text-xs font-bold text-caramel-700 shadow-soft">
          <CaramelMark className="w-5 h-5" />
          {t.home.heroEyebrow}
        </p>
        <h1
          className="text-[34px] leading-[1.3] sm:text-5xl sm:leading-[1.25] lg:text-[58px] lg:leading-[1.2] font-bold text-ink max-w-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.home.heroTitle1}
          <br />
          <span className="text-gradient-caramel">{t.home.heroTitle2}</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
          {t.home.heroLead}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/projects"
            className="btn-caramel inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full text-[15px] font-bold"
          >
            {t.common.viewProjects}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/for-agencies"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-line-strong bg-white text-ink text-[15px] font-bold hover:bg-caramel-50 hover:border-caramel-300 transition-colors"
          >
            {t.common.forAgencies}
          </Link>
        </div>

        <dl className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {facts.map((f) => (
            <div
              key={f.label}
              className="rounded-3xl bg-white/85 border border-line shadow-soft px-6 py-5"
            >
              <dt className="text-xs font-bold text-ink-muted">{f.label}</dt>
              <dd
                className="mt-1.5 text-[26px] font-bold text-gradient-caramel"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {f.value}
              </dd>
              <dd className="mt-1 text-sm text-ink-muted">{f.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
