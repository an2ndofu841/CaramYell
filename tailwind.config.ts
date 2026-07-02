import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        caramel: {
          50: "#FFF8F0",
          100: "#FFEFD6",
          200: "#FFDFAE",
          300: "#FFC377",
          400: "#F5A34B",
          500: "#E8842C",
          600: "#C96A1B",
          700: "#A35213",
          800: "#7D3D0E",
          900: "#5C2C0A",
        },
        candy: {
          pink: "#F2807B",
          peach: "#F5A34B",
          mint: "#8FD4C4",
          lavender: "#C9A87C",
          lemon: "#FFE0A8",
          sky: "#74C0FC",
        },
        honey: "#F3A93C",
        apricot: "#FFC98A",
        peach: "#FFDDB8",
        coral: "#F2807B",
        mint: "#8FD4C4",
        latte: "#C9A87C",
        cocoa: {
          500: "#6B4423",
          700: "#4A2C17",
          900: "#31200E",
        },
        cream: {
          50: "#FFFBF5",
          100: "#FFF6E9",
          200: "#FFEAD0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "float-slow": "float 5s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        sparkle: "sparkle 1.5s ease-in-out infinite",
        "bounce-slow": "bounce 2s infinite",
        drip: "drip 2.4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        sparkle: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "0.7" },
        },
        drip: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.15) translateY(2px)" },
        },
      },
      backgroundImage: {
        "candy-gradient":
          "linear-gradient(135deg, #F2807B 0%, #F5A34B 55%, #FFC98A 100%)",
        "caramel-gradient":
          "linear-gradient(135deg, #E8842C 0%, #F5A34B 100%)",
        "yell-gradient":
          "linear-gradient(135deg, #F2807B 0%, #E8842C 100%)",
        "cream-gradient":
          "linear-gradient(180deg, #FFFBF5 0%, #FFF6E9 100%)",
        "hero-pattern":
          "radial-gradient(circle at 20% 50%, rgba(242,128,123,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,163,75,0.15) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(255,201,138,0.12) 0%, transparent 50%)",
      },
      boxShadow: {
        candy: "0 4px 20px rgba(242, 128, 123, 0.3)",
        caramel: "0 4px 20px rgba(232, 132, 44, 0.3)",
        soft: "0 4px 30px rgba(92, 44, 10, 0.06)",
        "soft-lg": "0 8px 40px rgba(92, 44, 10, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
