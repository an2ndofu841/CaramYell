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
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "text-white font-bold shadow-candy btn-pop disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
      secondary:
        "text-caramel-700 font-bold bg-caramel-50 hover:bg-caramel-100 transition-colors duration-200",
      outline:
        "text-caramel-600 font-bold border-2 border-caramel-300 bg-transparent hover:bg-caramel-50 transition-colors duration-200",
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
            background: "linear-gradient(135deg, #FF6B9D 0%, #FFB347 100%)",
            boxShadow: "0 4px 20px rgba(255, 107, 157, 0.4)",
          }
        : {};

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
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
