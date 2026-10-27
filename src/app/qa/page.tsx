"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookA,
  Bot,
  FileText,
  GitCompareArrows,
  Lightbulb,
  Loader2,
  Package,
  SendHorizontal,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { ProductPicker } from "@/components/qa/ProductPicker";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { askKnowledge } from "@/lib/api";
import { toast } from "@/lib/feedback";
import { PRODUCTS, SUGGESTED_QUESTIONS, TYPE_SUGGESTIONS } from "@/lib/mock";
import { QUESTION_TYPE_LABEL, type ChatMessage, type QaAnswer, type QaStatus, type QuestionType } from "@/lib/types";
import { cn, inputClass, uid } from "@/lib/utils";

const TYPES: { value: QuestionType; icon: LucideIcon; hint: string }[] = [
  { value: "term", icon: BookA, hint: "보험 용어 뜻을 물어보세요" },
  { value: "concept", icon: Lightbulb, hint: "보험 구조·개념을 물어보세요" },
  { value: "product", icon: Package, hint: "선택한 상품의 약관 내용을 물어보세요" },
  { value: "compare", icon: GitCompareArrows, hint: "비교할 상품 이름을 함께 적어주세요" },
  { value: "recommend", icon: Sparkles, hint: "고객 나이·가족·걱정하는 보장을 적어주세요" },
];

const STATUS_META: Record<QaStatus, { tone: BadgeTone; label: string }> = {
  answered: { tone: "green", label: "근거 확인됨" },
  needs_review: { tone: "amber", label: "확정 불가 · 조건 확인 필요" },
  insufficient: { tone: "gray", label: "근거 부족 · 답변 보류" },
  reference: { tone: "sky", label: "참고용 · FC 판단 필요" },
};

function AnswerBubble({ answer }: { answer: QaAnswer }) {
  const meta = STATUS_META[answer.status];
  return (
    <div className="w-full max-w-[92%] rounded-3xl rounded-tl-lg border border-line/70 bg-white p-4 shadow-card sm:max-w-[80%] sm:p-5">
      <Badge tone={meta.tone}>{meta.label}</Badge>
      <p className="mt-2.5 text-[15px] leading-relaxed text-ink">{answer.answer}</p>

      {answer.table && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[420px] text-left text-[13px]">
            <thead className="bg-surface text-sub">
              <tr>
                {answer.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {answer.table.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell, i) => (
                    <td key={`${cell}-${i}`} className={cn("px-3 py-2.5 align-top", i === 0 ? "font-semibold text-sub" : "text-ink")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {answer.conditions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold text-sub">
            {answer.status === "reference" ? "권유 전 확인할 것" : "적용 조건"}
          </p>
          <ul className="space-y-1 text-sm text-ink">
            {answer.conditions.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
        </div>
      )}

      {answer.cautions.length > 0 && (
        <div className="mt-3 space-y-1 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
          {answer.cautions.map((c) => (
            <p key={c} className="flex gap-1.5">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {c}
            </p>
          ))}
        </div>
      )}

      {answer.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {answer.sources.map((s) => (
            <span
              key={`${s.docId}-${s.page}`}
              className="inline-flex items-center gap-1 rounded-xl bg-surface px-2.5 py-1.5 text-xs font-medium text-sub"
            >
              <FileText className="size-3.5" />
              {s.docTitle} · {s.version} · p.{s.page}
            </span>
          ))}
        </div>
      )}

      {(answer.status === "needs_review" || answer.status === "insufficient") && (
        <button
          type="button"
          onClick={() => toast.success("선배 FC에게 검토 요청을 보냈어요")}
          className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
        >
          선배 FC에게 검토 요청
        </button>
      )}
    </div>
  );
}

export default function KnowledgeChatPage() {
  const [qType, setQType] = useState<QuestionType>("term");
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const typeMeta = TYPES.find((t) => t.value === qType)!;
  const suggestions = qType === "product" ? (SUGGESTED_QUESTIONS[productId] ?? []) : TYPE_SUGGESTIONS[qType];

  useEffect(() => {
    // 대화가 있을 때만 맨 아래로 (빈 화면에서 안내 문구가 잘리지 않게)
    if (messages.length || loading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "user",
        text: question,
        qType,
        productName: qType === "product" ? product.name : undefined,
      },
    ]);
    setLoading(true);
    try {
      const answer = await askKnowledge(qType, question, productId);
      setMessages((m) => [...m, { id: uid("m"), role: "assistant", text: answer.answer, answer }]);
    } catch {
      toast.error("답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <PageHeader title="지식 챗봇" description="용어·개념부터 상품 설명·비교까지, 승인된 문서를 근거로 답해요." />

      {/* 질문 유형 */}
      <div className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TYPES.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setQType(value)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all active:scale-95",
              qType === value
                ? "bg-brand-600 text-white shadow-float"
                : "bg-white text-sub shadow-card hover:text-brand-700",
            )}
          >
            <Icon className="size-4" />
            {QUESTION_TYPE_LABEL[value]}
          </button>
        ))}
      </div>

      {/* 상품 설명일 때만 상품 선택 */}
      {qType === "product" && (
        <div className="mb-3 animate-rise">
          <ProductPicker productId={productId} onChange={setProductId} />
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col p-0 sm:p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand-50 to-brand-100 text-brand-600">
                <Bot className="size-7" />
              </div>
              <p className="font-bold text-ink">무엇이든 물어보세요</p>
              <p className="mt-1 text-sm text-muted">
                근거 문서가 없거나 심사가 필요한 질문은 확정해서 답하지 않아요.
              </p>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex flex-col items-end gap-1">
                {m.qType && (
                  <span className="text-[11px] font-semibold text-muted">
                    {QUESTION_TYPE_LABEL[m.qType]}
                    {m.productName ? ` · ${m.productName}` : ""}
                  </span>
                )}
                <p className="max-w-[85%] rounded-3xl rounded-tr-lg bg-brand-600 px-4 py-2.5 text-[15px] text-white sm:max-w-[70%]">
                  {m.text}
                </p>
              </div>
            ) : (
              m.answer && (
                <div key={m.id} className="flex">
                  <AnswerBubble answer={m.answer} />
                </div>
              )
            ),
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" />
              근거 문서를 찾는 중…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 추천 질문 + 입력 */}
        <div className="border-t border-line p-3 sm:p-4">
          <div className="scrollbar-none mb-2.5 flex gap-2 overflow-x-auto">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="shrink-0 rounded-full bg-surface px-3.5 py-2 text-[13px] text-sub transition hover:bg-brand-50 hover:text-brand-700"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={qType === "product" ? `${product.name}에 대해 질문하기` : typeMeta.hint}
              className={inputClass}
            />
            <Button type="submit" disabled={!input.trim()} loading={loading} aria-label="보내기" className="shrink-0 px-4">
              {!loading && <SendHorizontal className="size-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}