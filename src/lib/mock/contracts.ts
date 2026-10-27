import type { Contract } from "@/lib/types";
import { addDays } from "@/lib/utils";

export const CONTRACTS: Contract[] = [
  { id: "k1", customerId: "c1", productName: "든든 암보험 (가상)", category: "암", status: "유지", startDate: "2023-03-14", monthlyPremium: 68000, renewalDate: null },
  { id: "k2", customerId: "c1", productName: "실손의료보험 (가상)", category: "실손", status: "유지", startDate: "2021-07-02", monthlyPremium: 23000, renewalDate: addDays(240) },
  { id: "k3", customerId: "c2", productName: "평생 종신보험 (가상)", category: "종신", status: "유지", startDate: "2019-11-20", monthlyPremium: 152000, renewalDate: null },
  { id: "k4", customerId: "c2", productName: "든든 암보험 (가상)", category: "암", status: "유지", startDate: "2022-05-09", monthlyPremium: 54000, renewalDate: null },
  { id: "k5", customerId: "c4", productName: "든든 암보험 (가상)", category: "암", status: "갱신 예정", startDate: "2016-12-01", monthlyPremium: 98000, renewalDate: addDays(30) },
  { id: "k6", customerId: "c4", productName: "행복 연금보험 (가상)", category: "연금", status: "유지", startDate: "2012-04-15", monthlyPremium: 300000, renewalDate: null },
  { id: "k7", customerId: "c5", productName: "실손의료보험 (가상)", category: "실손", status: "유지", startDate: "2024-02-28", monthlyPremium: 19000, renewalDate: addDays(500) },
];