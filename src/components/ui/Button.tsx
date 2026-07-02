"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode, useState } from "react";
import { Loader2, Heart } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  /** ホバー時にハートが現れる演出（デザインカンプ「ホバーボタンの変化」） */
  heartOnHover?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      heartOnHover = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = useState(false);

    const variants = {
      primary:
        "text-white font-bold shadow-caramel btn-pop disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
      secondary:
        "text-caramel-700 font-bold bg-caramel-50 hover:bg-caramel-100 transition-colors duration-200",
      outline:
        "text-caramel-600 font-bold border-2 border-caramel-300 bg-white hover:bg-caramel-50 transition-colors duration-200",
      ghost:
        "text-gray-600 font-semibold hover:bg-gray-100 transition-colors duration-200",
      danger:
        "text-white font-bold bg-red-500 hover:bg-red-600 transition-colors duration-200 shadow-sm",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-full",
      md: "px-5 py-2.5 text-sm rounded-full",
      lg: "px-7 py-3 text-base rounded-full",
      xl: "px-10 py-4 text-lg rounded-full",
    };

    const primaryStyle =
      variant === "primary"
        ? {
            background: "linear-gradient(135deg, #F2807B 0%, #E8842C 60%, #F5A34B 100%)",
            boxShadow: "0 4px 20px rgba(232, 132, 44, 0.4)",
          }
        : {};

    const showHeart = heartOnHover && hovered && !loading;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200 select-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        style={primaryStyle}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : showHeart ? (
          <Heart size={16} className="fill-current animate-fade-in" />
        ) : (
          icon && iconPosition === "left" && icon
        )}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
