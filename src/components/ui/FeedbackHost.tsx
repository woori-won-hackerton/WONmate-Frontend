"use client";

import { useEffect } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useFeedbackStore, type ToastTone } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const TOAST_ICON: Record<ToastTone, typeof Info> = {
  success: CircleCheck,
  info: Info,
  error: CircleAlert,
};

const TOAST_ICON_COLOR: Record<ToastTone, string> = {
  success: "text-emerald-400",
  info: "text-sky-300",
  error: "text-rose-400",
};

/** 토스트 + 확인 모달을 화면에 그려주는 곳 (layout.tsx에 1번만 둠) */
export function FeedbackHost() {
  const toasts = useFeedbackStore((s) => s.toasts);
  const dismissToast = useFeedbackStore((s) => s.dismissToast);
  const confirm = useFeedbackStore((s) => s.confirm);
  const closeConfirm = useFeedbackStore((s) => s.closeConfirm);

  // ESC로 확인 모달 닫기
  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, closeConfirm]);

  return (
    <>
      {/* 토스트 — 모바일은 하단 탭바 위, PC는 하단 가운데 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8 lg:pl-64">
        {toasts.map((t) => {
          const Icon = TOAST_ICON[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-2.5 rounded-2xl bg-ink/95 px-4 py-3 text-sm font-medium text-white shadow-xl backdrop-blur"
            >
              <Icon className={cn("size-5 shrink-0", TOAST_ICON_COLOR[t.tone])} />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => dismissToast(t.id)}
                className="grid size-6 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 확인 모달 */}
      {confirm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="alertdialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => closeConfirm(false)} />
          <div className="relative w-full max-w-sm animate-rise rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <p className="text-lg font-bold text-ink">{confirm.title}</p>
            {confirm.description && (
              <p className="mt-2 text-sm leading-relaxed text-sub">{confirm.description}</p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="h-12 rounded-2xl bg-gray-100 text-[15px] font-semibold text-sub transition hover:bg-gray-200 active:scale-[0.98]"
              >
                {confirm.cancelText ?? "취소"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={cn(
                  "h-12 rounded-2xl text-[15px] font-bold text-white transition active:scale-[0.98]",
                  confirm.tone === "danger" ? "bg-rose-500 hover:bg-rose-600" : "bg-brand-600 hover:bg-brand-700",
                )}
              >
                {confirm.confirmText ?? "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}