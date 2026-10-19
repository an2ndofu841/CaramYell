import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileTabBar from "@/components/layout/MobileTabBar";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CaramYell | アーティストと応援企画のためのクラウドファンディング",
    template: "%s | CaramYell",
  },
  description:
    "CaramYellは、アーティスト・アイドルの生誕祭や周年企画、作品づくりを支えるクラウドファンディングです。掲載手数料は0%。事務所・レーベル単位での掲載にも対応しています。",
  keywords: [
    "クラウドファンディング",
    "資金調達",
    "応援",
    "CaramYell",
    "手数料無料",
    "生誕祭",
    "応援企画",
    "芸能事務所",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CaramYell | アーティストと応援企画のためのクラウドファンディング",
    description:
      "生誕祭・周年企画・作品づくりを、ファンの支援で形にする。掲載手数料0%、事務所単位での掲載にも対応。",
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "CaramYell | アーティストと応援企画のためのクラウドファンディング",
    description: "生誕祭・周年企画・作品づくりを、ファンの支援で形にする。掲載手数料0%、事務所単位での掲載にも対応。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <LocaleProvider>
        <AuthProvider>
          <Header />
          <main className="flex-1 page-enter pb-14 md:pb-0">{children}</main>
          <Footer />
          <MobileTabBar />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "white",
                color: "#1C1917",
                border: "1px solid #E7E2DC",
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(28, 25, 23, 0.08)",
                fontFamily: "Noto Sans JP, sans-serif",
                fontWeight: "500",
              },
            }}
          />
        </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
