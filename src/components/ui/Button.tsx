"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  /** 互換のために残している旧オプション。演出はもう行わない */
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      heartOnHover,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed",
      secondary:
        "text-caramel-700 font-bold bg-caramel-50 hover:bg-caramel-100 disabled:opacity-50",
      outline:
        "text-ink font-bold border border-line-strong bg-white hover:bg-cream-100 disabled:opacity-50",
      ghost:
        "text-ink-soft font-semibold hover:bg-cream-100 disabled:opacity-50",
      danger:
        "text-white font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-10 px-4 text-sm rounded-lg",
      lg: "h-12 px-6 text-[15px] rounded-lg",
      xl: "h-14 px-8 text-base rounded-lg",
    };

    // プロジェクトページのテーマ配下では --pt-* が定義される。
    // それ以外の画面では変数が無いのでフォールバックの標準配色になる。
    const primaryStyle =
      variant === "primary"
        ? {
            background: "var(--pt-gradient, #1C1917)",
            boxShadow: "var(--pt-button-shadow, none)",
          }
        : {};

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-[background-color,filter,opacity] duration-150 select-none",
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
