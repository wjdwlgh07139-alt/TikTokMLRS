FROM node:20-alpine

WORKDIR /app

# 1. 루트 및 client 패키지 파일 미리 복사 (postinstall 정상 동작을 위해)
COPY package*.json ./
COPY client/package*.json ./client/

# 2. 의존성 패키지 설치
RUN npm install

# 3. 전체 소스 코드 복사
COPY . .

# 4. 프론트엔드 React 앱 빌드 (client/dist 생성)
RUN npm --prefix client run build

# 5. 외부 노출 포트
EXPOSE 3001

# 6. Express 서버 실행
CMD ["npm", "run", "server"]
