/**
 * AI 처리 계층
 * - 지금은 프론트 단독 데모용 mock 구현
 * - 백엔드 준비 후 각 함수 안을 fetch(`${API_BASE}/...`)로 교체
 * - 화면 컴포넌트는 이 파일의 함수 시그니처에만 의존
 */
import { findDoc, KNOWLEDGE_CHUNKS } from "@/lib/mock";
import {
  CONSULT_TYPE_LABEL,
  type Briefing,
  type ConsultationRecord,
  type ConsultType,
  type Contract,
  type Customer,
  type QaAnswer,
  type RecordSummary,
} from "@/lib/types";
import { addDays, formatDate, formatWon, sleep } from "@/lib/utils";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const MODEL_VERSION = "mock-briefing-v0.1";

const QUESTIONS_BY_TYPE: Record<ConsultType, string[]> = {
  new: ["지금 꼭 필요한 보험이 뭐예요?", "보험료는 한 달에 얼마 정도가 적당해요?", "다른 보험이랑 겹치는 건 없나요?"],
  review: ["지금 보험료를 줄일 방법이 있을까요?", "제 보험으로 암 진단비는 얼마 나와요?", "해지하면 손해인가요?"],
  renewal: ["갱신하면 보험료가 얼마나 올라요?", "갱신 안 하면 어떻게 돼요?", "다른 상품으로 바꾸는 게 나을까요?"],
  claim: ["이 치료도 청구할 수 있나요?", "서류는 뭐가 필요해요?", "언제까지 청구해야 하나요?"],
};

const ORDER_BY_TYPE: Record<ConsultType, string[]> = {
  new: ["관계 형성", "고객 상황 파악", "예산·우선순위 확인", "다음 단계 안내"],
  review: ["고객 요구 재확인", "전체 계약 확인", "보장·보험료 검토", "다음 행동 합의"],
  renewal: ["갱신 내용 안내", "보험료 변동 설명", "유지·변경 선택지 비교", "고객 결정 존중"],
  claim: ["청구 내용 확인", "보장 조건 안내", "서류 안내", "접수 후 일정 안내"],
};

function firstLine(text: string) {
  return text.split("\n")[0].replace(/^•\s*/, "").trim();
}

interface BriefingInput {
  customer: Customer;
  contracts: Contract[];
  history: ConsultationRecord[];
  type: ConsultType;
}

/** PRE-02 고객 브리핑 카드 생성 */
export async function generateBriefing({ customer, contracts, history, type }: BriefingInput): Promise<Briefing> {
  await sleep(900);

  const active = contracts.filter((c) => c.status !== "실효");
  const last = history
    .filter((r) => r.status === "confirmed")
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const summary = [
    `${customer.age}세 ${customer.gender} · ${customer.job ?? "직업 확인되지 않음"}`,
    customer.family ? `가족: ${customer.family}` : "가족관계: 확인되지 않음",
    customer.interests.length
      ? `고객이 밝힌 관심사: ${customer.interests.join(", ")}`
      : "고객이 밝힌 관심사 없음",
    last
      ? `최근 상담(${formatDate(last.date)}, ${CONSULT_TYPE_LABEL[last.type]}): ${firstLine(last.summary?.needs || last.memo)}`
      : "이전 상담 기록 없음 — 첫 상담이에요",
    active.length
      ? `자사 연동 계약 ${active.length}건 확인 (월 합계 ${formatWon(active.reduce((sum, c) => sum + c.monthlyPremium, 0))})`
      : "자사 연동 계약 없음",
  ];
  active
    .filter((c) => c.renewalDate && c.renewalDate <= addDays(60))
    .forEach((c) => summary.push(`갱신 예정: ${c.productName} (${formatDate(c.renewalDate)})`));

  const unknowns: string[] = [];
  if (customer.monthlyBudget === null) unknowns.push("월 보험료 예산이 확인되지 않았어요");
  if (!customer.otherCompanyChecked) unknowns.push("타사 보험 가입 여부가 확인되지 않았어요");
  if (!customer.job) unknowns.push("직업 정보가 없어요");
  if (!customer.health.consented) unknowns.push("건강정보 제공 동의 전이에요 — 병력은 묻거나 추정하지 않아요");
  if (last?.summary?.unresolved) unknowns.push(`지난 상담 미해결: ${firstLine(last.summary.unresolved)}`);

  const cautions = [
    "전체 계약 확인 전에는 보장이 부족하다고 단정하지 않아요",
    "보험금 지급 여부는 개별 심사 사항이라 확정해서 말하지 않아요",
  ];
  if (customer.health.consented && customer.health.notes.length) {
    cautions.push("고객이 제공한 병력은 '고지 대상 여부 확인' 목적으로만 다뤄요");
  }

  return {
    summary,
    unknowns,
    expectedQuestions: QUESTIONS_BY_TYPE[type],
    order: ORDER_BY_TYPE[type],
    cautions,
    generatedAt: new Date().toISOString(),
    modelVersion: MODEL_VERSION,
  };
}

/** POST-02 상담 기록 초안 생성 — 메모에 없는 내용은 만들지 않음 */
export async function draftRecordSummary(memo: string): Promise<RecordSummary> {
  await sleep(800);

  const buckets: Record<keyof RecordSummary, string[]> = {
    needs: [], explained: [], questions: [], unresolved: [], nextActions: [],
  };

  memo
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line && !/^\[.*\]$/.test(line))
    .forEach((line) => {
      if (/^Q[:.]/.test(line) || /\?|문의|질문/.test(line)) buckets.questions.push(line.replace(/^Q[:.]\s*/, ""));
      else if (/확인 필요|미정|모름|보류/.test(line)) buckets.unresolved.push(line);
      else if (/다음|예정|까지|연락|발송|보내/.test(line)) buckets.nextActions.push(line);
      else if (/^A[:.]/.test(line) || /설명|안내/.test(line)) buckets.explained.push(line.replace(/^A[:.]\s*/, ""));
      else buckets.needs.push(line);
    });

  const format = (lines: string[]) => lines.map((l) => `• ${l}`).join("\n");

  return {
    needs: format(buckets.needs),
    explained: format(buckets.explained),
    questions: format(buckets.questions),
    unresolved: format(buckets.unresolved),
    nextActions: format(buckets.nextActions),
  };
}

/** QA-01 근거 기반 상품 Q&A — 승인(게시) 문서만 검색 */
export async function askProductQuestion(productId: string, question: string): Promise<QaAnswer> {
  await sleep(700);

  const normalized = question.replace(/\s+/g, "");
  const scored = KNOWLEDGE_CHUNKS
    .filter((chunk) => {
      const doc = findDoc(chunk.docId);
      return doc && doc.status === "게시" && (doc.productId === productId || doc.productId === "common");
    })
    .map((chunk) => ({ chunk, score: chunk.keywords.filter((k) => normalized.includes(k)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (!scored.length) {
    return {
      status: "insufficient",
      answer: "승인된 문서에서 이 질문을 뒷받침할 근거를 찾지 못했어요. 상품이나 질문을 더 구체적으로 입력하거나 FC교수에게 검토를 요청해 주세요.",
      conditions: [],
      cautions: [],
      sources: [],
    };
  }

  const sources = scored.map(({ chunk }) => {
    const doc = findDoc(chunk.docId)!;
    return { docId: doc.id, docTitle: doc.title, version: doc.version, page: chunk.page };
  });
  const cautions = scored.map((s) => s.chunk.caution).filter((c): c is string => Boolean(c));

  const asksPayout = /나오나요|나와요|지급되나요|받을 ?수 ?있나요|보장되나요/.test(question);
  if (asksPayout) {
    return {
      status: "needs_review",
      answer: "개별 보험금 지급 여부는 진단서와 약관 조건에 따른 심사 사항이라 확정해서 답할 수 없어요. 약관상 확인해야 할 조건을 정리했어요.",
      conditions: scored.map((s) => s.chunk.text),
      cautions: ["고객에게 '지급됩니다'처럼 단정적으로 안내하지 마세요", ...cautions],
      sources,
    };
  }

  return {
    status: "answered",
    answer: scored.map((s) => s.chunk.text).join(" "),
    conditions: scored.map((s) => s.chunk.condition).filter((c): c is string => Boolean(c)),
    cautions,
    sources,
  };
}