import Link from "next/link";
import { Heart, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-auto">
      {/* 波形の上部装飾 */}
      <div className="relative overflow-hidden">
        <svg
          viewBox="0 0 1440 80"
          className="w-full"
          preserveAspectRatio="none"
          style={{ display: "block", marginBottom: "-2px" }}
        >
          <path
            d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z"
            fill="#2D1B4E"
          />
        </svg>
      </div>

      <div style={{ backgroundColor: "#2D1B4E" }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* ブランド */}
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                  }}
                >
                  <span
                    className="text-white font-bold text-xl"
                    style={{ fontFamily: "Fredoka One, sans-serif" }}
                  >
                    C
                  </span>
                </div>
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "Fredoka One, sans-serif",
                    background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  CaramYell
                </span>
              </Link>
              <p className="text-sm text-white/60 leading-relaxed">
                みんなで夢を叶える、
                <br />
                世界一やさしいクラウドファンディング。
              </p>
              <div className="flex gap-3 mt-4">
                <SocialLink href="#" icon={<Twitter size={18} />} label="Twitter" />
                <SocialLink href="#" icon={<Instagram size={18} />} label="Instagram" />
                <SocialLink href="#" icon={<Youtube size={18} />} label="YouTube" />
              </div>
            </div>

            {/* リンク */}
            <div>
              <h3 className="font-bold text-sm mb-3 text-white/80">サービス</h3>
              <ul className="space-y-2">
                <FooterLink href="/projects">プロジェクト一覧</FooterLink>
                <FooterLink href="/projects/create">プロジェクトを作る</FooterLink>
                <FooterLink href="/about">CaramYellとは</FooterLink>
                <FooterLink href="/pricing">手数料について</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-3 text-white/80">サポート</h3>
              <ul className="space-y-2">
                <FooterLink href="/faq">よくある質問</FooterLink>
                <FooterLink href="/guide">ガイド</FooterLink>
                <FooterLink href="/contact">お問い合わせ</FooterLink>
                <FooterLink href="/security">セキュリティ</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-3 text-white/80">法的情報</h3>
              <ul className="space-y-2">
                <FooterLink href="/terms">利用規約</FooterLink>
                <FooterLink href="/privacy">プライバシーポリシー</FooterLink>
                <FooterLink href="/commercial">特定商取引法に基づく表記</FooterLink>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © 2025 CaramYell. All rights reserved.
            </p>
            <p className="text-xs text-white/40 flex items-center gap-1">
              Made with <Heart size={12} className="text-candy-pink fill-candy-pink" /> in Japan
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200 text-white/70 hover:text-white"
    >
      {icon}
    </a>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-white/50 hover:text-white transition-colors duration-200"
      >
        {children}
      </Link>
    </li>
  );
}
