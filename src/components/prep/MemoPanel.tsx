"use client";

import { useEffect, useState } from "react";
import { BookUser, NotebookPen, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, formatDateTime, inputClass } from "@/lib/utils";

type MemoTab = "wiki" | "consult";

interface MemoPanelProps {
  customerName: string;
  /** 고객 위키 전체 내용 (백엔드) */
  wiki: string;
  wikiLoading?: boolean;
  /** 위키 뒤에 내용 추가 — 성공하면 true */
  onWikiAppend: (value: string) => Promise<boolean>;
  memo: string;
  memoUpdatedAt?: string;
  onMemoSave: (value: string) => void;
  /** 저장하지 않은 변경이 있는지 부모에 알림 (상담 완료 시 확인용) */
  onDirtyChange?: (dirty: boolean) => void;
}

/** 상담 준비 우측 고정 메모 — 고객 위키(추가만) / 상담 메모(저장) 탭 */
export function MemoPanel({
  customerName,
  wiki,
  wikiLoading,
  onWikiAppend,
  memo,
  memoUpdatedAt,
  onMemoSave,
  onDirtyChange,
}: MemoPanelProps) {
  const [tab, setTab] = useState<MemoTab>("consult");
  const [wikiDraft, setWikiDraft] = useState("");
  const [memoDraft, setMemoDraft] = useState(memo);
  const [appending, setAppending] = useState(false);

  const wikiDirty = wikiDraft.trim() !== "";
  const memoDirty = memoDraft !== memo;
  const isWiki = tab === "wiki";

  useEffect(() => {
    onDirtyChange?.(wikiDirty || memoDirty);
  }, [wikiDirty, memoDirty, onDirtyChange]);

  const handleAppend = async () => {
    if (!wikiDirty) return;
    setAppending(true);
    const ok = await onWikiAppend(wikiDraft.trim());
    setAppending(false);
    if (ok) setWikiDraft("");
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

      {isWiki ? (
        <>
          <p className="mb-2 text-xs leading-relaxed text-muted">
            {customerName} 고객에 대해 계속 쌓아두는 메모예요. AI 브리핑에 참고되고, 추가한 내용은 수정 · 삭제할 수
            없어요.
          </p>
          <div className="mb-2 max-h-56 overflow-y-auto rounded-xl bg-surface p-3 text-sm leading-relaxed text-ink">
            {wikiLoading ? (
              <span className="text-muted">불러오는 중…</span>
            ) : wiki ? (
              <p className="whitespace-pre-wrap">{wiki}</p>
            ) : (
              <span className="text-muted">아직 적어둔 고객 메모가 없어요.</span>
            )}
          </div>
          <textarea
            value={wikiDraft}
            onChange={(e) => setWikiDraft(e.target.value)}
            rows={4}
            disabled={appending}
            placeholder={"추가할 내용\n예) 연락은 오후 4시 이후 선호"}
            className={cn(inputClass, "resize-y leading-relaxed")}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className={cn("text-xs", wikiDirty ? "font-semibold text-amber-600" : "text-muted")}>
              {wikiDirty ? "추가하지 않은 내용이 있어요" : "기존 내용 아래에 추가돼요"}
            </p>
            <Button size="sm" onClick={handleAppend} loading={appending} disabled={!wikiDirty}>
              {!appending && <Plus className="size-3.5" />}
              위키에 추가
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-2 text-xs leading-relaxed text-muted">
            상담 준비와 상담 중 들은 내용을 적어요. 저장한 메모가 AI 상담 요약의 원문이 돼요.
          </p>
          <textarea
            value={memoDraft}
            onChange={(e) => setMemoDraft(e.target.value)}
            rows={12}
            placeholder={"예) 월 보험료 부담 언급\n다음 주까지 증권 사진 받기"}
            className={cn(inputClass, "resize-y leading-relaxed")}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className={cn("text-xs", memoDirty ? "font-semibold text-amber-600" : "text-muted")}>
              {memoDirty
                ? "저장하지 않은 변경이 있어요"
                : memoUpdatedAt
                  ? `저장됨 ${formatDateTime(memoUpdatedAt)}`
                  : "아직 저장하지 않았어요"}
            </p>
            <Button size="sm" onClick={() => onMemoSave(memoDraft.trim())} disabled={!memoDirty}>
              <Save className="size-3.5" />
              메모 저장
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}