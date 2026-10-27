"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, FileText, Search } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useMounted } from "@/hooks/useMounted";
import { findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, RECORD_STATUS_LABEL, type RecordStatus } from "@/lib/types";
import { cn, formatDate, inputClass } from "@/lib/utils";

const STATUS_TONE: Record<RecordStatus, BadgeTone> = {
  memo: "gray",
  ai_draft: "sky",
  confirmed: "green",
};

type Tab = "open" | "confirmed";

export default function RecordsPage() {
  const mounted = useMounted();
  const records = useAppStore((s) => s.records);
  const [tab, setTab] = useState<Tab>("open");
  const [query, setQuery] = useState("");

  if (!mounted) return <LoadingBlock />;

  const open = records.filter((r) => r.status !== "confirmed");
  const confirmed = records.filter((r) => r.status === "confirmed");
  const list = (tab === "open" ? open : confirmed)
    .filter((r) => (findCustomer(r.customerId)?.name ?? "").includes(query.trim()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="animate-rise">
      <PageHeader
        title="AI 상담 요약"
        description="저장한 상담 메모를 AI 초안으로 정리하고, 확인 후 기록을 확정해요."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "open", label: `작성 중 ${open.length}` },
            { value: "confirmed", label: `이전 상담 ${confirmed.length}` },
          ]}
        />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="고객 이름 검색"
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === "open" ? "작성 중인 기록이 없어요" : "확정된 기록이 없어요"}
          description={tab === "open" ? "상담 준비에서 ‘상담 완료’를 누르면 여기로 넘어와요." : undefined}
        />
      ) : (
        <Card className="p-2 sm:p-2">
          <ul className="divide-y divide-line">
            {list.map((r) => {
              const customer = findCustomer(r.customerId);
              const preview = (r.summary?.needs || r.memo || "메모 없음").split("\n")[0].replace(/^•\s*/, "");
              const [, month, day] = r.date.split("-");
              return (
                <li key={r.id}>
                  <Link
                    href={`/records/${r.id}`}
                    className="group flex items-center gap-3.5 rounded-2xl p-3 transition hover:bg-gray-50"
                  >
                    <span
                      className={cn(
                        "tabular grid size-14 shrink-0 place-items-center rounded-2xl text-center leading-tight",
                        r.status === "confirmed" ? "bg-surface text-sub" : "bg-brand-50 text-brand-700",
                      )}
                    >
                      <span>
                        <span className="block text-[11px] font-semibold">{Number(month)}월</span>
                        <span className="block text-lg font-extrabold">{Number(day)}</span>
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="mr-1 font-bold text-ink">{customer?.name ?? "알 수 없음"} 고객</p>
                        <Badge tone="brand">{CONSULT_TYPE_LABEL[r.type]}</Badge>
                        <Badge tone={STATUS_TONE[r.status]}>{RECORD_STATUS_LABEL[r.status]}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-sub">{preview}</p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}