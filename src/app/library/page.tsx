"use client";

import { useState } from "react";
import { ChevronRight, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { KNOWLEDGE_DOCS } from "@/lib/mock";
import type { KnowledgeDoc } from "@/lib/types";
import { toast } from "@/lib/feedback";
import { cn, inputClass } from "@/lib/utils";

export default function LibraryPage() {
  const [query, setQuery] = useState("");

  // 게시(승인)된 문서만 노출
  const docs = KNOWLEDGE_DOCS.filter(
    (d) => d.status === "게시" && d.title.replace(/\s+/g, "").includes(query.replace(/\s+/g, "")),
  );

  const openDoc = (doc: KnowledgeDoc) => {
    // 백엔드 연동 후: window.open(문서 파일 URL, "_blank")
    toast.info(`'${doc.title}' 문서는 백엔드 연동 후 열 수 있어요`);
  };

  return (
    <div>
      <PageHeader
        title="지식 자료실"
        description="AI 챗봇이 참고하는 약관·상품설명서·업무지침이에요."
      />

      <div className="relative mb-4 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="문서명 검색"
          className={cn(inputClass, "pl-10")}
        />
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={Search} title="검색 결과가 없어요" description="문서명을 다시 확인해 주세요." />
      ) : (
        <Card className="p-2 sm:p-2">
          <ul className="divide-y divide-line">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText className="size-5" />
                </span>
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{d.title}</p>
                <Button size="sm" variant="secondary" onClick={() => openDoc(d)} className="shrink-0">
                  문서 보기
                  <ChevronRight className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}