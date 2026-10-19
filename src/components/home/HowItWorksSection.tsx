const steps = [
  {
    title: "プロジェクトを選ぶ",
    description:
      "応援したいアーティストの企画ページで、目標や使い道、リターンの内容を確認します。",
  },
  {
    title: "リターンを選んで支援する",
    description:
      "クレジットカードや Apple Pay で支払えます。アカウントを作らず、メールアドレスだけでも支援できます。",
  },
  {
    title: "企画の実施とリターンの受け取り",
    description:
      "進み具合は活動報告で届きます。デジタルリターンはメールで、グッズは登録した住所に届きます。",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          <div>
            <p className="eyebrow mb-3">For fans</p>
            <h2
              className="text-2xl sm:text-[28px] font-bold text-ink leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              支援のながれ
            </h2>
            <p className="mt-4 text-sm text-ink-muted leading-relaxed">
              支援金は申し込みのときに決済されます。目標に届かなかった場合も、
              掲載者は集まった金額の範囲で企画を実施します。
            </p>
          </div>

          <ol className="lg:col-span-2 space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="p-5 sm:p-6 flex gap-5 rounded-3xl bg-cream-50 border border-line"
              >
                {/* 番号はキャラメルの粒に見立てた丸い飴色のバッジ */}
                <span
                  className="candy-number flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold tabular-nums"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
