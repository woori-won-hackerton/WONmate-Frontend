"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AddConsultDialog } from "@/components/schedule/AddConsultDialog";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL } from "@/lib/types";
import { cn, formatDate, relativeDayLabel, toLocalISODate } from "@/lib/utils";

function shiftDate(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return toLocalISODate(new Date(y, m - 1, d + days));
}

/** 홈: 날짜별 상담 일정 (◀ ▶ 이동) + 일정 추가 */
export function ConsultScheduleCard() {
  const schedule = useAppStore((s) => s.schedule);
  const toggle = useAppStore((s) => s.toggleScheduleItem);

  const today = toLocalISODate();
  const [date, setDate] = useState(today);
  const [dialogOpen, setDialogOpen] = useState(false);

  const items = schedule
    .filter((i) => i.kind === "consult" && i.date === date)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  const rel = relativeDayLabel(date);
  const title = ["오늘", "내일", "어제"].includes(rel) ? `${rel} 상담 일정` : "상담 일정";

  return (
    <Card>
      <CardHeader
        icon={CalendarDays}
        title={title}
        right={
          <Button size="sm" variant="secondary" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            일정 추가
          </Button>
        }
      />

      {/* 날짜 이동 */}
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-surface p-1.5">
        <button
          type="button"
          aria-label="이전 날"
          onClick={() => setDate(shiftDate(date, -1))}
          className="grid size-9 place-items-center rounded-xl text-sub transition hover:bg-white hover:text-ink active:scale-95"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="tabular text-[15px] font-bold text-ink">{formatDate(date, true)}</span>
          {date === today ? (
            <Badge tone="brand">오늘</Badge>
          ) : (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-brand-600 shadow-sm hover:bg-brand-50"
            >
              오늘로
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="다음 날"
          onClick={() => setDate(shiftDate(date, 1))}
          className="grid size-9 place-items-center rounded-xl text-sub transition hover:bg-white hover:text-ink active:scale-95"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted">이 날은 예정된 상담이 없어요.</p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-2 text-sm font-semibold text-brand-600 hover:underline"
          >
            상담 일정 추가하기
          </button>
        </div>
      ) : (
        <ul key={date} className="animate-rise space-y-2">
          {items.map((item) => {
            const customer = item.customerId ? findCustomer(item.customerId) : undefined;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl p-3 transition sm:flex-row sm:items-center",
                  item.done ? "bg-gray-50/70" : "hover:bg-gray-50",
                )}
              >
                <div className="flex items-center gap-3 sm:flex-1">
                  <div
                    className={cn(
                      "tabular grid h-12 w-16 shrink-0 place-items-center rounded-xl text-[15px] font-bold",
                      item.done ? "bg-gray-100 text-muted" : "bg-brand-50 text-brand-700",
                    )}
                  >
                    {item.done ? <Check className="size-5" strokeWidth={2.5} /> : item.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={customer ? `/customers/${customer.id}` : "/customers"}
                        className={cn(
                          "text-[15px] font-bold text-ink hover:text-brand-700",
                          item.done && "text-muted line-through",
                        )}
                      >
                        {customer?.name ?? item.title} 고객
                      </Link>
                      {item.consultType && <Badge tone="brand">{CONSULT_TYPE_LABEL[item.consultType]}</Badge>}
                      {item.done && <Badge tone="green">완료</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted">
                      {item.done ? `${item.time} · ` : ""}
                      {customer ? `${customer.age}세 · ${customer.job ?? "직업 미확인"}` : item.title}
                    </p>
                  </div>
                </div>
                {!item.done && customer && (
                  <div className="flex gap-2 pl-[76px] sm:shrink-0 sm:pl-0">
                    <Link href={`/prep?scheduleId=${item.id}`} className={buttonClass("primary", "sm")}>
                      상담 준비
                    </Link>
                    <button type="button" onClick={() => toggle(item.id)} className={buttonClass("outline", "sm")}>
                      완료
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {dialogOpen && (
        <AddConsultDialog
          defaultDate={date < today ? today : date}
          onClose={() => setDialogOpen(false)}
          onAdded={(id) => {
            const added = useAppStore.getState().schedule.find((i) => i.id === id);
            if (added) setDate(added.date);
          }}
        />
      )}
    </Card>
  );
}