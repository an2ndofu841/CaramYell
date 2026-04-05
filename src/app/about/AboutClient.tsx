"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Heart,
  Shield,
  Globe,
  Zap,
  ArrowRight,
  Gift,
  Users,
  Bot,
  CreditCard,
} from "lucide-react";
import AnimatedSection from "@/components/animations/AnimatedSection";
import Button from "@/components/ui/Button";

const values = [
  {
    icon: <Heart size={28} />,
    title: "夢を100%届ける",
    description:
      "掲載者への手数料は完全0%。集まった資金はすべてクリエイターの手に届きます。出資者が手数料を負担するやさしい仕組みです。",
    color: "#FF6B9D",
    bg: "rgba(255, 107, 157, 0.08)",
  },
  {
    icon: <Zap size={28} />,
    title: "すべてをシンプルに",
    description:
      "AIが面倒な文章作成をサポート。最短30分で掲載スタート。出資者はアカウント登録すら不要。誰にとっても使いやすいプラットフォームを目指しています。",
    color: "#FFB347",
    bg: "rgba(255, 179, 71, 0.08)",
  },
  {
    icon: <Shield size={28} />,
    title: "安心・安全な決済",
    description:
      "決済はStripeを通じて行われ、クレジットカード情報はCaramYellのサーバーに保存されません。3Dセキュア認証にも対応しています。",
    color: "#4ECDC4",
    bg: "rgba(78, 205, 196, 0.08)",
  },
  {
    icon: <Globe size={28} />,
    title: "国境を越える応援",
    description:
      "AI自動翻訳とApple Pay・Google Payなど多彩な決済手段で、海外からの応援もスムーズに受け付けられます。",
    color: "#74C0FC",
    bg: "rgba(116, 192, 252, 0.08)",
  },
];

const features = [
  {
    icon: <CreditCard size={22} />,
    title: "掲載者の手数料 0%",
    description: "出資者が10%の手数料を負担する仕組みで、クリエイターの取り分は100%",
    color: "#FF6B9D",
  },
  {
    icon: <Bot size={22} />,
    title: "AIプロジェクト作成支援",
    description: "タイトルを入力するだけでAIが説明文・リターン内容を自動提案",
    color: "#C3B1E1",
  },
  {
    icon: <Users size={22} />,
    title: "アカウント不要で出資",
    description: "ニックネームとメールアドレスだけでサクッと応援可能",
    color: "#FFB347",
  },
  {
    icon: <Zap size={22} />,
    title: "最短30分で掲載開始",
    description: "シンプルな審査フローで、アイデアがあればすぐに始められる",
    color: "#4ECDC4",
  },
  {
    icon: <Gift size={22} />,
    title: "デジタルリターン対応",
    description: "限定ボイス・チェキ・動画URLなど、デジタルコンテンツもリターンに設定可能",
    color: "#74C0FC",
  },
  {
    icon: <Globe size={22} />,
    title: "海外決済 & AI翻訳",
    description: "Apple Pay・Google Payに対応。プロジェクトページを多言語で自動表示",
    color: "#FFE66D",
  },
];

const faqItems = [
  {
    q: "CaramYellの手数料はどうなっていますか？",
    a: "プロジェクト掲載者の手数料は完全に0%です。出資者側に10%のサービス手数料をご負担いただいています。例えば1,000円のリターンに出資する場合、お支払い総額は1,100円になります。",
  },
  {
    q: "アカウントを作らなくても出資できますか？",
    a: "はい。出資にはアカウント登録不要です。ニックネーム（任意）とメールアドレスだけで出資できます。デジタルリターンの場合は住所入力も不要です。",
  },
  {
    q: "プロジェクトが目標金額に届かなかったらどうなりますか？",
    a: "All-or-Nothing方式の場合、目標未達であれば出資者への課金は行われません。All-In方式の場合は目標金額に関わらず資金を受け取れます。掲載時にどちらの方式か選択できます。",
  },
  {
    q: "プロジェクトの掲載までどれくらいかかりますか？",
    a: "AIサポートを使えば最短10分でプロジェクトページが完成し、シンプルな審査を経て最短30分で掲載開始できます。",
  },
  {
    q: "海外からの出資も受けられますか？",
    a: "はい。Apple Pay・Google Pay・クレジットカードなど多彩な決済方法に対応し、AI自動翻訳でプロジェクトページを多言語表示できます。",
  },
];

export default function AboutClient() {
  return (
    <div className="relative z-10">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 107, 157, 0.06) 0%, rgba(255, 179, 71, 0.06) 50%, rgba(78, 205, 196, 0.06) 100%)",
          }}
        />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-10 bubble"
          style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }} />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full opacity-10 bubble-2"
          style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)" }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-up">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-6"
              style={{ background: "rgba(244, 123, 10, 0.1)", color: "#F47B0A" }}
            >
              CaramYellとは
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              夢を叶える人と、
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                応援する人をつなぐ
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              CaramYellは、手数料0%・AIサポート・アカウント不要で出資できる、
              世界一やさしいクラウドファンディングプラットフォームです。
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)", transform: "translate(30%, -30%)" }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(255, 107, 157, 0.1)", color: "#FF6B9D" }}
            >
              💭 ミッション
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">
              「やってみたい」を、
              <br />
              もっと気軽に
            </h2>
            <div className="text-base sm:text-lg text-gray-600 leading-relaxed space-y-4 max-w-2xl mx-auto text-left sm:text-center">
              <p>
                素敵なアイデアを持っているのに、資金が足りない。
                応援したい気持ちはあるのに、手続きが面倒。
              </p>
              <p>
                CaramYellは、そんな「もったいない」をなくすために生まれました。
              </p>
              <p>
                クリエイターには手数料0%で全額を届け、
                AIが面倒な文章作成をサポート。
                出資者にはアカウント登録不要で、
                メールアドレスだけで気軽に応援できる仕組みを提供しています。
              </p>
              <p className="font-semibold" style={{ color: "#FF6B9D" }}>
                誰もが「やってみたい」に挑戦でき、
                誰もが「応援したい」を届けられる世界を目指しています。
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(78, 205, 196, 0.1)", color: "#4ECDC4" }}
            >
              🌟 大切にしていること
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              CaramYellの4つの約束
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                <motion.div
                  className="p-8 rounded-3xl h-full"
                  style={{ background: value.bg, border: `2px solid ${value.color}20` }}
                  whileHover={{ y: -4, boxShadow: `0 12px 40px ${value.color}20` }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${value.color}20`, color: value.color }}
                  >
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-5"
          style={{ background: "linear-gradient(135deg, #4ECDC4, #74C0FC)", transform: "translate(-30%, 30%)" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(244, 123, 10, 0.1)", color: "#F47B0A" }}
            >
              ✨ 機能紹介
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              CaramYellでできること
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              クリエイターにもサポーターにも、使いやすい機能を揃えています
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 80}>
                <motion.div
                  className="p-6 rounded-3xl h-full bg-white border-2 transition-all duration-300"
                  style={{ borderColor: `${feature.color}20` }}
                  whileHover={{ y: -4, boxShadow: `0 12px 40px ${feature.color}15` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${feature.color}15`, color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-base font-bold text-gray-800">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Explanation */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(255, 107, 157, 0.1)", color: "#FF6B9D" }}
            >
              💸 手数料の仕組み
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              掲載者の手数料は
              <span
                style={{
                  background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {" "}完全0%
              </span>
            </h2>
          </AnimatedSection>

          <AnimatedSection animation="scale">
            <div
              className="rounded-4xl p-8 sm:p-10"
              style={{
                background: "linear-gradient(135deg, rgba(255, 107, 157, 0.05) 0%, rgba(255, 179, 71, 0.05) 100%)",
                border: "2px solid rgba(255, 107, 157, 0.1)",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    従来のクラウドファンディングとの違い
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
                        style={{ background: "#ccc" }}>
                        ✕
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">従来のサービス</p>
                        <p className="text-sm text-gray-400">掲載者から10〜20%の手数料を徴収</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}>
                        ◎
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">CaramYell</p>
                        <p className="text-sm text-gray-600">
                          掲載者の手数料は0%。出資者に10%のサービス手数料をご負担いただきます。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-3xl p-6 text-center"
                  style={{ background: "rgba(255, 255, 255, 0.7)" }}
                >
                  <p className="text-sm text-gray-500 mb-2">例：5,000円のリターンに出資</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">リターン金額</span>
                      <span className="font-bold text-gray-800">¥5,000</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">サービス手数料 (10%)</span>
                      <span className="font-bold text-gray-800">¥500</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">お支払い総額</span>
                      <span className="text-lg font-bold" style={{ color: "#FF6B9D" }}>¥5,500</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-gray-600">クリエイターの受取額</span>
                      <span className="text-lg font-bold" style={{ color: "#4ECDC4" }}>¥5,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up" className="text-center mb-12">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: "rgba(195, 177, 225, 0.15)", color: "#8B6DB5" }}
            >
              ❓ よくある質問
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
              FAQ
            </h2>
          </AnimatedSection>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 80}>
                <FAQItem question={item.q} answer={item.a} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0f2e 100%)" }}
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["🍬", "⭐", "🎀", "✨", "🍭"].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl opacity-30 select-none"
              style={{ left: `${10 + i * 20}%`, top: `${25 + Math.sin(i * 1.5) * 30}%` }}
              animate={{ y: [0, -15, 0], rotate: [-10, 10, -10] }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection animation="scale">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(255, 107, 157, 0.2)",
                border: "1px solid rgba(255, 107, 157, 0.4)",
              }}
            >
              <Sparkles size={16} className="text-candy-pink" />
              <span className="text-sm font-bold text-candy-pink">今すぐ始めよう</span>
            </div>

            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "Fredoka One, sans-serif" }}
            >
              あなたの
              <span
                style={{
                  background: "linear-gradient(135deg, #FF6B9D, #FFB347, #FFE66D)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                「やってみたい」
              </span>
              を
              <br />
              CaramYellで
            </h2>

            <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
              手数料0%・最短30分掲載・AIサポートで、
              夢を形にする第一歩を踏み出しましょう。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/projects/create">
                <Button size="xl" icon={<Sparkles size={20} />}>
                  無料でプロジェクトを作る
                </Button>
              </Link>
              <Link href="/projects">
                <button className="flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold text-white/80 border-2 border-white/20 hover:bg-white/10 hover:text-white transition-all duration-200">
                  プロジェクトを見る
                  <ArrowRight size={20} />
                </button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <motion.details
      className="group rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255, 248, 240, 0.5)",
        border: "2px solid rgba(255, 179, 71, 0.1)",
      }}
      whileHover={{ boxShadow: "0 4px 20px rgba(255, 179, 71, 0.1)" }}
    >
      <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left list-none [&::-webkit-details-marker]:hidden">
        <span className="font-bold text-gray-800 pr-4">{question}</span>
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-transform duration-300 group-open:rotate-45"
          style={{ background: "rgba(255, 179, 71, 0.15)", color: "#FFB347" }}
        >
          +
        </span>
      </summary>
      <div className="px-6 pb-5">
        <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </motion.details>
  );
}
