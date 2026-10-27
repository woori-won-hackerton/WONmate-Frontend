"use client";

import { useState } from "react";
import { Check, ListTodo, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAppStore } from "@/lib/store";
import { cn, inputClass, toLocalISODate } from "@/lib/utils";

/** 홈 우측: 해야 할 일 — 제목 입력하고 체크만 하는 단순 체크리스트 */
export function TaskCard() {
  const schedule = useAppStore((s) => s.schedule);
  const toggle = useAppStore((s) => s.toggleScheduleItem);
  const addItem = useAppStore((s) => s.addScheduleItem);
  const [title, setTitle] = useState("");

  const today = toLocalISODate();
  // 안 끝난 할 일 전부 + 오늘 체크한 할 일(실수로 눌렀을 때 되돌릴 수 있게)
  const tasks = schedule
    .filter((i) => i.kind === "task" && (!i.done || i.date === today))
    .sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date));
  const pending = tasks.filter((t) => !t.done).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addItem({ kind: "task", title: title.trim(), date: today, done: false });
    setTitle("");
  };

  return (
    <Card>
      <CardHeader
        icon={ListTodo}
        title="해야 할 일"
        right={
          <span className="text-sm font-semibold text-muted">
            <span className="text-brand-600">{pending}</span> / {tasks.length}
          </span>
        }
      />

      <form onSubmit={handleAdd} className="mb-3 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
          className={inputClass}
        />
        <button
          type="submit"
          aria-label="할 일 추가"
          disabled={!title.trim()}
          className="grid size-[46px] shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-float transition active:scale-95 disabled:bg-brand-200 disabled:shadow-none"
        >
          <Plus className="size-5" />
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">남은 할 일이 없어요 🎉</p>
      ) : (
        <ul className="-mx-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-gray-50"
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
                    task.done ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 text-transparent",
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className={cn("text-[15px] text-ink", task.done && "text-muted line-through")}>
                  {task.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}