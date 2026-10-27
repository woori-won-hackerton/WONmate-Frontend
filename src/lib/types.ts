export type ConsultType = "new" | "review" | "renewal" | "claim";

export const CONSULT_TYPES: ConsultType[] = ["new", "review", "renewal", "claim"];

export const CONSULT_TYPE_LABEL: Record<ConsultType, string> = {
  new: "신규 상담",
  review: "계약 점검",
  renewal: "갱신 상담",
  claim: "보험금 청구 안내",
};

export interface Customer {
  id: string;
  name: string;
  /** 만 나이. 생년월일이 없으면 null */
  age: number | null;
  gender: "남" | "여" | "기타";
  phone: string | null;
  job: string | null;
  family: string | null;
  region: string | null;
  /** 장애 유무. null = 확인되지 않음 */
  disability: string | null;
  /** 가장 최근 완료한 상담 날짜 (YYYY-MM-DD). 없으면 null */
  lastConsultedAt: string | null;
  /** 완료한 상담 수 */
  completedConsultCount: number;
}

/** 홈 '해야 할 일' (백엔드 /api/todos) */
export interface Todo {
  id: string;
  content: string;
  done: boolean;
}

export type ContractStatus = "유지" | "실효" | "해지" | "만기";

/** 지금 보장이 유지되는 계약 상태 */
export const ACTIVE_CONTRACT_STATUSES: ContractStatus[] = ["유지"];

export interface Contract {
  id: string;
  customerId: string;
  productName: string;
  /** 보험 종류 (예: 암, 종신, 건강) */
  category: string;
  status: ContractStatus;
  startDate: string;
  /** 월납 보험료. 월납이 아니면 null */
  monthlyPremium: number | null;
}

export interface Briefing {
  summary: string[];
  expectedQuestions: string[];
  order: string[];
  cautions: string[];
  generatedAt: string;
  modelVersion: string;
}

export interface ExpectedQA {
  question: string;
  answerMemo: string;
}

/** 상담 준비 draft — 상담 일정(scheduleId) 단위로 저장 */
export interface PrepDraft {
  scheduleId: string;
  customerId: string;
  type: ConsultType;
  briefing: Briefing | null;
  qa: ExpectedQA[];
  memo: string;
  updatedAt: string;
}

export type RecordStatus = "memo" | "ai_draft" | "confirmed";

export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  memo: "요약 전",
  ai_draft: "AI 초안",
  confirmed: "기록 확정",
};

export interface RecordSummary {
  needs: string;
  explained: string;
  questions: string;
  unresolved: string;
  nextActions: string;
}

export interface ScheduleItem {
  id: string;
  kind: "consult" | "task";
  title: string;
  date: string;
  time?: string;
  customerId?: string;
  /** 고객 이름 (백엔드 상담 일정 응답에 포함) */
  customerName?: string;
  consultType?: ConsultType;
  /** 상담 완료 여부 (백엔드 status === "completed") */
  done: boolean;
  /** AI 상담 요약 진행 상태 (완료된 상담만 의미 있음) */
  recordStatus?: RecordStatus;
}

/** 상품 대분류 (백엔드가 상품명으로 정함) */
export type ProductCategory = "종신보험" | "암보험" | "어린이보험" | "기타";

export const PRODUCT_CATEGORIES: ProductCategory[] = ["종신보험", "암보험", "어린이보험", "기타"];

/** AI 챗봇에서 고를 수 있는 상품 (백엔드 GET /api/products — 문서 적재가 끝난 상품만) */
export interface Product {
  /** 백엔드 상품 id (챗봇 request의 productId) */
  id: number;
  name: string;
  category: ProductCategory;
  documentCount: number;
}

/** 문서 종류 (백엔드 enum 그대로) */
export type DocumentType = "TERMS" | "SUMMARY";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  TERMS: "약관",
  SUMMARY: "상품요약서",
};

/** 문서 적재 상태 — COMPLETED만 챗봇이 검색해요 */
export type IngestionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

/** 지식 자료실 문서 (백엔드 GET /api/documents) */
export interface LibraryDocument {
  id: number;
  productId: number;
  productName: string;
  category: ProductCategory;
  /** 화면 표시용 이름 (예: 무배당…암보험 약관) */
  title: string;
  /** 원본 PDF 파일명 */
  fileName: string;
  documentType: DocumentType;
  status: IngestionStatus;
  chunkCount: number;
  updatedAt: string | null;
}

/* ------------------------------------------------------------------ */
/* 지식 챗봇 — 백엔드 API 계약 (request / response)                      */
/* ------------------------------------------------------------------ */

/** 질문 유형 (백엔드 enum 그대로) */
export type QuestionType = "TERM_EXPLANATION" | "INSURANCE_CONCEPT" | "PRODUCT_EXPLANATION";

export const QUESTION_TYPES: QuestionType[] = ["TERM_EXPLANATION", "INSURANCE_CONCEPT", "PRODUCT_EXPLANATION"];

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  TERM_EXPLANATION: "용어 설명",
  INSURANCE_CONCEPT: "개념 설명",
  PRODUCT_EXPLANATION: "상품 설명",
};

/** 챗봇 request — productId는 상품 설명일 때만 */
export interface ChatRequest {
  questionType: QuestionType;
  productId?: number;
  question: string;
  topK: number;
}

/** 챗봇 response의 근거 문서 */
export interface ChatSource {
  productId: number | null;
  productName: string | null;
  documentId: number;
  /** 화면 표시용 문서 이름 (예: 무배당…암보험 약관) */
  documentName: string;
  documentType: DocumentType;
  chunkId: number;
  sectionTitle: string | null;
  startPage: number | null;
  endPage: number | null;
}

/** 챗봇 response */
export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  questionType?: QuestionType;
  /** 상품 설명 질문일 때 선택한 상품명 */
  productName?: string;
  /** assistant 메시지일 때 근거 문서 */
  sources?: ChatSource[];
}

/** 로그인한 FC (계정은 시스템/DB에서 발급, 회원가입 없음) */
export interface FcUser {
  id: string;
  name: string;
  branch: string;
  /** 입사 연도 */
  joinedYear: number | null;
}