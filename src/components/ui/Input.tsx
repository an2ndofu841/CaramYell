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
          <label className="text-sm font-bold text-ink">{label}</label>
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
              "w-full h-11 rounded-lg border bg-white text-ink placeholder:text-ink-faint",
              "transition-colors duration-150 outline-none",
              "focus:border-ink focus:ring-2 focus:ring-ink/10",
              error
                ? "border-red-400 focus:border-red-500"
                : "border-line-strong hover:border-ink-faint",
              icon ? "pl-10 pr-3.5" : "px-3.5",
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
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
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
          <label className="text-sm font-bold text-ink">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full py-2.5 px-3.5 rounded-lg border bg-white text-ink placeholder:text-ink-faint",
            "transition-colors duration-150 outline-none resize-none",
            "focus:border-ink focus:ring-2 focus:ring-ink/10",
            error
              ? "border-red-400 focus:border-red-500"
              : "border-line-strong hover:border-ink-faint",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export default Input;
