"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useMounted } from "@/hooks/useMounted";
import { contractsOf, CUSTOMERS } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { cn, formatDate, inputClass } from "@/lib/utils";

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const mounted = useMounted();
  const records = useAppStore((s) => s.records);

  const list = useMemo(
    () => CUSTOMERS.filter((c) => c.name.includes(query.trim())),
    [query],
  );

  return (
    <div>
      <PageHeader title="담당 고객" description={`본인 담당 고객 ${CUSTOMERS.length}명만 조회돼요.`} />

      <div className="relative mb-4">
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
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((c) => {
            const activeCount = contractsOf(c.id).filter((k) => k.status !== "실효").length;
            const recordCount = mounted
              ? records.filter((r) => r.customerId === c.id && r.status === "confirmed").length
              : 0;
            return (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-brand-200 hover:shadow-sm sm:p-5"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink">{c.name}</p>
                      <span className="text-sm text-muted">
                        {c.age}세 · {c.gender}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-sub">
                      {c.interests.length ? c.interests.join(" · ") : "관심사 미확인"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="brand">계약 {activeCount}건</Badge>
                      <Badge>상담 기록 {recordCount}건</Badge>
                      <Badge>최근 상담 {formatDate(c.lastConsultedAt)}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
