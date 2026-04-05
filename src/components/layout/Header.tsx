"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Heart, Plus, LogIn, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass border-b border-white/50 shadow-soft py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-2xl bg-candy-gradient flex items-center justify-center shadow-candy group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "Fredoka One, sans-serif" }}>C</span>
            </div>
            <span
              className="text-xl font-bold text-gradient-candy hidden sm:block"
              style={{ fontFamily: "Fredoka One, sans-serif" }}
            >
              CaramYell
            </span>
          </Link>

          {/* ナビゲーション (デスクトップ) */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/projects">プロジェクトを見る</NavLink>
            <NavLink href="/projects/create">
              <span className="flex items-center gap-1">
                <Sparkles size={14} />
                掲載する
              </span>
            </NavLink>
            <NavLink href="/about">CaramYellとは</NavLink>
          </nav>

          {/* アクションボタン */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-caramel-600 hover:bg-caramel-50 transition-colors duration-200"
            >
              <LogIn size={16} />
              ログイン
            </Link>
            <Link
              href="/projects/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white btn-pop"
              style={{
                background: "linear-gradient(135deg, #FF6B9D, #FFB347)",
                boxShadow: "0 4px 15px rgba(255, 107, 157, 0.4)",
              }}
            >
              <Plus size={16} />
              プロジェクトを作る
            </Link>
          </div>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-caramel-50 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニュー"
          >
            {isMenuOpen ? (
              <X size={24} className="text-caramel-600" />
            ) : (
              <Menu size={24} className="text-caramel-600" />
            )}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      <div
        className={cn(
          "md:hidden transition-all duration-300 overflow-hidden",
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="glass border-t border-white/50 mx-4 mt-2 rounded-3xl p-4 shadow-soft-lg">
          <nav className="flex flex-col gap-1">
            <MobileNavLink href="/projects" onClick={() => setIsMenuOpen(false)}>
              🔍 プロジェクトを見る
            </MobileNavLink>
            <MobileNavLink href="/projects/create" onClick={() => setIsMenuOpen(false)}>
              ✨ 掲載する（AI支援あり）
            </MobileNavLink>
            <MobileNavLink href="/about" onClick={() => setIsMenuOpen(false)}>
              💬 CaramYellとは
            </MobileNavLink>
            <div className="border-t border-caramel-100 mt-2 pt-2 flex gap-2">
              <Link
                href="/auth/login"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold text-caramel-600 bg-caramel-50 hover:bg-caramel-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn size={16} />
                ログイン
              </Link>
              <Link
                href="/projects/create"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #FF6B9D, #FFB347)" }}
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus size={16} />
                プロジェクト作成
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:text-caramel-600 hover:bg-caramel-50 transition-all duration-200"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-caramel-50 hover:text-caramel-600 transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
