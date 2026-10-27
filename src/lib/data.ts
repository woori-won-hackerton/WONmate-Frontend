"use client";

/**
 * 화면에서 쓰는 서버 데이터 훅 (백엔드 API + SWR 캐시)
 * 같은 데이터를 여러 화면에서 써도 요청은 한 번만 가요.
 */
import { useCallback, useMemo } from "react";
import useSWR, { mutate, type SWRConfiguration } from "swr";
import { loadSavedBriefing } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { backendApi, toScheduleItem, type ConsultDto } from "@/lib/backend";
import { CONSULT_RANGE } from "@/lib/config";
import { ApiError } from "@/lib/http";
import { useAppStore } from "@/lib/store";
import type { Contract, ConsultType, Customer, RecordSummary, ScheduleItem, Todo } from "@/lib/types";
import { addDays } from "@/lib/utils";

const SWR_OPTIONS: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 10_000,
};

export interface Remote<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

const byDateTime = (a: ScheduleItem, b: ScheduleItem) =>
  a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");

/* ------------------------------------------------------------------ */
/* 고객                                                                 */
/* ------------------------------------------------------------------ */

/** 담당 고객 전체 */
export function useCustomers(): Remote<Customer[]> {
  const q = useSWR("customers", backendApi.getCustomers, SWR_OPTIONS);
  return { data: q.data ?? [], isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** 고객 id → 고객 (담당 고객 목록에서 찾음) */
export function useCustomerLookup() {
  const { data } = useCustomers();
  return useMemo(() => {
    const map = new Map(data.map((c) => [c.id, c]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [data]);
}

/** 고객 한 명 */
export function useCustomer(id?: string): Remote<Customer | undefined> {
  const q = useSWR(id ? ["customer", id] : null, ([, cid]) => backendApi.getCustomer(cid), SWR_OPTIONS);
  return { data: q.data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/* ------------------------------------------------------------------ */
/* 고객 위키 (추가만 가능 — 백엔드에 수정 · 삭제 API 없음)                   */
/* ------------------------------------------------------------------ */

/** GET /api/customers/{id}/wiki — 위키 전체 내용 ("" = 아직 없음) */
export function useCustomerWiki(customerId?: string): Remote<string> {
  const q = useSWR(customerId ? ["wiki", customerId] : null, ([, cid]) => backendApi.getWiki(cid), SWR_OPTIONS);
  return { data: q.data ?? "", isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** POST /api/customers/{id}/wiki/entries — 기존 위키 뒤에 내용 추가 */
export async function appendCustomerWiki(customerId: string, content: string) {
  const next = await backendApi.appendWiki(customerId, content);
  await mutate(["wiki", customerId], next, { revalidate: false });
  return next;
}

/* ------------------------------------------------------------------ */
/* 계약                                                                 */
/* ------------------------------------------------------------------ */

export function useContracts(customerId?: string): Remote<Contract[]> {
  const q = useSWR(customerId ? ["contracts", customerId] : null, ([, cid]) => backendApi.getContracts(cid), SWR_OPTIONS);
  return { data: q.data ?? [], isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/* ------------------------------------------------------------------ */
/* 상담 일정                                                             */
/* ------------------------------------------------------------------ */

const toItems = (list: ConsultDto[]) => list.map(toScheduleItem).sort(byDateTime);

/** 특정 날짜의 상담 일정 */
export function useConsultsOn(date: string): Remote<ScheduleItem[]> {
  const q = useSWR(["consults", date], ([, d]) => backendApi.getConsultsOn(d), SWR_OPTIONS);
  const data = useMemo(() => toItems(q.data ?? []), [q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/**
 * 최근 ~ 앞으로의 상담 일정 (상담 준비 드롭다운 · 고객별 다음 상담)
 * GET /api/consults?from=&to= 한 번으로 불러옴 (범위: CONSULT_RANGE)
 */
export function useUpcomingConsults(): Remote<ScheduleItem[]> {
  const from = addDays(-CONSULT_RANGE.pastDays);
  const to = addDays(CONSULT_RANGE.futureDays);
  const q = useSWR(["consults-range", from, to], ([, f, t]) => backendApi.getConsultsBetween(f, t), SWR_OPTIONS);
  const data = useMemo(() => toItems(q.data ?? []), [q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** 상담 일정 한 건 (범위 밖 일정 · AI 상담 요약 상세) */
export function useConsult(id?: string | null): Remote<ScheduleItem | undefined> {
  const q = useSWR(id ? ["consult", id] : null, ([, cid]) => backendApi.getConsult(cid), SWR_OPTIONS);
  const data = useMemo(() => (q.data ? toScheduleItem(q.data) : undefined), [q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/**
 * 완료된 상담 (최근 순) — AI 상담 요약 목록 · 고객별 이전 상담 기록
 * GET /api/consults/records (customerId 있으면 해당 고객만)
 */
export function useCompletedConsults(customerId?: string): Remote<ScheduleItem[]> {
  const q = useSWR(
    ["consult-records", customerId ?? "all"],
    () => backendApi.getCompletedConsults(customerId),
    SWR_OPTIONS,
  );
  const data = useMemo(() => (q.data ?? []).map(toScheduleItem), [q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** 상담 일정 · 완료 목록 캐시 새로고침 */
function refreshConsults() {
  return mutate((key) => Array.isArray(key) && String(key[0]).startsWith("consult"));
}

/** 고객 목록 · 상세 캐시 새로고침 (최근 상담 · 상담 수가 바뀌었을 때) */
function refreshCustomers() {
  return mutate((key) => key === "customers" || (Array.isArray(key) && key[0] === "customer"));
}

export interface NewConsultInput {
  customerId: string;
  consultType: ConsultType;
  date: string;
  time: string;
}

/** 상담 일정 추가 · 상담 완료 */
export function useConsultActions() {
  const clearPrepDraft = useAppStore((s) => s.clearPrepDraft);

  /** POST /api/consults */
  const addConsult = useCallback(async (input: NewConsultInput): Promise<ScheduleItem> => {
    const dto = await backendApi.createConsult(input);
    await refreshConsults();
    return toScheduleItem(dto);
  }, []);

  /**
   * POST /api/consults/{id}/complete — 최종 메모를 저장하고 상담을 완료 (되돌릴 수 없음)
   * 완료되면 AI 상담 요약 목록(/records)에 서버 기준으로 나타나요
   */
  const completeConsult = useCallback(
    async (item: ScheduleItem, memo: string): Promise<void> => {
      await backendApi.completeConsult(item.id, memo);
      void mutate(["memo", item.id], { consultationId: Number(item.id), memo, memoUpdatedAt: null }, { revalidate: false });
      clearPrepDraft(item.id);
      await Promise.all([refreshConsults(), refreshCustomers()]);
    },
    [clearPrepDraft],
  );

  return { addConsult, completeConsult };
}

/* ------------------------------------------------------------------ */
/* 할 일                                                                */
/* ------------------------------------------------------------------ */

const TODOS_KEY = "todos";

/** GET /api/todos — 내 할 일 전체 (로그인 전에는 요청 안 함) */
export function useTodos(): Remote<Todo[]> {
  const loggedIn = useAuthStore((s) => !!s.token);
  const q = useSWR(loggedIn ? TODOS_KEY : null, backendApi.getTodos, SWR_OPTIONS);
  return { data: q.data ?? [], isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** 할 일 추가 · 체크 */
export function useTodoActions() {
  const markTodoDone = useAppStore((s) => s.markTodoDone);

  /** POST /api/todos */
  const addTodo = useCallback(async (content: string) => {
    const todo = await backendApi.createTodo(content);
    await mutate<Todo[]>(TODOS_KEY, (list = []) => [...list, todo], { revalidate: false });
    return todo;
  }, []);

  /** PATCH /api/todos/{id}/status — 화면은 먼저 바꾸고, 실패하면 되돌림 */
  const toggleTodo = useCallback(
    async (todo: Todo) => {
      const done = !todo.done;
      const apply = (value: boolean) =>
        mutate<Todo[]>(TODOS_KEY, (list = []) => list.map((t) => (t.id === todo.id ? { ...t, done: value } : t)), {
          revalidate: false,
        });
      await apply(done);
      markTodoDone(todo.id, done);
      try {
        await backendApi.setTodoDone(todo.id, done);
      } catch (e) {
        await apply(!done);
        markTodoDone(todo.id, !done);
        throw e;
      }
    },
    [markTodoDone],
  );

  return { addTodo, toggleTodo };
}

/* ------------------------------------------------------------------ */
/* 상담 메모                                                             */
/* ------------------------------------------------------------------ */

/** 서버에 저장된 상담 메모 */
export function useConsultMemo(consultId?: string) {
  const q = useSWR(consultId ? ["memo", consultId] : null, ([, cid]) => backendApi.getMemo(cid), {
    ...SWR_OPTIONS,
    dedupingInterval: 0,
  });
  return {
    memo: q.data?.memo,
    updatedAt: q.data?.memoUpdatedAt ?? undefined,
    /** 불러오기가 끝났으면 true (실패 포함) */
    ready: !consultId || q.data !== undefined || q.error !== undefined,
    error: q.error ?? null,
  };
}

/** PATCH /api/consults/{id}/memo */
export async function saveConsultMemo(consultId: string, memo: string) {
  const saved = await backendApi.saveMemo(consultId, memo);
  await mutate(["memo", consultId], saved, { revalidate: false });
}

/* ------------------------------------------------------------------ */
/* AI 상담 기록                                                          */
/* ------------------------------------------------------------------ */

/** 이미 만들어진 AI 기록 (없으면 null) — 다른 기기에서 만든 초안도 불러오기 위함 */
export function useAiRecord(consultId?: string) {
  const q = useSWR(
    consultId ? ["ai-record", consultId] : null,
    async ([, cid]): Promise<RecordSummary | null> => {
      try {
        return await backendApi.getAiRecord(cid);
      } catch (e) {
        if (e instanceof ApiError && [404, 409].includes(e.status)) return null; // 아직 없음
        throw e;
      }
    },
    SWR_OPTIONS,
  );
  return { data: q.data ?? null, isLoading: q.isLoading };
}

/** PATCH /api/consults/{id}/ai-record — FC가 고친 AI 기록 저장 */
export async function saveAiRecord(consultId: string, summary: RecordSummary) {
  const saved = await backendApi.updateAiRecord(consultId, summary);
  await mutate(["ai-record", consultId], saved, { revalidate: false });
  return saved;
}

/** POST /api/consults/{id}/ai-record/confirm — 확정 (이후 수정 불가) */
export async function confirmAiRecord(consultId: string) {
  const confirmed = await backendApi.confirmAiRecord(consultId);
  await mutate(["ai-record", consultId], confirmed, { revalidate: false });
  await refreshConsults();
  return confirmed;
}

/** POST /api/consults/{id}/ai-record */
export async function generateAiRecord(consultId: string) {
  const summary = await backendApi.generateAiRecord(consultId);
  await mutate(["ai-record", consultId], summary, { revalidate: false });
  await refreshConsults();
  return summary;
}

/* ------------------------------------------------------------------ */
/* AI 브리핑                                                            */
/* ------------------------------------------------------------------ */

/** 마지막으로 만든 브리핑 (없으면 null) — 새로고침 · 다른 기기에서도 이어보기 */
export function useSavedBriefing(consultId?: string, type?: ConsultType) {
  const q = useSWR(
    consultId && type ? ["briefing", consultId, type] : null,
    ([, cid, t]) => loadSavedBriefing(cid, t as ConsultType),
    SWR_OPTIONS,
  );
  return { data: q.data ?? null, isLoading: q.isLoading };
}