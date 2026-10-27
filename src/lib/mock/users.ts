import type { FcUser } from "@/lib/types";

/**
 * 데모 계정 (회원가입 없음 — 실제로는 시스템/DB에서 발급)
 * 백엔드 연동 후에는 이 파일을 지우고 로그인 API 결과를 사용하세요.
 */
export const MOCK_ACCOUNTS: (FcUser & { password: string })[] = [
  { id: "fc01", password: "1234", name: "한우리", branch: "강남지점 3팀", tenureMonth: 4 },
];