"use client";

import { useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CUSTOMERS, findCustomer } from "@/lib/mock";
import { toast } from "@/lib/feedback";
import { useAppStore } from "@/lib/store";
import { CONSULT_TYPE_LABEL, CONSULT_TYPES, type ConsultType } from "@/lib/types";
import { cn, inputClass } from "@/lib/utils";

interface AddConsultDialogProps {
  defaultDate: string;
  defaultCustomerId?: string;
  onClose: () => void;
  /** 추가된 일정 id 전달 */
  onAdded?: (id: string) => void;
}

/** 상담 일정 추가 — 상담 종류는 여기서 정하고, 상담 준비 화면에서는 보여주기만 함 */
export function AddConsultDialog({ defaultDate, defaultCustomerId = "", onClose, onAdded }: AddConsultDialogProps) {
  const addScheduleItem = useAppStore((s) => s.addScheduleItem);

  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [type, setType] = useState<ConsultType>("new");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");

  const customer = customerId ? findCustomer(customerId) : undefined;
  const canSubmit = Boolean(customer && date && time);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    const id = addScheduleItem({
      kind: "consult",
      title: `${customer.name} 고객 ${CONSULT_TYPE_LABEL[type]}`,
      date,
      time,
      customerId: customer.id,
      consultType: type,
      done: false,
    });
    onAdded?.(id);
    onClose();
    toast.success(`${customer.name} 고객 상담 일정을 추가했어요`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <CalendarPlus className="size-5 text-brand-600" />
            상담 일정 추가
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-lg p-1.5 text-sub hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-sub">고객</span>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass}>
              <option value="">고객을 선택하세요</option>
              {CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.age}세)
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-sub">상담 종류</span>
            <div className="grid grid-cols-2 gap-2">
              {CONSULT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "h-10 rounded-xl border px-3 text-sm font-semibold transition",
                    type === t
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-white text-sub hover:border-brand-200 hover:text-brand-700",
                  )}
                >
                  {CONSULT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-sub">날짜</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-sub">시간</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </label>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" size="lg" disabled={!canSubmit}>
            일정 추가
          </Button>
        </div>
      </form>
    </div>
  );
}