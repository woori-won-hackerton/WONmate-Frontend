"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarPlus, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { ContractList } from "@/components/customers/ContractList";
import { AddConsultDialog } from "@/components/schedule/AddConsultDialog";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { generateBriefing } from "@/lib/api";
import { contractsOf, findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, type PrepDraft, type ScheduleItem } from "@/lib/types";
import { formatDate, inputClass, toLocalISODate } from "@/lib/utils";
import { MemoPanel } from "./MemoPanel";
import { BriefingCard, ExpectedQuestions, RequiredChecks } from "./PrepSections";
import { REQUIRED_CHECKS, TIPS } from "./tips";

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
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (!item) return;
    const id = finishPrep(item.id);
    if (id) router.push(`/records/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="상담 준비"
        description="상담 일정을 고르면 AI가 지난 기록을 바탕으로 브리핑을 만들어요."
      />

      {/* 상담 일정 선택 — 상담 종류는 일정 추가할 때 정하고 여기서는 보여주기만 */}
      <Card className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <label className="block">
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
            {item && customer && (
              <p className="mt-2.5 text-sm text-sub">
                상담 종류 <span className="font-bold text-brand-700">{CONSULT_TYPE_LABEL[type]}</span>
                <span className="mx-2 text-line">|</span>
                {formatDate(item.date, true)} {item.time}
                <span className="mx-2 text-line">|</span>
                {customer.name} 고객 ({customer.age}세)
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setDialogOpen(true)}>
              <CalendarPlus className="size-4" />
              일정 추가
            </Button>
            <Button size="lg" onClick={handleGenerate} loading={loading} disabled={!customer} className="flex-1">
              {!loading && <Sparkles className="size-4" />}
              {draft?.briefing ? "브리핑 다시 만들기" : "브리핑 생성"}
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

            {draft?.briefing ? (
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
              {!customer.otherCompanyChecked && (
                <Notice tone="amber" className="mb-3">
                  타사 계약은 확인되지 않았어요. 상담 중에 직접 확인해 주세요.
                </Notice>
              )}
              <ContractList contracts={contracts} />
            </Card>

            {draft?.briefing && <ExpectedQuestions qa={draft.qa} onChange={(qa) => update({ qa })} />}
          </div>

          {/* 우측 고정: 메모(고객 위키 / 상담 메모) · 준비 완료 · 팁 */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <MemoPanel
              key={item.id}
              customerName={customer.name}
              wiki={wikiDoc?.content ?? ""}
              wikiUpdatedAt={wikiDoc?.updatedAt}
              onWikiChange={(value) => saveWiki(customer.id, value)}
              memo={draft?.memo ?? ""}
              memoUpdatedAt={draft?.updatedAt || undefined}
              onMemoChange={(value) => update({ memo: value })}
            />

            <Card className="p-4 sm:p-5">
              <p className="text-sm font-bold text-ink">
                {customer.name} 고객 · {CONSULT_TYPE_LABEL[type]}
              </p>
              <p className="mt-1 text-xs text-muted">준비를 마치면 상담 메모가 상담 기록으로 넘어가요.</p>
              <Button className="mt-3 w-full" size="lg" onClick={handleFinish} disabled={!draft}>
                준비 완료 · 상담 기록으로
                <ArrowRight className="size-4" />
              </Button>
            </Card>

            <Card className="border-brand-100 bg-brand-50/60 p-4 sm:p-5">
              <CardHeader icon={Lightbulb} title="곁의 상담 팁" />
              <ul className="space-y-3">
                {TIPS[type].map((tip) => (
                  <li key={tip} className="text-sm leading-relaxed text-ink">
                    · {tip}
                  </li>
                ))}
              </ul>
            </Card>
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