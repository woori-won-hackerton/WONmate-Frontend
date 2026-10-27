import Image from "next/image";
import Link from "next/link";

/** 로고 파일 경로 — public/logo.svg */
export const LOGO_SRC = "/logo.svg";

/**
 * WONmate 로고 (사이드바 · 모바일 상단 바)
 * - 로고 파일만 바꾸려면 public/logo.svg 를 교체하면 돼요
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="WONmate 홈">
      <Image src={LOGO_SRC} alt="" width={36} height={36} priority unoptimized className="size-9 object-contain" />
      <span className="leading-tight">
        <span className="block text-[17px] font-extrabold tracking-tight text-ink">
          <span className="text-brand-600">WON</span>mate
        </span>
        {!compact && <span className="block text-xs text-muted">신입 FC 상담 워크스페이스</span>}
      </span>
    </Link>
  );
}