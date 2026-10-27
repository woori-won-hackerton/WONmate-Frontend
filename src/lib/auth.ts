"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FcUser } from "@/lib/types";

interface AuthState {
  user: FcUser | null;
  /** 백엔드 JWT (로그인 전에는 null) */
  token: string | null;
  /** 온보딩을 마친 사용자 id */
  onboarded: Record<string, boolean>;
  signIn: (user: FcUser, token?: string | null) => void;
  signOut: () => void;
  completeOnboarding: () => void;
}

/** 로그인 상태 — 브라우저 데이터(store.ts)와 따로 저장 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      onboarded: {},

      signIn: (user, token = null) => set({ user, token }),

      signOut: () => set({ user: null, token: null }),

      completeOnboarding: () => {
        const user = get().user;
        if (!user) return;
        set((s) => ({ onboarded: { ...s.onboarded, [user.id]: true } }));
      },
    }),
    {
      name: "wonmate-auth",
      storage: createJSONStorage(() => localStorage),
      // FcUser 구조가 바뀌어서 버전업 → 예전 로그인 정보는 지우고 다시 로그인
      version: 2,
      migrate: (persisted) => ({
        ...(persisted as Partial<AuthState>),
        user: null,
        token: null,
      }) as AuthState,
    },
  ),
);

const GUEST: FcUser = { id: "", name: "", branch: "", joinedYear: null };

/** 로그인한 FC 정보. 로그인 화면 밖에서는 항상 값이 있음 (없을 때를 대비한 기본값) */
export function useCurrentUser(): FcUser {
  const user = useAuthStore((s) => s.user);
  return user ?? GUEST;
}