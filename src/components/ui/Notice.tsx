import type { ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-brand-50 text-brand-800",
  amber: "bg-amber-50 text-amber-900",
  green: "bg-emerald-50 text-emerald-900",
};

const ICONS = { brand: Info, amber: TriangleAlert, green: CheckCircle2 };

export function Notice({
  tone = "brand",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}) {
  const Icon = ICONS[tone];
  return (
    <div className={cn("flex gap-2.5 rounded-2xl px-4 py-3.5 text-sm leading-relaxed", TONES[tone], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}