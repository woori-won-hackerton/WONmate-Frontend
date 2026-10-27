"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { LOGO_SRC } from "@/components/layout/Logo";
import { useAuthStore } from "@/lib/auth";
import { login, LoginError } from "@/lib/authApi";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const canSubmit = Boolean(id.trim() && password) && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const { user, token } = await login(id, password);
      signIn(user, token);
      router.replace("/"); // 온보딩 전이면 AppShell이 /onboarding으로 보냄
    } catch (err) {
      setError(err instanceof LoginError ? err.message : "잠시 후 다시 시도해 주세요.");
      setShakeKey((k) => k + 1);
      setPassword("");
      setLoading(false);
    }
  };

  const field = cn(
    "group flex h-14 items-center gap-3 rounded-2xl border bg-gray-50 px-4 transition focus-within:bg-white focus-within:ring-4",
    error
      ? "border-rose-300 focus-within:ring-rose-100"
      : "border-transparent focus-within:border-brand-400 focus-within:ring-brand-100",
  );

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-linear-to-br from-brand-800 via-brand-600 to-sky-accent px-4 py-10">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-sky-accent/40 blur-3xl" />

      <main className="relative w-full max-w-[400px] animate-rise">
        {/* 브랜드 */}
        <div className="mb-8 text-center text-white">
          <span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-white p-2.5 shadow-xl">
            <Image src={LOGO_SRC} alt="" width={44} height={44} priority unoptimized className="size-full object-contain" />
          </span>
          <h1 className="mt-4 text-[28px] font-extrabold tracking-tight">
            WON<span className="text-sky-200">mate</span>
          </h1>
          <p className="mt-1 text-sm text-white/75">첫 상담도 선배처럼 준비하는 AI 워크스페이스</p>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
          <form
            key={shakeKey}
            onSubmit={handleSubmit}
            className={cn("space-y-3 [&>button[type=submit]]:mt-5", shakeKey > 0 && "animate-shake")}
          >
            <label className={field}>
              <UserRound className="size-5 shrink-0 text-muted group-focus-within:text-brand-600" />
              <input
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setError("");
                }}
                placeholder="아이디"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              />
            </label>

            <label className={field}>
              <Lock className="size-5 shrink-0 text-muted group-focus-within:text-brand-600" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="비밀번호"
                autoComplete="current-password"
                className="h-full w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-gray-100"
              >
                {showPw ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </label>

            {error && (
              <p className="flex items-center gap-1.5 px-1 pb-1 text-[13px] font-medium text-rose-600">
                <CircleAlert className="size-4" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-base font-bold text-white shadow-float transition-all hover:bg-brand-700 active:scale-[0.98] disabled:bg-brand-200 disabled:shadow-none"
            >
              {loading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  로그인
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">계정은 소속 지점에서 발급해요</p>
      </main>
    </div>
  );
}