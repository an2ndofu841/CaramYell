"use client";

import Link from "next/link";
import { Heart, Twitter, Instagram, Youtube } from "lucide-react";
import AdminOnly from "@/components/auth/AdminOnly";
import { useT } from "@/components/i18n/LocaleProvider";

export default function Footer() {
  const t = useT();
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
            fill="#4A2C17"
          />
        </svg>
      </div>

      <div style={{ backgroundColor: "#4A2C17" }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* ブランド */}
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #F2807B, #E8842C)",
                  }}
                >
                  <span
                    className="text-white font-bold text-xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    C
                  </span>
                </div>
                <span
                  className="text-2xl font-black"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: "linear-gradient(135deg, #F2807B, #F5A34B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  CaramYell
                </span>
              </Link>
              <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
                {t.footer.tagline}
              </p>
              <div className="flex gap-3 mt-4">
                <SocialLink href="#" icon={<Twitter size={18} />} label="Twitter" />
                <SocialLink href="#" icon={<Instagram size={18} />} label="Instagram" />
                <SocialLink href="#" icon={<Youtube size={18} />} label="YouTube" />
              </div>
            </div>

            {/* リンク */}
            <div>
              <h3 className="font-bold text-sm mb-3 text-white/80">{t.footer.service}</h3>
              <ul className="space-y-2">
                <FooterLink href="/projects">{t.footer.projectList}</FooterLink>
                <AdminOnly>
                  <FooterLink href="/projects/create">{t.common.createProject}</FooterLink>
                </AdminOnly>
                <FooterLink href="/about">{t.common.about}</FooterLink>
                <FooterLink href="/pricing">{t.footer.pricing}</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-3 text-white/80">{t.footer.support}</h3>
              <ul className="space-y-2">
                <FooterLink href="/faq">{t.footer.faq}</FooterLink>
                <FooterLink href="/guide">{t.footer.guide}</FooterLink>
                <FooterLink href="/contact">{t.footer.contact}</FooterLink>
                <FooterLink href="/security">{t.footer.security}</FooterLink>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-3 text-white/80">{t.footer.legal}</h3>
              <ul className="space-y-2">
                <FooterLink href="/terms">{t.footer.terms}</FooterLink>
                <FooterLink href="/privacy">{t.footer.privacy}</FooterLink>
                <FooterLink href="/commercial">{t.footer.commercial}</FooterLink>
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
