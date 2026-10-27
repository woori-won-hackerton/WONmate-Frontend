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
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { generateBriefing } from "@/lib/api";
import { confirmDialog, toast } from "@/lib/feedback";
import { contractsOf, findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, type PrepDraft, type ScheduleItem } from "@/lib/types";
import { formatDate, inputClass, toLocalISODate } from "@/lib/utils";
import { MemoPanel } from "./MemoPanel";
import { BriefingCard, ExpectedQuestions, RequiredChecks } from "./PrepSections";
import { REQUIRED_CHECKS } from "./tips";

const byDateTime = (a: ScheduleItem, b: ScheduleItem) =>
  a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");

export function PrepWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mounted = useMounted();

  const records = useAppStore((s) => s.records);
  const schedule = useAppStore((s) => s.schedule);
  const drafts = useAppStore((s) => s.prepDrafts);
  const wiki = useAppStore((s) => s.wiki);
  const savePrepDraft = useAppStore((s) => s.savePrepDraft);
  const saveWiki = useAppStore((s) => s.saveWiki);
  const finishPrep = useAppStore((s) => s.finishPrep);

  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memoDirty, setMemoDirty] = useState(false);

  if (!mounted) return <LoadingBlock />;

  const today = toLocalISODate();
  const consults = schedule.filter((i) => i.kind === "consult").sort(byDateTime);
  const paramScheduleId = searchParams.get("scheduleId");
  const paramCustomerId = searchParams.get("customerId");

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
  const customer = item?.customerId ? findCustomer(item.customerId) : undefined;
  const type = item?.consultType ?? "review";
  const contracts = customer ? contractsOf(customer.id) : [];
  const draft = item ? drafts[item.id] : undefined;
  const wikiDoc = customer ? wiki[customer.id] : undefined;

  const options = consults.filter((i) => !i.done || i.id === scheduleId);
  const paramCustomer = paramCustomerId ? findCustomer(paramCustomerId) : undefined;

  /** 상담 준비/상담 중 구분 없이 하나의 draft state로 관리 */
  const update = (patch: Partial<PrepDraft>) => {
    if (!item || !customer) return;
    const base: PrepDraft = draft ?? {
      scheduleId: item.id,
      customerId: customer.id,
      type,
      briefing: null,
      qa: [],
      memo: "",
      updatedAt: "",
    };
    savePrepDraft({ ...base, ...patch, updatedAt: new Date().toISOString() });
  };

  const handleGenerate = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const history = records.filter((r) => r.customerId === customer.id);
      const briefing = await generateBriefing({ customer, contracts, history, type });
      const prevMemos = new Map((draft?.qa ?? []).map((q) => [q.question, q.answerMemo]));
      update({
        type,
        briefing,
        qa: briefing.expectedQuestions.map((q) => ({ question: q, answerMemo: prevMemos.get(q) ?? "" })),
      });
    } catch {
      toast.error("브리핑을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnswer = (index: number, answerMemo: string) => {
    const qa = (draft?.qa ?? []).map((q, i) => (i === index ? { ...q, answerMemo } : q));
    update({ qa });
    toast.success("답변 메모를 저장했어요");
  };

  const handleFinish = async () => {
    if (!item || !customer) return;
    const ok = await confirmDialog({
      title: "상담을 완료할까요?",
      description: memoDirty
        ? "저장하지 않은 메모가 있어요. 저장하지 않은 내용은 AI 상담 요약에 들어가지 않아요."
        : "저장한 상담 메모와 답변 메모가 AI 상담 요약으로 넘어가요.",
      confirmText: "상담 완료",
    });
    if (!ok) return;
    if (!draft) update({}); // 메모 없이 완료해도 기록은 만들어지게
    const id = finishPrep(item.id);
    if (id) {
      toast.success(`${customer.name} 고객 상담을 완료했어요`);
      router.push(`/records/${id}`);
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
              {options.map((o) => {
                const c = o.customerId ? findCustomer(o.customerId) : undefined;
                return (
                  <option key={o.id} value={o.id}>
                    {formatDate(o.date, true)} {o.time} · {c?.name ?? "고객 미지정"} ·{" "}
                    {o.consultType ? CONSULT_TYPE_LABEL[o.consultType] : "상담"}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setDialogOpen(true)}>
              <CalendarPlus className="size-4" />
              일정 추가
            </Button>
            <Button size="lg" onClick={handleGenerate} loading={loading} disabled={!customer} className="flex-1">
              {!loading && <Sparkles className="size-4" />}
              {draft?.briefing ? "AI 브리핑 다시 만들기" : "AI 브리핑 생성"}
            </Button>
          </div>
        </div>
      </Card>

      {!item || !customer ? (
        <EmptyState
          icon={Sparkles}
          title={
            paramCustomer && !paramScheduleId
              ? `${paramCustomer.name} 고객의 예정된 상담 일정이 없어요`
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
            ) : draft?.briefing ? (
              <BriefingCard briefing={draft.briefing} />
            ) : (
              <Card className="border-dashed text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Sparkles className="size-6" />
                </div>
                <p className="font-bold text-ink">{customer.name} 고객 브리핑을 만들어볼까요?</p>
                <p className="mt-1 text-sm text-muted">이전 상담 기록과 계약 정보를 바탕으로 요약해요.</p>
              </Card>
            )}

            <Card>
              <CardHeader icon={ShieldCheck} title="현재 유지 중인 계약" />
              <ContractList contracts={contracts} />
            </Card>

            {draft?.briefing && !loading && (
              <ExpectedQuestions key={draft.briefing.generatedAt} qa={draft.qa} onSave={handleSaveAnswer} />
            )}
          </div>

          {/* 우측 고정: 메모(고객 위키 / 상담 메모) · 상담 완료 */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <MemoPanel
              key={item.id}
              customerName={customer.name}
              wiki={wikiDoc?.content ?? ""}
              wikiUpdatedAt={wikiDoc?.updatedAt}
              onWikiSave={(value) => {
                saveWiki(customer.id, value);
                toast.success("고객 위키를 저장했어요");
              }}
              memo={draft?.memo ?? ""}
              memoUpdatedAt={draft?.updatedAt || undefined}
              onMemoSave={(value) => {
                update({ memo: value });
                toast.success("상담 메모를 저장했어요");
              }}
              onDirtyChange={setMemoDirty}
            />

            <Button className="w-full" size="lg" onClick={handleFinish}>
              <CheckCircle2 className="size-5" />
              상담 완료
            </Button>
          </aside>
        </div>
      )}

      {dialogOpen && (
        <AddConsultDialog
          defaultDate={today}
          defaultCustomerId={customer?.id ?? paramCustomerId ?? ""}
          onClose={() => setDialogOpen(false)}
          onAdded={(id) => setPicked(id)}
        />
      )}
    </div>
  );
}