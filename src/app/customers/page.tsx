"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { contractsOf, CUSTOMERS } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { cn, formatDate, inputClass, toLocalISODate } from "@/lib/utils";

export default function CustomersPage() {
  const mounted = useMounted();
  const records = useAppStore((s) => s.records);
  const schedule = useAppStore((s) => s.schedule);
  const [query, setQuery] = useState("");

  if (!mounted) return <LoadingBlock />;

  const today = toLocalISODate();
  const list = CUSTOMERS.filter((c) => c.name.includes(query.trim()));

  return (
    <div className="animate-rise">
      <PageHeader title="담당 고객" description={`본인 담당 고객 ${CUSTOMERS.length}명만 조회돼요.`} />

      <div className="relative mb-5 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="고객 이름으로 검색"
          className={cn(inputClass, "pl-10")}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Users} title="검색 결과가 없어요" description="이름을 다시 확인해 주세요." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((c) => {
            const activeCount = contractsOf(c.id).filter((k) => k.status !== "실효").length;
            const recordCount = records.filter((r) => r.customerId === c.id && r.status === "confirmed").length;
            const nextConsult = schedule
              .filter((i) => i.kind === "consult" && i.customerId === c.id && !i.done && i.date >= today)
              .sort((a, b) => a.date.localeCompare(b.date))[0];

            return (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="group block rounded-3xl border border-line/60 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-sky-accent text-lg font-bold text-white">
                      {c.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2">
                        <span className="text-[17px] font-bold text-ink">{c.name}</span>
                        <span className="text-sm text-muted">
                          {c.age}세 · {c.gender}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-sub">{c.job ?? "직업 미확인"}</p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </div>

                  <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
                    {nextConsult && <Badge tone="sky">다음 상담 {formatDate(nextConsult.date).slice(5)}</Badge>}
                    {c.interests.length ? (
                      c.interests.map((i) => (
                        <Badge key={i} tone="brand">
                          {i}
                        </Badge>
                      ))
                    ) : (
                      <Badge>관심사 미확인</Badge>
                    )}
                  </div>

                  <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface py-3 text-center">
                    <div>
                      <dt className="text-[11px] text-muted">보유 계약</dt>
                      <dd className="tabular mt-0.5 text-sm font-bold text-ink">{activeCount}건</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted">상담 기록</dt>
                      <dd className="tabular mt-0.5 text-sm font-bold text-ink">{recordCount}건</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted">최근 상담</dt>
                      <dd className="tabular mt-0.5 text-sm font-bold text-ink">
                        {c.lastConsultedAt ? formatDate(c.lastConsultedAt).slice(5) : "-"}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}