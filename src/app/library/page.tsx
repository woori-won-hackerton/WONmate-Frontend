"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FileText, Search } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadError } from "@/components/ui/LoadError";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingBlock } from "@/components/ui/Skeleton";
import { useDocuments } from "@/lib/data";
import { openDocument } from "@/lib/documents";
import { DOCUMENT_TYPE_LABEL, PRODUCT_CATEGORIES, type IngestionStatus, type ProductCategory } from "@/lib/types";
import { cn, inputClass } from "@/lib/utils";

/** 적재가 끝나지 않은 문서만 상태 표시 */
const STATUS_META: Record<Exclude<IngestionStatus, "COMPLETED">, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "적재 대기", tone: "gray" },
  PROCESSING: { label: "적재 중", tone: "amber" },
  FAILED: { label: "적재 실패", tone: "red" },
};

type CategoryFilter = "전체" | ProductCategory;

const compact = (text: string) => text.replace(/\s+/g, "").toLowerCase();

export default function LibraryPage() {
  const { data, isLoading, error, reload } = useDocuments();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("전체");

  // 문서가 있는 대분류만 필터로
  const categories = useMemo<CategoryFilter[]>(
    () => ["전체", ...PRODUCT_CATEGORIES.filter((c) => data.some((d) => d.category === c))],
    [data],
  );

  const docs = useMemo(() => {
    const keyword = compact(query);
    return data.filter(
      (d) =>
        (category === "전체" || d.category === category) &&
        (!keyword || compact(`${d.title}${d.productName}`).includes(keyword)),
    );
  }, [data, query, category]);

  if (isLoading) return <LoadingBlock />;
  if (error) return <LoadError error={error} onRetry={reload} title="지식 자료실을 불러오지 못했어요" />;

  return (
    <div>
      <PageHeader title="지식 자료실" description="AI 챗봇이 참고하는 상품 약관·상품요약서예요." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-all active:scale-95",
                category === c ? "bg-brand-600 text-white shadow-float" : "bg-white text-sub shadow-card hover:text-brand-700",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="문서명 · 상품명 검색"
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState icon={FileText} title="아직 등록된 문서가 없어요" description="문서 적재가 끝나면 여기에 나타나요." />
      ) : docs.length === 0 ? (
        <EmptyState icon={Search} title="검색 결과가 없어요" description="문서명이나 상품명을 다시 확인해 주세요." />
      ) : (
        <Card className="p-2 sm:p-2">
          <ul className="divide-y divide-line">
            {docs.map((d) => {
              const status = d.status === "COMPLETED" ? null : STATUS_META[d.status];
              return (
                <li key={d.id} className="flex items-center gap-3 px-3 py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">{d.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone={d.documentType === "TERMS" ? "brand" : "sky"}>
                        {DOCUMENT_TYPE_LABEL[d.documentType]}
                      </Badge>
                      <Badge>{d.category}</Badge>
                      {status && <Badge tone={status.tone}>{status.label}</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openDocument(d.id)} className="shrink-0">
                    문서 보기
                    <ChevronRight className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}