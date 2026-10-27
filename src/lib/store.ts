"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { INITIAL_RECORDS, INITIAL_SCHEDULE, INITIAL_WIKI } from "@/lib/mock";
import type { ConsultationRecord, PrepDraft, ScheduleItem, WikiDoc } from "@/lib/types";
import { uid } from "@/lib/utils";

interface DemoData {
  records: ConsultationRecord[];
  /** key = scheduleId */
  prepDrafts: Record<string, PrepDraft>;
  schedule: ScheduleItem[];
  /** key = customerId */
  wiki: Record<string, WikiDoc>;
}

interface AppState extends DemoData {
  savePrepDraft: (draft: PrepDraft) => void;
  /** 상담 준비 완료 → 상담 기록(메모 상태) 생성. 생성된 record id 반환 */
  finishPrep: (scheduleId: string) => string | null;
  updateRecord: (id: string, patch: Partial<ConsultationRecord>) => void;
  confirmRecord: (id: string, confirmedBy: string) => void;
  /** 추가된 일정 id 반환 */
  addScheduleItem: (item: Omit<ScheduleItem, "id">) => string;
  toggleScheduleItem: (id: string) => void;
  saveWiki: (customerId: string, content: string) => void;
  resetDemo: () => void;
}

const initialData = (): DemoData => ({
  records: INITIAL_RECORDS,
  prepDrafts: {},
  schedule: INITIAL_SCHEDULE,
  wiki: INITIAL_WIKI,
});

function composeMemo(draft: PrepDraft) {
  const parts = [draft.memo.trim()];
  const answered = draft.qa.filter((q) => q.answerMemo.trim());
  if (answered.length) {
    parts.push("[예상 질문 메모]");
    answered.forEach((q) => parts.push(`Q: ${q.question}`, `A: ${q.answerMemo.trim()}`));
  }
  return parts.filter(Boolean).join("\n");
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      savePrepDraft: (draft) =>
        set((s) => ({ prepDrafts: { ...s.prepDrafts, [draft.scheduleId]: draft } })),

      finishPrep: (scheduleId) => {
        const draft = get().prepDrafts[scheduleId];
        const item = get().schedule.find((i) => i.id === scheduleId);
        if (!draft || !item) return null;
        const id = uid("rec");
        const record: ConsultationRecord = {
          id,
          scheduleId,
          customerId: draft.customerId,
          type: draft.type,
          date: item.date,
          memo: composeMemo(draft),
          summary: null,
          status: "memo",
        };
        set((s) => {
          const rest = { ...s.prepDrafts };
          delete rest[scheduleId];
          return { records: [record, ...s.records], prepDrafts: rest };
        });
        return id;
      },

      updateRecord: (id, patch) =>
        set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      confirmRecord: (id, confirmedBy) =>
        set((s) => {
          const target = s.records.find((r) => r.id === id);
          const isSameConsult = (i: ScheduleItem) =>
            !!target &&
            i.kind === "consult" &&
            (target.scheduleId
              ? i.id === target.scheduleId
              : i.customerId === target.customerId && i.date === target.date);
          return {
            records: s.records.map((r) =>
              r.id === id
                ? { ...r, status: "confirmed", confirmedBy, confirmedAt: new Date().toISOString() }
                : r,
            ),
            // 기록을 확정하면 해당 상담 일정은 완료 처리
            schedule: s.schedule.map((i) => (isSameConsult(i) ? { ...i, done: true } : i)),
          };
        }),

      addScheduleItem: (item) => {
        const id = uid("sch");
        set((s) => ({ schedule: [...s.schedule, { ...item, id }] }));
        return id;
      },

      toggleScheduleItem: (id) =>
        set((s) => ({ schedule: s.schedule.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),

      saveWiki: (customerId, content) =>
        set((s) => ({
          wiki: { ...s.wiki, [customerId]: { content, updatedAt: new Date().toISOString() } },
        })),

      resetDemo: () => set(initialData()),
    }),
    {
      name: "fc-professor-demo",
      storage: createJSONStorage(() => localStorage),
      // 데이터 구조가 바뀌면 version을 올려서 예전 브라우저 데이터를 초기화
      version: 2,
      migrate: () => initialData() as AppState,
    },
  ),
);