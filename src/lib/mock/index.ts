/**
 * 백엔드 API가 아직 없는 기능의 가상 데이터만 남김
 * - knowledge.ts : AI 챗봇 상품 · 지식 자료실 문서 · 챗봇 검색 문단
 * - glossary.ts  : AI 챗봇 용어 · 개념 해설
 * (고객 · 계약 · 상담 일정 · 로그인 · 상담 요약은 백엔드에서 가져옴)
 */
import { KNOWLEDGE_DOCS } from "./knowledge";

export * from "./glossary";
export * from "./knowledge";

export function findDoc(id: string) {
  return KNOWLEDGE_DOCS.find((d) => d.id === id);
}