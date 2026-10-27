/**
 * AI 처리 계층
 * - AI 브리핑: POST /api/consults/{id}/briefing · 저장된 브리핑 GET /api/consults/{id}/briefing
 * - AI 상담 요약 초안: lib/data.ts 의 generateAiRecord (POST /api/consults/{id}/ai-record)
 * - AI 챗봇: POST /api/rag/ask
 * - 화면 컴포넌트는 이 파일의 함수 시그니처에만 의존
 */
import { backendApi, type BriefingDto } from "@/lib/backend";
import { ApiError } from "@/lib/http";
import type { Briefing, ChatRequest, ChatResponse, ConsultType } from "@/lib/types";

/** 예상 질문 — AI가 못 만들었을 때(예전 브리핑 등)만 쓰는 상담 종류별 기본값 */
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
 * 백엔드 브리핑 → 화면용 브리핑
 * - 요약 · 예상 질문: 백엔드 AI (고객 위키 + 완료된 이전 상담으로 작성)
 * - 상담 순서 · 주의 문구: 상담 종류별 고정값
 *   (백엔드가 주는 unconfirmedInformation · consultationTips 는 화면에서 뺐으므로 사용 안 함)
 */
function toBriefing(res: BriefingDto, type: ConsultType, generatedAt: string): Briefing {
  return {
    summary: res.summary,
    expectedQuestions: res.expectedQuestions?.length ? res.expectedQuestions : QUESTIONS_BY_TYPE[type],
    order: ORDER_BY_TYPE[type],
    cautions: FIXED_CAUTIONS,
    generatedAt,
    modelVersion: "WONmate AI",
  };
}

/** AI 브리핑 생성 — POST /api/consults/{id}/briefing */
export async function generateBriefing(scheduleId: string, type: ConsultType): Promise<Briefing> {
  const res = await backendApi.generateBriefing(scheduleId);
  return toBriefing(res, type, new Date().toISOString());
}

/** 마지막으로 만든 브리핑 — GET /api/consults/{id}/briefing (없으면 null) */
export async function loadSavedBriefing(scheduleId: string, type: ConsultType): Promise<Briefing | null> {
  try {
    const res = await backendApi.getSavedBriefing(scheduleId);
    return toBriefing(res, type, res.generatedAt ?? new Date().toISOString());
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* AI 챗봇 (RAG)                                                        */
/* ------------------------------------------------------------------ */

/** AI 챗봇 질문 — POST /api/rag/ask (약관 · 상품요약서에서 근거를 찾아 답변) */
export function askKnowledge(req: ChatRequest): Promise<ChatResponse> {
  return backendApi.ask(req);
}