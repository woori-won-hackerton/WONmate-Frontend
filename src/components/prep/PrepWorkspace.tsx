"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { ContractList } from "@/components/customers/ContractList";
import { AddConsultDialog } from "@/components/schedule/AddConsultDialog";
import { AI_STEPS, AiProgress } from "@/components/ui/AiProgress";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadError } from "@/components/ui/LoadError";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { generateBriefing } from "@/lib/api";
import {
  appendCustomerWiki,
  saveConsultMemo,
  useConsult,
  useConsultActions,
  useConsultMemo,
  useContracts,
  useCustomer,
  useCustomerLookup,
  useCustomerWiki,
  useSavedBriefing,
  useUpcomingConsults,
} from "@/lib/data";
import { confirmDialog, toast } from "@/lib/feedback";
import { composeMemo, useAppStore } from "@/lib/store";
import { ACTIVE_CONTRACT_STATUSES, CONSULT_TYPE_LABEL, type ExpectedQA, type PrepDraft } from "@/lib/types";
import { formatDate, inputClass, toLocalISODate } from "@/lib/utils";
import { MemoPanel } from "./MemoPanel";
import { BriefingCard, ExpectedQuestions, RequiredChecks } from "./PrepSections";
import { REQUIRED_CHECKS } from "./tips";

const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export function PrepWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mounted = useMounted();

  const drafts = useAppStore((s) => s.prepDrafts);
  const savePrepDraft = useAppStore((s) => s.savePrepDraft);
  const { completeConsult } = useConsultActions();

  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memoDirty, setMemoDirty] = useState(false);

  const today = toLocalISODate();
  const paramScheduleId = searchParams.get("scheduleId");
  const paramCustomerId = searchParams.get("customerId");

  // 상담 일정: 최근~앞으로의 일정 + (범위 밖이면) 링크로 들어왔거나 고른 일정 한 건
  const upcoming = useUpcomingConsults();
  const customerOf = useCustomerLookup();
  const inRange = (id: string | null) => !!id && upcoming.data.some((i) => i.id === id);
  const wantedId = picked || paramScheduleId;
  const linked = useConsult(!upcoming.isLoading && wantedId && !inRange(wantedId) ? wantedId : null);
  const consults = linked.data && !inRange(linked.data.id) ? [...upcoming.data, linked.data] : upcoming.data;

  /** URL로 들어온 경우: scheduleId 우선, customerId만 있으면 그 고객의 가장 가까운 상담 */
  const fromParams = (() => {
    if (paramScheduleId && consults.some((i) => i.id === paramScheduleId)) return paramScheduleId;
    if (paramCustomerId) {
      const mine = consults.filter((i) => i.customerId === paramCustomerId && !i.done);
      return (mine.find((i) => i.date >= today) ?? mine[0])?.id ?? "";
    }
    return "";
  })();

  const scheduleId = picked ?? fromParams;
  const item = consults.find((i) => i.id === scheduleId);
  const { data: customer } = useCustomer(item?.customerId);
  const contractsQuery = useContracts(item?.customerId);
  const memoQuery = useConsultMemo(item?.id);
  const wikiQuery = useCustomerWiki(item?.customerId);
  // 이 브라우저에 브리핑이 없으면 서버에 저장된 마지막 브리핑을 불러옴 (새로고침 · 다른 기기)
  const hasLocalBriefing = !!(item && drafts[item.id]?.briefing);
  const savedBriefing = useSavedBriefing(
    item && !hasLocalBriefing ? item.id : undefined,
    item?.consultType ?? "review",
  );

  if (!mounted || upcoming.isLoading) return <LoadingBlock />;
  if (upcoming.error) {
    return <LoadError error={upcoming.error} onRetry={upcoming.reload} title="상담 일정을 불러오지 못했어요" />;
  }

  const type = item?.consultType ?? "review";
  const draft = item ? drafts[item.id] : undefined;
  /** 화면에 보여줄 브리핑: 이 브라우저에서 만든 것 → 없으면 서버에 저장된 마지막 브리핑 */
  const briefing = draft?.briefing ?? savedBriefing.data;
  const qa: ExpectedQA[] = draft?.briefing
    ? draft.qa
    : (savedBriefing.data?.expectedQuestions ?? []).map((q) => ({ question: q, answerMemo: "" }));
  const customerId = item?.customerId;
  const customerName = customer?.name ?? item?.customerName ?? "고객";

  const options = consults.filter((i) => !i.done || i.id === scheduleId);
  const paramCustomerName = paramCustomerId ? customerOf(paramCustomerId)?.name : undefined;

  /** 상담 메모: 이 브라우저에서 쓴 메모가 있으면 그걸, 없으면 서버에 저장된 메모 */
  const memo = draft?.memo || memoQuery.memo || "";
  const memoUpdatedAt = draft?.updatedAt || memoQuery.updatedAt;

  /** 상담 준비/상담 중 구분 없이 하나의 draft state로 관리 */
  const update = (patch: Partial<PrepDraft>) => {
    if (!item || !customerId) return;
    const base: PrepDraft = draft ?? {
      scheduleId: item.id,
      customerId,
      type,
      briefing: null,
      qa: [],
      memo,
      updatedAt: "",
    };
    savePrepDraft({ ...base, ...patch, updatedAt: new Date().toISOString() });
  };

  const handleGenerate = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const briefing = await generateBriefing(item.id, type);
      const prevMemos = new Map(qa.map((q) => [q.question, q.answerMemo]));
      update({
        type,
        briefing,
        qa: briefing.expectedQuestions.map((q) => ({ question: q, answerMemo: prevMemos.get(q) ?? "" })),
      });
    } catch (e) {
      toast.error(errorText(e, "브리핑을 만들지 못했어요. 잠시 후 다시 시도해 주세요."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnswer = (index: number, answerMemo: string) => {
    const next = qa.map((q, i) => (i === index ? { ...q, answerMemo } : q));
    update({ briefing, qa: next });
    toast.success("답변 메모를 저장했어요");
  };

  const handleSaveMemo = async (value: string) => {
    if (!item) return;
    try {
      await saveConsultMemo(item.id, value); // PATCH /api/consults/{id}/memo
      update({ memo: value });
      toast.success("상담 메모를 저장했어요");
    } catch (e) {
      toast.error(errorText(e, "상담 메모를 저장하지 못했어요"));
    }
  };

  const handleFinish = async () => {
    if (!item) return;
    const ok = await confirmDialog({
      title: "상담을 완료할까요?",
      description: memoDirty
        ? "저장하지 않은 메모나 위키에 추가하지 않은 내용이 있어요. 저장하지 않은 내용은 AI 상담 요약에 들어가지 않아요. 완료하면 되돌릴 수 없어요."
        : "저장한 상담 메모와 답변 메모가 AI 상담 요약으로 넘어가요. 완료하면 되돌릴 수 없어요.",
      confirmText: "상담 완료",
    });
    if (!ok) return;
    setFinishing(true);
    try {
      // 저장한 상담 메모 + 답변 메모를 최종 메모로 보내고 상담 완료 (POST /complete)
      await completeConsult(item, composeMemo(memo, draft));
      toast.success(`${customerName} 고객 상담을 완료했어요`);
      router.push(`/records/${item.id}`);
    } catch (e) {
      toast.error(errorText(e, "상담을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."));
      setFinishing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="상담 준비"
        description="상담 일정을 고르면 AI가 지난 기록을 바탕으로 브리핑을 만들어요."
      />

      {/* 상담 일정 선택 — 상담 종류·일시·고객은 드롭다운에 함께 표시 */}
      <Card className="mb-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-semibold text-sub">상담 일정</span>
            <select value={scheduleId} onChange={(e) => setPicked(e.target.value)} className={inputClass}>
              <option value="">상담 일정을 선택하세요</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {formatDate(o.date, true)} {o.time} · {customerOf(o.customerId)?.name ?? o.customerName ?? "고객 미지정"} ·{" "}
                  {o.consultType ? CONSULT_TYPE_LABEL[o.consultType] : "상담"}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setDialogOpen(true)}>
              <CalendarPlus className="size-4" />
              일정 추가
            </Button>
            <Button size="lg" onClick={handleGenerate} loading={loading} disabled={!item} className="flex-1">
              {!loading && <Sparkles className="size-4" />}
              {briefing ? "AI 브리핑 다시 만들기" : "AI 브리핑 생성"}
            </Button>
          </div>
        </div>
      </Card>

      {!item ? (
        <EmptyState
          icon={Sparkles}
          title={
            paramCustomerName && !paramScheduleId
              ? `${paramCustomerName} 고객의 예정된 상담 일정이 없어요`
              : "상담 일정을 선택해 주세요"
          }
          description="상담 종류는 일정을 추가할 때 정해요. 홈의 상담 일정에서 바로 들어올 수도 있어요."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <CalendarPlus className="size-4" />
              상담 일정 추가
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-6">
            <RequiredChecks items={REQUIRED_CHECKS} />

            {loading ? (
              <AiProgress steps={AI_STEPS.briefing} />
            ) : briefing ? (
              <BriefingCard briefing={briefing} />
            ) : (
              <Card className="border-dashed text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Sparkles className="size-6" />
                </div>
                <p className="font-bold text-ink">{customerName} 고객 브리핑을 만들어볼까요?</p>
                <p className="mt-1 text-sm text-muted">이전 상담 기록과 계약 정보를 바탕으로 요약해요.</p>
              </Card>
            )}

            <Card>
              <CardHeader icon={ShieldCheck} title="현재 유지 중인 계약" />
              <ContractList
                contracts={contractsQuery.data.filter((c) => ACTIVE_CONTRACT_STATUSES.includes(c.status))}
                loading={contractsQuery.isLoading}
                error={contractsQuery.error}
              />
            </Card>

            {briefing && !loading && (
              <ExpectedQuestions key={briefing.generatedAt} qa={qa} onSave={handleSaveAnswer} />
            )}
          </div>

          {/* 우측 고정: 메모(고객 위키 / 상담 메모) · 상담 완료 */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <MemoPanel
              // 서버 메모를 다 불러온 뒤 입력칸을 새로 채우기 위해 key에 포함
              key={`${item.id}-${memoQuery.ready}`}
              customerName={customerName}
              wiki={wikiQuery.data}
              wikiLoading={wikiQuery.isLoading}
              onWikiAppend={async (value) => {
                if (!customerId) return false;
                try {
                  await appendCustomerWiki(customerId, value);
                  toast.success("고객 위키에 추가했어요");
                  return true;
                } catch (e) {
                  toast.error(errorText(e, "고객 위키에 추가하지 못했어요"));
                  return false;
                }
              }}
              memo={memo}
              memoUpdatedAt={memoUpdatedAt || undefined}
              onMemoSave={handleSaveMemo}
              onDirtyChange={setMemoDirty}
            />

            <Button
              className="w-full"
              size="lg"
              onClick={handleFinish}
              loading={finishing}
              disabled={item.done}
            >
              {!finishing && <CheckCircle2 className="size-5" />}
              {item.done ? "완료된 상담이에요" : "상담 완료"}
            </Button>
          </aside>
        </div>
      )}

      {dialogOpen && (
        <AddConsultDialog
          defaultDate={today}
          defaultCustomerId={customerId ?? paramCustomerId ?? ""}
          onClose={() => setDialogOpen(false)}
          onAdded={(added) => setPicked(added.id)}
        />
      )}
    </div>
  );
}