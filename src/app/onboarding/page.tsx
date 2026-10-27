"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, FileText, TriangleAlert } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { useAuthStore, useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    eyebrow: "상담 준비",
    title: "지난 기록은\nAI가 브리핑으로",
    desc: "지난 상담과 계약을 한 장으로 요약하고, 확인 안 된 정보는 따로 알려드려요.",
    visual: <BriefingVisual />,
  },
  {
    eyebrow: "AI 챗봇",
    title: "근거 있는 답만\n알려줘요",
    desc: "용어·개념부터 상품 설명까지, 근거 문서와 함께 답하고 근거가 없으면 보류해요.",
    visual: <QaVisual />,
  },
  {
    eyebrow: "AI 상담 요약",
    title: "초안은 AI가,\n확정은 FC님이",
    desc: "상담 메모를 항목별 초안으로 정리해요. 최종 확정은 FC님이 해요.",
    visual: <RecordVisual />,
  },
];

/** 첫 로그인 후 1회 보여주는 핵심 기능 안내 */
export default function OnboardingPage() {
  const router = useRouter();
  const mounted = useMounted();
  const user = useCurrentUser();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);

  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => {
    completeOnboarding();
    router.replace("/");
  };

  if (!mounted) return <div className="min-h-dvh bg-white" />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white lg:bg-surface lg:p-8">
      <div className="flex min-h-dvh w-full max-w-md flex-col bg-white lg:min-h-0 lg:rounded-[32px] lg:shadow-card">
        <header className="flex h-16 items-center justify-between px-6">
          <p className="text-sm font-semibold text-sub">
            <span className="font-bold text-ink">{user.name} FC님</span>, 환영해요 👋
          </p>
          {!last && (
            <button type="button" onClick={finish} className="text-sm font-semibold text-muted hover:text-sub">
              건너뛰기
            </button>
          )}
        </header>

        <div key={step} className="flex flex-1 animate-rise flex-col px-6">
          <div className="grid h-60 place-items-center rounded-[28px] bg-linear-to-br from-brand-50 to-sky-50">
            {current.visual}
          </div>
          <p className="mt-8 text-sm font-bold text-brand-600">{current.eyebrow}</p>
          <h1 className="mt-2 whitespace-pre-line text-[28px] font-extrabold leading-[1.3] tracking-tight text-ink">
            {current.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-sub">{current.desc}</p>
        </div>

        <footer className="px-6 pb-8 pt-6">
          <div className="mb-5 flex justify-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.eyebrow}
                type="button"
                aria-label={`${i + 1}단계`}
                onClick={() => setStep(i)}
                className={cn("h-2 rounded-full transition-all", i === step ? "w-6 bg-brand-600" : "w-2 bg-gray-200")}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (last ? finish() : setStep((s) => s + 1))}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-base font-bold text-white shadow-float transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            {last ? "시작하기" : "다음"}
            <ArrowRight className="size-5" />
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- 단계별 일러스트 (UI 조각으로 구성) ---------------- */

function BriefingVisual() {
  return (
    <div className="w-60 rounded-2xl bg-white p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
        <Bot className="size-4 text-brand-600" />
        요약 브리핑
      </p>
      <ul className="mt-3 space-y-2">
        {["42세 · IT 회사 팀장", "관심사: 가족 보장, 노후 준비", "자사 계약 2건"].map((t) => (
          <li key={t} className="flex items-center gap-2 text-xs text-sub">
            <span className="size-1.5 rounded-full bg-brand-500" />
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-50 p-2 text-[11px] font-semibold text-amber-800">
        <TriangleAlert className="size-3.5" />
        월 보험료 예산: 확인되지 않음
      </p>
    </div>
  );
}

function QaVisual() {
  return (
    <div className="w-60 space-y-2">
      <p className="ml-auto w-fit rounded-2xl rounded-tr-md bg-brand-600 px-3 py-2 text-xs font-medium text-white">
        암 진단비는 언제부터 보장돼요?
      </p>
      <div className="rounded-2xl rounded-tl-md bg-white p-3 shadow-card">
        <p className="text-xs leading-relaxed text-ink">계약일부터 90일이 지난 다음 날부터 보장돼요.</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-[10px] font-medium text-sub">
          <FileText className="size-3" />
          든든 암보험 약관 · p.12
        </span>
      </div>
    </div>
  );
}

function RecordVisual() {
  const rows = [
    { label: "상담 메모", tone: "bg-gray-100 text-sub" },
    { label: "AI 초안", tone: "bg-sky-50 text-sky-700" },
    { label: "FC 확정", tone: "bg-emerald-50 text-emerald-700" },
  ];
  return (
    <div className="flex w-60 flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
          <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {i + 1}
          </span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", r.tone)}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}