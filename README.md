# 병원 채용공고 알림 프로젝트 (Backend)

이 프로젝트는 대학병원의 채용공고를 스크래핑하고 새로운 공고에 대한 알림을 제공하는 백엔드 서비스입니다.

## 주요 기능

- 대학병원 채용공고 스크래핑
- 스크래핑 데이터 페이지네이션
- 새로운 채용공고 알림 기능
- 키워드 기반 알림 필터링

## 기술 스택

- [NestJS](https://nestjs.com/): 효율적이고 확장 가능한 Node.js 서버 사이드 애플리케이션을 구축하기 위한 프레임워크
- [PostgreSQL](https://www.postgresql.org/): 강력한 오픈소스 관계형 데이터베이스
- [pnpm](https://pnpm.io/): 빠르고 디스크 공간 효율적인 패키지 매니저

## 설치 및 실행

### 로컬 환경에서 실행

1. 저장소 클론

   ```
   git clone https://github.com/kilhyeonjun/medical-recruit-be.git
   cd medical-recruit-be
   ```

2. pnpm 설치 (아직 설치하지 않은 경우)

   ```
   npm install -g pnpm
   ```

3. 의존성 설치

   ```
   pnpm install
   ```

4. 환경 변수 설정
   `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요. (자세한 내용은 아래 '환경 변수' 섹션 참조)

5. 데이터베이스 설정
   PostgreSQL 데이터베이스를 생성하고 연결 정보를 환경 변수에 설정하세요.

6. 애플리케이션 실행

   ```
   pnpm start
   ```

   개발 모드로 실행하려면:

   ```
   pnpm run start:dev
   ```

## 환경 변수

프로젝트 실행을 위해 다음 환경 변수들을 설정해야 합니다. `.env` 파일을 생성하고 아래 형식으로 값을 채워넣으세요:

```
HASHED_API_KEY=your_hashed_api_key
DATABASE_HOST=your_database_host
DATABASE_PORT=your_database_port
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=your_database_name
SSL_CERTIFICATE_S3_BUCKET=your_s3_bucket_name
SSL_CERTIFICATE_S3_KEY=your_s3_key
SMTP_SERVICE=your_smtp_service
SMTP_SECURE=true_or_false
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

주의: 실제 값들은 안전하게 보관하고, 버전 관리 시스템에 직접 추가하지 마세요.

## 기여하기

프로젝트 기여를 환영합니다! 버그 리포트, 기능 제안 또는 풀 리퀘스트를 제출해 주세요.

## 연락처

프로젝트에 대한 질문이나 제안이 있으시면 kboxstar@gmail.com로 연락주세요.
