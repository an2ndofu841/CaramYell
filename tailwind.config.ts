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
          200: "#FFD9A8",
          300: "#FFBC6B",
          400: "#FF9A2E",
          500: "#F47B0A",
          600: "#D85E00",
          700: "#B34700",
          800: "#8F3700",
          900: "#6B2800",
        },
        candy: {
          pink: "#FF6B9D",
          peach: "#FFB347",
          mint: "#4ECDC4",
          lavender: "#C3B1E1",
          lemon: "#FFE66D",
          sky: "#74C0FC",
        },
        cream: {
          50: "#FFFBF5",
          100: "#FFF5E6",
          200: "#FFE8C8",
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
      },
      backgroundImage: {
        "candy-gradient":
          "linear-gradient(135deg, #FF6B9D 0%, #FFB347 50%, #FFE66D 100%)",
        "caramel-gradient":
          "linear-gradient(135deg, #F47B0A 0%, #FF9A2E 100%)",
        "cream-gradient":
          "linear-gradient(180deg, #FFFBF5 0%, #FFF5E6 100%)",
        "hero-pattern":
          "radial-gradient(circle at 20% 50%, rgba(255,107,157,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,179,71,0.15) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(78,205,196,0.1) 0%, transparent 50%)",
      },
      boxShadow: {
        candy: "0 4px 20px rgba(255, 107, 157, 0.3)",
        caramel: "0 4px 20px rgba(244, 123, 10, 0.3)",
        soft: "0 4px 30px rgba(0, 0, 0, 0.06)",
        "soft-lg": "0 8px 40px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
