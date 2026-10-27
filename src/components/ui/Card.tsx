import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl border border-line/60 bg-white p-5 shadow-card sm:p-6", className)}
      {...props}
    />
  );
}

export function CardHeader({ icon: Icon, title, right }: { icon?: LucideIcon; title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight text-ink">
        {Icon && (
          <span className="grid size-8 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="size-[18px]" strokeWidth={2} />
          </span>
        )}
        {title}
      </h2>
      {right}
    </div>
  );
}