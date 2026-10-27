"use client";

import { useEffect, useState } from "react";
import { BookUser, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, formatDateTime, inputClass } from "@/lib/utils";

type MemoTab = "wiki" | "consult";

interface MemoPanelProps {
  customerName: string;
  wiki: string;
  wikiUpdatedAt?: string;
  onWikiSave: (value: string) => void;
  memo: string;
  memoUpdatedAt?: string;
  onMemoSave: (value: string) => void;
  /** 저장하지 않은 변경이 있는지 부모에 알림 (상담 완료 시 확인용) */
  onDirtyChange?: (dirty: boolean) => void;
}

/** 상담 준비 우측 고정 메모 — 고객 위키 / 상담 메모 탭 (저장 버튼으로 저장) */
export function MemoPanel({
  customerName,
  wiki,
  wikiUpdatedAt,
  onWikiSave,
  memo,
  memoUpdatedAt,
  onMemoSave,
  onDirtyChange,
}: MemoPanelProps) {
  const [tab, setTab] = useState<MemoTab>("consult");
  const [wikiDraft, setWikiDraft] = useState(wiki);
  const [memoDraft, setMemoDraft] = useState(memo);

  const wikiDirty = wikiDraft !== wiki;
  const memoDirty = memoDraft !== memo;
  const isWiki = tab === "wiki";
  const dirty = isWiki ? wikiDirty : memoDirty;
  const updatedAt = isWiki ? wikiUpdatedAt : memoUpdatedAt;

  useEffect(() => {
    onDirtyChange?.(wikiDirty || memoDirty);
  }, [wikiDirty, memoDirty, onDirtyChange]);

  const handleSave = () => {
    if (isWiki) onWikiSave(wikiDraft.trim());
    else onMemoSave(memoDraft.trim());
  };

  const tabs: { value: MemoTab; label: string; icon: typeof BookUser; changed: boolean }[] = [
    { value: "wiki", label: "고객 위키", icon: BookUser, changed: wikiDirty },
    { value: "consult", label: "상담 메모", icon: NotebookPen, changed: memoDirty },
  ];

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        {tabs.map(({ value, label, icon: Icon, changed }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition",
              tab === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-sub",
            )}
          >
            <Icon className={cn("size-4", tab === value ? "text-brand-600" : "")} />
            {label}
            {changed && <span className="absolute right-2 top-1.5 size-1.5 rounded-full bg-amber-500" />}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs leading-relaxed text-muted">
        {isWiki
          ? `${customerName} 고객에 대해 계속 쌓아두는 메모예요. 다음 상담에서도 그대로 보여요.`
          : "상담 준비와 상담 중 들은 내용을 적어요. 저장한 메모가 AI 상담 요약의 원문이 돼요."}
      </p>
      <textarea
        value={isWiki ? wikiDraft : memoDraft}
        onChange={(e) => (isWiki ? setWikiDraft(e.target.value) : setMemoDraft(e.target.value))}
        rows={12}
        placeholder={
          isWiki
            ? "예) 연락은 오후 4시 이후 선호\n자녀 어린이보험에 관심"
            : "예) 월 보험료 부담 언급\n다음 주까지 증권 사진 받기"
        }
        className={cn(inputClass, "resize-y leading-relaxed")}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={cn("text-xs", dirty ? "font-semibold text-amber-600" : "text-muted")}>
          {dirty ? "저장하지 않은 변경이 있어요" : updatedAt ? `저장됨 ${formatDateTime(updatedAt)}` : "아직 저장하지 않았어요"}
        </p>
        <Button size="sm" onClick={handleSave} disabled={!dirty}>
          <Save className="size-3.5" />
          {isWiki ? "위키 저장" : "메모 저장"}
        </Button>
      </div>
    </Card>
  );
}