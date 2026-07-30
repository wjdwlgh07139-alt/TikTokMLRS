# --- 1단계: 빌드 스테이지 ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 만약 Gemini API 키를 환경변수로 주입해야 한다면 빌드 시점에 넣어줍니다.
# (Vite 기준: VITE_로 시작해야 프론트엔드 코드에서 인식합니다.)
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

# --- 2단계: 실행 스테이지 (경량 Nginx) ---
FROM nginx:alpine
# 빌드된 결과물만 Nginx의 웹 루트 폴더로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# React Router(SPA)를 사용할 때 404 에러를 방지하기 위한 Nginx 설정
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]