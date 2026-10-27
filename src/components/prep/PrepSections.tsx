"use client";

import { useState } from "react";
import { Bot, MessageSquareQuote, ShieldAlert, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Briefing, ExpectedQA } from "@/lib/types";
import { cn, formatDateTime, inputClass } from "@/lib/utils";

export function BriefingCard({ briefing }: { briefing: Briefing }) {
  return (
    <Card>
      <CardHeader icon={Bot} title="요약 브리핑" right={<Badge tone="sky">AI 초안 · FC 확인 필요</Badge>} />

      <ul className="space-y-2">
        {briefing.summary.map((s) => (
          <li key={s} className="flex gap-2 text-[15px] leading-relaxed text-ink">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
            {s}
          </li>
        ))}
      </ul>

      {briefing.unknowns.length > 0 && (
        <div className="mt-5 rounded-xl bg-amber-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <TriangleAlert className="size-4" />
            확인되지 않은 정보
          </p>
          <ul className="space-y-1 text-sm text-amber-900">
            {briefing.unknowns.map((u) => <li key={u}>· {u}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-sub">권장 상담 순서</p>
        <ol className="flex flex-wrap items-center gap-2">
          {briefing.order.map((step, i) => (
            <li key={step} className="flex items-center gap-2 text-sm">
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                {i + 1}. {step}
              </span>
              {i < briefing.order.length - 1 && <span className="text-muted">→</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 space-y-1 text-sm text-sub">
        {briefing.cautions.map((c) => <p key={c}>⚠︎ {c}</p>)}
      </div>

      <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
        생성 {formatDateTime(briefing.generatedAt)} · {briefing.modelVersion} · 근거: 고객 정보 · 계약 · 상담 이력
      </p>
    </Card>
  );
}

/** 상담 전 함께 확인해주세요 — 프론트 고정 필수사항 (체크 없음) */
export function RequiredChecks({ items }: { items: string[] }) {
  return (
    <Card className="border-brand-100 bg-brand-50/50">
      <CardHeader icon={ShieldAlert} title="상담 전 함께 확인해주세요" right={<Badge tone="brand">필수</Badge>} />
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function ExpectedQuestions({
  qa,
  onChange,
}: {
  qa: ExpectedQA[];
  onChange: (qa: ExpectedQA[]) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader icon={MessageSquareQuote} title="고객이 물어볼 수 있는 질문" />
      <ul className="space-y-2">
        {qa.map((item, i) => {
          const open = openIndex === i;
          return (
            <li key={item.question} className="rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-ink">Q. {item.question}</span>
                {item.answerMemo.trim() ? <Badge tone="green">메모됨</Badge> : <Badge>답변 메모</Badge>}
              </button>
              {open && (
                <div className="border-t border-line p-3">
                  <textarea
                    value={item.answerMemo}
                    onChange={(e) =>
                      onChange(qa.map((q, idx) => (idx === i ? { ...q, answerMemo: e.target.value } : q)))
                    }
                    rows={3}
                    placeholder="예상 답변을 메모해 두세요. 약관 근거가 필요하면 상품 Q&A에서 확인하세요."
                    className={cn(inputClass, "resize-y")}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}