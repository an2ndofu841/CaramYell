import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "glass" | "outlined";
}

export default function Card({
  children,
  className,
  hover = false,
  padding = "md",
  variant = "default",
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variants = {
    default: "bg-white shadow-soft",
    glass: "glass border border-white/60",
    outlined: "bg-white border-2 border-caramel-100",
  };

  return (
    <div
      className={cn(
        "rounded-3xl overflow-hidden",
        variants[variant],
        paddings[padding],
        hover && "card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
