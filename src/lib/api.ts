/**
 * AI 처리 계층
 * - AI 브리핑: POST /api/consults/{id}/briefing
 * - AI 상담 요약 초안: lib/data.ts 의 generateAiRecord (POST /api/consults/{id}/ai-record)
 * - AI 챗봇: BACKEND_READY.chat 이 true면 백엔드, 아니면 mock (백엔드 API 준비 중)
 * - 화면 컴포넌트는 이 파일의 함수 시그니처에만 의존
 */
import { backendApi } from "@/lib/backend";
import { BACKEND_READY } from "@/lib/config";
import { apiRequest } from "@/lib/http";
import { findDoc, GLOSSARY, GLOSSARY_DOC_ID, KNOWLEDGE_CHUNKS, PRODUCTS, type KnowledgeChunk } from "@/lib/mock";
import type { Briefing, ChatRequest, ChatResponse, ChatSource, ConsultType, DocType } from "@/lib/types";
import { sleep } from "@/lib/utils";

/** 예상 질문 — 백엔드가 아직 만들지 않아서 상담 종류별 고정값 */
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

const FIXED_CAUTIONS = [
  "전체 계약 확인 전에는 보장이 부족하다고 단정하지 않아요",
  "보험금 지급 여부는 개별 심사 사항이라 확정해서 말하지 않아요",
];

/**
 * AI 브리핑 생성
 * - 요약(summary): 백엔드 AI가 고객 위키 + 완료된 이전 상담(메모 · AI 기록)으로 작성
 * - 예상 질문 · 상담 순서 · 주의 문구: 상담 종류별 고정값
 *   (백엔드가 주는 unconfirmedInformation · consultationTips 는 화면에서 뺐으므로 사용 안 함)
 */
export async function generateBriefing(scheduleId: string, type: ConsultType): Promise<Briefing> {
  const res = await backendApi.generateBriefing(scheduleId);
  return {
    summary: res.summary,
    expectedQuestions: QUESTIONS_BY_TYPE[type],
    order: ORDER_BY_TYPE[type],
    cautions: FIXED_CAUTIONS,
    generatedAt: new Date().toISOString(),
    modelVersion: "WONmate AI",
  };
}

/* ------------------------------------------------------------------ */
/* 지식 챗봇 (RAG)                                                      */
/* ------------------------------------------------------------------ */

/** 챗봇 검색 문단 수 — 백엔드 요청 고정값 */
export const CHAT_TOP_K = 5;

/** TODO: 백엔드 경로 확정되면 수정 */
const CHAT_PATH = "/api/chat";

/**
 * AI 챗봇 질문
 * - BACKEND_READY.chat 이 true면 백엔드 호출, 아니면 mock
 * - 응답이 { isSuccess, result } 로 감싸져 와도, 그대로 와도 처리
 */
export async function askKnowledge(req: ChatRequest): Promise<ChatResponse> {
  if (BACKEND_READY.chat) {
    return apiRequest<ChatResponse>(CHAT_PATH, { method: "POST", body: req });
  }
  return mockAskKnowledge(req);
}

/* ---------------- 이하 mock (백엔드 연동 후 삭제) ---------------- */

const normalize = (text: string) => text.replace(/\s+/g, "").toLowerCase();

const DOC_TYPE_CODE: Record<DocType, string> = {
  약관: "TERMS",
  상품설명서: "SUMMARY",
  업무지침: "GUIDE",
};

/** 문서 id("d1") → 숫자 id (백엔드 형식 흉내) */
const numId = (id: string) => Number(id.replace(/\D/g, "")) || 0;

function toSource(docId: string, page: number, chunkId: number): ChatSource {
  const doc = findDoc(docId)!;
  const product = PRODUCTS.find((p) => p.id === doc.productId);
  return {
    productId: product?.apiId ?? null,
    documentId: numId(doc.id),
    documentName: `${doc.title} (${doc.version}).pdf`,
    documentType: DOC_TYPE_CODE[doc.docType],
    chunkId,
    sectionTitle: null,
    startPage: page,
    endPage: page,
  };
}

const NOT_FOUND: ChatResponse = {
  answer: "승인된 문서에서 이 질문의 근거를 찾지 못했어요. 질문을 조금 더 구체적으로 입력해 주세요.",
  sources: [],
};

async function mockAskKnowledge(req: ChatRequest): Promise<ChatResponse> {
  await sleep(2200);
  const q = normalize(req.question);

  // 용어 · 개념 설명 — 해설집 검색
  if (req.questionType !== "PRODUCT_EXPLANATION") {
    const kind = req.questionType === "TERM_EXPLANATION" ? "term" : "concept";
    const hit = GLOSSARY.filter((g) => g.kind === kind)
      .map((g) => ({ g, score: g.keywords.filter((k) => q.includes(normalize(k))).length }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)[0];
    if (!hit) return NOT_FOUND;

    const { g } = hit;
    return {
      answer: `${g.title}\n\n${g.body}${g.caution ? `\n\n참고: ${g.caution}` : ""}`,
      sources: [toSource(GLOSSARY_DOC_ID, g.page, numId(g.id))],
    };
  }

  // 상품 설명 — 선택한 상품의 게시 문서 + 공통 문서 검색
  const product = PRODUCTS.find((p) => p.apiId === req.productId);
  if (!product) return NOT_FOUND;

  const hits: KnowledgeChunk[] = KNOWLEDGE_CHUNKS.filter((chunk) => {
    const doc = findDoc(chunk.docId);
    return doc && doc.status === "게시" && (doc.productId === product.id || doc.productId === "common");
  })
    .map((chunk) => ({ chunk, score: chunk.keywords.filter((k) => q.includes(normalize(k))).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, req.topK)
    .map((s) => s.chunk);

  if (!hits.length) return NOT_FOUND;

  const asksPayout = /나오나요|나와요|지급되나요|받을수있나요|보장되나요/.test(q);
  const body = hits
    .map((h) => [h.text, h.condition && `조건: ${h.condition}`, h.caution && `참고: ${h.caution}`].filter(Boolean).join("\n"))
    .join("\n\n");

  return {
    answer: asksPayout
      ? `개별 보험금 지급 여부는 진단서와 약관 조건에 따른 심사 사항이라 확정할 수 없어요. 약관상 확인할 조건은 아래와 같아요.\n\n${body}`
      : body,
    sources: hits.map((h) => toSource(h.docId, h.page, numId(h.id))),
  };
}