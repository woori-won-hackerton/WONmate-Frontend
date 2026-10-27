"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, FileCheck2, FileX, NotebookPen, Save, Sparkles } from "lucide-react";
import { AI_STEPS, AiProgress } from "@/components/ui/AiProgress";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadError } from "@/components/ui/LoadError";
import { Notice } from "@/components/ui/Notice";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import {
  confirmAiRecord,
  generateAiRecord,
  saveAiRecord,
  useAiRecord,
  useConsult,
  useConsultMemo,
  useCustomerLookup,
} from "@/lib/data";
import { confirmDialog, toast } from "@/lib/feedback";
import { ApiError } from "@/lib/http";
import { CONSULT_TYPE_LABEL, type RecordSummary } from "@/lib/types";
import { cn, formatDate, inputClass } from "@/lib/utils";

const FIELDS: { key: keyof RecordSummary; label: string; hint: string }[] = [
  { key: "needs", label: "고객 요구", hint: "고객이 원하거나 걱정한 것" },
  { key: "explained", label: "설명한 내용", hint: "실제로 설명·안내한 것만" },
  { key: "questions", label: "고객 질문", hint: "고객이 물어본 것" },
  { key: "unresolved", label: "미해결 사항", hint: "확인이 더 필요한 것" },
  { key: "nextActions", label: "다음 행동", hint: "누가, 언제까지, 무엇을" },
];

const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** AI 상담 요약 상세 — URL의 id = 상담 id */
export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mounted = useMounted();
  const customerOf = useCustomerLookup();

  const consultQuery = useConsult(id);
  const consult = consultQuery.data;
  const memoQuery = useConsultMemo(consult?.done ? id : undefined);
  const aiRecord = useAiRecord(consult?.done ? id : undefined);

  /** 화면에서 고친 항목 (저장 전) */
  const [edits, setEdits] = useState<Partial<RecordSummary>>({});
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!mounted || consultQuery.isLoading) return <LoadingBlock />;

  const notFound = consultQuery.error instanceof ApiError && [403, 404].includes(consultQuery.error.status);
  if (consultQuery.error && !notFound) {
    return <LoadError error={consultQuery.error} onRetry={consultQuery.reload} title="상담 기록을 불러오지 못했어요" />;
  }

  if (!consult) {
    return (
      <EmptyState
        icon={FileX}
        title="기록을 찾을 수 없어요"
        action={<Link href="/records" className={buttonClass("secondary")}>목록으로</Link>}
      />
    );
  }

  if (!consult.done) {
    return (
      <EmptyState
        icon={FileX}
        title="아직 완료되지 않은 상담이에요"
        description="상담 준비에서 ‘상담 완료’를 누르면 AI 상담 요약을 만들 수 있어요."
        action={
          <Link href={`/prep?scheduleId=${consult.id}`} className={buttonClass("secondary")}>
            상담 준비로
          </Link>
        }
      />
    );
  }

  const customerName = customerOf(consult.customerId)?.name ?? consult.customerName ?? "알 수 없음";
  const isConfirmed = consult.recordStatus === "confirmed";
  const memo = memoQuery.memo ?? "";
  const summary: RecordSummary | null = aiRecord.data ? { ...aiRecord.data, ...edits } : null;
  const dirty = Object.keys(edits).length > 0;

  const handleDraft = async () => {
    setGenerating(true);
    try {
      await generateAiRecord(consult.id);
      setEdits({});
      toast.success("AI 초안을 만들었어요. 내용을 확인해 주세요");
    } catch (e) {
      toast.error(errorText(e, "AI 초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!summary) return;
    setSaving(true);
    try {
      await saveAiRecord(consult.id, summary);
      setEdits({});
      toast.success("수정한 내용을 저장했어요");
    } catch (e) {
      toast.error(errorText(e, "저장하지 못했어요"));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!summary) return;
    const ok = await confirmDialog({
      title: "상담 요약을 확정할까요?",
      description: "확정하면 수정할 수 없어요. 실제 상담 내용과 일치하는지 확인해 주세요.",
      confirmText: "확정하기",
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (dirty) await saveAiRecord(consult.id, summary); // 고친 내용 먼저 저장
      await confirmAiRecord(consult.id);
      setEdits({});
      toast.success("AI 상담 요약을 확정했어요");
    } catch (e) {
      toast.error(errorText(e, "확정하지 못했어요"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-rise space-y-5 lg:space-y-6">
      <Link href="/records" className="inline-flex items-center gap-1 text-sm font-semibold text-sub hover:text-ink">
        <ChevronLeft className="size-4" />
        AI 상담 요약
      </Link>

      {/* 헤더 */}
      <Card>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{customerName} 고객</h1>
            {consult.consultType && <Badge tone="brand">{CONSULT_TYPE_LABEL[consult.consultType]}</Badge>}
            {isConfirmed && <Badge tone="green">기록 확정</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatDate(consult.date, true)} {consult.time} 상담
          </p>
        </div>
      </Card>

      {!isConfirmed && (
        <Notice tone="amber">
          AI 요약은 설명의무 이행이나 적합성 확인의 증거가 아니에요. 실제로 한 설명과 확인만 남기고, 하지
          않은 내용은 지워주세요.
        </Notice>
      )}

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader icon={NotebookPen} title="상담 완료 때 저장한 메모" right={<Badge>원문</Badge>} />
          <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-surface p-4 font-sans text-sm leading-relaxed text-ink">
            {memoQuery.ready ? memo || "메모 없음" : "불러오는 중…"}
          </pre>
          {!isConfirmed && !summary && (
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={handleDraft}
              loading={generating}
              disabled={!memo.trim() || aiRecord.isLoading}
            >
              {!generating && <Sparkles className="size-4" />}
              AI 초안 생성
            </Button>
          )}
          {memoQuery.ready && !memo.trim() && (
            <p className="mt-2 text-xs text-muted">저장된 메모가 없어서 AI 초안을 만들 수 없어요.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            icon={FileCheck2}
            title="AI 상담 요약"
            right={summary && !isConfirmed ? <Badge tone="sky">AI 초안 · 수정 가능</Badge> : undefined}
          />
          {generating ? (
            <AiProgress steps={AI_STEPS.record} />
          ) : aiRecord.isLoading ? (
            <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>
          ) : !summary ? (
            <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-line text-center text-sm text-muted">
              왼쪽 메모로 AI 초안을 만들어 주세요.
            </div>
          ) : (
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1.5 flex items-center justify-between text-sm font-bold text-sub">
                    {f.label}
                    {!summary[f.key] && <Badge tone="amber">메모에 없음</Badge>}
                  </span>
                  {isConfirmed ? (
                    <p className="whitespace-pre-wrap rounded-2xl bg-surface p-3 text-sm text-ink">
                      {summary[f.key] || "—"}
                    </p>
                  ) : (
                    <textarea
                      value={summary[f.key]}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      rows={3}
                      placeholder={f.hint}
                      disabled={saving}
                      className={cn(inputClass, "resize-y")}
                    />
                  )}
                </label>
              ))}
            </div>
          )}
          {!isConfirmed && summary && (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" size="lg" onClick={handleSave} loading={saving} disabled={!dirty || generating}>
                {!saving && <Save className="size-4" />}
                {dirty ? "수정 내용 저장" : "저장됨"}
              </Button>
              <Button size="lg" onClick={handleConfirm} disabled={saving || generating}>
                <CheckCircle2 className="size-4" />
                기록 확정
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}