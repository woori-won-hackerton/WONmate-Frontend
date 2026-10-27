"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, FileText, HeartPulse, IdCard, ShieldCheck, Sparkles, UserX } from "lucide-react";
import { ContractList } from "@/components/customers/ContractList";
import { CustomerWiki } from "@/components/customers/CustomerWiki";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { useMounted } from "@/hooks/useMounted";
import { contractsOf, findCustomer } from "@/lib/mock";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, RECORD_STATUS_LABEL } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">
        {value ?? <Badge tone="amber">확인되지 않음</Badge>}
      </dd>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mounted = useMounted();
  const records = useAppStore((s) => s.records);
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

  const contracts = contractsOf(customer.id);
  const history = mounted
    ? records.filter((r) => r.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-6">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-sub hover:text-ink">
        <ChevronLeft className="size-4" />
        담당 고객
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-700">
            {customer.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {customer.name}{" "}
              <span className="text-base font-medium text-muted">
                {customer.age}세 · {customer.gender}
              </span>
            </h1>
            <p className="text-sm text-muted">
              출처: {customer.source} · 최종 갱신 {formatDate(customer.updatedAt)}
            </p>
          </div>
        </div>
        <Link href={`/prep?customerId=${customer.id}`} className={buttonClass("primary", "lg")}>
          <Sparkles className="size-4" />
          상담 준비 시작
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader icon={IdCard} title="기본 정보" />
          <dl className="grid gap-x-8 sm:grid-cols-2">
            <InfoRow label="연락처" value={customer.phone} />
            <InfoRow label="직업" value={customer.job} />
            <InfoRow label="가족" value={customer.family} />
            <InfoRow label="거주 지역" value={customer.region} />
            <InfoRow
              label="월 보험료 예산"
              value={customer.monthlyBudget !== null ? `${customer.monthlyBudget}만원 이내` : null}
            />
            <InfoRow label="타사 계약" value={customer.otherCompanyChecked ? "확인 완료" : null} />
            <InfoRow label="장애 유무" value={customer.disability} />
          </dl>
          <div className="mt-5">
            <p className="mb-2 text-sm font-bold text-sub">고객이 밝힌 관심사</p>
            <div className="flex flex-wrap gap-1.5">
              {customer.interests.length ? (
                customer.interests.map((i) => <Badge key={i} tone="brand">{i}</Badge>)
              ) : (
                <Badge tone="amber">확인되지 않음</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={HeartPulse}
            title="건강 정보"
            right={
              <Badge tone={customer.health.consented ? "green" : "gray"}>
                {customer.health.consented ? "민감정보 동의" : "동의 전"}
              </Badge>
            }
          />
          {customer.health.consented ? (
            customer.health.notes.length ? (
              <ul className="space-y-2">
                {customer.health.notes.map((n) => (
                  <li key={n} className="rounded-xl bg-surface p-3 text-sm text-ink">{n}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">고객이 제공한 내용이 없어요.</p>
            )
          ) : (
            <p className="text-sm text-muted">
              건강정보 제공 동의 전이라 조회할 수 없어요. 병력은 묻거나 추정하지 않아요.
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            고객이 직접 제공한 내용만 표시하며, 고지의무 안내 목적으로만 사용해요.
          </p>
        </Card>
      </div>

      {mounted && <CustomerWiki customerId={customer.id} />}

      <Card>
        <CardHeader
          icon={ShieldCheck}
          title="보유 계약"
          right={<span className="text-sm text-muted">자사 연동 {contracts.length}건</span>}
        />
        {!customer.otherCompanyChecked && (
          <Notice tone="amber" className="mb-3">
            타사 계약은 아직 확인되지 않았어요. ‘보험 없음’이 아니라 ‘확인되지 않음’ 상태예요.
          </Notice>
        )}
        <ContractList contracts={contracts} />
      </Card>

      <Card>
        <CardHeader icon={FileText} title="이전 상담 기록" />
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">아직 상담 기록이 없어요.</p>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/records/${r.id}`}
                  className="flex flex-col gap-1 py-3.5 hover:text-brand-700 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="w-24 shrink-0 text-sm font-semibold text-sub">{formatDate(r.date)}</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="brand">{CONSULT_TYPE_LABEL[r.type]}</Badge>
                    <Badge tone={r.status === "confirmed" ? "green" : "sky"}>{RECORD_STATUS_LABEL[r.status]}</Badge>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {(r.summary?.needs || r.memo).split("\n")[0].replace(/^•\s*/, "")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}