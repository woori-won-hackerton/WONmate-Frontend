"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookMarked, LogOut, Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/constants/nav";
import { useMounted } from "@/hooks/useMounted";
import { useAuthStore, useCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/authApi";
import { confirmDialog } from "@/lib/feedback";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

/** 사이드바 없이 화면 전체를 쓰는 페이지 */
const BARE_ROUTES = ["/login", "/onboarding"];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const onboarded = useAuthStore((s) => (s.user ? Boolean(s.onboarded[s.user.id]) : false));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isBare = BARE_ROUTES.includes(pathname);

  // 로그인 · 온보딩 이동 규칙 (백엔드 연동 후에는 middleware.ts에서 쿠키로 처리 권장)
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      if (pathname !== "/login") router.replace("/login");
    } else if (!onboarded) {
      if (pathname !== "/onboarding") router.replace("/onboarding");
    } else if (pathname === "/login") {
      router.replace("/");
    }
  }, [mounted, user, onboarded, pathname, router]);

  if (isBare) return <>{children}</>;

  // 확인 전에는 화면을 보여주지 않음 (로그인 안 된 상태로 내용이 잠깐 보이는 것 방지)
  if (!mounted || !user || !onboarded) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface">
        <span className="size-8 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* 데스크톱 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-white shadow-[1px_0_0_var(--color-line)] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        <Logo compact />
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={() => setDrawerOpen(true)}
          className="grid size-10 place-items-center rounded-full text-sub hover:bg-white"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* 모바일 드로어 (전체 메뉴) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col rounded-l-3xl bg-white shadow-xl">
            <button
              type="button"
              aria-label="메뉴 닫기"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-4 top-5 grid size-9 place-items-center rounded-full text-sub hover:bg-gray-100"
            >
              <X className="size-5" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="pb-28 lg:pb-0 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      {/* 모바일 하단 탭바 */}
      <BottomTabBar pathname={pathname} />
    </div>
  );
}

function usePendingTasks() {
  const mounted = useMounted();
  const pending = useAppStore((s) => s.schedule.filter((i) => i.kind === "task" && !i.done).length);
  return mounted ? pending : 0;
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  const user = useCurrentUser();
  const signOut = useAuthStore((s) => s.signOut);
  const pendingTasks = usePendingTasks();

  const handleLogout = async () => {
    onNavigate?.();
    const ok = await confirmDialog({ title: "로그아웃할까요?", confirmText: "로그아웃" });
    if (!ok) return;
    await logout();
    signOut();
    router.replace("/login");
  };

  return (
    <>
      <div className="px-6 pb-5 pt-7">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(pathname, href);
          const count = badge === "pendingTasks" ? pendingTasks : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-all",
                active
                  ? "bg-brand-600 text-white shadow-float"
                  : "text-sub hover:bg-gray-50 hover:text-ink",
              )}
            >
              <Icon className={cn("size-5", active ? "text-white" : "text-muted")} strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    active ? "bg-white/25 text-white" : "bg-rose-500 text-white",
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 p-4">
        <Link
          href="/onboarding"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted hover:bg-gray-50 hover:text-sub"
        >
          <BookMarked className="size-4" />
          이용 가이드 다시 보기
        </Link>

        <div className="rounded-2xl bg-surface p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-500 to-sky-accent text-sm font-bold text-white">
              {user.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{user.name} FC</p>
              <p className="truncate text-xs text-muted">
                {[user.branch, user.joinedYear && `${user.joinedYear}년 입사`].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-white text-xs font-semibold text-sub transition hover:text-rose-500"
            >
              <LogOut className="size-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function BottomTabBar({ pathname }: { pathname: string }) {
  const pendingTasks = usePendingTasks();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-white/90 px-2 pt-1.5 backdrop-blur-md lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.filter((item) => item.tab).map(({ href, short, icon: Icon, badge }) => {
          const active = isActive(pathname, href);
          const count = badge === "pendingTasks" ? pendingTasks : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 whitespace-nowrap rounded-2xl py-1.5 text-[11px] font-semibold tracking-tight transition-colors",
                  active ? "text-brand-600" : "text-muted",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.8} />
                {short}
                {count > 0 && (
                  <span className="absolute right-[calc(50%-20px)] top-0.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}