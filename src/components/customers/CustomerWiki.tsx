"use client";

import { useState } from "react";
import { BookUser, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadError } from "@/components/ui/LoadError";
import { appendCustomerWiki, useCustomerWiki } from "@/lib/data";
import { toast } from "@/lib/feedback";
import { cn, inputClass } from "@/lib/utils";

const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * 고객 위키(고객 메모) — 상담 준비 화면의 '고객 위키' 탭과 같은 데이터
 * 백엔드는 '내용 추가'만 지원해요. (이미 적은 내용은 수정 · 삭제 불가)
 */
export function CustomerWiki({ customerId }: { customerId: string }) {
  const { data: content, isLoading, error, reload } = useCustomerWiki(customerId);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    try {
      await appendCustomerWiki(customerId, text);
      setDraft("");
      toast.success("고객 위키에 추가했어요");
    } catch (e) {
      toast.error(errorText(e, "고객 위키에 추가하지 못했어요"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader icon={BookUser} title="고객 위키" />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted">불러오는 중…</p>
      ) : error ? (
        <LoadError error={error} onRetry={reload} title="고객 위키를 불러오지 못했어요" />
      ) : (
        <>
          {content ? (
            <p className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-surface p-4 text-sm leading-relaxed text-ink">
              {content}
            </p>
          ) : (
            <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-muted">
              아직 적어둔 고객 메모가 없어요.
            </p>
          )}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            disabled={saving}
            placeholder={"추가할 내용을 적어주세요. 고객이 직접 말한 내용만 적어주세요.\n예) 연락은 오후 4시 이후 선호"}
            className={cn(inputClass, "mt-3 resize-y leading-relaxed")}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={handleAdd} loading={saving} disabled={!draft.trim()}>
              {!saving && <Plus className="size-4" />}
              위키에 추가
            </Button>
          </div>
        </>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted">
        상담과 상관없이 고객에 대해 계속 쌓아두는 메모예요. 적은 내용은 기존 내용 아래에 추가되고, AI 브리핑을 만들 때
        참고돼요. 한 번 추가한 내용은 수정 · 삭제할 수 없어요.
      </p>
    </Card>
  );
}