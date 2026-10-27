"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** 화면별 AI 진행 단계 문구 */
export const AI_STEPS = {
  briefing: ["고객 정보와 계약을 불러오는 중", "지난 상담 기록을 살펴보는 중", "AI가 브리핑을 작성하는 중"],
  record: ["상담 메모를 읽는 중", "항목별로 내용을 나누는 중", "AI가 기록 초안을 작성하는 중"],
  chat: ["질문을 이해하는 중", "관련 문서를 찾아보는 중", "근거를 바탕으로 답변을 작성하는 중"],
} as const;

interface AiProgressProps {
  /** 순서대로 보여줄 단계 문구 */
  steps: readonly string[];
  /** 다음 단계로 넘어가는 간격(ms) — 마지막 단계에서는 응답이 올 때까지 머묾 */
  interval?: number;
  /** compact = 챗봇 말풍선용 작은 버전 */
  variant?: "card" | "compact";
  className?: string;
}

/**
 * AI·RAG 처리 중 표시 (응답이 올 때까지)
 * - 실제 진행률이 아니라 단계 안내용. 응답이 오면 부모가 이 컴포넌트를 내리면 됨
 */
export function AiProgress({ steps, interval = 1200, variant = "card", className }: AiProgressProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= steps.length - 1) return;
    const timer = setTimeout(() => setCurrent((c) => c + 1), interval);
    return () => clearTimeout(timer);
  }, [current, steps.length, interval]);

  if (variant === "compact") {
    return (
      <div
        role="status"
        className={cn(
          "inline-flex items-center gap-2.5 rounded-3xl rounded-tl-lg border border-line/70 bg-white px-4 py-3 shadow-card",
          className,
        )}
      >
        <span className="relative grid size-7 place-items-center rounded-full bg-linear-to-br from-brand-500 to-sky-accent text-white">
          <Sparkles className="size-3.5 animate-pulse" />
        </span>
        <span key={current} className="animate-rise text-sm font-semibold text-sub">
          {steps[current]}
        </span>
        <TypingDots />
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-3xl border border-brand-100 bg-linear-to-br from-brand-50 via-white to-sky-50 p-5 sm:p-6",
        className,
      )}
    >
      {/* 반짝이는 띠 */}
      <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer bg-linear-to-r from-transparent via-white/70 to-transparent" />

      <div className="relative flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-linear-to-br from-brand-600 to-sky-accent text-white shadow-float">
          <Sparkles className="size-5 animate-pulse" />
        </span>
        <div>
          <p className="text-[15px] font-bold text-ink">AI가 작업 중이에요</p>
          <p className="text-xs text-muted">잠시만 기다려 주세요</p>
        </div>
      </div>

      <ol className="relative mt-4 space-y-2.5">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors",
                done && "text-sub",
                active && "font-semibold text-brand-700",
                !done && !active && "text-muted/70",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full",
                  done && "bg-emerald-500 text-white",
                  active && "border-2 border-brand-200 border-t-brand-600 animate-spin",
                  !done && !active && "border-2 border-gray-200",
                )}
              >
                {done && <Check className="size-3" strokeWidth={3} />}
              </span>
              {step}
              {active && <TypingDots />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 animate-bounce rounded-full bg-brand-400"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}