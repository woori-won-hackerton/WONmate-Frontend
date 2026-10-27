import type { WikiDoc } from "@/lib/types";
import { addDays } from "@/lib/utils";

/** 고객 위키 초기값 (가상). 고객이 직접 말한 내용만 적는 공간 */
export const INITIAL_WIKI: Record<string, WikiDoc> = {
  c1: {
    content:
      "• 연락은 평일 오후 4시 이후 선호 (수업 끝난 뒤)\n• 지난 상담에서 월 보험료 부담을 언급함\n• 자녀(5세) 어린이보험에 관심 — 다음 상담에서 같이 보기로 함\n• 배우자 보험은 배우자가 직접 관리 중이라고 함",
    updatedAt: `${addDays(-21)}T18:30:00`,
  },
  c2: {
    content:
      "• 메시지보다 전화 선호, 점심시간(12~13시) 통화 가능\n• 첫째가 내년에 초등학교 입학\n• 종신보험은 계속 유지하고 싶다고 함",
    updatedAt: `${addDays(-45)}T17:10:00`,
  },
  c4: {
    content:
      "• 가게 영업 때문에 오전이나 늦은 오후 상담만 가능\n• 연금은 65세부터 받을 생각이라고 함\n• 갱신 보험료 인상에 민감 — 숫자로 먼저 보여드리기",
    updatedAt: `${addDays(-60)}T15:50:00`,
  },
  c5: {
    content: "• 청구 서류는 사진으로 보내는 걸 편해함\n• 진료비 영수증을 다음 주까지 보내주기로 함",
    updatedAt: `${addDays(-7)}T11:40:00`,
  },
};