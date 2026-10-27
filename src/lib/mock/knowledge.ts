import type { KnowledgeDoc, Product } from "@/lib/types";

/** 상품 Q&A 대상 상품 (대분류 → 소분류) */
export const PRODUCTS: Product[] = [
  { id: "p2", name: "평생 종신보험 (가상)", category: "종신보험" },
  { id: "p5", name: "우리가족 종신보험 (가상)", category: "종신보험" },
  { id: "p1", name: "든든 암보험 (가상)", category: "암보험" },
  { id: "p6", name: "3대질병 암보험 (가상)", category: "암보험" },
  { id: "p4", name: "우리아이 튼튼 어린이보험 (가상)", category: "어린이보험" },
];

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  { id: "d1", productId: "p1", title: "든든 암보험 약관", docType: "약관", version: "2026.04", effectiveFrom: "2026-04-01", status: "게시", pages: 86 },
  { id: "d2", productId: "p1", title: "든든 암보험 상품설명서", docType: "상품설명서", version: "2026.04", effectiveFrom: "2026-04-01", status: "게시", pages: 24 },
  { id: "d3", productId: "p1", title: "든든 암보험 약관", docType: "약관", version: "2025.04", effectiveFrom: "2025-04-01", status: "게시 중단", pages: 82 },
  { id: "d4", productId: "p2", title: "평생 종신보험 약관", docType: "약관", version: "2025.10", effectiveFrom: "2025-10-01", status: "게시", pages: 112 },
  { id: "d7", productId: "p5", title: "우리가족 종신보험 약관", docType: "약관", version: "2026.07", effectiveFrom: "2026-07-01", status: "게시", pages: 98 },
  { id: "d8", productId: "p6", title: "3대질병 암보험 약관", docType: "약관", version: "2026.01", effectiveFrom: "2026-01-01", status: "게시", pages: 74 },
  { id: "d9", productId: "p4", title: "우리아이 튼튼 어린이보험 약관", docType: "약관", version: "2026.03", effectiveFrom: "2026-03-01", status: "게시", pages: 92 },
  { id: "d6", productId: "common", title: "신입 FC 업무지침", docType: "업무지침", version: "v1.2", effectiveFrom: "2026-07-01", status: "게시", pages: 40 },
];

/** RAG 검색 대상 문단 (가상 내용). 백엔드 연동 시 벡터 검색으로 대체 */
export interface KnowledgeChunk {
  id: string;
  docId: string;
  page: number;
  keywords: string[];
  text: string;
  condition?: string;
  caution?: string;
}

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  // 든든 암보험
  {
    id: "ch1", docId: "d1", page: 12,
    keywords: ["진단비", "보장개시", "면책", "언제부터", "90일"],
    text: "암 진단비는 계약일부터 90일이 지난 날의 다음 날부터 보장이 시작됩니다.",
    condition: "보장 개시일 이전에 진단받은 경우는 지급 대상이 아님",
  },
  {
    id: "ch2", docId: "d1", page: 13,
    keywords: ["1년", "감액", "50%", "진단비"],
    text: "보장 개시일부터 1년 이내에 암으로 진단되면 진단비의 50%를 지급합니다.",
    condition: "보장 개시일부터 1년 이내 진단 시 50% 감액 지급",
  },
  {
    id: "ch3", docId: "d2", page: 4,
    keywords: ["갱신", "보험료", "오르", "인상"],
    text: "갱신형 특약은 갱신 시점의 나이와 위험률에 따라 보험료가 오를 수 있습니다.",
    caution: "갱신 후 보험료는 설계 시스템 조회 결과로만 안내",
  },
  {
    id: "ch4", docId: "d3", page: 11,
    keywords: ["진단비", "면책", "언제부터"],
    text: "(구버전) 암 진단비 면책기간 60일.",
  },
  // 평생 종신보험
  {
    id: "ch5", docId: "d4", page: 21,
    keywords: ["해지", "환급금", "돌려받", "해약"],
    text: "보험기간 중 해지하면 해지환급금이 이미 낸 보험료보다 적거나 없을 수 있습니다.",
    caution: "해지 권유 전 해지환급금 손실을 반드시 비교 안내",
  },
  {
    id: "ch6", docId: "d4", page: 9,
    keywords: ["납입면제", "면제", "장해"],
    text: "약관에서 정한 장해분류표상 50% 이상 장해 상태가 되면 이후 보험료 납입이 면제됩니다.",
  },
  // 우리가족 종신보험
  {
    id: "ch10", docId: "d7", page: 8,
    keywords: ["사망", "보험금", "얼마"],
    text: "피보험자가 사망하면 가입금액의 100%를 사망보험금으로 지급합니다. (가상 수치)",
    condition: "약관에서 정한 보험금을 지급하지 않는 사유에 해당하면 지급 대상이 아님",
  },
  {
    id: "ch11", docId: "d7", page: 5,
    keywords: ["납입기간", "언제까지", "몇년", "납입"],
    text: "보험료 납입기간은 10년·20년·30년 중에서 선택할 수 있습니다.",
    caution: "납입기간별 보험료는 설계 시스템 조회 결과로만 안내",
  },
  // 3대질병 암보험
  {
    id: "ch12", docId: "d8", page: 10,
    keywords: ["뇌", "심장", "3대", "보장", "뭐"],
    text: "암·뇌혈관질환·허혈성심장질환으로 진단되면 질병별로 진단비를 최초 1회 지급합니다.",
    condition: "질병별 최초 1회 지급",
  },
  {
    id: "ch13", docId: "d8", page: 14,
    keywords: ["유사암", "갑상선", "소액암"],
    text: "갑상선암 등 유사암으로 진단되면 일반암 진단비의 20%를 지급합니다. (가상 수치)",
    condition: "유사암 해당 여부는 약관 별표의 분류 기준을 따름",
  },
  // 우리아이 튼튼 어린이보험
  {
    id: "ch14", docId: "d9", page: 3,
    keywords: ["가입", "나이", "몇살", "태아", "임신"],
    text: "0세부터 15세까지 가입할 수 있고, 태아는 임신 22주 이내까지 가입할 수 있습니다. (가상 기준)",
  },
  {
    id: "ch15", docId: "d9", page: 6,
    keywords: ["만기", "언제까지", "30세", "100세"],
    text: "보험기간은 30세 만기와 100세 만기 중에서 선택합니다.",
    caution: "만기별 보험료 차이는 설계 시스템 조회 결과로만 안내",
  },
  {
    id: "ch16", docId: "d9", page: 18,
    keywords: ["골절", "깁스", "다치", "상해"],
    text: "상해로 골절 진단을 받으면 1회당 골절진단비를 지급합니다.",
    condition: "치아 파절은 제외",
  },
  // 공통 업무지침
  {
    id: "ch9", docId: "d6", page: 3,
    keywords: ["고지", "병력", "알려야", "숨기"],
    text: "청약 시 질문받은 병력은 사실대로 알려야 하며, 알리지 않으면 계약이 해지되거나 보험금이 지급되지 않을 수 있습니다.",
    caution: "고지 회피를 권유하는 표현 금지",
  },
];

export const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  p1: [
    "암 진단비는 가입 후 언제부터 보장돼요?",
    "갱신하면 보험료가 오르나요?",
    "가입 1년 안에 암 진단받으면 진단비가 나오나요?",
  ],
  p2: ["중간에 해지하면 낸 돈 돌려받나요?", "보험료 납입면제 조건이 뭐예요?"],
  p5: ["사망보험금은 얼마 나와요?", "보험료는 몇 년 동안 내요?"],
  p6: ["3대질병이 뭐뭐 보장돼요?", "갑상선암도 진단비가 나오나요?"],
  p4: ["몇 살까지 가입할 수 있어요?", "만기는 언제까지 할 수 있어요?", "아이가 골절되면 보장되나요?"],
};