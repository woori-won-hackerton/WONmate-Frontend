"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";

/**
 * 화면 공통 피드백 (alert / confirm 대체)
 * - toast.success("저장했어요")
 * - if (await confirmDialog({ title: "로그아웃할까요?" })) { ... }
 */

export type ToastTone = "success" | "info" | "error";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** danger = 되돌리기 어려운 동작 (빨간 버튼) */
  tone?: "primary" | "danger";
}

interface FeedbackState {
  toasts: ToastItem[];
  confirm: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  pushToast: (message: string, tone: ToastTone) => void;
  dismissToast: (id: string) => void;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (ok: boolean) => void;
}

export const useFeedbackStore = create<FeedbackState>()((set, get) => ({
  toasts: [],
  confirm: null,

  pushToast: (message, tone) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => get().dismissToast(id), 2800);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  openConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ confirm: { ...options, resolve } });
    }),

  closeConfirm: (ok) => {
    get().confirm?.resolve(ok);
    set({ confirm: null });
  },
}));

export const toast = {
  success: (message: string) => useFeedbackStore.getState().pushToast(message, "success"),
  info: (message: string) => useFeedbackStore.getState().pushToast(message, "info"),
  error: (message: string) => useFeedbackStore.getState().pushToast(message, "error"),
};

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return useFeedbackStore.getState().openConfirm(options);
}