"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ConsultationRecord, PrepDraft, ScheduleItem, WikiDoc } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * 이 브라우저에만 저장하는 데이터 (localStorage)
 * — 백엔드에 아직 API가 없는 것만 보관해요
 *   할 일 · 상담 준비 draft(브리핑 · 답변 메모) · AI 상담 요약 목록 · 고객 위키 · 상담 완료 표시
 * 고객 · 계약 · 상담 일정 · 상담 메모 · AI 기록은 lib/data.ts 에서 백엔드로 불러와요.
 */
interface LocalData {
  records: ConsultationRecord[];
  /** key = 상담 id */
  prepDrafts: Record<string, PrepDraft>;
  /** 할 일 (kind: "task") */
  schedule: ScheduleItem[];
  /** key = customerId */
  wiki: Record<string, WikiDoc>;
  /** 상담 완료 표시 (백엔드 상담 일정 응답에 상태가 없어서 따로 보관). key = 상담 id */
  consultDone: Record<string, boolean>;
}

interface AppState extends LocalData {
  savePrepDraft: (draft: PrepDraft) => void;
  /** 상담 완료 후 호출 → 완료 표시 + AI 상담 요약 목록에 추가. 만든 record id 반환 */
  finishConsult: (item: ScheduleItem, memo: string) => string;
  updateRecord: (id: string, patch: Partial<ConsultationRecord>) => void;
  confirmRecord: (id: string, confirmedBy: string) => void;
  /** 할 일 추가 — 추가된 id 반환 */
  addScheduleItem: (item: Omit<ScheduleItem, "id">) => string;
  toggleScheduleItem: (id: string) => void;
  saveWiki: (customerId: string, content: string) => void;
}

const initialData = (): LocalData => ({
  records: [],
  prepDrafts: {},
  schedule: [],
  wiki: {},
  consultDone: {},
});

/** 상담 메모 + 예상 질문 답변 메모를 하나의 최종 메모로 합침 (상담 완료 때 백엔드로 보냄) */
export function composeMemo(memo: string, draft?: PrepDraft) {
  const parts = [memo.trim()];
  const answered = (draft?.qa ?? []).filter((q) => q.answerMemo.trim());
  if (answered.length) {
    parts.push("[예상 질문 메모]");
    answered.forEach((q) => parts.push(`Q: ${q.question}`, `A: ${q.answerMemo.trim()}`));
  }
  return parts.filter(Boolean).join("\n");
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialData(),

      savePrepDraft: (draft) =>
        set((s) => ({ prepDrafts: { ...s.prepDrafts, [draft.scheduleId]: draft } })),

      finishConsult: (item, memo) => {
        const id = uid("rec");
        set((s) => {
          const rest = { ...s.prepDrafts };
          delete rest[item.id];
          const record: ConsultationRecord = {
            id,
            scheduleId: item.id,
            customerId: item.customerId ?? "",
            type: item.consultType ?? "review",
            date: item.date,
            memo,
            summary: null,
            status: "memo",
          };
          return {
            // 같은 상담으로 이미 만든 요약이 있으면 교체
            records: [record, ...s.records.filter((r) => r.scheduleId !== item.id)],
            prepDrafts: rest,
            consultDone: { ...s.consultDone, [item.id]: true },
          };
        });
        return id;
      },

      updateRecord: (id, patch) =>
        set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      confirmRecord: (id, confirmedBy) =>
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, status: "confirmed", confirmedBy, confirmedAt: new Date().toISOString() } : r,
          ),
        })),

      addScheduleItem: (item) => {
        const id = uid("task");
        set((s) => ({ schedule: [...s.schedule, { ...item, id }] }));
        return id;
      },

      toggleScheduleItem: (id) =>
        set((s) => ({ schedule: s.schedule.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),

      saveWiki: (customerId, content) =>
        set((s) => ({
          wiki: { ...s.wiki, [customerId]: { content, updatedAt: new Date().toISOString() } },
        })),
    }),
    {
      name: "wonmate-local",
      storage: createJSONStorage(() => localStorage),
      // 데이터 구조가 바뀌면 version을 올려서 예전 브라우저 데이터를 초기화
      version: 5,
      migrate: () => initialData() as AppState,
    },
  ),
);