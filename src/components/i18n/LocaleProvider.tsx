"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, type Locale, type Dictionary } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
  /** プロジェクトなどDBの多言語フィールドを選ぶ（英語が空なら日本語にフォールバック） */
  pick: (ja?: string | null, en?: string | null) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY = "caramyell.locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja");

  // 保存済みの選択、なければブラウザ言語から初期値を決める
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "ja" || saved === "en") {
        setLocaleState(saved);
        return;
      }
      if (!navigator.language.toLowerCase().startsWith("ja")) {
        setLocaleState("en");
      }
    } catch {
      // localStorage が使えない環境では既定の日本語のまま
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // 保存できなくても表示は切り替わる
    }
  };

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t: dictionaries[locale] as Dictionary,
    pick: (ja, en) => (locale === "en" ? en || ja || "" : ja || ""),
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within <LocaleProvider>");
  }
  return ctx;
}

/** 文言だけ使いたいときの短縮形 */
export function useT() {
  return useLocale().t;
}
