"use client";

/**
 * WONmate 백엔드(Spring) API — 응답 타입(Dto) + 프론트 타입으로 바꾸는 함수
 * 백엔드 응답 형식이 바뀌면 이 파일만 고치면 돼요.
 */
import { apiRequest } from "@/lib/http";
import type {
  Contract,
  ContractStatus,
  ConsultType,
  Customer,
  FcUser,
  RecordStatus,
  RecordSummary,
  ScheduleItem,
  Todo,
} from "@/lib/types";
import { CONSULT_TYPE_LABEL } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* 백엔드 응답 타입                                                       */
/* ------------------------------------------------------------------ */

export interface UserDto {
  fcId: number;
  loginId: string;
  email: string | null;
  fullName: string;
  joinedYear: number | null;
  branchName: string | null;
}

export interface CustomerDto {
  customerId: number;
  fullName: string;
  birthDate: string | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  occupation: string | null;
  isMarried: boolean | null;
  hasChildren: boolean | null;
  hasDisability: boolean | null;
  phoneNumber: string | null;
  residentialArea: string | null;
  /** 가장 최근 완료한 상담 날짜 */
  lastConsultedAt: string | null;
  completedConsultCount: number;
}

export interface CustomerPageDto {
  customers: CustomerDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ContractDto {
  productName: string;
  startDate: string;
  insuranceType: string | null;
  status: "active" | "lapsed" | "terminated" | "matured";
  monthlyPremium: number | null;
}

export type BackendConsultType = "NEW" | "CONTRACT_REVIEW" | "RENEWAL" | "CLAIM_GUIDANCE";

export type ConsultStatus = "draft" | "scheduled" | "completed" | "cancelled";

export type AiRecordStatus = "NONE" | "DRAFT" | "CONFIRMED";

export interface ConsultDto {
  consultId: number;
  customerId: number;
  customerName: string;
  customerAge: number | null;
  consultType: BackendConsultType;
  consultTypeName: string;
  consultDate: string;
  /** "13:30:00" */
  consultTime: string;
  status: ConsultStatus;
  aiRecordStatus: AiRecordStatus;
}

export interface ConsultMemoDto {
  consultationId: number;
  memo: string;
  memoUpdatedAt: string | null;
}

export interface BriefingDto {
  summary: string[];
  unconfirmedInformation: string[];
  consultationTips: string[];
  /** AI가 만든 예상 질문 (예전 브리핑에는 없을 수 있음) */
  expectedQuestions?: string[];
}

/** GET /api/consults/{id}/briefing — 저장된 브리핑 */
export interface SavedBriefingDto extends BriefingDto {
  generatedAt: string | null;
}

/** AI 상담 기록 (빈 항목은 "") */
export interface AiRecordDto {
  customerNeeds: string;
  explainedContent: string;
  customerQuestions: string;
  unresolvedIssues: string;
  nextActions: string;
}

export interface TodoDto {
  todoId: number;
  content: string;
  completed: boolean;
}

/** 고객 위키 — 아직 아무것도 안 적었으면 wikiId · content 가 null */
export interface CustomerWikiDto {
  wikiId: number | null;
  customerId: number;
  content: string | null;
}

/* ------------------------------------------------------------------ */
/* 값 변환                                                              */
/* ------------------------------------------------------------------ */

const TO_BACKEND_CONSULT: Record<ConsultType, BackendConsultType> = {
  new: "NEW",
  review: "CONTRACT_REVIEW",
  renewal: "RENEWAL",
  claim: "CLAIM_GUIDANCE",
};

const FROM_BACKEND_CONSULT: Record<BackendConsultType, ConsultType> = {
  NEW: "new",
  CONTRACT_REVIEW: "review",
  RENEWAL: "renewal",
  CLAIM_GUIDANCE: "claim",
};

const CONTRACT_STATUS: Record<ContractDto["status"], ContractStatus> = {
  active: "유지",
  lapsed: "실효",
  terminated: "해지",
  matured: "만기",
};

const RECORD_STATUS: Record<AiRecordStatus, RecordStatus> = {
  NONE: "memo",
  DRAFT: "ai_draft",
  CONFIRMED: "confirmed",
};

const GENDER: Record<NonNullable<CustomerDto["gender"]>, Customer["gender"]> = {
  male: "남",
  female: "여",
  other: "기타",
};

function familyText(dto: CustomerDto): string | null {
  const parts: string[] = [];
  if (dto.isMarried != null) parts.push(dto.isMarried ? "기혼" : "미혼");
  if (dto.hasChildren != null) parts.push(dto.hasChildren ? "자녀 있음" : "자녀 없음");
  return parts.length ? parts.join(" · ") : null;
}

export function toUser(dto: UserDto): FcUser {
  return {
    id: String(dto.fcId),
    name: dto.fullName,
    branch: dto.branchName ?? "소속 미등록",
    joinedYear: dto.joinedYear,
  };
}

export function toCustomer(dto: CustomerDto): Customer {
  return {
    id: String(dto.customerId),
    name: dto.fullName,
    age: dto.age,
    gender: dto.gender ? GENDER[dto.gender] : "기타",
    phone: dto.phoneNumber,
    job: dto.occupation,
    family: familyText(dto),
    region: dto.residentialArea,
    disability: dto.hasDisability == null ? null : dto.hasDisability ? "있음" : "없음",
    lastConsultedAt: dto.lastConsultedAt ?? null,
    completedConsultCount: dto.completedConsultCount ?? 0,
  };
}

export function toContract(dto: ContractDto, customerId: string, index: number): Contract {
  return {
    id: `${customerId}-${index}`,
    customerId,
    productName: dto.productName,
    category: dto.insuranceType ?? "기타",
    status: CONTRACT_STATUS[dto.status] ?? "유지",
    startDate: dto.startDate,
    monthlyPremium: dto.monthlyPremium == null ? null : Number(dto.monthlyPremium),
  };
}

export function toScheduleItem(dto: ConsultDto): ScheduleItem {
  const consultType = FROM_BACKEND_CONSULT[dto.consultType] ?? "review";
  return {
    id: String(dto.consultId),
    kind: "consult",
    title: `${dto.customerName} 고객 ${CONSULT_TYPE_LABEL[consultType]}`,
    date: dto.consultDate,
    time: dto.consultTime.slice(0, 5),
    customerId: String(dto.customerId),
    customerName: dto.customerName,
    consultType,
    done: dto.status === "completed",
    recordStatus: RECORD_STATUS[dto.aiRecordStatus] ?? "memo",
  };
}

export function toTodo(dto: TodoDto): Todo {
  return { id: String(dto.todoId), content: dto.content, done: dto.completed };
}

export function toAiRecordDto(summary: RecordSummary): AiRecordDto {
  return {
    customerNeeds: summary.needs,
    explainedContent: summary.explained,
    customerQuestions: summary.questions,
    unresolvedIssues: summary.unresolved,
    nextActions: summary.nextActions,
  };
}

export function toRecordSummary(dto: AiRecordDto): RecordSummary {
  return {
    needs: dto.customerNeeds,
    explained: dto.explainedContent,
    questions: dto.customerQuestions,
    unresolved: dto.unresolvedIssues,
    nextActions: dto.nextActions,
  };
}

/* ------------------------------------------------------------------ */
/* API 호출                                                             */
/* ------------------------------------------------------------------ */

export const backendApi = {
  /** POST /api/auth/login */
  login: (loginId: string, password: string) =>
    apiRequest<{ accessToken: string }>("/api/auth/login", {
      method: "POST",
      body: { loginId, password },
      auth: false,
    }),

  /** GET /api/users/me — 로그인 직후 내 정보 조회 (토큰을 직접 넘김) */
  getMe: async (token: string) => {
    const res = await fetch("/api/users/me", {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.result) throw new Error("사용자 정보를 불러오지 못했어요.");
    return json.result as UserDto;
  },

  /** GET /api/customers — 담당 고객 전체 (최대 100명) */
  getCustomers: async () => {
    const page = await apiRequest<CustomerPageDto>("/api/customers?page=0&size=100");
    return page.customers.map(toCustomer);
  },

  /** GET /api/customers/{id} */
  getCustomer: async (customerId: string) =>
    toCustomer(await apiRequest<CustomerDto>(`/api/customers/${customerId}`)),

  /** GET /api/contracts/{customerId} */
  getContracts: async (customerId: string) => {
    const list = await apiRequest<ContractDto[]>(`/api/contracts/${customerId}`);
    return list.map((dto, i) => toContract(dto, customerId, i));
  },

  /** GET /api/consults?date=YYYY-MM-DD */
  getConsultsOn: (date: string) => apiRequest<ConsultDto[]>(`/api/consults?date=${date}`),

  /** GET /api/consults?from=&to= — 기간 조회 (양 끝 포함, 최대 92일) */
  getConsultsBetween: (from: string, to: string) =>
    apiRequest<ConsultDto[]>(`/api/consults?from=${from}&to=${to}`),

  /** GET /api/consults/records — 완료된 상담 (최근 순, customerId 있으면 해당 고객만) */
  getCompletedConsults: (customerId?: string) =>
    apiRequest<ConsultDto[]>(`/api/consults/records${customerId ? `?customerId=${customerId}` : ""}`),

  /** GET /api/consults/{id} */
  getConsult: (consultId: string) => apiRequest<ConsultDto>(`/api/consults/${consultId}`),

  /** POST /api/consults */
  createConsult: (input: { customerId: string; consultType: ConsultType; date: string; time: string }) =>
    apiRequest<ConsultDto>("/api/consults", {
      method: "POST",
      body: {
        customerId: Number(input.customerId),
        consultType: TO_BACKEND_CONSULT[input.consultType],
        consultDate: input.date,
        consultTime: `${input.time}:00`,
      },
    }),

  /** POST /api/consults/{id}/briefing — AI 브리핑 생성 (응답이 공통 형식으로 안 감싸져 있음) */
  generateBriefing: (consultId: string) =>
    apiRequest<BriefingDto>(`/api/consults/${consultId}/briefing`, { method: "POST" }),

  /** GET /api/consults/{id}/briefing — 마지막으로 만든 브리핑 (없으면 404) */
  getSavedBriefing: (consultId: string) =>
    apiRequest<SavedBriefingDto>(`/api/consults/${consultId}/briefing`),

  /** GET /api/consults/{id}/memo */
  getMemo: (consultId: string) => apiRequest<ConsultMemoDto>(`/api/consults/${consultId}/memo`),

  /** PATCH /api/consults/{id}/memo */
  saveMemo: (consultId: string, memo: string) =>
    apiRequest<ConsultMemoDto>(`/api/consults/${consultId}/memo`, { method: "PATCH", body: { memo } }),

  /** POST /api/consults/{id}/complete — 최종 메모 저장 + 상담 완료 (되돌릴 수 없음) */
  completeConsult: (consultId: string, memo: string) =>
    apiRequest<null>(`/api/consults/${consultId}/complete`, { method: "POST", body: { memo } }),

  /** POST /api/consults/{id}/ai-record — 완료된 상담 메모로 AI 기록 초안 생성 (이미 있으면 기존 것 반환) */
  generateAiRecord: async (consultId: string) =>
    toRecordSummary(await apiRequest<AiRecordDto>(`/api/consults/${consultId}/ai-record`, { method: "POST" })),

  /** GET /api/consults/{id}/ai-record — 없으면 404 */
  getAiRecord: async (consultId: string) =>
    toRecordSummary(await apiRequest<AiRecordDto>(`/api/consults/${consultId}/ai-record`)),

  /** GET /api/todos — 내 할 일 전체 (등록 순) */
  getTodos: async () => (await apiRequest<TodoDto[]>("/api/todos")).map(toTodo),

  /** POST /api/todos */
  createTodo: async (content: string) =>
    toTodo(await apiRequest<TodoDto>("/api/todos", { method: "POST", body: { content } })),

  /** PATCH /api/todos/{id}/status */
  setTodoDone: async (todoId: string, completed: boolean) =>
    toTodo(await apiRequest<TodoDto>(`/api/todos/${todoId}/status`, { method: "PATCH", body: { completed } })),

  /** GET /api/customers/{id}/wiki — 위키 전체 내용 ("" = 아직 없음) */
  getWiki: async (customerId: string) =>
    (await apiRequest<CustomerWikiDto>(`/api/customers/${customerId}/wiki`)).content ?? "",

  /** POST /api/customers/{id}/wiki/entries — 기존 내용 뒤에 이어 붙이기 (수정 · 삭제 API는 없음) */
  appendWiki: async (customerId: string, content: string) =>
    (
      await apiRequest<CustomerWikiDto>(`/api/customers/${customerId}/wiki/entries`, {
        method: "POST",
        body: { content },
      })
    ).content ?? "",

  /** PATCH /api/consults/{id}/ai-record — FC가 고친 AI 기록 저장 (확정 후엔 409) */
  updateAiRecord: async (consultId: string, summary: RecordSummary) =>
    toRecordSummary(
      await apiRequest<AiRecordDto>(`/api/consults/${consultId}/ai-record`, {
        method: "PATCH",
        body: toAiRecordDto(summary),
      }),
    ),

  /** POST /api/consults/{id}/ai-record/confirm — AI 기록 확정 */
  confirmAiRecord: async (consultId: string) =>
    toRecordSummary(
      await apiRequest<AiRecordDto>(`/api/consults/${consultId}/ai-record/confirm`, { method: "POST" }),
    ),
};