"use client";

/**
 * 화면에서 쓰는 서버 데이터 훅 (백엔드 API + SWR 캐시)
 * 같은 데이터를 여러 화면에서 써도 요청은 한 번만 가요.
 */
import { useCallback, useMemo } from "react";
import useSWR, { mutate, type SWRConfiguration } from "swr";
import { backendApi, toScheduleItem, type ConsultDto } from "@/lib/backend";
import { CONSULT_RANGE } from "@/lib/config";
import { ApiError } from "@/lib/http";
import { useAppStore } from "@/lib/store";
import type { Contract, ConsultType, Customer, RecordSummary, ScheduleItem } from "@/lib/types";
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
/* 계약                                                                 */
/* ------------------------------------------------------------------ */

export function useContracts(customerId?: string): Remote<Contract[]> {
  const q = useSWR(customerId ? ["contracts", customerId] : null, ([, cid]) => backendApi.getContracts(cid), SWR_OPTIONS);
  return { data: q.data ?? [], isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/* ------------------------------------------------------------------ */
/* 상담 일정                                                             */
/* ------------------------------------------------------------------ */

/** 백엔드 상담 일정 + 브라우저에 저장한 완료 표시를 합침 */
function useMergeDone() {
  const consultDone = useAppStore((s) => s.consultDone);
  return useCallback(
    (list: ConsultDto[]) => list.map((dto) => toScheduleItem(dto, !!consultDone[dto.consultId])).sort(byDateTime),
    [consultDone],
  );
}

/** 특정 날짜의 상담 일정 */
export function useConsultsOn(date: string): Remote<ScheduleItem[]> {
  const merge = useMergeDone();
  const q = useSWR(["consults", date], ([, d]) => backendApi.getConsultsOn(d), SWR_OPTIONS);
  const data = useMemo(() => merge(q.data ?? []), [merge, q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

function rangeDates() {
  const dates: string[] = [];
  for (let d = -CONSULT_RANGE.pastDays; d <= CONSULT_RANGE.futureDays; d++) dates.push(addDays(d));
  return dates;
}

/**
 * 최근 ~ 앞으로의 상담 일정 (상담 준비 드롭다운 · 고객별 다음 상담)
 * 기간 조회 API가 없어서 날짜별로 나눠 불러옴 (CONSULT_RANGE)
 */
export function useUpcomingConsults(): Remote<ScheduleItem[]> {
  const merge = useMergeDone();
  const from = addDays(-CONSULT_RANGE.pastDays);
  const q = useSWR(
    ["consults-range", from],
    async () => (await Promise.all(rangeDates().map((d) => backendApi.getConsultsOn(d)))).flat(),
    SWR_OPTIONS,
  );
  const data = useMemo(() => merge(q.data ?? []), [merge, q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** 상담 일정 한 건 (범위 밖 일정을 링크로 들어왔을 때) */
export function useConsult(id?: string | null): Remote<ScheduleItem | undefined> {
  const merge = useMergeDone();
  const q = useSWR(id ? ["consult", id] : null, ([, cid]) => backendApi.getConsult(cid), SWR_OPTIONS);
  const data = useMemo(() => (q.data ? merge([q.data])[0] : undefined), [merge, q.data]);
  return { data, isLoading: q.isLoading, error: q.error ?? null, reload: () => void q.mutate() };
}

/** 상담 일정 캐시 새로고침 */
function refreshConsults() {
  return mutate((key) => Array.isArray(key) && String(key[0]).startsWith("consult"));
}

export interface NewConsultInput {
  customerId: string;
  consultType: ConsultType;
  date: string;
  time: string;
}

/** 상담 일정 추가 · 상담 완료 */
export function useConsultActions() {
  const finishConsult = useAppStore((s) => s.finishConsult);

  /** POST /api/consults */
  const addConsult = useCallback(async (input: NewConsultInput): Promise<ScheduleItem> => {
    const dto = await backendApi.createConsult(input);
    await refreshConsults();
    return toScheduleItem(dto, false);
  }, []);

  /**
   * POST /api/consults/{id}/complete — 최종 메모를 저장하고 상담을 완료 (되돌릴 수 없음)
   * 성공하면 AI 상담 요약 목록에 추가하고, 만든 record id를 반환
   */
  const completeConsult = useCallback(
    async (item: ScheduleItem, memo: string): Promise<string> => {
      await backendApi.completeConsult(item.id, memo);
      void mutate(["memo", item.id], { consultationId: Number(item.id), memo, memoUpdatedAt: null }, { revalidate: false });
      return finishConsult(item, memo);
    },
    [finishConsult],
  );

  return { addConsult, completeConsult };
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

/** POST /api/consults/{id}/ai-record */
export async function generateAiRecord(consultId: string) {
  const summary = await backendApi.generateAiRecord(consultId);
  await mutate(["ai-record", consultId], summary, { revalidate: false });
  return summary;
}