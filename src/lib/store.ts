"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PrepDraft } from "@/lib/types";
import { toLocalISODate } from "@/lib/utils";

/**
 * 이 브라우저에만 저장하는 데이터 (localStorage)
 * — 백엔드에 아직 API가 없는 것만 보관해요
 *   상담 준비 draft(브리핑 화면용 · 예상 질문 답변 메모 · 입력 중인 메모) · 할 일 체크한 날짜
 * 고객 · 계약 · 상담 일정(완료 여부 포함) · 상담 메모 · 브리핑 · AI 상담 요약 · 고객 위키 · 할 일은
 * lib/data.ts 에서 백엔드로 불러와요.
 */
interface LocalData {
  /** key = 상담 id */
  prepDrafts: Record<string, PrepDraft>;
  /**
   * 할 일을 체크한 날짜. key = 할 일 id
   * (백엔드 할 일 응답에 날짜가 없어서, '오늘 체크한 할 일은 목록에 남겨두기'용으로 따로 보관)
   */
  todoDoneOn: Record<string, string>;
}

interface AppState extends LocalData {
  savePrepDraft: (draft: PrepDraft) => void;
  /** 상담 완료 후 상담 준비 draft 정리 */
  clearPrepDraft: (scheduleId: string) => void;
  markTodoDone: (todoId: string, done: boolean) => void;
}

const initialData = (): LocalData => ({
  prepDrafts: {},
  todoDoneOn: {},
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

      clearPrepDraft: (scheduleId) =>
        set((s) => {
          const rest = { ...s.prepDrafts };
          delete rest[scheduleId];
          return { prepDrafts: rest };
        }),

      markTodoDone: (todoId, done) =>
        set((s) => {
          const rest = { ...s.todoDoneOn };
          if (done) rest[todoId] = toLocalISODate();
          else delete rest[todoId];
          return { todoDoneOn: rest };
        }),
    }),
    {
      name: "wonmate-local",
      storage: createJSONStorage(() => localStorage),
      // 데이터 구조가 바뀌면 version을 올려요
      version: 7,
      migrate: (persisted, version) => {
        // v5 · v6 → v7: 상담 완료 표시 · AI 상담 요약 목록이 백엔드로 이동 → 상담 준비 draft만 유지
        if ((version === 5 || version === 6) && persisted) {
          const old = persisted as Partial<LocalData>;
          return {
            ...initialData(),
            prepDrafts: old.prepDrafts ?? {},
            todoDoneOn: old.todoDoneOn ?? {},
          } as AppState;
        }
        return initialData() as AppState;
      },
    },
  ),
);