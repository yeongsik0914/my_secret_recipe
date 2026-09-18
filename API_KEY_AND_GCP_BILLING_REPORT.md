# 📊 키친 셰프 (Kitchen Chef) API Key, GCP 토큰 및 과금 현황 보고서

> **문서 버전**: v1.0.0  
> **작성 일자**: 2026-09-18  
> **조사 대상**: 프로젝트 내 전체 소스코드(Frontend, Backend, Config, Agents, Documentation)  
> **요약 결론**: **현재까지 발생한 실제 청구 요금은 0원($0.00, 완전 무료)이며, 외부 클라우드 결제형 API를 직접 호출하지 않는 Zero-Cost 하이브리드 로컬 아키텍처로 안전하게 보호 및 운영되고 있습니다.**

---

## 1. 📌 총괄 요약 (Executive Summary)

| 항목 | 현재 상태 | 상세 내용 |
|---|:---:|---|
| **현재까지 발생 과금액** | **0원 ($0.00)** | GCP, Firebase, 외부 유료 API 실결제 호출 내역 없음 (청구액 0원) |
| **GCP 토큰 관리 상태** | **안전 (미발급/미연동)** | 서비스 계정 키(`serviceAccountKey.json`) 및 gcloud 결제 계정 미연동 |
| **API Key 관리 상태** | **안전 (Mock/격리)** | 프론트엔드는 가상 Mock 키 사용, 백엔드는 환경변수 기반 스마트 폴백 구동 |
| **데이터베이스 비용** | **0원** | Cloud Firestore 대신 원자적 파일 스토어(`backend/data/admin_store.json`) 에뮬레이션 |
| **음성 TTS 비용** | **0원** | Google Cloud TTS 대신 브라우저 내장 Web Speech API(`window.speechSynthesis`) 활용 |
| **비전 AI 비용** | **0원** | Gemini API Key 부재 시 고지능 룰베이스 스마트 Fallback 엔진 가동 |

---

## 2. 🔍 모듈별 API Key & GCP 토큰 상세 점검 내역

### 2.1 Firebase 인증 및 Firestore DB (User & Fridge Store)
- **점검 파일**: `frontend/js/firebase-config.js`, `js/firebase-config.js`, `backend/server.py`
- **현재 구현 방식**:
  - `firebase-config.js`에 `apiKey: "AIzaSyMockKitchenChefKey1234567890"`와 같은 **모의(Mock) 키**가 설정되어 있습니다.
  - SDK 로딩 여부와 키의 유효성을 체크하는 하이브리드 가드가 내장되어 있어, Mock 키 상태에서는 실제 Google Cloud 엔드포인트로 유료 트래픽을 전송하지 않고 **로컬 스토리지(LocalStorage) 및 자체 백엔드 REST API**로 즉시 전환됩니다.
  - 백엔드(`backend/server.py`)는 `firebase_python.md` 기획서에 명시된 `/users/{uid}` 표준 스키마(Document ID = `uid`, `providers`, `role`, `tier` 등)를 로컬 파일 데이터베이스(`backend/data/admin_store.json`)로 완벽하게 에뮬레이션하여 영구 보존 및 구글 계정 통합(Account Linking)을 수행합니다.
- **과금 여부**: **0원 (과금 없음)**

### 2.2 비전 AI 식재료 인식 (Vision & Inventory Agent)
- **점검 파일**: `backend/agents/vision_agent.py`, `frontend/js/harness/vision-agent.js`
- **현재 구현 방식**:
  - `backend/agents/vision_agent.py`는 `GEMINI_API_KEY` 환경변수가 주입되어 있을 때에만 Google GenAI SDK(`client = genai.Client()`)를 호출하도록 설계되어 있습니다.
  - 현재 로컬 및 서버 환경에 해당 API Key가 설정되어 있지 않으므로, 예외를 안전하게 포착(`except Exception`)하여 내장된 **지능형 스마트 폴백 엔진(`_smart_fallback`)과 한글 정규식 기반 자연어 파서(`parse_natural_text`)**가 100% 무과금으로 대체 처리합니다.
  - 프론트엔드 역시 클라이언트 측 자체 규칙 기반 파서를 내장하고 있어 외부 요청이 발생하지 않습니다.
- **과금 여부**: **0원 (과금 없음)**

### 2.3 조리 순서 음성 안내 가이드 (AI TTS)
- **점검 파일**: `frontend/js/app.js`, `js/app.js`
- **현재 구현 방식**:
  - Google Cloud Text-to-Speech API와 같은 유료 클라우드 보이스 API를 사용하지 않습니다.
  - 사용자의 웹 브라우저 및 운영체제에 기본 탑재된 순수 **Web Speech API (`window.speechSynthesis`, `SpeechSynthesisUtterance`)**를 구동합니다.
  - 한국어 전용 보이스(`ko-KR`, `Yuna`, `Sora` 등)를 클라이언트 로컬 하드웨어 합성 엔진으로 직접 호출하므로 네트워크 트래픽이나 GCP 과금이 원천적으로 발생할 수 없습니다.
- **과금 여부**: **0원 (영구 무과금)**

### 2.4 레시피 탐색 및 유튜브 영상 연동 (Search Agent)
- **점검 파일**: `frontend/js/recipes-data.js`, `backend/domain/recipes_data.py`
- **현재 구현 방식**:
  - YouTube Data API v3의 유료 할당량(Quota)이나 API Key를 소비하는 검색 방식 대신, 사전 검증된 한국 공인 셰프 영상 데이터셋과 유튜브 공식 무료 표준 임베드(`iframe`) 방식을 사용합니다.
- **과금 여부**: **0원 (무과금)**

### 2.5 이메일 인증 발송 엔진 (SMTP Engine)
- **점검 파일**: `backend/data/smtp_config.json`, `backend/server.py`
- **현재 구현 방식**:
  - SendGrid, AWS SES 등 유료 메일 발송 SaaS를 이용하지 않고 표준 TLS 포트(587)를 이용하는 Python 내장 `smtplib` 모듈을 사용합니다.
  - 메일 설정값이 비어 있는 경우 터미널 인증 로그 및 백엔드 파일 기록으로 안전하게 폴백되어 추가 비용이 발생하지 않습니다.
- **과금 여부**: **0원 (무과금)**

---

## 3. 🛡️ 보안 관리 및 토큰 유출 방어 현황

1. **Git 저장소 유출 차단 (`.gitignore`)**:
   - `.env`, `.env.*`가 `.gitignore`에 등록되어 있어 환경변수 파일이 실수로 GitHub 원격 저장소(`origin/main`)에 커밋되는 사고를 방지하고 있습니다.
   - 서비스 계정 키 파일(`serviceAccountKey.json`, `*credentials*.json`) 역시 Git 추적에서 원천 배제되어 있습니다.

2. **GCP CLI 및 클라우드 결제 계정 연결 상태**:
   - 로컬 작업 환경에 `gcloud` CLI 도구 및 GCP 서비스 계정이 연동되어 있지 않으므로, 백그라운드 프로세스에 의한 돌발적인 클라우드 리소스 생성이나 과금 발생 가능성이 **0%**입니다.

3. **클라이언트 코드 내 민감정보 부재**:
   - 브라우저에 전달되는 JavaScript 파일에 실제 유료 결제가 연결된 GCP API Key, 프라이빗 시크릿 토큰이 하드코딩되어 있지 않습니다.

---

## 4. 💡 향후 실제 상용 GCP / Firebase 연동 시 과금 가이드 및 전략

향후 프로젝트를 실제 상용 Google Cloud / Firebase 프로젝트에 정식 배포·연동할 경우를 위한 권장 가이드입니다:

### 4.1 Firebase 무료 티어 (Spark 요금제) 극대화 전략
Firebase의 기본 무료 요금제(Spark Plan)만으로도 초기 서비스 단계에서 **비용 0원**으로 충분히 운영 가능합니다:
* **Firebase Authentication**: 월간 활성 사용자(MAU) **50,000명까지 완전 무료**
* **Cloud Firestore**:
  * 저장 용량: **1 GiB 무료**
  * 일일 읽기(Read): **50,000회/일 무료**
  * 일일 쓰기(Write): **20,000회/일 무료**
  * 일일 삭제(Delete): **20,000회/일 무료**
* *팁: 현재 적용된 로컬 캐싱(LocalStorage) 및 배치 쓰기 구조를 유지하면 일 5만 회 무료 한도를 거의 초과하지 않습니다.*

### 4.2 비용 폭탄 방지 (GCP Budget Alerts) 설정 3단계
실제 결제 프로필을 연결하게 될 경우 반드시 아래 설정을 적용해야 합니다:
1. **Google Cloud Console > 결제(Billing) > 예산 및 알림(Budgets & Alerts)** 이동
2. 월간 예산(예: $5 또는 10,000원) 설정
3. 예산의 **50%, 90%, 100% 도달 시 이메일 및 슬랙 알림** 트리거 활성화

### 4.3 API Key 보안 권장 사항
1. **HTTP 리퍼러(Referrer) 제한**: Google Cloud Console의 API 키 설정에서 허용 도메인을 본인 서비스 도메인(`localhost:8080`, `https://yourdomain.com/*`)으로만 제한.
2. **API 스코프 제한**: 해당 키로 접근 가능한 API를 `Firebase Authentication`, `Cloud Firestore API`로만 한정하여 다른 유료 API 도용 원천 차단.

---

## 5. 📋 요약 결론

* **현재까지 청구된 요금**: **₩0 ($0.00)**
* **GCP 토큰 / API 키 관리 수준**: **우수 (결제형 키 미사용, Mock 및 지능형 로컬 스마트 폴백 완비)**
* **보안 안전성**: GitHub 저장소에 어떠한 유료 GCP 토큰이나 개인 비밀키도 유출되지 않은 **완전 클린(Clean) 상태**입니다.
