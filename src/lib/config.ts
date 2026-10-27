/**
 * 백엔드 연동 설정
 *
 * 브라우저는 항상 같은 주소의 /api/... 로 요청하고,
 * Next 서버(src/app/api/[...path]/route.ts)가 BACKEND_URL 로 대신 전달해요. (CORS 설정 없이 동작)
 */

/**
 * 백엔드에 아직 API가 없는 기능 — API가 생기면 true로 바꾸고 lib/api.ts 의 경로를 맞추면 돼요
 * (false인 기능은 프론트 mock으로 동작)
 */
export const BACKEND_READY = {
  /** AI 챗봇 (RAG) */
  chat: false,
} as const;

/**
 * 상담 일정 기간 조회 API가 없어서, 날짜별 조회(GET /api/consults?date=)를 이 범위만큼 반복해서 불러와요
 * (상담 준비 드롭다운 · 고객별 다음 상담에 사용)
 */
export const CONSULT_RANGE = { pastDays: 3, futureDays: 14 } as const;