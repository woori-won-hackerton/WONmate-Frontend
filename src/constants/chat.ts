/**
 * AI 챗봇 추천 질문
 * - 용어 · 개념 설명: 질문 유형별
 * - 상품 설명: 상품 대분류별 (선택한 상품의 약관 · 상품요약서에서 답을 찾음)
 */
import type { ProductCategory, QuestionType } from "@/lib/types";

/** 챗봇 검색 문단 수 (백엔드 기본값 5, 1~20) */
export const CHAT_TOP_K = 5;

export const TYPE_SUGGESTIONS: Record<Exclude<QuestionType, "PRODUCT_EXPLANATION">, string[]> = {
  TERM_EXPLANATION: ["면책기간이 뭐예요?", "해지환급금이 뭐예요?", "고지의무가 뭐예요?"],
  INSURANCE_CONCEPT: [
    "갱신형과 비갱신형 차이가 뭐예요?",
    "종신보험과 정기보험은 어떻게 달라요?",
    "실손보험 여러 개 가입하면 다 받나요?",
  ],
};

export const PRODUCT_SUGGESTIONS: Record<ProductCategory, string[]> = {
  암보험: [
    "암 진단비는 가입 후 언제부터 보장돼요?",
    "가입 1년 안에 암 진단받으면 진단비가 나오나요?",
    "유사암은 얼마나 보장돼요?",
  ],
  종신보험: ["사망보험금은 얼마 나와요?", "보험료 납입면제 조건이 뭐예요?", "중간에 해지하면 낸 돈 돌려받나요?"],
  어린이보험: ["아이가 골절되면 보장되나요?", "만기는 언제까지 할 수 있어요?", "입원하면 하루에 얼마 나와요?"],
  기타: ["이 상품은 어떤 걸 보장해요?", "보험금을 못 받는 경우가 있나요?", "중간에 해지하면 낸 돈 돌려받나요?"],
};