/**
 * 백엔드 연동 설정
 *
 * 브라우저는 항상 같은 주소의 /api/... 로 요청하고,
 * Next 서버(src/app/api/[...path]/route.ts)가 BACKEND_URL 로 대신 전달해요. (CORS 설정 없이 동작)
 */

/**
 * 상담 준비 드롭다운 · 고객별 다음 상담에 쓰는 상담 일정 범위
 * (GET /api/consults?from=&to= 로 한 번에 불러와요. 백엔드 최대 92일)
 */
export const CONSULT_RANGE = { pastDays: 3, futureDays: 14 } as const;