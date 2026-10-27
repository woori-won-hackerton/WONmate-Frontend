"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** localStorage 상태를 쓰는 화면에서 서버/클라이언트 렌더 불일치를 막기 위한 훅 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
