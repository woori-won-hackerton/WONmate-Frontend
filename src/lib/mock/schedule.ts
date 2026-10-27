import type { ScheduleItem } from "@/lib/types";
import { addDays } from "@/lib/utils";

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: "s7", kind: "consult", title: "정하늘 고객 보험금 청구 안내", date: addDays(-7), time: "11:00", customerId: "c5", consultType: "claim", done: true },
  { id: "s1", kind: "consult", title: "김서연 고객 계약 점검", date: addDays(0), time: "10:00", customerId: "c1", consultType: "review", done: true },
  { id: "s2", kind: "consult", title: "박준호 고객 신규 상담", date: addDays(0), time: "13:30", customerId: "c2", consultType: "new", done: false },
  { id: "s3", kind: "consult", title: "이민지 고객 신규 상담", date: addDays(0), time: "15:00", customerId: "c3", consultType: "new", done: false },
  { id: "s4", kind: "consult", title: "최영수 고객 갱신 상담", date: addDays(0), time: "17:00", customerId: "c4", consultType: "renewal", done: false },
  { id: "s6", kind: "consult", title: "김서연 고객 신규 상담", date: addDays(1), time: "16:30", customerId: "c1", consultType: "new", done: false },
  { id: "s5", kind: "consult", title: "정하늘 고객 보험금 청구 안내", date: addDays(2), time: "14:00", customerId: "c5", consultType: "claim", done: false },
  { id: "t1", kind: "task", title: "김서연 고객 타사 계약 확인 요청", date: addDays(0), customerId: "c1", done: false },
  { id: "t2", kind: "task", title: "상품 변경 공지 확인 (든든 암보험)", date: addDays(-1), done: true },
];