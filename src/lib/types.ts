export type ConsultType = "new" | "review" | "renewal" | "claim";

export const CONSULT_TYPES: ConsultType[] = ["new", "review", "renewal", "claim"];

export const CONSULT_TYPE_LABEL: Record<ConsultType, string> = {
  new: "신규 상담",
  review: "계약 점검",
  renewal: "갱신 상담",
  claim: "보험금 청구 안내",
};

export interface HealthInfo {
  /** 민감정보 별도 동의 여부 */
  consented: boolean;
  /** 고객이 직접 제공한 내용만 기록 (AI가 추측해서 채우지 않음) */
  notes: string[];
}

export interface Customer {
  id: string;
  name: string;
  age: number;
  gender: "남" | "여";
  phone: string;
  job: string | null;
  family: string | null;
  region: string | null;
  /** 월 보험료 예산(만원). null = 확인되지 않음 */
  monthlyBudget: number | null;
  interests: string[];
  /** 타사 계약 확인 여부 */
  otherCompanyChecked: boolean;
  health: HealthInfo;
  lastConsultedAt: string | null;
  updatedAt: string;
  source: string;
  /** 장애 유무. 고객이 직접 밝힌 경우만 기록, null = 확인되지 않음 */
  disability: string | null;
}

/** 고객 위키: 상담과 상관없이 고객에 대해 계속 쌓아두는 메모 */
export interface WikiDoc {
  content: string;
  updatedAt: string;
}

export type ContractStatus = "유지" | "갱신 예정" | "실효";
export type ContractCategory = "종신" | "암" | "실손" | "연금" | "어린이";

export interface Contract {
  id: string;
  customerId: string;
  productName: string;
  category: ContractCategory;
  status: ContractStatus;
  startDate: string;
  monthlyPremium: number;
  renewalDate: string | null;
}

export interface Briefing {
  summary: string[];
  unknowns: string[];
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
  memo: "메모 저장",
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

export interface ConsultationRecord {
  id: string;
  /** 어떤 상담 일정에서 만들어진 기록인지 */
  scheduleId?: string;
  customerId: string;
  type: ConsultType;
  date: string;
  memo: string;
  summary: RecordSummary | null;
  status: RecordStatus;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface ScheduleItem {
  id: string;
  kind: "consult" | "task";
  title: string;
  date: string;
  time?: string;
  customerId?: string;
  consultType?: ConsultType;
  done: boolean;
}

/** 상품 대분류 (지식 챗봇 상품 선택용) */
export type ProductCategory = "종신보험" | "암보험" | "어린이보험";

export const PRODUCT_CATEGORIES: ProductCategory[] = ["종신보험", "암보험", "어린이보험"];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
}

export type DocType = "약관" | "상품설명서" | "업무지침";

export interface KnowledgeDoc {
  id: string;
  /** "common" = 상품 공통 문서 */
  productId: string;
  title: string;
  docType: DocType;
  version: string;
  effectiveFrom: string;
  status: "게시" | "게시 중단";
  pages: number;
}

export interface QaSource {
  docId: string;
  docTitle: string;
  version: string;
  page: number;
}

/** 지식 챗봇 질문 유형 */
export type QuestionType = "term" | "concept" | "product" | "compare" | "recommend";

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  term: "용어 설명",
  concept: "개념 설명",
  product: "상품 설명",
  compare: "상품 비교",
  recommend: "상품 추천",
};

/** answered = 근거 확인 / needs_review = 확정 불가 / insufficient = 근거 부족 / reference = 참고용(FC 판단 필요) */
export type QaStatus = "answered" | "needs_review" | "insufficient" | "reference";

export interface QaTable {
  headers: string[];
  rows: string[][];
}

export interface QaAnswer {
  status: QaStatus;
  answer: string;
  /** 상품 비교·추천 결과 표 */
  table?: QaTable;
  conditions: string[];
  cautions: string[];
  sources: QaSource[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  qType?: QuestionType;
  /** 상품 설명 질문일 때 선택한 상품명 */
  productName?: string;
  answer?: QaAnswer;
}

/** 로그인한 FC (계정은 시스템/DB에서 발급, 회원가입 없음) */
export interface FcUser {
  id: string;
  name: string;
  branch: string;
  tenureMonth: number;
}