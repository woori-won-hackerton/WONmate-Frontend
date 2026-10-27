"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, MessageCircle, SendHorizontal, TriangleAlert } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductPicker } from "@/components/qa/ProductPicker";
import { PageHeader } from "@/components/ui/PageHeader";
import { askProductQuestion } from "@/lib/api";
import { PRODUCTS, SUGGESTED_QUESTIONS } from "@/lib/mock";
import type { ChatMessage, QaAnswer, QaStatus } from "@/lib/types";
import { inputClass, uid } from "@/lib/utils";

const STATUS_META: Record<QaStatus, { tone: BadgeTone; label: string }> = {
  answered: { tone: "green", label: "근거 확인됨" },
  needs_review: { tone: "amber", label: "확정 불가 · 조건 확인 필요" },
  insufficient: { tone: "gray", label: "근거 부족 · 답변 보류" },
};

function AnswerBubble({ answer }: { answer: QaAnswer }) {
  const meta = STATUS_META[answer.status];
  return (
    <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-line bg-white p-4 sm:max-w-[80%]">
      <Badge tone={meta.tone}>{meta.label}</Badge>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{answer.answer}</p>

      {answer.conditions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold text-sub">적용 조건</p>
          <ul className="space-y-1 text-sm text-ink">
            {answer.conditions.map((c) => <li key={c}>· {c}</li>)}
          </ul>
        </div>
      )}

      {answer.cautions.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
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
              className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-sub"
            >
              <FileText className="size-3.5" />
              {s.docTitle} · {s.version} · p.{s.page}
            </span>
          ))}
        </div>
      )}

      {answer.status !== "answered" && (
        <button
          type="button"
          onClick={() => alert("FC교수에게 검토 요청을 남겼어요. (데모)")}
          className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
        >
          FC교수 검토 요청
        </button>
      )}
    </div>
  );
}

export default function QaPage() {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];

  useEffect(() => {
    // 대화가 있을 때만 맨 아래로 (빈 화면에서 안내 문구가 잘리지 않게)
    if (messages.length || loading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: uid("m"), role: "user", text: question }]);
    setLoading(true);
    try {
      const answer = await askProductQuestion(productId, question);
      setMessages((m) => [...m, { id: uid("m"), role: "assistant", text: answer.answer, answer }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col lg:h-[calc(100dvh-5rem)]">
      <PageHeader title="상품 Q&A" description="승인된 약관·상품설명서에서만 찾아서, 근거 페이지와 함께 답해요." />

      <div className="mb-3">
        <ProductPicker
          productId={productId}
          onChange={(id) => {
            if (id === productId) return;
            setProductId(id);
            setMessages([]);
          }}
        />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col p-0 sm:p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <MessageCircle className="size-6" />
              </div>
              <p className="font-semibold text-ink">{product.name}에 대해 물어보세요</p>
              <p className="mt-0.5 text-xs text-muted">{product.category}</p>
              <p className="mt-1 text-sm text-muted">
                개별 보험금 지급 여부처럼 심사가 필요한 질문은 확정해서 답하지 않아요.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(SUGGESTED_QUESTIONS[productId] ?? []).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-line bg-white px-3.5 py-2 text-sm text-sub hover:border-brand-200 hover:text-brand-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-2.5 text-[15px] text-white sm:max-w-[70%]">
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
              승인 문서에서 근거를 찾는 중…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-line p-3 sm:p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${product.name}에 대해 질문하기`}
            className={inputClass}
          />
          <Button type="submit" disabled={!input.trim()} loading={loading} aria-label="보내기" className="shrink-0">
            {!loading && <SendHorizontal className="size-4" />}
          </Button>
        </form>
      </Card>
    </div>
  );
}