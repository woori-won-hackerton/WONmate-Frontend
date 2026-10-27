import Link from "next/link";

/**
 * WONmate 워드마크 (오리지널 플레이스홀더).
 * 공식 로고 파일을 받으면 public/에 넣고 이 컴포넌트만 교체하세요.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="WONmate 홈">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-600 to-sky-accent text-base font-extrabold text-white shadow-sm">
        W
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-extrabold tracking-tight text-ink">
          <span className="text-brand-600">WON</span>mate
        </span>
        {!compact && <span className="block text-xs text-muted">신입 FC 상담 워크스페이스</span>}
      </span>
    </Link>
  );
}