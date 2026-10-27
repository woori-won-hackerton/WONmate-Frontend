"use client";

import Link from "next/link";
import { CalendarCheck2, CheckCircle2, ChevronRight, Clock3, ListTodo, Sparkles } from "lucide-react";
import { ConsultScheduleCard } from "@/components/home/ConsultScheduleCard";
import { TaskCard } from "@/components/home/TaskCard";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { useCurrentUser } from "@/lib/auth";
import { useConsultsOn, useCustomerLookup, useTodos } from "@/lib/data";
import { CONSULT_TYPE_LABEL } from "@/lib/types";
import { cn, formatDate, toLocalISODate } from "@/lib/utils";

export default function HomePage() {
  const mounted = useMounted();
  const user = useCurrentUser();
  const today = toLocalISODate();
  const { data: todays, isLoading } = useConsultsOn(today);
  const customerOf = useCustomerLookup();
  const { data: todos } = useTodos();

  if (!mounted || isLoading) return <LoadingBlock />;

  const done = todays.filter((i) => i.done).length;
  const remaining = todays.length - done;
  const pendingTodos = todos.filter((t) => !t.done).length;
  const next = todays.find((i) => !i.done);
  const nextCustomerName = next ? (customerOf(next.customerId)?.name ?? next.customerName) : undefined;
  const progress = todays.length ? Math.round((done / todays.length) * 100) : 0;

  const stats = [
    { label: "오늘 상담", value: todays.length, icon: CalendarCheck2, tone: "bg-brand-50 text-brand-600" },
    { label: "완료", value: done, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
    { label: "남은 상담", value: remaining, icon: Clock3, tone: "bg-amber-50 text-amber-600" },
    { label: "남은 할 일", value: pendingTodos, icon: ListTodo, tone: "bg-sky-50 text-sky-600" },
  ];

  return (
    <div className="animate-rise space-y-5 lg:space-y-6">
      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-brand-700 via-brand-600 to-sky-accent p-6 text-white shadow-float sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-32 size-56 rounded-full bg-white/5" />

        <p className="relative text-sm font-medium text-white/75">{formatDate(today, true)}</p>
        <h1 className="relative mt-1 text-[24px] font-extrabold leading-snug tracking-tight sm:text-[30px]">
          {user.name} FC님,
          <br className="sm:hidden" /> 오늘 상담 <span className="text-sky-200">{remaining}건</span> 남았어요
        </h1>

        {/* 오늘 진행률 */}
        <div className="relative mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20 sm:max-w-xs">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="tabular text-xs font-semibold text-white/85">
            {done}/{todays.length} 완료
          </span>
        </div>

        {next && nextCustomerName ? (
          <Link
            href={`/prep?scheduleId=${next.id}`}
            className="group relative mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/12 p-4 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="tabular grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-white text-[15px] font-bold text-brand-700">
                {next.time}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-white/70">다음 상담</p>
                <p className="mt-0.5 truncate font-bold">
                  {nextCustomerName} 고객 · {next.consultType ? CONSULT_TYPE_LABEL[next.consultType] : "상담"}
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
              <Sparkles className="size-4" />
              <span className="hidden sm:inline">상담 준비하기</span>
              <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <p className="relative mt-5 rounded-2xl bg-white/12 p-4 text-sm text-white/85">
            오늘 남은 상담이 없어요. 상담 기록을 정리해볼까요?
          </p>
        )}
      </section>

      {/* 통계 */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line/60 shadow-card lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 bg-white p-4 sm:p-5">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", tone)}>
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-[13px] text-sub">{label}</p>
              <p className="tabular text-[22px] font-extrabold leading-tight text-ink">
                {value}
                <span className="ml-0.5 text-sm font-semibold text-muted">건</span>
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:gap-6">
        {/* 상담 일정 (날짜 이동 · 일정 추가) */}
        <ConsultScheduleCard />

        {/* 할 일 */}
        <TaskCard />
      </div>
    </div>
  );
}