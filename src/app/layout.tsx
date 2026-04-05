import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingParticles from "@/components/animations/FloatingParticles";

export const metadata: Metadata = {
  title: {
    default: "CaramYell | みんなで夢を叶えるクラウドファンディング",
    template: "%s | CaramYell",
  },
  description:
    "CaramYellは、手数料0%で誰でも簡単に使えるクラウドファンディングサービスです。アカウント登録なしで出資でき、最短30分で掲載スタート。AI支援でプロジェクト作成も簡単。",
  keywords: [
    "クラウドファンディング",
    "資金調達",
    "応援",
    "CaramYell",
    "手数料無料",
  ],
  openGraph: {
    title: "CaramYell | みんなで夢を叶えるクラウドファンディング",
    description:
      "手数料0%・アカウント不要で出資できる、世界一やさしいクラウドファンディング",
    type: "website",
    locale: "ja_JP",
    siteName: "CaramYell",
  },
  twitter: {
    card: "summary_large_image",
    title: "CaramYell | みんなで夢を叶えるクラウドファンディング",
    description: "手数料0%・アカウント不要で出資できる、世界一やさしいクラウドファンディング",
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
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fredoka+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <FloatingParticles />
        <Header />
        <main className="flex-1 page-enter">{children}</main>
        <Footer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "white",
              color: "#2D1B4E",
              border: "2px solid #FFD9A8",
              borderRadius: "16px",
              fontFamily: "Nunito, sans-serif",
              fontWeight: "600",
            },
          }}
        />
      </body>
    </html>
  );
}
