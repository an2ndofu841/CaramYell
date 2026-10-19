"use client";

import Link from "next/link";
import CreatorOnly from "@/components/auth/CreatorOnly";
import { useT } from "@/components/i18n/LocaleProvider";
import Logo from "@/components/layout/Logo";

export default function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link href="/" className="inline-block text-ink">
              <Logo />
            </Link>
            <p className="mt-4 text-sm text-ink-muted leading-relaxed whitespace-pre-line">
              {t.footer.tagline}
            </p>
            <Link
              href="/for-agencies"
              className="mt-6 inline-flex items-center h-9 px-4 rounded-full border border-line-strong text-sm font-bold text-caramel-700 hover:bg-caramel-50 hover:border-caramel-300 transition-colors"
            >
              {t.common.forAgencies}
            </Link>
          </div>

          <FooterColumn title={t.footer.service}>
            <FooterLink href="/projects">{t.footer.projectList}</FooterLink>
            <CreatorOnly>
              <FooterLink href="/projects/create">{t.common.createProject}</FooterLink>
            </CreatorOnly>
            <FooterLink href="/about">{t.common.about}</FooterLink>
            <FooterLink href="/for-agencies">{t.common.forAgencies}</FooterLink>
            <FooterLink href="/pricing">{t.footer.pricing}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.footer.support}>
            <FooterLink href="/faq">{t.footer.faq}</FooterLink>
            <FooterLink href="/guide">{t.footer.guide}</FooterLink>
            <FooterLink href="/contact">{t.footer.contact}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t.footer.legal}>
            <FooterLink href="/terms">{t.footer.terms}</FooterLink>
            <FooterLink href="/privacy">{t.footer.privacy}</FooterLink>
            <FooterLink href="/commercial">{t.footer.commercial}</FooterLink>
          </FooterColumn>
        </div>

        <div className="border-t border-line mt-12 pt-6 text-xs text-ink-muted">
          © {new Date().getFullYear()} CaramYell
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-ink mb-4">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-ink-muted hover:text-caramel-600 transition-colors">
        {children}
      </Link>
    </li>
  );
}
