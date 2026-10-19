"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";
import { BACKER_FEE_PERCENT } from "@/lib/config/fees";

export default function HeroSection() {
  const t = useT();

  const facts = [
    { value: "0%", label: "掲載者の手数料", note: `サービス手数料は支援者側の${BACKER_FEE_PERCENT}%のみ` },
    { value: "登録不要", label: "支援者の手続き", note: "メールアドレスだけで支援できます" },
    { value: "事務所単位", label: "掲載のしかた", note: "所属タレントの企画をまとめて管理" },
  ];

  return (
    <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow mb-6">{t.home.heroEyebrow}</p>
        <h1
          className="text-[34px] leading-[1.25] sm:text-5xl sm:leading-[1.2] lg:text-[64px] lg:leading-[1.15] font-bold text-ink max-w-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.home.heroTitle1}
          <br />
          {t.home.heroTitle2}
        </h1>
        <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
          {t.home.heroLead}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-ink text-white text-[15px] font-bold hover:bg-ink-soft transition-colors"
          >
            {t.common.viewProjects}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/for-agencies"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-line-strong bg-white text-ink text-[15px] font-bold hover:bg-cream-100 transition-colors"
          >
            {t.common.forAgencies}
          </Link>
        </div>

        <dl className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 border-t border-line">
          {facts.map((f, i) => (
            <div
              key={f.label}
              className={
                "py-6 sm:pr-8 " +
                (i > 0 ? "border-t sm:border-t-0 sm:border-l border-line sm:pl-8" : "")
              }
            >
              <dt className="text-xs font-bold text-ink-muted">{f.label}</dt>
              <dd
                className="mt-2 text-2xl font-bold text-ink"
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
