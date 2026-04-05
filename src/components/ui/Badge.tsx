import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: "pink" | "caramel" | "mint" | "lavender" | "lemon" | "sky" | "gray";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  color = "caramel",
  size = "md",
  className,
}: BadgeProps) {
  const colors = {
    pink: "bg-pink-100 text-pink-700",
    caramel: "bg-caramel-100 text-caramel-700",
    mint: "bg-teal-100 text-teal-700",
    lavender: "bg-purple-100 text-purple-700",
    lemon: "bg-yellow-100 text-yellow-700",
    sky: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full",
        colors[color],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
