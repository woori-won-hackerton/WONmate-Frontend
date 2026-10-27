"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, FileCheck2, FileX, NotebookPen, Sparkles } from "lucide-react";
import { AI_STEPS, AiProgress } from "@/components/ui/AiProgress";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { draftRecordSummary } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { confirmDialog, toast } from "@/lib/feedback";
import { findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, type RecordSummary } from "@/lib/types";
import { cn, formatDate, inputClass } from "@/lib/utils";

const FIELDS: { key: keyof RecordSummary; label: string; hint: string }[] = [
  { key: "needs", label: "고객 요구", hint: "고객이 원하거나 걱정한 것" },
  { key: "explained", label: "설명한 내용", hint: "실제로 설명·안내한 것만" },
  { key: "questions", label: "고객 질문", hint: "고객이 물어본 것" },
  { key: "unresolved", label: "미해결 사항", hint: "확인이 더 필요한 것" },
  { key: "nextActions", label: "다음 행동", hint: "누가, 언제까지, 무엇을" },
];

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mounted = useMounted();
  const record = useAppStore((s) => s.records.find((r) => r.id === id));
  const updateRecord = useAppStore((s) => s.updateRecord);
  const confirmRecord = useAppStore((s) => s.confirmRecord);
  const user = useCurrentUser();

  const [generating, setGenerating] = useState(false);

  if (!mounted) return <LoadingBlock />;

  if (!record) {
    return (
      <EmptyState
        icon={FileX}
        title="기록을 찾을 수 없어요"
        action={<Link href="/records" className={buttonClass("secondary")}>목록으로</Link>}
      />
    );
  }

  const customer = findCustomer(record.customerId);
  const isConfirmed = record.status === "confirmed";
  const summary = record.summary;

  const handleDraft = async () => {
    setGenerating(true);
    try {
      const next = await draftRecordSummary(record.memo);
      updateRecord(record.id, { summary: next, status: "ai_draft" });
      toast.success("AI 초안을 만들었어요. 내용을 확인해 주세요");
    } catch {
      toast.error("AI 초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요");
    } finally {
      setGenerating(false);
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
    confirmRecord(record.id, user.name);
    toast.success("AI 상담 요약을 확정했어요");
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
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">{customer?.name ?? "알 수 없음"} 고객</h1>
            <Badge tone="brand">{CONSULT_TYPE_LABEL[record.type]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{formatDate(record.date, true)} 상담</p>
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
          <CardHeader icon={NotebookPen} title="저장한 상담 메모" right={<Badge>원문</Badge>} />
          {isConfirmed ? (
            <pre className="whitespace-pre-wrap rounded-2xl bg-surface p-4 font-sans text-sm leading-relaxed text-ink">
              {record.memo || "메모 없음"}
            </pre>
          ) : (
            <>
              <textarea
                value={record.memo}
                onChange={(e) => updateRecord(record.id, { memo: e.target.value })}
                rows={14}
                className={cn(inputClass, "resize-y leading-relaxed")}
              />
              <Button
                className="mt-3 w-full"
                variant="secondary"
                onClick={handleDraft}
                loading={generating}
                disabled={!record.memo.trim()}
              >
                {!generating && <Sparkles className="size-4" />}
                {summary ? "AI 초안 다시 만들기" : "AI 초안 생성"}
              </Button>
            </>
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
                      onChange={(e) =>
                        updateRecord(record.id, { summary: { ...summary, [f.key]: e.target.value } })
                      }
                      rows={3}
                      placeholder={f.hint}
                      className={cn(inputClass, "resize-y")}
                    />
                  )}
                </label>
              ))}
            </div>
          )}
          {!isConfirmed && (
            <Button className="mt-5 w-full" size="lg" onClick={handleConfirm} disabled={!summary || generating}>
              <CheckCircle2 className="size-4" />
              기록 확정
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}