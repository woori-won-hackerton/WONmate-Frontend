"use client";

/**
 * 백엔드 API 공통 요청 함수
 * - 같은 주소의 /api/... 로 요청 → Next 서버가 백엔드로 전달 (src/app/api/[...path]/route.ts)
 * - 로그인 토큰을 Authorization: Bearer 로 붙임
 * - { isSuccess, code, message, result } 로 감싼 응답은 result만 꺼내고, 안 감싼 응답은 그대로 반환
 * - 토큰 만료(401) → 자동 로그아웃 + 안내
 */
import { mutate } from "swr";
import { useAuthStore } from "@/lib/auth";
import { toast } from "@/lib/feedback";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** false면 토큰을 안 붙이고, 401이어도 자동 로그아웃하지 않음 (로그인 요청용) */
  auth?: boolean;
}

const STATUS_MESSAGE: Record<number, string> = {
  400: "요청 값이 올바르지 않아요.",
  401: "로그인이 필요해요.",
  403: "접근 권한이 없어요. 담당 고객인지 확인해 주세요.",
  404: "요청한 정보를 찾을 수 없어요.",
  422: "처리할 수 없는 요청이에요.",
  500: "서버에서 오류가 났어요. 잠시 후 다시 시도해 주세요.",
  502: "서버 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.",
  503: "서버를 사용할 수 없어요. 잠시 후 다시 시도해 주세요.",
};

type Envelope = { isSuccess?: boolean; message?: string; result?: unknown };

const isEnvelope = (json: unknown): json is Envelope =>
  typeof json === "object" && json !== null && "isSuccess" in json;

function errorMessage(json: unknown, status: number) {
  // 공통 응답 형식이면 백엔드 메시지 사용 (단, 영어 기본 에러 메시지는 제외)
  if (isEnvelope(json) && json.message && /[가-힣]/.test(json.message)) return json.message;
  return STATUS_MESSAGE[status] ?? `요청에 실패했어요. (${status})`;
}

/** 로그아웃 · 토큰 만료 시 화면에 남아있는 서버 데이터 캐시 비우기 */
export function clearRemoteCache() {
  void mutate(() => true, undefined, { revalidate: false });
}

export async function apiRequest<T>(path: string, { method = "GET", body, auth = true }: RequestOptions = {}): Promise<T> {
  const token = auth ? useAuthStore.getState().token : null;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("네트워크에 연결할 수 없어요.", 0);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (res.status === 401 && auth) {
    const { user, signOut } = useAuthStore.getState();
    if (user) {
      signOut();
      clearRemoteCache();
      toast.error("로그인이 만료됐어요. 다시 로그인해 주세요.");
    }
    throw new ApiError("로그인이 만료됐어요.", 401);
  }

  if (!res.ok || (isEnvelope(json) && json.isSuccess === false)) {
    throw new ApiError(errorMessage(json, res.status), res.status);
  }

  return (isEnvelope(json) ? json.result : json) as T;
}