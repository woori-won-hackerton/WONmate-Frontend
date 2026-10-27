import {
  BookOpen,
  FileText,
  Home,
  MessageCircle,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** 모바일 하단 탭바용 짧은 이름 */
  short: string;
  icon: LucideIcon;
  /** 모바일 하단 탭바에 노출 여부 (나머지는 햄버거 메뉴에서) */
  tab?: boolean;
  badge?: "pendingTasks";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", short: "홈", icon: Home, tab: true, badge: "pendingTasks" },
  { href: "/customers", label: "담당 고객", short: "고객", icon: Users, tab: true },
  { href: "/prep", label: "상담 준비", short: "상담 준비", icon: Sparkles, tab: true },
  { href: "/qa", label: "AI 챗봇", short: "챗봇", icon: MessageCircle, tab: true },
  { href: "/records", label: "AI 상담 요약", short: "상담 요약", icon: FileText, tab: true },
  { href: "/library", label: "지식 자료실", short: "자료실", icon: BookOpen },
];

/** 로그인 연동 전 데모용 사용자 */
export const CURRENT_FC = {
  name: "한우리",
  branch: "강남지점 3팀",
  tenureMonth: 4,
};