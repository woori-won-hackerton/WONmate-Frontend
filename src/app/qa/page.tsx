"use client";

import { useEffect, useRef, useState } from "react";
import { BookA, Bot, FileText, Lightbulb, Package, SendHorizontal, type LucideIcon } from "lucide-react";
import { ProductPicker } from "@/components/qa/ProductPicker";
import { AI_STEPS, AiProgress } from "@/components/ui/AiProgress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { askKnowledge, CHAT_TOP_K } from "@/lib/api";
import { toast } from "@/lib/feedback";
import { PRODUCTS, SUGGESTED_QUESTIONS, TYPE_SUGGESTIONS } from "@/lib/mock";
import {
  QUESTION_TYPE_LABEL,
  QUESTION_TYPES,
  type ChatMessage,
  type ChatRequest,
  type ChatSource,
  type QuestionType,
} from "@/lib/types";
import { cn, inputClass, uid } from "@/lib/utils";

const TYPE_META: Record<QuestionType, { icon: LucideIcon; hint: string }> = {
  TERM_EXPLANATION: { icon: BookA, hint: "보험 용어 뜻을 물어보세요" },
  INSURANCE_CONCEPT: { icon: Lightbulb, hint: "보험 구조·개념을 물어보세요" },
  PRODUCT_EXPLANATION: { icon: Package, hint: "선택한 상품의 약관 내용을 물어보세요" },
};

/** 같은 문서·같은 페이지 범위는 한 번만 보여줌 */
function uniqueSources(sources: ChatSource[]) {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = `${s.documentId}-${s.startPage}-${s.endPage}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pageLabel(s: ChatSource) {
  if (s.startPage == null) return "";
  return s.endPage != null && s.endPage !== s.startPage ? `p.${s.startPage}–${s.endPage}` : `p.${s.startPage}`;
}

/** 답변 말풍선 — 본문 + 마지막에 근거 문서(파일명 · 페이지) */
function AnswerBubble({ text, sources }: { text: string; sources: ChatSource[] }) {
  const list = uniqueSources(sources);
  return (
    <div className="w-full max-w-[92%] rounded-3xl rounded-tl-lg border border-line/70 bg-white p-4 shadow-card sm:max-w-[80%] sm:p-5">
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{text}</p>

      {list.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-xs font-bold text-sub">참고 문서</p>
          <ul className="space-y-1.5">
            {list.map((s) => (
              <li
                key={`${s.documentId}-${s.chunkId}`}
                className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-sub"
              >
                <FileText className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                <span className="min-w-0 flex-1 break-all">{s.documentName}</span>
                {pageLabel(s) && <span className="tabular shrink-0 font-semibold text-ink">{pageLabel(s)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeChatPage() {
  const [questionType, setQuestionType] = useState<QuestionType>("TERM_EXPLANATION");
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isProduct = questionType === "PRODUCT_EXPLANATION";
  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const suggestions = isProduct ? (SUGGESTED_QUESTIONS[productId] ?? []) : TYPE_SUGGESTIONS[questionType];

  useEffect(() => {
    // 대화가 있을 때만 맨 아래로 (빈 화면에서 안내 문구가 잘리지 않게)
    if (messages.length || loading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    // 백엔드 request 형태 — productId는 상품 설명일 때만
    const request: ChatRequest = {
      questionType,
      ...(isProduct ? { productId: product.apiId } : {}),
      question,
      topK: CHAT_TOP_K,
    };

    setInput("");
    setMessages((m) => [
      ...m,
      {
        id: uid("m"),
        role: "user",
        text: question,
        questionType,
        productName: isProduct ? product.name : undefined,
      },
    ]);
    setLoading(true);
    try {
      const res = await askKnowledge(request);
      setMessages((m) => [...m, { id: uid("m"), role: "assistant", text: res.answer, sources: res.sources }]);
    } catch {
      toast.error("답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <PageHeader title="AI 챗봇" description="용어·개념부터 상품 설명까지, 승인된 문서를 근거로 답해요." />

      {/* 질문 유형 */}
      <div className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {QUESTION_TYPES.map((value) => {
          const Icon = TYPE_META[value].icon;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setQuestionType(value)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all active:scale-95",
                questionType === value
                  ? "bg-brand-600 text-white shadow-float"
                  : "bg-white text-sub shadow-card hover:text-brand-700",
              )}
            >
              <Icon className="size-4" />
              {QUESTION_TYPE_LABEL[value]}
            </button>
          );
        })}
      </div>

      {/* 상품 설명일 때만 상품 선택 */}
      {isProduct && (
        <div className="mb-3 animate-rise">
          <ProductPicker productId={productId} onChange={setProductId} />
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col p-0 sm:p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && !loading && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand-50 to-brand-100 text-brand-600">
                <Bot className="size-7" />
              </div>
              <p className="font-bold text-ink">무엇이든 물어보세요</p>
              <p className="mt-1 text-sm text-muted">승인된 약관·상품요약서·해설집에서 근거를 찾아 답해요.</p>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex flex-col items-end gap-1">
                {m.questionType && (
                  <span className="text-[11px] font-semibold text-muted">
                    {QUESTION_TYPE_LABEL[m.questionType]}
                    {m.productName ? ` · ${m.productName}` : ""}
                  </span>
                )}
                <p className="max-w-[85%] rounded-3xl rounded-tr-lg bg-brand-600 px-4 py-2.5 text-[15px] text-white sm:max-w-[70%]">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex">
                <AnswerBubble text={m.text} sources={m.sources ?? []} />
              </div>
            ),
          )}

          {/* AI · RAG 진행 표시 */}
          {loading && (
            <div className="flex">
              <AiProgress steps={AI_STEPS.chat} variant="compact" />
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
                disabled={loading}
                className="shrink-0 rounded-full bg-surface px-3.5 py-2 text-[13px] text-sub transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
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
              placeholder={isProduct ? `${product.name}에 대해 질문하기` : TYPE_META[questionType].hint}
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