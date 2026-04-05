import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightElement, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-sm font-semibold text-gray-700">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full py-3 rounded-2xl border-2 bg-white text-gray-800 placeholder:text-gray-400",
              "transition-all duration-200 outline-none",
              "focus:border-candy-pink focus:shadow-candy/20 focus:shadow-md",
              error
                ? "border-red-300 focus:border-red-400"
                : "border-caramel-100 hover:border-caramel-200",
              icon ? "pl-10 pr-4" : "px-4",
              rightElement ? "pr-12" : "",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-sm font-semibold text-gray-700">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full py-3 px-4 rounded-2xl border-2 bg-white text-gray-800 placeholder:text-gray-400",
            "transition-all duration-200 outline-none resize-none",
            "focus:border-candy-pink focus:shadow-candy/20 focus:shadow-md",
            error
              ? "border-red-300 focus:border-red-400"
              : "border-caramel-100 hover:border-caramel-200",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export default Input;
