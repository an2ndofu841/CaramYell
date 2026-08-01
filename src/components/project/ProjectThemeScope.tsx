"use client";

import { ReactNode, useEffect } from "react";
import {
  ProjectTheme,
  isDarkTheme,
  themeFontHref,
  themeToCssVars,
} from "@/lib/theme/project-theme";
import { cn } from "@/lib/utils";

interface ProjectThemeScopeProps {
  theme: ProjectTheme;
  children: ReactNode;
  className?: string;
  /**
   * ページ全体をこのテーマにする場合に指定する。
   * スコープ外にある共通ヘッダーや装飾も暗いテーマに合わせる。
   * 管理画面の縮小プレビューのように一部分だけ描くときは false のままにする。
   */
  pageLevel?: boolean;
}

/**
 * 配下の要素に掲載者のテーマを適用する。
 * 見出しフォントは全ページで読み込むと重いので、必要なテーマのときだけ取りに行く。
 */
export default function ProjectThemeScope({
  theme,
  children,
  className,
  pageLevel = false,
}: ProjectThemeScopeProps) {
  const fontHref = themeFontHref(theme);
  const dark = isDarkTheme(theme);

  useEffect(() => {
    if (!pageLevel || !dark) return;
    document.documentElement.dataset.projectTheme = "dark";
    return () => {
      delete document.documentElement.dataset.projectTheme;
    };
  }, [pageLevel, dark]);

  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <div
        className={cn("project-theme", className)}
        style={themeToCssVars(theme)}
        data-dark={dark ? "true" : "false"}
      >
        {children}
      </div>
    </>
  );
}
