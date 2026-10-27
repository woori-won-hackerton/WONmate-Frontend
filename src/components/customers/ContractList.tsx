import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Contract, ContractStatus } from "@/lib/types";
import { formatDate, formatWon } from "@/lib/utils";

const STATUS_TONE: Record<ContractStatus, BadgeTone> = {
  유지: "green",
  실효: "gray",
  해지: "gray",
  만기: "gray",
};

interface ContractListProps {
  contracts: Contract[];
  loading?: boolean;
  error?: Error | null;
}

export function ContractList({ contracts, loading = false, error = null }: ContractListProps) {
  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="py-6 text-center text-sm text-rose-600">{error.message}</p>;
  }

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
            <p className="mt-0.5 text-xs text-muted">가입 {formatDate(c.startDate)}</p>
          </div>
          <p className="text-sm font-bold text-ink sm:text-right">
            {c.monthlyPremium != null ? `월 ${formatWon(c.monthlyPremium)}` : <span className="font-medium text-muted">월납 아님</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}