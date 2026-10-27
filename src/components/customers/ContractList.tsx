import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Contract, ContractStatus } from "@/lib/types";
import { formatDate, formatWon } from "@/lib/utils";

const STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  유지: "green",
  "갱신 예정": "amber",
  실효: "gray",
};

export function ContractList({ contracts }: { contracts: Contract[] }) {
  if (!contracts.length) {
    return <p className="py-6 text-center text-sm text-muted">보유 계약이 없어요.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {contracts.map((c) => (
        <li key={c.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-ink">{c.productName}</p>
              <Badge>{c.category}</Badge>
              <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              가입 {formatDate(c.startDate)}
              {c.renewalDate ? ` · 갱신 ${formatDate(c.renewalDate)}` : ""}
            </p>
          </div>
          <p className="text-sm font-bold text-ink sm:text-right">월 {formatWon(c.monthlyPremium)}</p>
        </li>
      ))}
    </ul>
  );
}