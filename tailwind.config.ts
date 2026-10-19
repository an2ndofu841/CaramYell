import type { Config } from "tailwindcss";

/**
 * 配色は「とろけるキャラメル」。CaramYell = キャラメル + エールなので、
 * 地はミルクキャラメルのクリーム色、文字は焦がしキャラメルの濃い茶、
 * 強調はキャラメルソースの艶のあるグラデーションにしている。
 *
 * 色数そのものはキャラメルの階調に絞り、ピンク・ミント・ラベンダーのような
 * 別系統のキャンディ色は使わない（画面ごとに色が散って落ち着かなかったため）。
 * 既存のクラス名（candy-pink / coral / mint / cocoa など）は各画面に大量に
 * 残っているので、名前はそのままに値だけをこのパレットへ寄せている。
 * - candy-pink / coral / honey など強調系 → キャラメルの濃い色
 * - mint → 達成を示す落ち着いた緑
 * - ink / cocoa → 本文の焦がしキャラメル色
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
          DEFAULT: "#2E1F15",
          soft: "#4F3B2D",
          muted: "#7E6857",
          faint: "#B19C8A",
        },
        line: {
          DEFAULT: "#EFDFCB",
          strong: "#E2C9AC",
        },
        caramel: {
          50: "#FFF5E8",
          100: "#FDE8CF",
          200: "#F8D2A6",
          300: "#F0B475",
          400: "#E39549",
          500: "#CC7630",
          600: "#A85D22",
          700: "#86471A",
          800: "#643416",
          900: "#452412",
        },
        candy: {
          pink: "#A85D22",
          peach: "#CC7630",
          mint: "#3E7C5E",
          lavender: "#7E6857",
          lemon: "#FCEBC8",
          sky: "#4A6A8F",
        },
        honey: "#CC7630",
        apricot: "#F8D2A6",
        peach: "#FDE8CF",
        coral: "#A85D22",
        mint: "#3E7C5E",
        latte: "#7E6857",
        cocoa: {
          500: "#5E4838",
          700: "#2E1F15",
          900: "#1C120B",
        },
        cream: {
          50: "#FFF9F1",
          100: "#FCF0E1",
          200: "#F6E4CE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        // 見出しは丸ゴシック。キャラメルの角の取れた形に合わせる
        display: ["var(--font-display)", "sans-serif"],
      },
      fontWeight: {
        // 900 の極太は和文だと字面が潰れて幼く見えるので、black も 700 に揃える
        black: "700",
        extrabold: "700",
      },
      borderRadius: {
        // キャラメルの粒のように角を大きく丸める。
        // テーマ配下の rounded-3xl は --pt-radius で上書きされる
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "1.75rem",
        "5xl": "2rem",
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
        // キャラメルソースの艶。明るい飴色から焦がしキャラメルへ流す。
        // 白文字を載せるので、文字が乗る中央より先は十分に濃くしてある
        "caramel-gradient": "linear-gradient(135deg, #E39549 0%, #B96626 48%, #8E4C1C 100%)",
        "candy-gradient": "linear-gradient(135deg, #E39549 0%, #B96626 48%, #8E4C1C 100%)",
        "yell-gradient": "linear-gradient(135deg, #E39549 0%, #B96626 48%, #8E4C1C 100%)",
        "cream-gradient": "linear-gradient(180deg, #FFF9F1 0%, #FCEEDC 100%)",
        "hero-pattern": "none",
      },
      boxShadow: {
        // 影は墨ではなくキャラメル色を薄く落として、温かみを残す
        candy: "0 6px 16px rgba(168, 93, 34, 0.28)",
        caramel: "0 6px 16px rgba(168, 93, 34, 0.28)",
        soft: "0 2px 10px rgba(134, 71, 26, 0.06), 0 0 0 1px rgba(134, 71, 26, 0.06)",
        "soft-lg": "0 16px 36px rgba(134, 71, 26, 0.12), 0 0 0 1px rgba(134, 71, 26, 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
