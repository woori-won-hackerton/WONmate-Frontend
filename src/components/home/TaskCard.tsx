"use client";

import { useState } from "react";
import { Check, ListTodo, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { LoadError } from "@/components/ui/LoadError";
import { useTodoActions, useTodos } from "@/lib/data";
import { toast } from "@/lib/feedback";
import { useAppStore } from "@/lib/store";
import type { Todo } from "@/lib/types";
import { cn, inputClass, toLocalISODate } from "@/lib/utils";

const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** 홈 우측: 해야 할 일 — 입력하고 체크만 하는 단순 체크리스트 (백엔드 /api/todos) */
export function TaskCard() {
  const { data: todos, isLoading, error, reload } = useTodos();
  const { addTodo, toggleTodo } = useTodoActions();
  const todoDoneOn = useAppStore((s) => s.todoDoneOn);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const today = toLocalISODate();
  // 안 끝난 할 일 전부 + 오늘 체크한 할 일(실수로 눌렀을 때 되돌릴 수 있게)
  const tasks = todos
    .filter((t) => !t.done || todoDoneOn[t.id] === today)
    .sort((a, b) => Number(a.done) - Number(b.done));
  const pending = tasks.filter((t) => !t.done).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = title.trim();
    if (!content || adding) return;
    setAdding(true);
    try {
      await addTodo(content);
      setTitle("");
    } catch (err) {
      toast.error(errorText(err, "할 일을 추가하지 못했어요"));
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      await toggleTodo(todo);
    } catch (err) {
      toast.error(errorText(err, "할 일 상태를 바꾸지 못했어요"));
    }
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
          disabled={adding}
          className={inputClass}
        />
        <button
          type="submit"
          aria-label="할 일 추가"
          disabled={!title.trim() || adding}
          className="grid size-[46px] shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-float transition active:scale-95 disabled:bg-brand-200 disabled:shadow-none"
        >
          <Plus className="size-5" />
        </button>
      </form>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted">불러오는 중…</p>
      ) : error ? (
        <LoadError error={error} onRetry={reload} title="할 일을 불러오지 못했어요" />
      ) : tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">남은 할 일이 없어요 🎉</p>
      ) : (
        <ul className="-mx-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => handleToggle(task)}
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
                  {task.content}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}