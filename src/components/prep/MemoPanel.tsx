"use client";

import { useState } from "react";
import { BookUser, NotebookPen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn, formatDateTime, inputClass } from "@/lib/utils";

type MemoTab = "wiki" | "consult";

interface MemoPanelProps {
  customerName: string;
  wiki: string;
  wikiUpdatedAt?: string;
  onWikiChange: (value: string) => void;
  memo: string;
  memoUpdatedAt?: string;
  onMemoChange: (value: string) => void;
}

/** 상담 준비 우측 고정 메모 — 고객 위키 / 상담 메모 탭 */
export function MemoPanel({
  customerName,
  wiki,
  wikiUpdatedAt,
  onWikiChange,
  memo,
  memoUpdatedAt,
  onMemoChange,
}: MemoPanelProps) {
  const [tab, setTab] = useState<MemoTab>("consult");
  const updatedAt = tab === "wiki" ? wikiUpdatedAt : memoUpdatedAt;

  const tabs: { value: MemoTab; label: string; icon: typeof BookUser }[] = [
    { value: "wiki", label: "고객 위키", icon: BookUser },
    { value: "consult", label: "상담 메모", icon: NotebookPen },
  ];

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition",
              tab === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-sub",
            )}
          >
            <Icon className={cn("size-4", tab === value ? "text-brand-600" : "")} />
            {label}
          </button>
        ))}
      </div>

      {tab === "wiki" ? (
        <>
          <p className="mb-2 text-xs leading-relaxed text-muted">
            {customerName} 고객에 대해 계속 쌓아두는 메모예요. 다음 상담에서도 그대로 보여요.
          </p>
          <textarea
            value={wiki}
            onChange={(e) => onWikiChange(e.target.value)}
            rows={12}
            placeholder={"예) 연락은 오후 4시 이후 선호\n자녀 어린이보험에 관심"}
            className={cn(inputClass, "resize-y leading-relaxed")}
          />
        </>
      ) : (
        <>
          <p className="mb-2 text-xs leading-relaxed text-muted">
            상담 준비와 상담 중 들은 내용을 한곳에 적어요. 이 메모가 상담 기록 초안의 원문이 돼요.
          </p>
          <textarea
            value={memo}
            onChange={(e) => onMemoChange(e.target.value)}
            rows={12}
            placeholder={"예) 월 보험료 부담 언급\n타사 실손 있다고 함 → 다음 주까지 증권 사진 받기"}
            className={cn(inputClass, "resize-y leading-relaxed")}
          />
        </>
      )}

      <p className="mt-2 text-right text-xs text-muted">
        {updatedAt ? `자동 저장 ${formatDateTime(updatedAt)}` : "입력하면 자동 저장돼요"}
      </p>
    </Card>
  );
}