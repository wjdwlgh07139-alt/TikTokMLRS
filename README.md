# 쨰깍 리허설

첫 근무 전, 아이·부모님과의 첫 만남을 짧게 미리 연습해보는 온보딩 보조 도구입니다. 아이/부모 역할극을 3~4턴만 나누고, 대화가 끝나면 코치가 구체적인 피드백을 줍니다.

## 실행 방법

```bash
npm install          # 루트 + client 의존성 설치 (postinstall)
cp .env.example .env # GEMINI_API_KEY 입력 (https://aistudio.google.com/apikey 에서 발급)
npm run dev          # 서버(3001) + 클라이언트(5173) 동시 실행
```

브라우저에서 http://localhost:5173 접속.

## 구조

- `server/index.js` — Express API: `/api/roleplay`(gemini-3.6-flash), `/api/review`(gemini-3.6-flash), `/api/health`
- `server/personas.js` — 8개 시나리오 인물 지시문 + 프롬프트 템플릿 (서버 전용, 클라이언트에 노출되지 않음)
- `client/` — Vite + React 프론트엔드 (home → chat → review)

## 참고

- API 키는 서버 `.env`에만 존재하며 브라우저에 절대 노출되지 않습니다.
- 대화는 사용자(선생님) 발화 3턴 후 서버가 강제로 종료합니다(`done=true`).
- 로그인/DB/결제/카카오 연동 등은 범위 밖이며 구현되어 있지 않습니다(향후 과제).
- 모델 문자열(`server/index.js` 상단 `MODEL_ROLEPLAY`/`MODEL_REVIEW`)은 Gemini 쪽에서 자주 갱신되므로, 필요하면 [모델 목록](https://ai.google.dev/gemini-api/docs/models)을 확인해 교체하세요.
- 원래는 평가(`review`)에 `gemini-2.5-pro`를 쓰려 했으나, 무료 등급(free tier) 할당량이 0이라 429 오류가 났습니다. 결제(billing)를 연결하면 `MODEL_REVIEW`를 `gemini-2.5-pro`로 바꿔 더 깊은 평가를 받을 수 있습니다.
