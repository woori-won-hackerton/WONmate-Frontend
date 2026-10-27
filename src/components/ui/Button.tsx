import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-float hover:bg-brand-700 disabled:bg-brand-200 disabled:shadow-none",
  secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50",
  outline: "border border-line bg-white text-ink hover:bg-gray-50 disabled:opacity-50",
  ghost: "text-sub hover:bg-gray-100 disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 rounded-xl px-3.5 text-[13px]",
  md: "h-11 rounded-2xl px-4 text-sm",
  lg: "h-12 rounded-2xl px-5 text-[15px]",
};

/** Link에 버튼 모양을 입힐 때 사용 */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100",
    VARIANTS[variant],
    SIZES[size],
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}