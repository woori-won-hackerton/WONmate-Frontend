# WONmate — frontend

```bash
npm install
npm run dev   # http://localhost:3000
```

- 데이터는 `src/lib/mock/`의 가상 데이터, AI 응답은 `src/lib/api.ts`의 mock 함수예요.
- 백엔드가 준비되면 `.env.example`을 `.env.local`로 복사해 `NEXT_PUBLIC_API_BASE_URL`을 넣고, `api.ts` 함수만 `fetch`로 교체하면 돼요.
- 데모 데이터는 브라우저 localStorage에 저장돼요. 사이드바 하단 ↺ 버튼으로 초기화.