# 키친 셰프 (Kitchen Chef) - 하네스 기반 멀티 에이전트 레시피 웹 플랫폼

> **"도마 위에 펼쳐진 오늘의 추천 레시피"**  
> 사용자의 개인 냉장고 속 식재료를 기반으로, 하네스(Harness) 기반의 멀티 에이전트가 한국 인기 유튜브 및 웹 데이터를 검증하여 최적의 요리를 추천하고, 조리 시 냉장고 재고를 실시간 자동 소진하는 지능형 키친 플랫폼입니다.

---

## 📌 주요 특징 (Key Features)

1. **사용자별 개인 냉장고 및 영구 보존**
   - 사용자 계정별 독립 냉장고 상태 관리 (LocalStorage 기반).
   - 신선 채소/과일, 육류/해산물, 유제품/달걀, 양념/소스 등 선반별 재고 및 신선도 관리.

2. **지능형 식재료 입력 (Vision AI & 텍스트 직접 입력)**
   - **사진 이미지 첨부**: 냉장고 내부 사진 또는 장보기 영수증을 업로드하면 Vision Agent가 재료와 수량, 권장 보관 위치를 자동 파싱하여 냉장고에 등록.
   - **간편 텍스트 입력**: 식재료명, 수량, 보관 칸을 손쉽게 추가.

3. **2초 강제 냉장고 오픈 & 재료 추출 3D 인터랙티브 애니메이션**
   - 레시피 추천 요청 시 3D 양문형 냉장고가 열리고, 선택된 식재료들이 공중으로 튀어나와 도마 위로 떨어지는 모션 연출.
   - 최소 2초 동안 하네스 멀티 에이전트의 파이프라인 분석 과정과 카운트업 타이머를 시각적으로 제공.

4. **한국 데이터 기반 검증된 최적 레시피 큐레이션**
   - 유튜브 공인 채널(백종원의 요리비책, 뚝딱이형, 하루한끼 등) 기반 데이터.
   - `agents.md` 표준에 따라 **조회수(10만+), 구독자수(5만+), 인기순, 재료 일치율(70%+)** 을 통과한 한국인 맞춤형 레시피만 엄선 제공.
   - 우드 도마 크래프트(OAK, MAPLE, WALNUT 등) 프리미엄 카드 UI.

5. **실시간 냉장고 재료 자동 소진 (Inventory Deduction)**
   - 레시피 조리 시작/완료 시 해당 요리에 소모된 재료가 개인 냉장고에서 즉시 차감.
   - 소진된 재료에 대한 '장보기 추가' 안내 및 실시간 재고 반영.

6. **완식 인증 및 커뮤니티**
   - 조리 완료 도장 및 인증서 발급.
   - 나만의 조리 팁, 별점, 사진 후기를 공유하는 인터랙티브 커뮤니티.

7. **Firebase Auth 연동 및 실제 구글 계정 간편 로그인, 1시간 세션 관리**
   - 첫 접속 시 로그인 모달 자동 노출 및 미인증 보호.
   - 실제 구글 계정(`22 songpa`, `YUJIN H`) 선택 모달 UI 및 원클릭 간편 로그인.
   - 1시간 로그인 세션 유지 (자동 만료 로그아웃 및 헤더 우측 상단 실시간 카운트다운 타이머 탑재).
   - 헤더 우측 상단 프로필 알약(Pill) UI & 사용자 등급/아바타 연동 및 로그아웃 드롭다운 메뉴 지원.
   - 모던 다크 글래스모피즘 기반 프리미엄 인증 모달 CSS 리디자인.

8. **회원 계정 총괄 관리자(Admin) 전용 콘솔 & 6대 거버넌스 제어 권한**
   - **총괄 관리자 전용 계정**: `admin@kitchenchef.com` / `admin1234!` 및 인증 모달 내 원클릭 빠른 로그인 버튼 지원.
   - **권한 1 (계정 및 세션/보안 제어)**: 전체 회원 목록 조회, 실시간 검색/필터, 원클릭 강제 세션 만료, 계정 제재(Suspension) 및 정상 복구.
   - **권한 2 (회원별 등급 및 칭호 수동 교정)**: Lv.1~Lv.4 등급 및 칭호, 누적 완식 횟수(`cookCount`) 즉시 교정 및 세션 동기화.
   - **권한 3 (개인 냉장고 재고 관리 & Vision 오인식 교정)**: 회원별 4대 선반 재고 실시간 열람, 6대 기본 식재료 스냅샷 복구, Vision AI 오인식 오류 로그 확인 및 보관칸 수동 교정.
   - **권한 4 (커뮤니티 및 콘텐츠 모더레이션)**: 불량 후기 블라인드(`hidden`), 영구 삭제, `[👑 베스트 노하우]` 핀 수동 지정/해제.
   - **권한 5 (AI 에이전트 자원 사용량 및 활동 통계)**: 5대 하네스 에이전트 파이프라인 가동률, 지연 시간(ms), Gemini Vision 멀티모달 통계.
   - **권한 6 (관리자 권한 및 감사 로그 Audit Trail)**: 관리자 작업 전수 타임라인 기록, 카테고리 필터링 및 JSON/CSV 내보내기 지원.

9. **회원 가입/생성 시점 DB 영속화 & 실시간 관리자 동기화 (Two-way Persistence & Sync)**
   - **회원 생성 시점 원격 DB 영속화**: Firebase Auth 및 Google 간편 가입 시 Firestore `users/{uid}` 도큐먼트 생성 및 백엔드 REST API(`POST /api/users`)를 동시 호출하여 서버 파일 DB(`backend/data/admin_store.json`)에 즉시 영속화.
   - **실시간 양방향 관리자 동기화**: 관리자 화면 진입 및 탭 전환 시 `GET /api/admin/users` 및 Firestore 클라우드 유저 풀을 실시간 취합/병합하여 신규 가입자가 관리자 화면에 즉시 표출.
   - **개인 냉장고 재고 백엔드 동기화**: 사용자가 냉장고 재료를 추가/수정/소진할 때마다 `POST /api/fridge/sync`를 통해 서버에 자동 저장되며, 관리자가 실시간으로 유저별 최신 재고(`GET /api/admin/fridge/<userId>`)를 모니터링 가능.

10. **회원 DB 등록 계정 대상 엄격한 로그인 검증 & 시드(Seed) 계정 자동 세팅**
    - **미등록 계정 차단 & 경고 배너**: DB에 등록되지 않은 이메일이나 잘못된 비밀번호 입력 시 세션 발급을 엄격히 차단하고, 흔들림 애니메이션 인라인 경고 배너(`#sign-form-alert`)를 노출하며 로그인 모달을 유지.
    - **초기 시드 계정 자동 생성**: DB가 비어있어도 즉시 테스트할 수 있도록 총괄 관리자(`admin@kitchenchef.com` / `admin1234!`) 및 일반 회원(`user@kitchenchef.com` / `user1234!`) 초기 데이터를 자동 세팅.
    - **원클릭 빠른 입력 칩**: 로그인 모달 내에 시드 계정 단축 칩을 탑재하여 클릭 한 번으로 테스트 계정 정보를 자동 입력.
11. **서비스 이용 필수 로그인 가드 & 관리자 권한 동적 부여 거버넌스**
    - **필수 로그인 정책 (Auth Guard)**: 비로그인 상태에서는 냉장고 및 레시피 서비스를 이용할 수 없도록 로그인 모달을 잠그고 닫기(✕ 버튼 및 배경 클릭) 및 메뉴 이동을 전면 차단.
    - **관리자 권한 동적 부여/회수**: 총괄 관리자가 관리자 콘솔에서 임의의 일반 회원에게 관리자(Admin) 권한을 직접 부여하거나 회수할 수 있으며, 서버 DB(`admin_store.json`) 및 감사 로그에 실시간 기록.
    - **정돈된 프로덕션 로그인 UI**: 하드코딩된 더미 계정, 테스트용 시드 칩, 빠른 로그인 버튼을 제거하고 항상 깨끗한 빈칸 입력란을 유지.

---

## 🏗️ 최신 트렌드 표준 디렉토리 구조 트리 (Architecture Tree)

본 프로젝트는 최신 소프트웨어 엔지니어링 표준(Layered / Clean Architecture)을 적용하여 **HTML, CSS, JavaScript, Python** 계층이 명확하게 분리되어 있습니다.

```
My secret recipe/
├── backend/                             # 🐍 [Python] 백엔드 & 에이전트 엔진
│   ├── server.py                        # Python 통합 서버 (REST API + 정적 파일 서빙 + SSR 모듈 결합)
│   ├── config.py                        # 서버 설정 및 환경 변수
│   ├── agents/                          # Python 기반 하네스 멀티 에이전트 모듈
│   │   ├── __init__.py
│   │   ├── orchestrator.py              # 파이프라인 총괄 오케스트레이터
│   │   ├── vision_agent.py              # 영수증/식재료 OCR 분석 에이전트
│   │   ├── search_agent.py              # 유튜브 및 웹 레시피 탐색 에이전트
│   │   ├── quality_agent.py             # agents.md 규칙 검증 에이전트
│   │   └── deduction_agent.py           # 냉장고 재고 실시간 차감 에이전트
│   └── domain/                          # 도메인 모델 및 데이터 정의
│       ├── __init__.py
│       ├── models.py                    # 식재료, 레시피, 유저, 후기 데이터 모델
│       └── recipes_data.py              # 한국 인기 유튜브 기반 레시피 데이터셋
│
├── views/                               # 📄 [HTML] 6대 독립 뷰 섹션 컴포넌트
│   ├── view-main.html                   # View 1: 재료 입력 & 냉장고 재고
│   ├── view-animation.html              # View 2: 3D 냉장고 오픈 & 애니메이션
│   ├── view-recipes.html                # View 3: 도마 레시피 목록 카드
│   ├── view-detail.html                 # View 4: 도마 위 상세 조리 (YouTube/TTS)
│   ├── view-community.html              # View 5: 조리 완료 커뮤니티 & 후기
│   └── view-admin.html                  # View 6: 총괄 관리자(Admin) 6대 권한 콘솔
│
├── frontend/                            # 🎨 [Frontend] 프론트엔드 리소스 계층
│   ├── html/                            # 📄 [HTML] 구조 및 템플릿 계층
│   │   ├── index.html                   # 메인 뷰 마크업 (인증 모달 & 관리자 모듈 플레이스홀더)
│   │   └── views/                       # 6대 뷰 섹션 미러링 디렉토리 (view-admin.html 포함)
│   ├── css/                             # 🎨 [CSS] 스타일시트 계층
│   │   ├── style.css                    # 키친 셰프 디자인 시스템, 인증 & 관리자 콘솔 스타일
│   │   ├── fridge-3d.css                # 3D 냉장고 오픈 & 재료 추출 애니메이션
│   │   └── responsive.css               # 반응형 미디어 쿼리
│   ├── js/                              # ⚡ [JavaScript] 클라이언트 로직 계층
│   │   ├── app.js                       # UI 이벤트, 뷰 컨트롤러, 1시간 타이머 & 관리자 콘솔 제어
│   │   ├── firebase-config.js           # Firebase Auth, 구글 로그인 & 관리자 빠른 인증 모듈
│   │   ├── view-loader.js               # 뷰 섹션 비동기 모듈 로더
│   │   ├── store.js                     # 개인 냉장고, 회원/세션 관리, 관리자 거버넌스 API 연동
│   │   ├── recipes-data.js              # 프론트엔드 레시피 데이터셋
│   │   └── harness/                     # 프론트엔드 하네스 모듈
│   │       ├── agent-core.js            # 이벤트 버스 및 파이프라인 코어
│   │       ├── vision-agent.js          # 비전 파싱 에이전트
│   │       ├── search-agent.js          # 레시피 검색 에이전트
│   │       └── quality-agent.js         # 품질 검증 에이전트
│   └── assets/                          # 🖼️ [Assets] 정적 미디어 에셋 계층
│       └── images/                      # icon.png, 구글 아바타(songpa22, yujin) 등
│
├── agents.md                            # 멀티 에이전트 표준 규칙 & 하네스 명세서
├── readme.md                            # 프로젝트 구조 트리 및 실행 매뉴얼 (본 문서)
├── log.md                               # 구조 개편, 이슈 해결 및 개발자별 기여 로그
├── requirements.txt                     # Python 의존성 패키지 명세
└── index.html                           # 루트 엔트리포인트 (인증 모달 & 관리자 뷰 플레이스홀더)
```

---

## 🚀 실행 방법 (Local Run)

### 1) Python 백엔드 통합 서버 실행 (권장)
REST API 엔드포인트(`/api/recipes`, `/api/recommend`, `/api/admin/*` 등)와 프론트엔드 정적 파일이 동시에 제공됩니다.

```bash
# Python 백엔드 통합 서버 실행 (포트 8080)
python3 backend/server.py
```

### 2) 가벼운 정적 웹서버 실행
```bash
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080`으로 접속하여 즉시 이용할 수 있습니다.

---

## 👥 개발팀 및 기여자 (Team & Contributors)

본 프로젝트는 3인의 개발자가 협업하여 설계, 개발 및 지속적인 유지보수를 진행하고 있습니다. 모든 업데이트 및 이슈 해결 내역에는 **담당 개발자의 GitHub 사용자명**을 명시하여 투명한 기여 관리를 수행합니다.

| 개발자 (GitHub ID) | 역할 및 주요 담당 분야 | 상태 |
|---|---|---|
| **[@yeongsik0914](https://github.com/yeongsik0914)** | Fullstack Architecture, Multi-Agent Harness, Server Integration, Admin Console Platform | Active (Lead) |
| **[@uzzi-121](https://github.com/uzzi-121)** | Frontend Auth & UI/UX, Firebase / Google SNS 로그인, 1시간 세션 관리, Admin UI 컴포넌트 | Active |
| **[@sllm05](https://github.com/sllm05)** | Vision AI 멀티모달 인식, 보관함 선반 자동 분류, Vision 오류 감사 및 재고 복구 로직 | Active |

---

## 📝 업데이트 히스토리 (Changelog)

| 버전 | 일자 | 개발자 (Author) | 업데이트 내용 |
|---|---|---|---|
| **v1.5.3** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **서비스 필수 로그인 강제, 관리자 권한 부여 기능 추가, 입력창 상시 공백화 및 테스트 버튼 제거**:<br/>  1. **필수 로그인 가드**: 비인증 게스트의 서비스 접근을 차단하고 로그인 모달 잠금(닫기 방지, 배경 클릭 차단, 탭 이동 가드)<br/>  2. **관리자 권한 부여/회수 거버넌스**: 관리자 콘솔 회원 목록에서 일반 회원에게 관리자(Admin) 권한 원클릭 부여/회수 기능(`POST /api/admin/users/role`) 및 감사 로그 연동<br/>  3. **입력창 상시 공백화**: 이메일/비밀번호 입력란 초기값 제거 및 모달 열기/탭 전환 시 항상 빈칸 유지<br/>  4. **테스트/빠른 로그인 버튼 정리**: 모달 내 테스터용 등록 계정 빠른 입력 칩 박스 및 총괄 관리자 빠른 로그인 버튼 완전 제거 |
| **v1.5.2** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **회원 DB 등록 사용자 대상 로그인 인증 검증, 미등록 계정 차단 및 초기 시드 계정 자동 세팅**:<br/>  1. **로그인 검증 및 미등록 계정 차단**: 회원 DB/백엔드(`/api/auth/login`) 및 로컬 레지스트리에 등록된 사용자만 로그인 허용, 미등록 계정 로그인 시 세션 발급 차단 및 인라인 경고 배너(`sign-form-alert`) 노출 후 모달 유지<br/>  2. **비밀번호 검증 및 보안 강화**: 비밀번호 불일치(401 `INVALID_PASSWORD`) 및 계정 정지(403) 차단 로직 구현<br/>  3. **초기 시드 계정 자동 세팅**: DB가 비어있을 경우 테스트 가능한 총괄 관리자(`admin@kitchenchef.com` / `admin1234!`) 및 기본 유저(`user@kitchenchef.com` / `user1234!`) 자동 등록<br/>  4. **로그인 UI/UX 개선**: 하드코딩된 더미 입력값 제거, 빠른 테스트용 시드 계정 원클릭 입력 칩 제공, 흔들림 애니메이션 경고 배너 적용 |
| **v1.5.1** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **Google Identity Services API 연동 및 Firebase 사용자 영구 등록 시스템 구축**:<br/>  1. **공식 Google API 연동**: Google Identity Services(GIS) 클라이언트 라이브러리(`accounts.google.com/gsi/client`) CDN 탑재, 클라이언트 초기화, ID 토큰 JWT 디코딩 파서(`parseGoogleJwt`) 및 계정 인증 지원<br/>  2. **Firebase Auth & Firestore 자동 사용자 등록**: Google API로 간편 가입/로그인한 사용자를 Firebase Auth 및 Cloud Firestore(`users/{uid}`)에 영구 등록하고 하이브리드 레지스트리(`firebase_registered_users_registry`)와 동기화<br/>  3. **전용 클라우드 냉장고 자동 생성**: Google API로 신규 가입한 사용자에게 '초보 셰프 Lv.1' 등급 부여 및 독립된 클라우드 냉장고(`syncFridgeToCloud`) 자동 생성<br/>  4. **인증 상태 시각화 및 피드백**: 계정 관리 모달에 'Google API' 및 '🔥 Firebase 등록됨' 배지, Firebase 연동 UID 표시 및 성공 토스트 피드백 연동<br/>  5. **백엔드 REST API 연동**: `/api/auth/google/register` 및 `/api/auth/firebase/status` 엔드포인트 신설 |
| **v1.5.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914)<br/>[@uzzi-121](https://github.com/uzzi-121) | - **총괄 관리자(Admin) 계정 및 6대 거버넌스 제어 콘솔 전면 구축**:<br/>  1. **총괄 관리자 계정 체계**: `admin@kitchenchef.com` / `admin1234!` 계정 및 로그인 모달 내 `[🛡️ 총괄 관리자(Admin) 빠른 로그인]` 원클릭 인증 지원<br/>  2. **권한 1 (계정 및 인증/세션 관리)**: 전체 회원 목록 조회, 실시간 이름/이메일/상태 검색·필터링, 원클릭 강제 세션 만료, 계정 제재(Suspension) 및 정상 복구<br/>  3. **권한 2 (회원별 등급 조회 및 수정)**: Lv.1~Lv.4 등급 및 칭호 부여, 누적 완식 횟수(`cookCount`) 수동 교정, 즉시 사용자 세션 동기화<br/>  4. **권한 3 (개인 냉장고 및 재고 데이터 관리)**: 회원별 4대 선반(채소·육류·유제품·양념) 재고 실시간 열람, 6대 기본 식재료 스냅샷 복구, Vision AI 오인식 오류 로그 확인 및 보관칸 수동 교정<br/>  5. **권한 4 (커뮤니티 및 콘텐츠 관리)**: 불량 후기 블라인드(`hidden`), 영구 삭제, 우수 조리 팁 `[👑 베스트 노하우]` 핀 수동 토글<br/>  6. **권한 5 (AI 에이전트 자원 사용량 및 활동 통계)**: 5대 하네스 에이전트 가동률, 실시간 응답 지연 시간(ms), Gemini Vision 멀티모달 인식 통계 및 시스템 헬스 대시보드<br/>  7. **권한 6 (관리자 권한 및 감사 로그)**: 관리자 작업 전수 타임라인 기록(Audit Trail), 카테고리 필터링, JSON/CSV 다운로드 내보내기 지원<br/>  8. **비관리자 접근 보호(Access Guard)**: 비관리자 로그인 시 네비게이션 탭 자동 은닉 및 URL 직접 접근 시 차단 화면 표출 |
| **v1.4.2** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **Google 계정 선택 기반 간편 회원가입 및 간편 로그인 연동**:<br/>  1. 로그인/회원가입 모달 탭 전환에 따른 SNS 영역 안내 문구 및 버튼 라벨 실시간 최적화 (`SNS 간편 회원가입`, `Google 계정으로 간편 가입`)<br/>  2. Google 계정 선택 모달(Account Chooser)을 통한 등록 계정(`22 songpa`, `YUJIN H`) 원클릭 인증 및 인라인 커스텀 계정 입력 폼 신설<br/>  3. 구글 계정으로 신규 회원가입 시 개인 전용 독립 냉장고 즉시 생성 및 성공 토스트 피드백 연동 |
| **v1.4.1** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **식재료 입력 선반 매핑 정상화, 신선도 도트 표시 및 맞춤 프롬프트 레시피 합성**:<br/>  1. 선반 드롭다운 옵션에 위치 명칭 병기 (`(야채칸 보관)`, `(신선실/육류칸)` 등)<br/>  2. 직접 식재료 입력 시 선반 선택 우선 반영 및 100여 개 한국어 식재료 자동 분류 키워드 대폭 보강<br/>  3. 각 식재료 칩별 신선도 컬러 도트(초록/주황) 적용 및 불필요한 범례 정리<br/>  4. 맞춤 요리 프롬프트 실시간 태그 표시 및 AI 맞춤 특선 레시피 합성 연동 |
| **v1.4.0** | 2026-09-17 | [@uzzi-121](https://github.com/uzzi-121) | - **Firebase Auth 연동, Google 간편 로그인 모달(실제 계정 선택), 1시간 세션 관리 및 원격 병합**:<br/>  1. 첫 접속 시 로그인 모달 자동 노출 및 미인증 접근 보호 (모달 임의 닫기 방지)<br/>  2. Google SNS 간편 로그인 연동: 실제 계정(`22 songpa`, `YUJIN H`) 선택 모달 팝업 및 원클릭 계정 연동<br/>  3. 1시간 로그인 유지 세션 관리 및 헤더 실시간 카운트다운 타이머(`⏳ 59:59`) 탑재 (만료 시 자동 로그아웃)<br/>  4. 헤더 우측 상단 프로필 알약(Pill) UI 리디자인, 등급 뱃지/아바타 연동 및 로그아웃 드롭다운 메뉴 구축<br/>  5. 웹사이트 분위기에 맞춘 모던 다크 글래스모피즘 인증 모달 CSS 전면 리디자인<br/>  6. GitHub 원격 저장소(`origin/main`)의 최신 작업(재료 개별 삭제 ✕ 버튼, `detectShelf`, 비전 초기화 등)과 로컬 작업을 충돌 없이 완벽 병합 및 Push 완료 (`8f58aa5`) |
| **v1.3.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **5대 핵심 뷰 섹션 HTML 독립 모듈화 및 하이브리드 연동**:<br/>  1. 거대한 단일 `index.html`에서 5대 뷰 섹션을 각각 `views/view-main.html`, `view-animation.html`, `view-recipes.html`, `view-detail.html`, `view-community.html`로 독립 분리<br/>  2. 비동기 뷰 로더(`view-loader.js`)를 신설하여 정적 환경에서 플레이스홀더를 비동기 병렬 주입<br/>  3. Python 백엔드(`backend/server.py`)에 SSR 사전 결합 렌더링 로직(`render_assembled_html`) 및 `/views/` 라우팅 추가로 깜빡임(FOUC) 없는 첫 화면 로딩 보장 |
| **v1.2.1** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **유튜브 영상 재생 및 한국어 TTS 음성 엔진 강화 (핫픽스)**:<br/>  1. 검증된 실제 YouTube 영상 ID(`N_7i62FEKkk`, `A5Qg-JriOX4`, `rjhoBi-mhMk`)로 교체 및 `strict-origin-when-cross-origin` 보안 정책 적용<br/>  2. 상세 조리 화면에 `[▶️ YouTube 원본 영상 새 창으로 시청하기]` 버튼 추가로 100% 영상 접근성 보장<br/>  3. Web Speech API 한국어 전용 보이스(`ko-KR`) 자동 매핑 및 크롬/사파리 일시 정지(paused) 버그 해결<br/>  4. 문장 큐(Sentence Queue) 기반 안정적 낭독 엔진 구축(15초 버퍼 제한 방지) 및 낭독 스텝 실시간 시각적 하이라이트(`.active-speaking`) 연동 |
| **v1.2.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **12대 핵심 요구사항 및 agents.md 확장 전면 구현**:
  1. **Firebase Auth & Firestore 하이브리드 어댑터 연동**: 계정 생성 및 전용 냉장고 DB 저장 동기화
  2. **원하는 메뉴 및 조리방식 직접 입력 검색**: 키워드 가중치 기반 레시피 종합 발굴
  3. **나만의 도마 레시피 직접 등록 & 공유**: 동일 메뉴라도 사용자별 노하우 중복 추천 지원
  4. **Web Speech API 한국어 TTS 음성 가이드**: 전체 레시피 낭독 및 조리 스텝별 개별 듣기 지원
  5. **완식 사용자 전용 커뮤니티 권한(Lock/Unlock)**: 조리 미완료 시 후기 작성 잠금 안내
  6. **커뮤니티 추천수/조회수 기반 [👑 베스트 노하우 댓글] 자동 선정**: 실시간 좋아요 추천 인터랙션
  7. **완식 횟수 기반 사용자 칭호 등급제**: 호기심쟁이 -> 재고구출자 -> 냉파마스터 -> 미슐랭장인 티어 및 프로그레스 바 연동
  8. **에이전트 외부 자료 및 사용자 공유 레시피 종합 수집/검증**: `agents.md` 규칙 100% 준수 |
| **v1.1.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **최신 트렌드 표준 폴더 구조 개편**: HTML, CSS, JavaScript, Python 계층 완전 분리<br/>- `backend/` 계층 신설: Python 기반 5대 멀티 에이전트 및 REST API 서버 구축<br/>- `frontend/` 계층 분리: `html/`, `css/`, `js/`, `assets/images/` 디렉토리 정리<br/>- 루트 호환성 및 상대 경로 참조 동기화 완료 |
| **v1.0.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - 하네스 기반 멀티 에이전트 아키텍처 초판 구현<br/>- 개인 냉장고 CRUD 및 LocalStorage 연동<br/>- Vision AI 이미지 분석 및 텍스트 재료 입력 모듈 추가<br/>- 2초 강제 냉장고 개방 & 재료 추출 3D 애니메이션 구축<br/>- 한국 인기 유튜브(백종원 등) 기반 도마 레시피 카드 뷰 및 상세 조리 뷰 구현<br/>- 조리 완료 시 냉장고 식재료 실시간 자동 소진(Deduction) 기능 구현<br/>- 완식 인증 커뮤니티 및 후기 등록 기능 연동<br/>- `agents.md`, `readme.md`, `log.md` 표준 문서 체계 수립 |
