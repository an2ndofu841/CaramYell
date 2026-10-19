import type { Config } from "tailwindcss";

/**
 * 配色は「温かみのある無彩色 + キャラメル1色」に絞っている。
 *
 * 以前はピンク・ミント・ラベンダーなどのキャンディ色とグラデーションを
 * 多用していたが、画面ごとに色が散って落ち着かなかった。既存のクラス名
 * （candy-pink / coral / mint / cocoa など）は各画面に大量に残っているので、
 * 名前はそのままに値だけを新しいパレットへ寄せている。
 * - candy-pink / coral / honey など強調系 → キャラメルの濃い色
 * - mint → 達成を示す落ち着いた緑
 * - cocoa → 本文の墨色
 * - cream → ページの地色
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C1917",
          soft: "#44403C",
          muted: "#78716C",
          faint: "#A8A29E",
        },
        line: {
          DEFAULT: "#E7E2DC",
          strong: "#D6CFC7",
        },
        caramel: {
          50: "#FBF6F0",
          100: "#F5EADD",
          200: "#EBD5BC",
          300: "#DDB78F",
          400: "#CC9161",
          500: "#B9703A",
          600: "#9A5A2A",
          700: "#7C4721",
          800: "#5F361A",
          900: "#432613",
        },
        candy: {
          pink: "#9A5A2A",
          peach: "#B9703A",
          mint: "#3E7C5E",
          lavender: "#78716C",
          lemon: "#F3E7CC",
          sky: "#4A6A8F",
        },
        honey: "#B9703A",
        apricot: "#EBD5BC",
        peach: "#F5EADD",
        coral: "#9A5A2A",
        mint: "#3E7C5E",
        latte: "#78716C",
        cocoa: {
          500: "#57534E",
          700: "#1C1917",
          900: "#0C0A09",
        },
        cream: {
          50: "#FAF8F5",
          100: "#F4F1EC",
          200: "#EAE5DE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      fontWeight: {
        // 900 の極太は和文だと字面が潰れて幼く見えるので、black も 700 に揃える
        black: "700",
        extrabold: "700",
      },
      borderRadius: {
        // 角丸は控えめに。テーマ配下の rounded-3xl は --pt-radius で上書きされる
        "2xl": "0.75rem",
        "3xl": "1rem",
        "4xl": "1.25rem",
        "5xl": "1.5rem",
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        // 旧グラデーションのクラス名は単色に置き換える
        "candy-gradient": "linear-gradient(#9A5A2A, #9A5A2A)",
        "caramel-gradient": "linear-gradient(#9A5A2A, #9A5A2A)",
        "yell-gradient": "linear-gradient(#9A5A2A, #9A5A2A)",
        "cream-gradient": "linear-gradient(#FAF8F5, #FAF8F5)",
        "hero-pattern": "none",
      },
      boxShadow: {
        candy: "0 1px 2px rgba(28, 25, 23, 0.08)",
        caramel: "0 1px 2px rgba(28, 25, 23, 0.08)",
        soft: "0 1px 2px rgba(28, 25, 23, 0.04), 0 0 0 1px rgba(28, 25, 23, 0.06)",
        "soft-lg": "0 8px 24px rgba(28, 25, 23, 0.08), 0 0 0 1px rgba(28, 25, 23, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
