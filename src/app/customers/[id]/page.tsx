"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, FileText, IdCard, ShieldCheck, Sparkles, UserX } from "lucide-react";
import { ContractList } from "@/components/customers/ContractList";
import { CustomerWiki } from "@/components/customers/CustomerWiki";
import { AddConsultDialog } from "@/components/schedule/AddConsultDialog";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useMounted } from "@/hooks/useMounted";
import { contractsOf, findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, RECORD_STATUS_LABEL } from "@/lib/types";
import { formatDate, toLocalISODate } from "@/lib/utils";

function InfoTile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">
        {value ?? <Badge tone="amber">확인되지 않음</Badge>}
      </dd>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mounted = useMounted();
  const records = useAppStore((s) => s.records);
  const schedule = useAppStore((s) => s.schedule);
  const [dialogOpen, setDialogOpen] = useState(false);
  const customer = findCustomer(id);

  if (!customer) {
    return (
      <EmptyState
        icon={UserX}
        title="고객을 찾을 수 없어요"
        description="담당 고객이 아니거나 존재하지 않는 고객이에요."
        action={<Link href="/customers" className={buttonClass("secondary")}>목록으로</Link>}
      />
    );
  }

  if (!mounted) return <LoadingBlock />;

  const today = toLocalISODate();
  const contracts = contractsOf(customer.id);
  const history = records.filter((r) => r.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date));
  const nextConsult = schedule
    .filter((i) => i.kind === "consult" && i.customerId === customer.id && !i.done && i.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""))[0];

  return (
    <div className="animate-rise space-y-5 lg:space-y-6">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-sub hover:text-ink">
        <ChevronLeft className="size-4" />
        담당 고객
      </Link>

      {/* 프로필 */}
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-[22px] bg-linear-to-br from-brand-500 to-sky-accent text-2xl font-bold text-white shadow-float">
            {customer.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-baseline gap-2 text-2xl font-extrabold tracking-tight text-ink">
              {customer.name}
              <span className="text-base font-medium text-muted">
                {customer.age}세 · {customer.gender}
              </span>
            </h1>
            <p className="mt-1 text-sm text-sub">
              {nextConsult ? (
                <>
                  다음 상담{" "}
                  <b className="text-brand-700">
                    {formatDate(nextConsult.date, true)} {nextConsult.time}
                  </b>
                  {nextConsult.consultType && ` · ${CONSULT_TYPE_LABEL[nextConsult.consultType]}`}
                </>
              ) : (
                "예정된 상담이 없어요"
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              출처 {customer.source} · 최종 갱신 {formatDate(customer.updatedAt)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <CalendarPlus className="size-4" />
            일정 잡기
          </Button>
          <Link href={`/prep?customerId=${customer.id}`} className={buttonClass("primary")}>
            <Sparkles className="size-4" />
            상담 준비
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader icon={IdCard} title="기본 정보" />
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <InfoTile label="연락처" value={customer.phone} />
          <InfoTile label="직업" value={customer.job} />
          <InfoTile label="가족" value={customer.family} />
          <InfoTile label="거주 지역" value={customer.region} />
          <InfoTile label="장애 유무" value={customer.disability} />
        </dl>
      </Card>

      <CustomerWiki customerId={customer.id} />

      <Card>
        <CardHeader
          icon={ShieldCheck}
          title="보유 계약"
          right={<span className="text-sm text-muted">{contracts.length}건</span>}
        />
        <ContractList contracts={contracts} />
      </Card>

      <Card>
        <CardHeader icon={FileText} title="이전 상담 기록" />
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">아직 상담 기록이 없어요.</p>
        ) : (
          <ul className="-mx-2 space-y-1">
            {history.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/records/${r.id}`}
                  className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-gray-50"
                >
                  <span className="tabular grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-center leading-tight text-sub">
                    <span>
                      <span className="block text-[10px] font-semibold">{Number(r.date.slice(5, 7))}월</span>
                      <span className="block text-base font-extrabold">{Number(r.date.slice(8, 10))}</span>
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{CONSULT_TYPE_LABEL[r.type]}</Badge>
                      <Badge tone={r.status === "confirmed" ? "green" : "sky"}>{RECORD_STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink">
                      {(r.summary?.needs || r.memo || "메모 없음").split("\n")[0].replace(/^•\s*/, "")}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {dialogOpen && (
        <AddConsultDialog
          defaultDate={today}
          defaultCustomerId={customer.id}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}