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
   - 브라우저 구글 계정 자동 감지(One Tap) 및 Google 공식 로그인 팝업(`accounts.google.com`) 연동.
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

12. **스마트 유튜브 비디오 매칭 엔진 (Dynamic Video Resolver) & 실시간 주제 검증 가드**
    - **정적 카탈로그 전수 검증**: 14종 도마 레시피(마라 전골, 제육 두루치기, 갈비구이, 카레, 샐러드 등) 전수 한국 공식 유튜브 채널의 주제 일치 영상 ID(예: 얼큰 마라 찌개 -> 다솔쿠의 마라두부전골 `gFoT-Df74Kk`)로 100% 매칭.
    - **다범주 스마트 비디오 리졸버 (`resolveMatchingYouTubeVideo`)**: 요리명, 사용 식재료, 테마 카테고리를 교차 분석하여 AI 생성/검색 추천 요리에 대해 주제에 정확히 부합하는 최적의 유튜브 영상을 실시간 동적 할당.
    - **런타임 불일치 감지/치환 안전 가드**: 레시피 상세 모달 오픈 시 메뉴명과 영상 제목이 상충(예: 마라 메뉴에 짜글이 영상 등)할 경우 즉시 적합한 영상으로 자동 치환하여 재생 보장.

13. **순수 요리명 키워드 추출기 (`extractCleanKeywords`) & 100% 검증 유튜브 추천 및 실시간 공식 검색 URL 연동**
    - **순수 요리명 추출**: 레시피 제목에서 시리즈 접두어(`AIR CRAFT NO. 13` 등) 및 30여 종의 장식용 수식어(`바삭 촉촉`, `초간단`, `황금`, `비법` 등)를 완전 제거하여 순수 요리명(`닭가슴살 감자 에어프라이어 구이` 등) 정밀 추출.
    - **유효하지 않은 영상 전면 교체**: `recipe_13`의 가짜 ID(`4y-8y9J2H9M`) 및 유효하지 않은 영상 ID 9종을 YouTube 공식 oEmbed API 100% 검증 통과된 실제 정상 재생 영상 ID로 전면 교체.
    - **실시간 공식 검색 URL 자동 바인딩**: `generateYouTubeSearchUrl(keyword)`를 통해 추출된 키워드로 YouTube 공식 실시간 레시피 검색 URL(`https://www.youtube.com/results?search_query=...`)을 실시간 생성하여 원본 시청 및 관련 영상 탐색 완벽 지원.

14. **회원가입 이메일 실존 인증(SMTP) 엔진 & 가짜/오타 도메인 사전 차단 가드**
    - **화면 내 인증코드 노출 원천 차단**: 보안 취약점이었던 클라이언트 모달창 인증코드(`debugCode`) 표기를 전면 제거하고 오직 실제 수신된 이메일을 통해서만 6자리 인증코드를 확인하도록 개편.
    - **가짜/오타 도메인 사전 검증 (`validate_email_domain`)**: `dsfaf@nave.com` 등 빈번한 오타 도메인을 사전 감지하여 `naver.com` 교정을 제안하고, DNS/MX 조회가 불가능한 가짜 도메인은 인증번호 발급 단계에서 원천 차단.
    - **실제 메일 발송 엔진 탑재 (`backend/email_service.py`)**: Python `smtplib` 기반 표준 SMTP 전송 엔진 및 키친 셰프 모던 HTML 인증 메일 템플릿(유효시간 5분 타이머 표기) 연동.
    - **관리자 콘솔 SMTP 제어 플랫폼 (`view-admin.html`)**: 네이버, 지메일, 다음/카카오 원클릭 프리셋, 암호화(TLS/SSL) 포트 지정 및 실시간 테스트 발송 인터페이스 완비.

15. **회원 계정 삭제 시 연동 DB 전수 연쇄 삭제 (Cascading Purge) & 단일 진실 공급원 동기화**
    - **연쇄 삭제 파이프라인**: 관리자 콘솔에서 사용자 계정 삭제 시 해당 회원의 냉장고 식재료(`fridges`), 1:1 맞춤 레시피(`user_recipes`), 감사 로그를 데이터베이스에서 일괄 연쇄 삭제.
    - **영구 삭제 블랙리스트 (`deleted_users`)**: 삭제된 계정이 로컬스토리지나 캐시로 부활하지 못하도록 영구 차단 목록을 관리하여 백엔드 DB를 단일 진실 공급원(Single Source of Truth)으로 유지.

---

## 🏗️ 최신 트렌드 표준 디렉토리 구조 트리 (Architecture Tree)

본 프로젝트는 최신 파이썬 패키징 표준(PEP 517/621, `src-layout`) 및 `uv` 가상환경 환경을 적용하여 **모던 백엔드 패키지(`src/my_secret_recipe/`)**와 **프론트엔드 단일 원천(`frontend/`)**이 완벽히 정돈되어 있습니다.

```
My secret recipe/
├── src/                                 # 🐍 [Modern Python] PEP 517/621 src-layout 패키지
│   └── my_secret_recipe/                # 패키지 루트 (Kitchen Chef Core)
│       ├── __init__.py                  # 패키지 진입점 (main, run_server, __version__)
│       ├── server.py                    # 통합 백엔드 & 정적 파일 서빙 서버 (REST API + SSR 모듈 결합)
│       ├── email_service.py             # 실존 이메일(SMTP) 발송 엔진, 도메인 MX/DNS 검증 및 템플릿
│       ├── config.py                    # 서버 환경 설정
│       ├── data/                        # 서버 영속 데이터 스토어 (Single Source of Truth)
│       │   ├── admin_store.json         # 회원, 개인 냉장고, 맞춤 레시피, 감사 로그 DB
│       │   └── smtp_config.json         # SMTP 발신 엔진(Gmail, Naver, Daum 등) 환경 설정
│       ├── agents/                      # Python 기반 하네스 6대 멀티 에이전트
│       │   ├── __init__.py
│       │   ├── orchestrator.py          # 파이프라인 총괄 오케스트레이터
│       │   ├── user_recipe_agent.py     # 1:1 맞춤 레시피 전담 에이전트
│       │   ├── vision_agent.py          # 영수증/식재료 OCR 분석 에이전트
│       │   ├── search_agent.py          # 유튜브 및 웹 레시피 탐색 에이전트
│       │   ├── quality_agent.py         # agents.md 규칙 검증 에이전트
│       │   └── deduction_agent.py       # 냉장고 재고 실시간 차감 에이전트
│       └── domain/                      # 도메인 모델 및 한국 레시피 데이터셋
│           ├── __init__.py
│           ├── models.py                # 식재료, 레시피, 유저, 후기 데이터 모델
│           └── recipes_data.py          # 한국 인기 유튜브 기반 레시피 데이터셋
│
├── frontend/                            # 🎨 [Frontend] 프론트엔드 단일 원천 (Single Source of Truth)
│   ├── html/                            # 📄 [HTML] 마크업 및 뷰 컴포넌트
│   │   ├── index.html                   # 메인 SPA 뷰 (인증 모달 & 뷰 플레이스홀더)
│   │   └── views/                       # 6대 독립 뷰 섹션 컴포넌트
│   │       ├── view-main.html           # View 1: 재료 입력 & 냉장고 재고
│   │       ├── view-animation.html      # View 2: 3D 냉장고 오픈 & 애니메이션
│   │       ├── view-recipes.html        # View 3: 도마 레시피 목록 카드
│   │       ├── view-detail.html         # View 4: 도마 위 상세 조리 (YouTube/TTS)
│   │       ├── view-community.html      # View 5: 조리 완료 커뮤니티 & 후기
│   │       └── view-admin.html          # View 6: 총괄 관리자(Admin) 7대 권한 콘솔
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
│   │       ├── quality-agent.js         # 품질 검증 에이전트
│   │       └── user-recipe-agent.js     # 유저 맞춤 레시피 에이전트
│   └── assets/                          # 🖼️ [Assets] 정적 미디어 에셋 계층
│       └── images/                      # icon.png, 레시피 썸네일, 구글 아바타 등
│
├── pyproject.toml                       # 📦 모던 파이썬 패키지 및 uv 프로젝트 메타데이터
├── uv.lock                              # 🔒 uv 패키지 의존성 잠금 파일
├── run.py                               # 🚀 메인 엔트리포인트 실행 스크립트
├── index.html                           # 🌐 루트 게이트웨이 (frontend/html/index.html 리다이렉트)
├── agents.md                            # 📜 멀티 에이전트 표준 규칙 & 하네스 명세서
├── README.md                            # 📖 프로젝트 아키텍처 및 실행 매뉴얼 (본 문서)
└── log.md                               # 📝 구조 개편, 이슈 해결 및 개발자별 기여 로그
```

---

## 🚀 실행 방법 (Local Run)

### 1) `uv`를 통한 모던 파이썬 원클릭 실행 (권장)
최신 파이썬 패키징 도구인 `uv`를 통해 의존성 관리와 서버 구동을 한 번에 실행합니다:

```bash
# uv 프로젝트 동기화 (최초 1회)
uv sync

# 키친 셰프 CLI 스크립트로 실행
uv run my-secret-recipe

# 또는 run.py를 통해 실행
uv run python run.py
```

### 2) 표준 Python 인터프리터로 직접 실행
별도의 도구 없이 순수 파이썬 환경에서도 완벽히 구동됩니다:

```bash
python3 run.py
```

브라우저에서 `http://localhost:8080`으로 접속하여 즉시 이용할 수 있습니다.

---

## 👥 개발팀 및 기여자 (Team & Contributors)

본 프로젝트는 3인의 개발자가 협업하여 설계, 개발 및 지속적인 유지보수를 진행하고 있습니다. 모든 업데이트 및 이슈 해결 내역에는 **담당 개발자의 GitHub 사용자명**을 명시하여 투명한 기여 관리를 수행합니다.

| 개발자 (GitHub ID) | 역할 및 주요 담당 분야 | 상태 |
|---|---|---|
| **[@yeongsik0914](https://github.com/yeongsik0914)** | Fullstack Architecture, Multi-Agent Harness, Server Integration, Admin Console Platform | Active (Lead) |
| **[@uzzi-121](https://github.com/uzzi-121)** | Frontend Auth & UI/UX, Firebase / Google SNS 로그인, 1시간 세션 관리, Admin UI 컴포넌트, YouTube 고도화 | Active |
| **[@sllm05](https://github.com/sllm05)** | AI 맞춤 레시피 3종 합성 엔진, 계정별 맞춤 레시피/매칭 식재료 DB 영구 저장, 3D 냉장고 모션 UI, 식재료 단위/선반 정밀 분류, 실시간 캐시 제어 | Active |

---

## 📝 업데이트 히스토리 (Changelog)

| 버전 | 일자 | 개발자 (Author) | 업데이트 내용 |
|---|---|---|---|
| **v1.9.3** | 2026-09-19 | [@yeongsik0914](https://github.com/yeongsik0914) | - **GNB '팬트리 신선 모드' 배지 완전 영구 삭제 및 6대 뷰 전면 풀 반응형 웹(Responsive Web) 레이아웃 고도화**:<br/>  1. **'팬트리 신선 모드' 배지 전면 영구 삭제**: 상단 GNB 우측의 불필요한 `.pantry-badge` 마크업 및 스타일을 완전 제거하여 헤더 공간 정돈 및 UI 가독성 극대화<br/>  2. **모던 풀 반응형 웹 스타일시트 전면 개편 (`responsive.css`)**: 모바일(320px~480px), 태블릿(768px~1024px), 데스크톱(> 1024px)에 대응하는 4단계 정밀 미디어 쿼리 구축<br/>  3. **GNB 2단 유연 레이아웃 & 터치 탭 스크롤**: 768px 이하 모바일 화면에서 로고와 프로필을 1단에 배치하고, 메뉴 탭을 가로 터치 스크롤바로 전환하여 글자 잘림 원천 차단<br/>  4. **메인 식재료 등록 및 4대 선반 반응형 전환**: 1024px 이하 1열 스택 및 768px 이하 2x2/1열 그리드 변환, 풀 와이드 터치 액션 버튼 탑재<br/>  5. **도마 레시피 & 상세 조리 & 커뮤니티 & 관리자 콘솔 반응형 완비**: 1100px 이하 2열, 768px 이하 1열 레시피 카드 단독 표출, 유튜브 16:9 반응형 비디오, 관리자 회원 테이블 가로 스크롤 컨테이너 구축, 전 모달 창 모바일 뷰포트 맞춤 패딩 최적화 |
| **v1.9.2** | 2026-09-19 | [@yeongsik0914](https://github.com/yeongsik0914) | - **Google OAuth 2.0 정책 오류 (400 origin_mismatch) 심층 분석 및 승인 출처 가이드, Client ID 동적 설정 및 원클릭 계정 연계 시스템 구축**:<br/>  1. **Google Developers 공식 문서 기반 `origin_mismatch` 심층 분석**: Google OAuth 2.0 보안 정책에 따라 인증 요청 웹 앱의 출처(스키마, 호스트, 포트)가 GCP 콘솔의 '승인된 자바스크립트 원본'과 100% 일치해야 하는 엄격 규정 확인 및 GCP 등록 3단계 가이드 확립<br/>  2. **Google 정책 오류 안내 아코디언 컴포넌트 신설 (`modal-google-fast-picker`, `.google-policy-guide`)**: 모달 내에 GCP 콘솔 바로가기 링크 및 등록해야 할 정확한 로컬 원본 주소(`http://localhost:8080`, `http://127.0.0.1:8080`) 안내 시각화<br/>  3. **사용자 공식 Google Client ID 바인딩 및 영속화 기능 탑재**: 사용자가 본인 GCP 프로젝트에서 발급받은 공식 Client ID(`920380215419-ntesp9r0dunfuu1a4cjari7ieiq5st9h.apps.googleusercontent.com`)를 코드베이스 기본값 및 영구 설정으로 바인딩하여 100% 실제 Google 로그인 보장<br/>  4. **방금 시도한 계정(`songpa10@iceu.kr`) 원클릭 자동 완성 칩 제공**: 이미지 속 사용자 실제 계정을 1초 만에 자동 채우는 퀵 칩(`.btn-quick-fill-email`)을 배치하여 출처 등록 전이라도 지체 없는 원클릭 가입/로그인 완료 보장<br/>  5. **오류 시 자동 가이드 펼침 (Graceful Fallback)**: 공식 팝업 오류 발생 시 fast-picker 모달 자동 오픈 및 아코디언 활성화로 사용자 혼란 원천 차단 |
| **v1.9.1** | 2026-09-19 | [@yeongsik0914](https://github.com/yeongsik0914) | - **구글 더미 계정(YUJIN H, 송파구 장인) 전면 영구 삭제 및 브라우저 구글 계정 자동 감지·Google 공식 로그인 팝업 연동**:<br/>  1. **더미 계정 전면 영구 삭제 (코드 & DB 100% 0건 달성)**: 계정 선택 모달 및 인라인 폼에 하드코딩되어 있던 더미 값(`yujinham12@gmail.com`, `YUJIN H`, `송파구 장인`, `songpa22@gmail.com`) 및 `defaultAccounts` 배열, `admin_store.json` DB 레코드를 전면 영구 삭제하여 사용자 혼란 원천 해결<br/>  2. **브라우저 실제 구글 세션 자동 감지 (One Tap / Auto-select)**: GIS `google.accounts.id.initialize`에 `auto_select: true` 및 `google.accounts.id.prompt()`를 탑재하여 크롬 브라우저에 이미 로그인되어 있는 사용자의 실제 계정을 브라우저 레벨에서 즉시 자동 감지 및 원클릭 세션 체결<br/>  3. **Google 공식 로그인 웹 팝업 시스템 구축 (`launchGoogleOfficialPopup`)**: `[+ Google 공식 로그인 / 다른 계정 추가]` 버튼 클릭 시 GIS OAuth2 Token Client(`google.accounts.oauth2.initTokenClient`)를 통해 Google 공식 로그인 창(`accounts.google.com`)을 브라우저에 직접 띄우고, 사용자 인가 시 Google UserInfo API를 통해 실제 프로필을 획득하여 백엔드 영속화 및 1:1 냉장고 자동 생성<br/>  4. **무결성 및 안정성 전수 검증 통과**: 코드베이스 전체 더미 이메일 0건 달성, 정적 파일 서빙 및 백엔드 REST API 100% 200 OK 검증 완료 |
| **v1.9.0** | 2026-09-19 | [@yeongsik0914](https://github.com/yeongsik0914) | - **가짜 다크 모달(modal-google-chooser) 완전 제거 및 계획서 기반 Google 간편 로그인(Single Sign-On) 시스템 구축**:<br/>  1. **가짜 다크 모달 및 비밀번호 재인증 모달 전면 삭제**: 사용자가 원치 않던 임의의 다크 테마 카드 모달(`#modal-google-chooser`, `#modal-google-reauth`) 및 관련 더미 UI를 완전 제거하고, Google 공식 브랜드 가이드라인을 준수한 세련된 화이트 카드 안전 대화상자(`modal-google-fast-picker`, `.google-fast-card`)로 전면 개편<br/>  2. **원클릭 Google 간편 로그인 파이프라인 가동**: 첫 번째 이미지의 `[ G Google 계정으로 계속하기 ]` 버튼 클릭 시 `openGoogleChooser` 대신 신규 비동기 메서드 `handleGoogleLogin()`을 직접 호출하여 Google Identity Services (GIS) / Firebase `GoogleAuthProvider` 및 백엔드 영속화 파이프라인 직결<br/>  3. **Pinterest / Reddit 벤치마크 무마찰 가입 & 계정 통합(Silent Account Linking)**: 신규 구글 유저 차단 로직("등록되지 않은 구글 계정입니다")을 전면 삭제하고, 신규/기존 회원 여부와 상관없이 원클릭으로 즉시 프로필 추출 ➔ 자동 가입 ➔ 1:1 개인 냉장고 DB 생성 ➔ 자동 로그인 세션 체결<br/>  4. **Google Identity Services Client ID 공식 설정 & 백엔드 영속성 동기화**: `FirebaseAdapter`에 계획서 v1.2.0 표준 Client ID 바인딩 및 백엔드 REST API(`POST /api/auth/google`) 응답 인벤토리 실시간 세션 바인딩, 로그인 완료 시 모달 자동 닫힘 및 헤더 사용자 프로필 실시간 갱신<br/>  5. **전 계층 통합 테스트 검증 통과**: 백엔드 신규 생성 및 기존 계정 통합 200 OK, 프론트엔드 정적 리소스 서빙 100% 200 OK 무결성 검증 완료 |
| **v1.8.0** | 2026-09-18 | [@yeongsik0914](https://github.com/yeongsik0914) | - **최신 파이썬 `src` 레이아웃(src-layout & uv) 아키텍처 전면 개편, 프론트엔드 단일 원천(Single Source of Truth) 통합 및 중복/불필요 파일 완전 정리**:<br/>  1. **모던 파이썬 `src` 레이아웃(`src/my_secret_recipe/`) 표준 패키지화**: 기존 `backend/` 디렉토리를 최신 PEP 517/621 표준 `src` 레이아웃으로 이전 완료. `server.py`, `email_service.py`, `agents/`, `domain/`, `data/`를 모던 패키지로 통합하고 `__init__.py`에서 `main`, `run_server` 노출<br/>  2. **`uv` 패키징 & CLI 실행 환경 구축**: `pyproject.toml`에 프로젝트 메타데이터 및 `[project.scripts]`(`my-secret-recipe = "my_secret_recipe:main"`, `kitchen-chef = "my_secret_recipe:main"`) 등록. `uv run my-secret-recipe`, `uv run python run.py`, `python3 run.py` 전수 지원<br/>  3. **프론트엔드 단일 원천(`frontend/`) 통합 및 루트 중복 완전 제거**: 루트에 복제되어 있던 `css/`, `js/`, `views/`, `images/` 디렉토리 및 `assets` 심볼릭 링크를 완전 삭제하고 모든 프론트엔드 자산을 `frontend/` 단일 디렉토리로 확정. 루트 `index.html`은 `frontend/html/index.html`로 자동 연결되는 경량 게이트웨이로 통합<br/>  4. **불필요한 파일 전수 삭제**: 내용이 중복된 `readme.txt`, 과거 임시 작업 문서 `implementation_plan2.md`, 임시 폴더 `scratch/` 및 레거시 `backend/` 폴더 완전 삭제<br/>  5. **백엔드 단일 원천 정적 라우팅 및 HEAD/GET 전수 지원**: `src/my_secret_recipe/server.py`에 `/css/`, `/js/`, `/views/`, `/images/`, `/assets/`, `/frontend/` 단일 원천 매핑 및 `do_HEAD()` 핸들러 탑재로 모든 리소스 100% 200 OK 서빙 보장 |
| **v1.7.0** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **관리자 콘솔 냉장고 탭 분리 및 독립된 [4. 맞춤 레시피 DB] 전용 관제 플랫폼 신설 (레시피 기능 특화)**:<br/>  1. **냉장고 및 Vision AI 탭(탭 3) 원상 복원**: 하단에 합쳐졌던 레시피 영역을 완전 분리하여 좌측 '유저 냉장고 상태 열람 및 복구', 우측 'Vision AI 오인식 로그 및 보관칸 수동 교정' 2컬럼 레이아웃 100% 원복<br/>  2. **독립 서브탭 [4. 맞춤 레시피 DB] 신설**: 관리자 내비게이션을 7대 거버넌스로 개편하고 독립된 관제 플랫폼 구축<br/>  3. **레시피 고유 기능 특화 UI/UX**: 4대 핵심 KPI, 식재료 매칭 컨텍스트 바, 다차원 실시간 검색/필터/정렬, 완성도 높은 레시피 카드, 수정/프리뷰/삭제 액션<br/>  4. **신규 맞춤 레시피 직접 주입 및 수정 모달 (`modal-admin-recipe-edit`)**: 관리자가 회원의 DB에 레시피를 직접 등록/수정 가능<br/>  5. **백엔드 REST API 확장**: `POST /api/admin/recipes/save` 및 `RECIPE_DB` 감사 로그 연동 |
| **v1.6.9** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **맞춤 레시피 UI 클린업, 카드 상단 텍스트 잘림/여백 제거, 2.35초 도어 닫힘 복원 및 관리자 계정별 레시피 DB 관리 플랫폼 신설**:<br/>  1. **레시피 화면 클린업**: 산만한 대괄호 태그를 단정하고 정제된 `[⭐ 맞춤 추천]` 단일 배지로 통합<br/>  2. **카드 상단 잘림 및 여백 해결**: 의사 요소 오버플로우 문제 해결 및 모던하고 깔끔한 화이트 카드 복원<br/>  3. **냉장고 도어 닫힘 모션 복원**: 2.30초 전 수납 완료 후 2.35초에 부드럽게 도어가 닫힌 뒤 3.50초에 도마 화면으로 즉시 전환<br/>  4. **관리자 계정별 레시피 DB 관리**: 유저별 레시피 열람, 기본 3종 복구, 전체 비우기, 개별 삭제 완비 |
| **v1.6.8** | 2026-09-18 | [@yeongsik0914](https://github.com/yeongsik0914) | - **회원가입 이메일 실존 인증(SMTP) 발송 엔진 신설, 클라이언트 인증코드 노출 취약점 완전 제거 및 도메인 유효성 사전 검증 가드 구축**:<br/>  1. **클라이언트 인증코드 노출 전면 차단 (`debugCode` 삭제)**: 백엔드 API(`POST /api/auth/send-verification-email`) 응답 및 프론트엔드 모달/토스트 안내문에서 6자리 인증코드를 일체 노출하지 않도록 제거. 사용자 화면에는 실제 받은편지함(스팸함 포함) 확인 안내 문구만 표출<br/>  2. **가짜/오타 도메인 사전 검증 및 차단 (`email_service.py`)**: `dsfaf@nave.com` 등 흔한 도메인 오타 즉시 감지 및 `naver.com` 교정 제안 반환, DNS/MX 레코드 조회가 불가능한 가짜 도메인 사전 차단<br/>  3. **실제 메일 발송(SMTP) 엔진 신설 (`backend/email_service.py`, `smtp_config.json`)**: Python `smtplib` 기반 표준 이메일 발송 엔진 신설, 키친 셰프 브랜딩 고품질 모던 HTML 인증 메일 템플릿 탑재<br/>  4. **관리자 콘솔 내 SMTP 제어 UI 탑재 (`view-admin.html`, `frontend/html/views/view-admin.html`)**: 관리자 콘솔 사용자 관리 탭에 네이버/지메일/다음 원클릭 프리셋, 포트/암호화(TLS/SSL) 설정, 실시간 상태 뱃지 및 테스트 발송 기능 탑재<br/>  5. **100% SHA-256 패리티 동기화 및 자동화 보안 테스트 검증 통과** |
| **v1.6.7** | 2026-09-18 | [@yeongsik0914](https://github.com/yeongsik0914) | - **관리자 콘솔 회원 계정 영구 삭제 시 연동 DB 전수 연쇄 삭제(Cascading Purge) 및 비관리자 계정 완전 정제**:<br/>  1. **연동 DB 전수 연쇄 삭제 파이프라인 (`delete_user`)**: 관리자 콘솔에서 사용자 계정 삭제 시 `users`뿐만 아니라 해당 사용자의 개인 냉장고 재고(`fridges`), 1:1 맞춤 레시피(`user_recipes`), 감사 로그 기록까지 트랜잭션 단위로 일괄 삭제<br/>  2. **부활 방지 블랙리스트 (`deleted_users`)**: 삭제된 계정이 로컬스토리지나 브라우저 캐시에 의해 자동 재등록(부활)되지 못하도록 영구 차단 목록을 관리하여 백엔드 DB를 단일 진실 공급원(SSOT)으로 확립<br/>  3. **데이터베이스 완전 정제 (Purge)**: 서버 DB(`admin_store.json`)에서 총괄 관리자(`admin@kitchenchef.com`) 및 영식 관리자(`fkdlemgoej@gmail.com`) 2개 핵심 관리자 계정만 남기고 비관리자/테스트 계정 20여 개 및 잔여 냉장고 데이터를 완전 정제<br/>  4. **최고 관리자 계정 보호 가드**: `admin@kitchenchef.com` 계정의 삭제 시도는 상시 원천 차단 (`CANNOT_DELETE_ROOT_ADMIN`) |
| **v1.6.6** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **3D 냉장고 오픈 상태 유지 & 선택 식재료 바구니 이동 모션 복원 및 3.5초 즉시 도마 레시피 전환 보장**:<br/>  1. **냉장고 양문 개방 상태 온전 유지**: 애니메이션 도중 임의로 도어를 닫아버리던 1.45초 중간 닫힘 타이머(`doors-closed`)를 전면 제거하여, 3.5초 전 구간 동안 냉장고 문이 활짝 열린 상태에서 선택한 식재료들이 주방 아일랜드 바구니로 자연스럽게 이동하는 본래 인터랙션 100% 복원<br/>  2. **6종 식재료 바구니 다이빙 타이밍 고도화**: `css/fridge-3d.css`의 식재료 비행 시간을 1.4s 및 0.2s~1.7s 스태거 딜레이로 재조정하여 3.5초 동안 유려하게 바구니로 수납되도록 완성<br/>  3. **3.5초 만료 즉시 도마 레시피(`view-recipes`) 무조건 전환**: 타이머 3.5s 도달 즉시 `transitionToRecipes()`를 호출하고, 실시간 DOM 쿼리 및 타겟 섹션 직접 지정 가드로 지연 없는 즉각 전환 보장<br/>  4. **브라우저 캐시 무력화 버전 일괄 갱신**: `?v=20260918_05` 적용으로 구버전 캐시 실행 차단 |
| **v1.6.5** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **애니메이션 3.5초 완료 후 도마 레시피 세션 자동 전환 무결성 보장 및 런타임 안정화**:<br/>  1. **자동 세션 전환 파이프라인 무결성 확보**: 3.5초 카운트업 종료 후 도마 레시피 세션(`view-recipes`)으로 즉시 자동 이동하도록 `transitionToRecipes` 핸들러 및 800ms 타임아웃 안전망 가드 구축<br/>  2. **FridgeStore 사용자 ID 획득 함수(`getCurrentUserId`) 공식 지원**: `store.getCurrentUserId()` 메서드를 정식 구현하여 비동기 체인 내 TypeError 발생 가능성 원천 차단<br/>  3. **UserRecipeAgent 방어적 예외 처리**: 레시피 저장 비동기 처리 시 에러 발생 여부와 무관하게 3.5초 화면 전환이 100% 정상 작동하도록 try-catch 안전 가드 완비 |
| **v1.6.4** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **고정 더미 의존 탈피 & 개인 DB 전담 에이전트(UserRecipeAgent) 구축 및 도마·상세·차감·커뮤니티 전 세션 파이프라인 연동**:<br/>  1. **UserRecipeAgent 신설 및 하네스 공식 편입**: `frontend/js/harness/user-recipe-agent.js` 및 `backend/agents/user_recipe_agent.py` 신설. `SearchAgent` ➔ `QualityGateAgent` ➔ `UserRecipeAgent` 체인으로 개인 DB 영구 보관 자동화<br/>  2. **도마 레시피 화면 고정 더미 목록 배제 & 맞춤 레시피 최우선 단독 표출**: 기존 14종 고정 더미 목록(`recipes-data.js`)의 일방적 노출을 걷어내고, 오직 사용자 개인 DB에 보관된 1:1 맞춤 AI 레시피 3종만 기본 단독 표출하는 탭 스위처 구축 (`[⭐ 내 맞춤 레시피]` vs `[📋 기본 카탈로그 둘러보기]`)<br/>  3. **전 세션 파이프라인 무결성 확보**: 개인 DB 레시피 클릭 ➔ `view-detail` 상세 조리(TTS, 유튜브 모아보기) ➔ `DeductionAgent` 실제 냉장고 재료 자동 차감 ➔ `view-community` 완식 인증서 발급 및 후기 폼 언락 연계 완료<br/>  4. **agents.md 표준 명세 갱신**: 제7 에이전트 다이어그램 및 프로토콜 규격 반영<br/>  5. **18개 미러 파일 100% SHA-256 패리티 달성**: 루트 파일과 `frontend/` 디렉토리 간 완전 무결성 유지 |
| **v1.6.3** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **메인 [냉장고 문 열고 요리 찾기] 클릭 시 계정별 맞춤 레시피 및 매칭 식재료 DB 영구 저장 시스템 구축**:<br/>  1. **계정별 레시피 DB 영구 보관**: `backend/data/admin_store.json` 내 `user_recipes` 스토어 신설. 메인 화면에서 `[🚪 냉장고 문 열고 요리 찾기]` 버튼 클릭 시 합성된 1:1 맞춤 AI 레시피 및 매칭된 식재료 정보(식재료명, 필요량, 단위, 매칭 여부, 보관 선반, 사용자 프롬프트)를 해당 사용자 계정 DB에 자동 영구 저장<br/>  2. **REST API 엔드포인트 구축**: `POST /api/user-recipes` (계정별 맞춤 레시피/매칭 식재료 저장), `GET /api/user-recipes` (계정별 저장된 맞춤 레시피 복원 조회) 신설<br/>  3. **프론트엔드 상태 머신 연동**: `store.saveUserRecipesToDB()`, `store.fetchUserRecipesFromDB()` 구현, 도마 레시피 화면에 `[💾 개인 DB 연동됨]` 뱃지 표출 및 새로고침/재방문 시 개인 DB 레시피 우선 복원 로드<br/>  4. **보안 감사 로그 연동**: 개인 DB 레시피 저장 시 카테고리 `RECIPE_DB` 감사 로그 자동 발행<br/>  5. **100% 미러 파일 패리티 달성**: 루트 파일과 `frontend/` 디렉토리 간 완전 무결성 유지 |
| **v1.6.2** | 2026-09-18 | [@uzzi-121](https://github.com/uzzi-121) | - **레시피-유튜브 영상 불일치 해결, 요리 형태(Dish Category) 최우선 매칭 엔진, AI 하드코딩 영상 제거 및 주메인 식재료 필수 매칭 가드(Main Ingredient Match Guard) 구축**:<br/>  1. **AI 생성 레시피 하드코딩 영상 ID 전면 제거**: `synthesizeTopAccurateRecipes`에서 고정 영상 ID(`A5Qg-JriOX4` 등)를 완전히 삭제하고, 생성된 요리명과 재료를 기반으로 `resolveMatchingYouTubeVideo`가 100% 동적 매칭하도록 위임<br/>  2. **요리 형태(Dish Category) 1순위 최우선 매칭 엔진**: '두루치기', '볶음밥', '찌개/짜글이', '구이/에어프라이어', '전', '샐러드' 등 15대 요리 형태에 +100점 가중치 및 문장 끝 명사 헤드 가산점(+50점)을 부여하여 '계란 특선 두루치기'가 부재료 '계란'이 아닌 요리 형태 '두루치기'로 백종원 제육/두루치기 영상(`j7s9VRsrm9o`)에 정확히 매칭되도록 개선<br/>  3. **상세 화면 유튜브 실시간 검색 연동**: 상세 뷰 유튜브 버튼 클릭 시 `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword + ' 레시피')}`로 연결되도록 바인딩하여 100% 원본 영상 모아보기 제공 (블로그 레시피 제외)<br/>  4. **주메인 식재료 필수 매칭 가드(Main Ingredient Match Guard)**: 대파, 간장 등 조미료·향신채만 있고 두부, 계란, 육류 등 주재료가 0개 매칭된 경우 일치율을 최대 20%로 제한하고 하단 강등하여 엉뚱한 요리 추천 원천 차단 |
| **v1.6.1** | 2026-09-18 | [@uzzi-121](https://github.com/uzzi-121) | - **순수 요리명 키워드 추출기(`extractCleanKeywords`) 구현, 깨진 유튜브 영상 ID 전면 교체(100% 정상 재생 보장) 및 키워드 기반 유튜브 추천·실시간 공식 검색 URL 엔진 구축**:<br/>  1. **순수 요리명 키워드 정밀 추출기(`extractCleanKeywords`)**: 'AIR CRAFT NO. 13', '바삭 촉촉', '초간단', '황금', '비법' 등 시리즈 접두어 및 장식성 수식어를 제거하고 순수 요리명만 추출하는 함수 구현 및 export<br/>  2. **깨진 유튜브 영상 ID 전면 교체**: `recipe_13`(닭가슴살 감자 에어프라이어 구이)의 가짜 ID(`4y-8y9J2H9M`) 및 404 영상 ID 9종을 YouTube 공식 oEmbed API 100% 검증을 통과한 실제 영상 ID(`_Vq0HnbVqyo`, `nj-DjQFEZb0`, `_-oaae1jjWs`, `Eino3yP-Wk0`, `JsXnSWmvNEU`, `xiLqt4FUEzc`, `j7s9VRsrm9o`, `E4so3rBlG2o`, `J1v721PgaUE`, `b7Ki08LjkPs`)로 전면 교체<br/>  3. **실시간 공식 검색 URL 생성 엔진(`generateYouTubeSearchUrl`)**: 추출된 순수 요리명 기반으로 YouTube 공식 검색 URL 실시간 생성<br/>  4. **지능형 추천 엔진(`resolveMatchingYouTubeVideo`) 고도화**: 키워드 점수 가중치 매칭, 무효 영상 블랙리스트(`KNOWN_BROKEN_YOUTUBE_IDS`) 가드 및 `searchUrl` 자동 바인딩 지원<br/>  5. **전 계층 데이터 동기화**: `js/recipes-data.js`, `frontend/js/recipes-data.js`, `backend/domain/recipes_data.py`, `backend/domain/models.py`, `backend/agents/search_agent.py`, `js/harness/search-agent.js`, `frontend/js/harness/search-agent.js` 전면 동기화 |
| **v1.6.0-patch** | 2026-09-18 | [@sllm05](https://github.com/sllm05) | - **HTTP 서버 브라우저 캐시 무효화 헤더 탑재 및 관리자 스토어 원격 동기화**:<br/>  1. **브라우저 캐시 방지**: `backend/server.py`의 `end_headers`에 `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0` 헤더 적용으로 `git pull` 후 구버전 JS/CSS 캐싱 문제 원천 해결<br/>  2. **최신 데이터 동기화**: `backend/data/admin_store.json`의 사용자 계정 및 개인별 냉장고 재고 데이터 깃허브 푸시 동기화 |
| **v1.6.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **firebase_python.md 기반 회원가입/로그인/로그아웃 시스템 전면 개편 및 관리자 권한/종합 조치 콘솔 구축**:<br/>  1. **firebase_python.md 스펙 100% 준수**: `/users/{uid}` 데이터 스키마 정규화(`uid`, `email`, `display_name`, `photo_url`, `providers` (`list[str]`), `role` (`admin`, `manager`, `user`), `is_active` (`bool`), `created_at`, `updated_at`)<br/>  2. **Google OAuth 다중 계정 자동 통합 (3.4 process_google_auth)**: 이메일 가입 유저가 동일 이메일의 Google 계정으로 로그인 시 계정 중복 없이 `google.com` 제공자를 `providers`에 안전하게 병합 연동<br/>  3. **계정 고립 방지 가드 (3.5 unlink_google)**: 잔여 로그인 수단이 1개뿐인 경우 연동 해제를 원천 차단(`ACCOUNT_ISOLATION_RISK` 400 반환 및 안내 팝업)<br/>  4. **관리자 콘솔 고도화 (`view-admin.html`)**: 회원 목록에 `연동 수단 (Providers)` 컬럼 추가, `[🛠️ 권한/조치]` 전용 모달(`modal-admin-user-action`) 탑재로 3대 권한(Admin/Manager/User) 설정, 계정 활성/정지 토글, 즉시 세션 강제 만료, 난수 임시 비밀번호 재발급 및 Google 연동 해제 지원<br/>  5. **최고 관리자(Super Admin) 강등 방지 보안**: `admin@kitchenchef.com` 계정의 권한 박탈 및 강등 시도 차단<br/>  6. **마이페이지 연동 관리 (`modal-account-manage`)**: 사용자 역할 뱃지, 연동된 로그인 수단 배지, Google 연동 추가 및 안전 해제 버튼, 관리자/매니저 전용 콘솔 바로가기 버튼 제공<br/>  7. **루트 & frontend/ 6대 미러 파일 100% 해시 동기화**: 모든 프론트엔드 파일의 완전 무결성 검증 완료 |
| **v1.5.6** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **사용자 프롬프트 시맨틱 파싱 고도화 및 중복 없는 정확한 요리 사진 매핑**:<br/>  1. **시맨틱 파싱 고도화**: 프롬프트의 요리 형태(탕/전골/찌개, 타코/보울, 파스타, 디저트 등) 및 풍미 프로필(허니버터, 매콤, 마라 등) 정밀 감지<br/>  2. **실물 음식 사진 매핑 가드**: 레시피 카드 렌더링 시 음식 사진이 중복되지 않도록 Set 기반 고유 매핑 알고리즘 적용 |
| **v1.5.5** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **최상단 3열 정밀 1:1 맞춤 AI 레시피 3종 합성 및 고화질 실물 요리 사진 정밀 매칭**:<br/>  1. **3열 맞춤 AI 레시피 3종 탑재**: 사용자 냉장고 식재료와 프롬프트에 직격 매칭되는 시그니처 메인(NO. 01), 페어링 바삭 구이(NO. 02), 든든한 일품요리(NO. 03) 3종 합성 엔진 구축<br/>  2. **고화질 요리 사진 23종 에셋 탑재**: 감자탕, 두루치기, 갈비구이, 카프레제, 부침 등 23종 실물 요리 사진 정밀 매칭 |
| **v1.5.4** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **서비스 필수 로그인 강제, 관리자 권한 부여 기능 추가, 입력창 상시 공백화 및 테스트 버튼 제거**:<br/>  1. **필수 로그인 가드**: 비인증 게스트의 서비스 접근을 차단하고 로그인 모달 잠금(닫기 방지, 배경 클릭 차단, 탭 이동 가드)<br/>  2. **관리자 권한 부여/회수 거버넌스**: 관리자 콘솔 회원 목록에서 일반 회원에게 관리자(Admin) 권한 원클릭 부여/회수 기능(`POST /api/admin/users/role`) 및 감사 로그 연동<br/>  3. **입력창 상시 공백화**: 이메일/비밀번호 입력란 초기값 제거 및 모달 열기/탭 전환 시 항상 빈칸 유지<br/>  4. **테스트/빠른 로그인 버튼 정리**: 모달 내 테스터용 등록 계정 빠른 입력 칩 박스 및 총괄 관리자 빠른 로그인 버튼 완전 제거 |
| **v1.5.3** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **Google OAuth 401 오류 해결, 2번 이미지 다크 테마 계정 선택기 및 Firebase 구글 재인증 시스템 구축**:<br/>  1. **Google OAuth 401 오류(invalid_client) 원천 해결**: GIS 클라이언트의 더미 Client ID로 인한 구글 팝업 차단 및 401 오류를 완벽 차단하는 안전 모드(Safe Mode) 전환 및 직관적 인증 파이프라인 구축<br/>  2. **Firebase 구글 로그인 이력 동적 검사 및 '없으면 띄우지마' 원칙 구현**: Firebase 레지스트리(`firebase_registered_users_registry`)를 동적으로 조회하여 구글 로그인을 했던 계정이 존재할 때만 2번 이미지와 100% 일치하는 다크 테마 카드(`영식 정`, `10 songpa` 및 `세션이 만료됨` 뱃지)로 표시하고, 등록 이력이 없으면 계정 카드를 전혀 띄우지 않는 조건부 렌더링 완성<br/>  3. **Google 로그인 재인증(본인 확인) 모달 신설**: 이전에 구글 로그인을 했던 계정이더라도 즉시 로그인되지 않고, '본인 확인(계속하려면 Google 계정 비밀번호를 입력하세요)' 전용 모달을 통해 비밀번호 재인증을 통과해야만 Firebase 세션 갱신 및 1시간 자동 로그인이 체결되도록 보안 강화<br/>  4. **2번 이미지 일치 UI/UX 컴포넌트**: 프로필 아바타 편집 펜 뱃지, `+ 다른 계정 추가` 인라인 폼, `로그아웃`, `Google 계정 관리` 알약 버튼 및 푸터 약관 링크 구현<br/>  5. **100% 동기화 및 전수 검증**: 루트 파일과 `frontend/` 미러 파일 간 100% 해시 일치 유지 및 백엔드/정적 파일 무결성 테스트 완료 |
| **v1.5.2** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **회원 DB 등록 사용자 대상 로그인 인증 검증, 미등록 계정 차단 및 초기 시드 계정 자동 세팅**:<br/>  1. **로그인 검증 및 미등록 계정 차단**: 회원 DB/백엔드(`/api/auth/login`) 및 로컬 레지스트리에 등록된 사용자만 로그인 허용, 미등록 계정 로그인 시 세션 발급 차단 및 인라인 경고 배너(`sign-form-alert`) 노출 후 모달 유지<br/>  2. **비밀번호 검증 및 보안 강화**: 비밀번호 불일치(401 `INVALID_PASSWORD`) 및 계정 정지(403) 차단 로직 구현<br/>  3. **초기 시드 계정 자동 세팅**: DB가 비어있을 경우 테스트 가능한 총괄 관리자(`admin@kitchenchef.com` / `admin1234!`) 및 기본 유저(`user@kitchenchef.com` / `user1234!`) 자동 등록<br/>  4. **로그인 UI/UX 개선**: 하드코딩된 더미 입력값 제거, 빠른 테스트용 시드 계정 원클릭 입력 칩 제공, 흔들림 애니메이션 경고 배너 적용 |
| **v1.5.1** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914) | - **Google Identity Services API 연동 및 Firebase 사용자 영구 등록 시스템 구축**:<br/>  1. **공식 Google API 연동**: Google Identity Services(GIS) 클라이언트 라이브러리(`accounts.google.com/gsi/client`) CDN 탑재, 클라이언트 초기화, ID 토큰 JWT 디코딩 파서(`parseGoogleJwt`) 및 계정 인증 지원<br/>  2. **Firebase Auth & Firestore 자동 사용자 등록**: Google API로 간편 가입/로그인한 사용자를 Firebase Auth 및 Cloud Firestore(`users/{uid}`)에 영구 등록하고 하이브리드 레지스트리(`firebase_registered_users_registry`)와 동기화<br/>  3. **전용 클라우드 냉장고 자동 생성**: Google API로 신규 가입한 사용자에게 '초보 셰프 Lv.1' 등급 부여 및 독립된 클라우드 냉장고(`syncFridgeToCloud`) 자동 생성<br/>  4. **인증 상태 시각화 및 피드백**: 계정 관리 모달에 'Google API' 및 '🔥 Firebase 등록됨' 배지, Firebase 연동 UID 표시 및 성공 토스트 피드백 연동<br/>  5. **백엔드 REST API 연동**: `/api/auth/google/register` 및 `/api/auth/firebase/status` 엔드포인트 신설 |
| **v1.5.0** | 2026-09-17 | [@yeongsik0914](https://github.com/yeongsik0914)<br/>[@uzzi-121](https://github.com/uzzi-121) | - **총괄 관리자(Admin) 계정 및 6대 거버넌스 제어 콘솔 전면 구축**:<br/>  1. **총괄 관리자 계정 체계**: `admin@kitchenchef.com` / `admin1234!` 계정 및 로그인 모달 내 `[🛡️ 총괄 관리자(Admin) 빠른 로그인]` 원클릭 인증 지원<br/>  2. **권한 1 (계정 및 인증/세션 관리)**: 전체 회원 목록 조회, 실시간 이름/이메일/상태 검색·필터링, 원클릭 강제 세션 만료, 계정 제재(Suspension) 및 정상 복구<br/>  3. **권한 2 (회원별 등급 조회 및 수정)**: Lv.1~Lv.4 등급 및 칭호 부여, 누적 완식 횟수(`cookCount`) 수동 교정, 즉시 사용자 세션 동기화<br/>  4. **권한 3 (개인 냉장고 및 재고 데이터 관리)**: 회원별 4대 선반(채소·육류·유제품·양념) 재고 실시간 열람, 6대 기본 식재료 스냅샷 복구, Vision AI 오인식 오류 로그 확인 및 보관칸 수동 교정<br/>  5. **권한 4 (커뮤니티 및 콘텐츠 관리)**: 불량 후기 블라인드(`hidden`), 영구 삭제, 우수 조리 팁 `[👑 베스트 노하우]` 핀 수동 토글<br/>  6. **권한 5 (AI 에이전트 자원 사용량 및 활동 통계)**: 5대 하네스 에이전트 가동률, 실시간 응답 지연 시간(ms), Gemini Vision 멀티모달 인식 통계 및 시스템 헬스 대시보드<br/>  7. **권한 6 (관리자 권한 및 감사 로그)**: 관리자 작업 전수 타임라인 기록(Audit Trail), 카테고리 필터링, JSON/CSV 다운로드 내보내기 지원<br/>  8. **비관리자 접근 보호(Access Guard)**: 비관리자 로그인 시 네비게이션 탭 자동 은닉 및 URL 직접 접근 시 차단 화면 표출 |
| **v1.4.6** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **냉장고 재료 개인별 DB 연동 및 백엔드 영구 보관**:<br/>  1. **회원별 독립 냉장고 DB 구축**: `backend/server.py`에 `/api/fridge/<userId>` REST API 구축 및 `admin_store.json`에 회원별 재고 저장<br/>  2. **실시간 양방향 동기화**: 재료 수량 증감, 추가, 삭제 시 로컬스토리지와 서버 DB 실시간 동기화 |
| **v1.4.5** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **Main 화면 불필요 기능 정리 및 레이아웃 반응형 최적화**:<br/>  1. **메인 화면 정돈**: 중복 버튼 및 혼란을 유발하는 UI 요소 제거, 그리드 여백 및 선반 가독성 강화 |
| **v1.4.4** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **3.5초 냉장고 3D 양문형 도어 개방/닫힘 및 아일랜드 바구니 수납 애니메이션 고도화**:<br/>  1. **3D 도어 인터랙션**: 3.5초 동안 냉장고 양문이 열리고 식재료가 바구니로 수납된 후 도어가 자동으로 닫히는 정밀 CSS3 3D 애니메이션 구축<br/>  2. **타이머 게이지 시각화**: 원형 SVG 프로그레스 게이지(`0.0s` -> `3.5s`) 및 실시간 하네스 로그 연동 |
| **v1.4.3** | 2026-09-17 | [@sllm05](https://github.com/sllm05) | - **Recipes Session 기능 고도화 및 하이브리드 랭킹 엔진 구축**:<br/>  1. **하이브리드 랭킹 엔진**: 식재료 일치율(60%) + 미디어 조회수 로그 스케일(40%) 결합 정밀 랭킹 알고리즘 적용 |
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
