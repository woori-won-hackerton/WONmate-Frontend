"use client";

import { useState } from "react";
import { Bot, MessageSquareQuote, Save, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Briefing, ExpectedQA } from "@/lib/types";
import { cn, formatDateTime, inputClass } from "@/lib/utils";

export function BriefingCard({ briefing }: { briefing: Briefing }) {
  return (
    <Card>
      <CardHeader icon={Bot} title="AI 브리핑" right={<Badge tone="sky">AI 초안 · FC 확인 필요</Badge>} />

      <ul className="space-y-2">
        {briefing.summary.map((s) => (
          <li key={s} className="flex gap-2 text-[15px] leading-relaxed text-ink">
            <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
            {s}
          </li>
        ))}
      </ul>

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
  onSave,
}: {
  qa: ExpectedQA[];
  /** 답변 메모 저장 (index, 메모) */
  onSave: (index: number, answerMemo: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // 저장 전 입력 중인 답변 (질문 index → 메모)
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  return (
    <Card>
      <CardHeader icon={MessageSquareQuote} title="고객이 물어볼 수 있는 질문" />
      <ul className="space-y-2">
        {qa.map((item, i) => {
          const open = openIndex === i;
          const value = drafts[i] ?? item.answerMemo;
          const dirty = value !== item.answerMemo;
          return (
            <li key={item.question} className="rounded-2xl border border-line">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-ink">Q. {item.question}</span>
                {dirty ? (
                  <Badge tone="amber">저장 안 됨</Badge>
                ) : item.answerMemo.trim() ? (
                  <Badge tone="green">메모됨</Badge>
                ) : (
                  <Badge>답변 메모</Badge>
                )}
              </button>
              {open && (
                <div className="border-t border-line p-3">
                  <textarea
                    value={value}
                    onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                    rows={3}
                    placeholder="예상 답변을 메모해 두세요. 약관 근거가 필요하면 AI 챗봇에서 확인하세요."
                    className={cn(inputClass, "resize-y")}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      disabled={!dirty}
                      onClick={() => {
                        onSave(i, value.trim());
                        setDrafts((d) => {
                          const next = { ...d };
                          delete next[i];
                          return next;
                        });
                      }}
                    >
                      <Save className="size-3.5" />
                      답변 저장
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}