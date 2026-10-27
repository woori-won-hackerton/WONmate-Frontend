/**
 * 인증 API 계층
 * - 지금은 프론트 단독 데모용 mock
 * - 백엔드 연동 시: fetch(`${API_BASE}/auth/login`, { method: "POST", credentials: "include", ... })
 *   로 바꾸고, 토큰은 httpOnly 쿠키로 받는 걸 권장 (localStorage에 토큰 저장 X)
 */
import { MOCK_ACCOUNTS } from "@/lib/mock/users";
import type { FcUser } from "@/lib/types";
import { sleep } from "@/lib/utils";

export class LoginError extends Error {}

export async function login(id: string, password: string): Promise<FcUser> {
  await sleep(600);

  const account = MOCK_ACCOUNTS.find((a) => a.id === id.trim().toLowerCase() && a.password === password);
  if (!account) {
    throw new LoginError("아이디 또는 비밀번호가 올바르지 않아요.");
  }

  const { password: _password, ...user } = account;
  void _password;
  return user;
}

export async function logout(): Promise<void> {
  // 백엔드 연동 시: await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
  await sleep(100);
}