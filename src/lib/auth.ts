"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CURRENT_FC } from "@/constants/nav";
import type { FcUser } from "@/lib/types";

interface AuthState {
  user: FcUser | null;
  /** 온보딩을 마친 사용자 id */
  onboarded: Record<string, boolean>;
  signIn: (user: FcUser) => void;
  signOut: () => void;
  completeOnboarding: () => void;
}

/** 로그인 상태 — 데모 데이터(store.ts)와 분리해서 '데모 초기화'를 눌러도 로그아웃되지 않게 함 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      onboarded: {},

      signIn: (user) => set({ user }),

      signOut: () => set({ user: null }),

      completeOnboarding: () => {
        const user = get().user;
        if (!user) return;
        set((s) => ({ onboarded: { ...s.onboarded, [user.id]: true } }));
      },
    }),
    {
      name: "wonmate-auth",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** 로그인한 FC 정보. 로그인 화면 밖에서는 항상 값이 있음 (없을 때를 대비한 기본값) */
export function useCurrentUser(): FcUser {
  const user = useAuthStore((s) => s.user);
  return user ?? { id: "", ...CURRENT_FC };
}