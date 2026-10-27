"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, type ScheduleItem } from "@/lib/types";
import { cn, formatDate, relativeDayLabel, toLocalISODate } from "@/lib/utils";

type Filter = "all" | "consult" | "task";

/** 홈 하단: 내일 이후 상담·할 일 (날짜별) */
export function UpcomingSchedule() {
  const schedule = useAppStore((s) => s.schedule);
  const toggle = useAppStore((s) => s.toggleScheduleItem);
  const [filter, setFilter] = useState<Filter>("all");

  const today = toLocalISODate();
  const items = schedule
    .filter((i) => i.date > today && (filter === "all" || i.kind === filter))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"));

  const groups = items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    (acc[item.date] ??= []).push(item);
    return acc;
  }, {});

  return (
    <Card id="upcoming" className="scroll-mt-20">
      <CardHeader icon={CalendarDays} title="다가오는 일정" />
      <div className="mb-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "전체" },
            { value: "consult", label: "상담" },
            { value: "task", label: "할 일" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">예정된 일정이 없어요.</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([day, list]) => (
            <section key={day}>
              <h3 className="mb-2 text-sm font-bold text-sub">
                {relativeDayLabel(day)} <span className="font-medium text-muted">{formatDate(day, true)}</span>
              </h3>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {list.map((item) => {
                  const customer = item.customerId ? findCustomer(item.customerId) : undefined;
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggle(item.id)}
                        aria-label="완료 처리"
                        className="size-4 shrink-0 accent-brand-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold text-ink", item.done && "text-muted line-through")}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.kind === "consult"
                            ? [item.time, item.consultType && CONSULT_TYPE_LABEL[item.consultType]]
                                .filter(Boolean)
                                .join(" · ")
                            : customer
                              ? `${customer.name} 고객`
                              : "고객 미지정"}
                        </p>
                      </div>
                      <Badge tone={item.kind === "consult" ? "brand" : "gray"}>
                        {item.kind === "consult" ? "상담" : "할 일"}
                      </Badge>
                      {item.kind === "consult" && !item.done && customer && (
                        <Link
                          href={`/prep?customerId=${customer.id}&type=${item.consultType ?? "review"}`}
                          className={cn(buttonClass("secondary", "sm"), "hidden sm:inline-flex")}
                        >
                          준비
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}