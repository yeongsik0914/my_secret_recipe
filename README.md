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
├── views/                               # 📄 [HTML] 5대 독립 뷰 섹션 컴포넌트
│   ├── view-main.html                   # View 1: 재료 입력 & 냉장고 재고
│   ├── view-animation.html              # View 2: 3D 냉장고 오픈 & 애니메이션
│   ├── view-recipes.html                # View 3: 도마 레시피 목록 카드
│   ├── view-detail.html                 # View 4: 도마 위 상세 조리 (YouTube/TTS)
│   └── view-community.html              # View 5: 조리 완료 커뮤니티 & 후기
│
├── frontend/                            # 🎨 [Frontend] 프론트엔드 리소스 계층
│   ├── html/                            # 📄 [HTML] 구조 및 템플릿 계층
│   │   ├── index.html                   # 메인 뷰 마크업 (모듈 플레이스홀더 기반)
│   │   └── views/                       # 5대 뷰 섹션 미러링 디렉토리
│   ├── css/                             # 🎨 [CSS] 스타일시트 계층
│   │   ├── style.css                    # 키친 셰프 글로벌 디자인 시스템
│   │   ├── fridge-3d.css                # 3D 냉장고 오픈 & 재료 추출 애니메이션
│   │   └── responsive.css               # 반응형 미디어 쿼리
│   ├── js/                              # ⚡ [JavaScript] 클라이언트 로직 계층
│   │   ├── app.js                       # UI 이벤트 및 뷰 컨트롤러
│   │   ├── view-loader.js               # 뷰 섹션 비동기 모듈 로더
│   │   ├── store.js                     # 개인 냉장고 상태 및 재고 차감 로직
│   │   ├── recipes-data.js              # 프론트엔드 레시피 데이터셋
│   │   └── harness/                     # 프론트엔드 하네스 모듈
│   │       ├── agent-core.js            # 이벤트 버스 및 파이프라인 코어
│   │       ├── vision-agent.js          # 비전 파싱 에이전트
│   │       ├── search-agent.js          # 레시피 검색 에이전트
│   │       └── quality-agent.js         # 품질 검증 에이전트
│   └── assets/                          # 🖼️ [Assets] 정적 미디어 에셋 계층
│       └── images/                      # icon.png, main.png, ani.png, recipe .png 등
│
├── agents.md                            # 멀티 에이전트 표준 규칙 & 하네스 명세서
├── readme.md                            # 프로젝트 구조 트리 및 실행 매뉴얼 (본 문서)
├── log.md                               # 구조 개편, 이슈 해결 및 개발자별 기여 로그
├── requirements.txt                     # Python 의존성 패키지 명세
└── index.html                           # 루트 엔트리포인트 (모듈 플레이스홀더 연동)
```

---

## 🚀 실행 방법 (Local Run)

### 1) Python 백엔드 통합 서버 실행 (권장)
REST API 엔드포인트(`/api/recipes`, `/api/recommend` 등)와 프론트엔드 정적 파일이 동시에 제공됩니다.

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
| **[@yeongsik0914](https://github.com/yeongsik0914)** | Fullstack Architecture, Multi-Agent Harness, Server Integration | Active (Lead) |
| **Team Member 2** *(지정 대기)* | Frontend UI/UX, Interactive 3D & CSS Motion, Web Speech TTS | Active |
| **Team Member 3** *(지정 대기)* | Backend API & Agents, Domain Recipe Data & Quality Gates | Active |

---

## 📝 업데이트 히스토리 (Changelog)

| 버전 | 일자 | 개발자 (Author) | 업데이트 내용 |
|---|---|---|---|
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
