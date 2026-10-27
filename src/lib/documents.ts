"use client";

/**
 * 원본 PDF 열기 (지식 자료실 · 챗봇 근거 문서)
 * PDF는 로그인 토큰이 필요해서 링크로 바로 못 열고, 받아서 새 탭에 띄워요.
 */
import { backendApi } from "@/lib/backend";
import { toast } from "@/lib/feedback";

/** @param page 열 페이지 (PDF 실제 페이지, 1부터) */
export async function openDocument(documentId: number, page?: number | null) {
  // 팝업 차단을 피하려고 클릭 직후 빈 탭을 먼저 열고, 파일을 받은 뒤 주소를 바꿈
  const tab = window.open("", "_blank");
  if (tab) {
    tab.document.title = "문서를 여는 중…";
    tab.document.body.style.cssText = "font-family:sans-serif;color:#6b7280;display:grid;place-items:center;height:100vh;margin:0";
    tab.document.body.textContent = "문서를 여는 중이에요…";
  }

  try {
    const blob = await backendApi.getDocumentFile(documentId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const target = page && page > 0 ? `${url}#page=${page}` : url;
    if (tab) tab.location.href = target;
    else window.open(target, "_blank");
    // 탭이 PDF를 읽은 뒤 메모리 정리
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    tab?.close();
    toast.error(e instanceof Error && e.message ? e.message : "문서를 열지 못했어요.");
  }
}