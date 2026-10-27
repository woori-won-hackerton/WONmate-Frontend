"use client";

import { useState } from "react";
import { BookUser, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { toast } from "@/lib/feedback";
import { useAppStore } from "@/lib/store";
import { cn, formatDateTime, inputClass } from "@/lib/utils";

/** 고객 위키(고객 메모) 조회 · 편집 — 상담 준비 화면의 '고객 위키' 탭과 같은 데이터 */
export function CustomerWiki({ customerId }: { customerId: string }) {
  const doc = useAppStore((s) => s.wiki[customerId]);
  const saveWiki = useAppStore((s) => s.saveWiki);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const content = doc?.content ?? "";

  const startEdit = () => {
    setDraft(content);
    setEditing(true);
  };

  const handleSave = () => {
    saveWiki(customerId, draft.trim());
    setEditing(false);
    toast.success("고객 위키를 저장했어요");
  };

  return (
    <Card>
      <CardHeader
        icon={BookUser}
        title="고객 위키"
        right={
          !editing && (
            <Button size="sm" variant="ghost" onClick={startEdit}>
              <Pencil className="size-3.5" />
              편집
            </Button>
          )
        }
      />

      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            autoFocus
            placeholder={"고객이 직접 말한 내용만 적어주세요.\n예) 연락은 오후 4시 이후 선호"}
            className={cn(inputClass, "resize-y leading-relaxed")}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </div>
        </>
      ) : content ? (
        <>
          <p className="whitespace-pre-wrap rounded-xl bg-surface p-4 text-sm leading-relaxed text-ink">{content}</p>
          {doc?.updatedAt && (
            <p className="mt-2 text-right text-xs text-muted">최종 수정 {formatDateTime(doc.updatedAt)}</p>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-line py-8 text-center">
          <p className="text-sm text-muted">아직 적어둔 고객 메모가 없어요.</p>
          <button type="button" onClick={startEdit} className="mt-1 text-sm font-semibold text-brand-600 hover:underline">
            첫 메모 남기기
          </button>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted">
        상담과 상관없이 고객에 대해 계속 쌓아두는 메모예요. 상담 준비 화면의 &lsquo;고객 위키&rsquo; 탭에서도
        수정할 수 있어요.
      </p>
    </Card>
  );
}