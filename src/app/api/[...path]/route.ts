import type { NextRequest } from "next/server";

/**
 * 백엔드 프록시: 브라우저의 /api/** 요청을 BACKEND_URL/api/** 로 그대로 전달
 * - 브라우저 입장에서는 같은 주소라 백엔드에 CORS 설정이 없어도 동작
 * - BACKEND_URL 은 서버 실행 시점의 환경변수 (도커는 docker run -e BACKEND_URL=... 로 지정)
 */
export const dynamic = "force-dynamic";

const FORWARD_REQUEST_HEADERS = ["authorization", "content-type", "accept"];

function json(status: number, message: string) {
  return Response.json({ isSuccess: false, code: `PROXY${status}`, message, result: null, error: null }, { status });
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return json(503, "BACKEND_URL 환경변수가 설정되지 않았어요.");
  }

  const { path } = await ctx.params;
  const target = new URL(`/api/${path.map(encodeURIComponent).join("/")}`, backendUrl);
  target.search = req.nextUrl.search;

  const headers = new Headers();
  FORWARD_REQUEST_HEADERS.forEach((name) => {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  });

  const hasBody = !["GET", "HEAD"].includes(req.method);

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    // 압축은 fetch가 이미 풀었으므로 content-type만 넘김
    const resHeaders = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) resHeaders.set("content-type", contentType);

    return new Response(res.body, { status: res.status, headers: resHeaders });
  } catch {
    return json(502, "백엔드 서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.");
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };