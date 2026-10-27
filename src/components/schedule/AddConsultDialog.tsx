"use client";

import { useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConsultActions, useCustomers } from "@/lib/data";
import { toast } from "@/lib/feedback";
import { CONSULT_TYPE_LABEL, CONSULT_TYPES, type ConsultType, type ScheduleItem } from "@/lib/types";
import { cn, formatAge, inputClass } from "@/lib/utils";

interface AddConsultDialogProps {
  defaultDate: string;
  defaultCustomerId?: string;
  onClose: () => void;
  /** 추가된 일정 전달 */
  onAdded?: (item: ScheduleItem) => void;
}

/** 상담 일정 추가 — 상담 종류는 여기서 정하고, 상담 준비 화면에서는 보여주기만 함 */
export function AddConsultDialog({ defaultDate, defaultCustomerId = "", onClose, onAdded }: AddConsultDialogProps) {
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { addConsult } = useConsultActions();

  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [type, setType] = useState<ConsultType>("new");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  const canSubmit = Boolean(customer && date && time) && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || saving) return;
    setSaving(true);
    try {
      const added = await addConsult({
        customerId: customer.id,
        consultType: type,
        date,
        time,
      });
      onAdded?.(added);
      onClose();
      toast.success(`${customer.name} 고객 상담 일정을 추가했어요`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "상담 일정을 추가하지 못했어요");
      setSaving(false);
    }
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
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={customersLoading}
              className={inputClass}
            >
              <option value="">{customersLoading ? "고객 목록을 불러오는 중…" : "고객을 선택하세요"}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatAge(c.age)})
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
          <Button type="submit" size="lg" disabled={!canSubmit} loading={saving}>
            일정 추가
          </Button>
        </div>
      </form>
    </div>
  );
}