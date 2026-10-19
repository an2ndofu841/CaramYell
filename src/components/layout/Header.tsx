"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Plus, LayoutDashboard, LogOut, User, ShieldCheck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import CreatorOnly from "@/components/auth/CreatorOnly";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import { useT } from "@/components/i18n/LocaleProvider";
import Logo from "@/components/layout/Logo";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const t = useT();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ページを移ったらメニューは閉じる
  useEffect(() => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    router.push("/");
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";

  const navItems = [
    { href: "/projects", label: t.common.findProjects },
    { href: "/for-agencies", label: t.common.forAgencies },
    { href: "/about", label: t.common.about },
  ];

  return (
    <header className="site-header fixed top-0 left-0 right-0 z-50 h-16 border-b border-line bg-cream-50/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="CaramYell トップへ" className="chrome-text text-ink">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <LocaleSwitcher />
            {loading ? (
              <div className="w-24 h-9 rounded-md bg-cream-100 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="chrome-hover flex items-center gap-2 h-9 pl-1 pr-2 rounded-md hover:bg-cream-100 transition-colors"
                  aria-expanded={showUserMenu}
                >
                  <span className="chrome-solid w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="chrome-text text-sm font-medium text-ink max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown size={14} className="chrome-muted text-ink-muted" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg border border-line shadow-soft-lg py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-line">
                      <p className="text-sm font-bold text-ink truncate">{displayName}</p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                    </div>
                    <MenuLink href="/dashboard" icon={<LayoutDashboard size={15} />}>
                      {t.common.dashboard}
                    </MenuLink>
                    <MenuLink href="/dashboard/settings" icon={<User size={15} />}>
                      {t.common.profileSettings}
                    </MenuLink>
                    {isAdmin && (
                      <MenuLink href="/admin" icon={<ShieldCheck size={15} />}>
                        運営CMS
                      </MenuLink>
                    )}
                    <div className="border-t border-line mt-1.5 pt-1.5">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink-soft hover:bg-cream-100 transition-colors"
                      >
                        <LogOut size={15} />
                        {t.common.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="chrome-text chrome-hover h-9 px-3 inline-flex items-center rounded-md text-sm font-medium text-ink hover:bg-cream-100 transition-colors"
                >
                  {t.common.login}
                </Link>
                <Link
                  href="/auth/login?mode=signup"
                  className="chrome-solid h-9 px-4 inline-flex items-center rounded-md text-sm font-bold bg-ink text-white hover:bg-ink-soft transition-colors"
                >
                  {t.common.signup}
                </Link>
              </>
            )}

            <CreatorOnly>
              <Link
                href="/projects/create"
                className="chrome-solid h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md text-sm font-bold bg-ink text-white hover:bg-ink-soft transition-colors"
              >
                <Plus size={15} />
                {t.common.createProject}
              </Link>
            </CreatorOnly>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <LocaleSwitcher compact />
            <button
              className="chrome-text chrome-hover p-2 -mr-2 rounded-md text-ink hover:bg-cream-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="メニュー"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-line shadow-soft-lg">
          <nav className="px-4 py-3 flex flex-col">
            {navItems.map((item) => (
              <MobileNavLink key={item.href} href={item.href}>
                {item.label}
              </MobileNavLink>
            ))}
            <CreatorOnly>
              <MobileNavLink href="/projects/create">{t.common.createProject}</MobileNavLink>
            </CreatorOnly>
            {user && <MobileNavLink href="/dashboard">{t.common.dashboard}</MobileNavLink>}
            {isAdmin && <MobileNavLink href="/admin">運営CMS</MobileNavLink>}
            <div className="border-t border-line mt-2 pt-3 pb-1 flex gap-2">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex-1 h-10 rounded-md text-sm font-bold text-ink border border-line-strong"
                >
                  {t.common.logout}
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex-1 h-10 inline-flex items-center justify-center rounded-md text-sm font-bold text-ink border border-line-strong"
                  >
                    {t.common.login}
                  </Link>
                  <Link
                    href="/auth/login?mode=signup"
                    className="flex-1 h-10 inline-flex items-center justify-center rounded-md text-sm font-bold bg-ink text-white"
                  >
                    {t.common.signup}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "chrome-hover h-9 px-3 inline-flex items-center rounded-md text-sm transition-colors hover:bg-cream-100",
        active ? "chrome-text font-bold text-ink" : "chrome-muted font-medium text-ink-soft"
      )}
    >
      {children}
    </Link>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-ink-soft hover:bg-cream-100 hover:text-ink transition-colors"
    >
      <span className="text-ink-muted">{icon}</span>
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center py-3 text-[15px] font-medium text-ink border-b border-line last:border-b-0"
    >
      {children}
    </Link>
  );
}
