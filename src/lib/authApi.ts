/**
 * 인증 API
 * - POST /api/auth/login → accessToken
 * - GET /api/users/me → 내 정보
 */
import { backendApi, toUser } from "@/lib/backend";
import { ApiError, clearRemoteCache } from "@/lib/http";
import type { FcUser } from "@/lib/types";

export class LoginError extends Error {}

export interface LoginResult {
  user: FcUser;
  token: string;
}

const WRONG_ACCOUNT = "아이디 또는 비밀번호가 올바르지 않아요.";

export async function login(id: string, password: string): Promise<LoginResult> {
  const loginId = id.trim();

  let token: string;
  try {
    ({ accessToken: token } = await backendApi.login(loginId, password));
  } catch (e) {
    if (e instanceof ApiError && [400, 401, 403, 404].includes(e.status)) throw new LoginError(WRONG_ACCOUNT);
    throw new LoginError(e instanceof Error ? e.message : "잠시 후 다시 시도해 주세요.");
  }

  try {
    return { user: toUser(await backendApi.getMe(token)), token };
  } catch {
    // 내 정보 조회에 실패해도 로그인은 진행 (이름 자리에 아이디 표시)
    return { user: { id: loginId, name: loginId, branch: "", joinedYear: null }, token };
  }
}

export async function logout(): Promise<void> {
  // 백엔드에 로그아웃 API가 없음 (JWT는 브라우저에서 지우면 끝)
  clearRemoteCache();
}