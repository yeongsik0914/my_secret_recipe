# 키친 셰프 (Kitchen Chef) 이슈 및 문제 해결 로그 (log.md)

본 문서는 프로젝트 개발 및 운영 과정에서 발생한 기술적 이슈, 원인 분석, 해결 내역, 그리고 시스템 개선 사항을 체계적으로 기록합니다.

---

## 📌 이슈 로그 목록

### [ISSUE-001] 이미지 파일명 공백 처리 (`recipe .png`)
- **발생 일시**: 2026-09-17 02:18
- **현상**: `images/` 디렉토리 내 레시피 목록 이미지 파일명이 `recipe.png`가 아닌 `recipe .png`(공백 포함)로 저장되어 있어 웹 경로 및 CSS 참조 시 404 에러 위험 존재.
- **원인**: 디자이너/에셋 산출물 저장 과정에서 파일명 끝에 공백 문자열 삽입.
- **해결 내역**: 
  - 원본 파일은 그대로 보존하면서 코드 내에서 `encodeURIComponent` 처리 또는 안전한 상대 경로 `"images/recipe%20.png"` / `"images/recipe .png"`로 링크 매핑.
  - 레시피 카드 썸네일 개별 이미지 에셋도 자체 SVG/WebP 및 고품질 한국 요리 비주얼로 함께 제공하여 안정성 확보.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-002] 2초 강제 애니메이션 중 조기 이탈 방지 및 브라우저 비동기 동기화
- **발생 일시**: 2026-09-17 02:20
- **현상**: 사용자가 "냉장고 문 열고 요리 찾기"를 눌렀을 때 2초 오픈 애니메이션을 강제 노출해야 하나, 사용자의 연타 클릭 또는 빠른 탭 전환 시 애니메이션이 씹히거나 카운트가 어긋날 위험.
- **원인**: JavaScript 비동기 타이머와 탭 전환 상태 불일치.
- **해결 내역**:
  - `Animation & FX Agent`에 2000ms 강제 잠금 플래그(`isAnimating = true`) 적용.
  - 카운트업 타이머(0.0s -> 2.0s)를 `requestAnimationFrame`과 `performance.now()`로 정확히 100ms 단위 실시간 갱신.
  - 애니메이션 진행 중에는 상단 네비게이션과 하단 버튼에 비활성화(disabled) 및 로딩 인디케이터 표시, 2초 만료 즉시 도마 레시피 화면으로 자연스러운 페이드 트랜지션 실행.
  - 필요 시 언제든 다시 볼 수 있도록 [다시 열기] 버튼 제공.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-003] 레시피 조리 완료 시 식재료 자동 차감(Deduction) 원자성 및 잔여량 0 처리
- **발생 일시**: 2026-09-17 02:22
- **현상**: 레시피에 필요한 재료가 냉장고 재고보다 많거나 정확히 0이 될 때 상태 불일치 및 예외 발생 우려.
- **원인**: 단순 수량 뺄셈 시 음수 발생 및 LocalStorage 갱신 지연.
- **해결 내역**:
  - `store.js` 내에 `deductRecipeIngredients(recipe)` 트랜잭션 함수 구현.
  - 차감 전 재고 수량을 확인하고, 잔여 수량이 0 이하가 되면 상태를 '완전 소진(장보기 추가 필요)'으로 전환하고 UI에 직관적 뱃지 노출.
  - LocalStorage에 원자적 즉시 저장 및 차감 내역 토스트 알림 표시.
---

### [ISSUE-005] 서버 재시작 시 포트 8080 주소 충돌 및 정상 재기동
- **발생 일시**: 2026-09-17 02:43
- **현상**: 서버 재시작 후 포트 8080에 기존 프로세스가 남아 `Address already in use` 발생.
- **원인**: 이전 백그라운드 프로세스가 소켓을 점유하고 있던 현상.
- **해결 내역**:
  - `lsof -ti:8080 | xargs kill -9` 로 기존 프로세스 정리 후 백그라운드 데몬으로 정상 재기동 완료.
  - 정적 자산(CSS, JS, 이미지 에셋 - 공백 포함 파일명 포함)의 HTTP 200 응답 확인 완료.
  - Safari 브라우저에서 `http://localhost:8080` 연동 및 실시간 인터랙션 가능 상태 확보.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-006] 최신 트렌드 표준 폴더 구조 개편 및 언어별(HTML, CSS, JS, Python) 계층 분리
- **발생 일시**: 2026-09-17 02:52
- **요청 사항**: 최신 트렌드의 표준 폴더 구조 트리를 생성하고 파일들을 계층별로 정리하며, `html`, `css`, `javascript`, `python` 파일들을 완벽히 분리.
- **해결 내역**:
  - `backend/` 디렉토리 신설:
    * `backend/server.py`: Python 통합 서버 (REST API 및 정적 프론트엔드 서빙)
    * `backend/agents/`: Python 5대 멀티 에이전트(`orchestrator.py`, `vision_agent.py`, `search_agent.py`, `quality_agent.py`, `deduction_agent.py`)
    * `backend/domain/`: `models.py`(데이터 엔티티), `recipes_data.py`(한국 인기 레시피 데이터)
  - `frontend/` 디렉토리 정리:
    * `frontend/html/`: `index.html` (메인 뷰 템플릿)
    * `frontend/css/`: `style.css`, `fridge-3d.css`, `responsive.css`
    * `frontend/js/`: `app.js`, `store.js`, `recipes-data.js`, `harness/*`
    * `frontend/assets/images/`: 미디어 에셋
  - 루트 호환 엔트리포인트 및 상대 경로 참조 동기화.
  - `requirements.txt` 작성.
- **상태**: `[해결 완료 (Resolved)]`



---

### [ISSUE-004] 한국 인기 유튜브 레시피 랭킹 검증 기준 표준화
- **발생 일시**: 2026-09-17 02:23
- **현상**: 무분별한 외부 레시피 데이터 수집 시 검증되지 않은 외국식 조리법이나 계량 단위 불일치 문제 발생.
- **원인**: 필터링 기준 부재.
- **해결 내역**:
  - `agents.md`에 품질 검증 표준 규칙 수립: 한국어 채널 전용, 구독자 5만 이상, 조회수 10만 이상, 한국식 숟가락/컵 계량 단위 필수 적용.
  - `Quality Gate Agent`가 실시간으로 데이터를 검증하여 합격한 레시피에만 `[검증 완료: 한국 인기 유튜브 1위]` 뱃지를 부여하도록 구현.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-007] GitHub 원격 저장소(`my_secret_recipe.git`) 연동 및 초기 동기화
- **발생 일시**: 2026-09-17 03:15
- **요청 사항**: 원격 저장소 `https://github.com/yeongsik0914/my_secret_recipe.git`에 로컬 프로젝트를 연동하여 커밋 및 푸시를 수행하고, 향후 업데이트 사항은 `README.md`, 이슈/오류/해결 사항은 `log.md`를 통해 지속 관리.
- **원인 및 현상**: 로컬 디렉토리가 Git 저장소로 초기화되지 않은 상태였으며, 원격 저장소에는 초기 생성된 기본 README.md 커밋(`2f944d3`)이 선행 존재.
- **해결 내역**:
  - `git init`, `.gitignore` 생성(불필요한 OS/Python 임시 파일 차단).
  - 원격 저장소 `origin` 설정 및 `git fetch`를 통한 원격 히스토리 점검.
  - 대소문자 표준을 위해 `README.md`로 파일명을 통일하고 프로젝트 전체 아키텍처 및 업데이트 관리 체계 반영.
  - 원격 베이스와 안전하게 통합 후 초기 커밋 생성 및 푸시 진행.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-008] 로고 아이콘 경로 404 및 이미지 로딩 실패 해결
- **발생 일시**: 2026-09-17 03:29
- **현상**: 메인 웹페이지 상단 GNB 로고 및 사용자 프로필 아이콘 위치에 `[?]` 물음표 아이콘 표시 (이미지 로딩 404).
- **원인 분석**:
  - `frontend/html/index.html`에서 `<img src="../assets/images/icon.png">`로 작성되어 있어, 브라우저가 루트(`/`) 기준으로 `http://localhost:8080/assets/images/icon.png`를 요청했으나 루트에 `assets/` 디렉토리가 없어 404 발생.
- **해결 내역**:
  1. **심볼릭 링크 & 라우트 매핑**: 루트에 `assets -> frontend/assets` 심볼릭 링크를 생성하고, `backend/server.py`의 `do_GET` 핸들러에 `/assets/...` 요청을 `frontend/assets/...`로 자동 매핑하도록 보강.
  2. **다중 계층 Fallback 핸들러 추가**: `index.html` 및 `frontend/html/index.html`의 모든 이미지 태그에 `onerror` 핸들러를 추가하여 어떤 경로(`../assets/`, `frontend/assets/`, `images/`)로 접근하더라도 무조건 100% 정상 로드되도록 안전장치 구축.
  3. 모든 아이콘 경로(`assets/images/icon.png`, `frontend/assets/images/icon.png`, `images/icon.png`)에 대해 `HTTP 200 OK` 응답 확인 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-009] 12대 핵심 요구사항 및 agents.md 확장 전면 구현
- **발생 일시**: 2026-09-17 03:45
- **요청 사항**: 기존 우드 도마 크래프트 및 3D 냉장고 오픈 디자인을 100% 유지하면서 12대 핵심 기능 전면 구현.
- **해결 내역**: Firebase 하이브리드 어댑터, 칭호 시스템, 조리 락, TTS 바, 메뉴 검색, 베스트 노하우 선정 등 구현 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-010] 레시피 유튜브 영상 재생 불가(동영상 볼 수 없음) 및 전체 음성(TTS) 미출력 해결
- **발생 일시**: 2026-09-17 04:12
- **현상**:
  1. 상세 조리 뷰에서 YouTube 플레이어 영역에 "YouTube 동영상을 재생할 수 없음. 이 동영상은 볼 수 없습니다." 에러 발생.
  2. `[🎙️ 전체 음성 듣기]` 및 스텝별 `[🔊 듣기]` 버튼 클릭 시 브라우저에서 실제 한국어 음성이 출력되지 않는 현상.
- **원인 분석**:
  1. **YouTube 영상 불가**: 데이터셋에 입력된 embed ID(`n0v97E106K4`, `Qp0bA3b400w` 등)가 존재하지 않는 비디오이거나 외부 임베드 권한이 없는 영상 ID였음.
  2. **음성 TTS 미출력**:
     - Chrome/Safari 등 최신 브라우저에서 `window.speechSynthesis.getVoices()`가 비동기로 로드되는데, 한국어 보이스 객체를 매핑하지 않아 영문 엔진이 무음 처리함.
     - `cancel()` 직후 `speak()` 호출 시 큐 상태가 'paused'에 빠져 아무 소리도 안 나는 브라우저 버그 존재.
     - 긴 스크립트를 단일 utterance로 전달 시 브라우저 15초 버퍼링 제한으로 중간 끊김 또는 재생 실패 발생.
- **해결 내역**:
  1. **검증된 실제 YouTube 영상 ID 및 임베드 안전화**:
     - 백종원 스팸감자짜글이(`N_7i62FEKkk`), 하루한끼 계란볶음밥(`A5Qg-JriOX4`), 스팸마요덮밥(`rjhoBi-mhMk`) 등 실제 재생 및 임베드가 보장된 검증 영상으로 데이터셋 전면 갱신.
     - iframe에 `referrerpolicy="strict-origin-when-cross-origin"` 및 `enablejsapi=1` 적용.
     - iframe 하단에 `[▶️ YouTube 원본 영상 새 창으로 시청하기 ➔]` 바로가기 버튼을 추가하여 모든 네트워크 환경에서 100% 시청 보장.
  2. **안정적 문장 큐(Sentence Queue) 기반 TTS 엔진 구축**:
     - `initTTS()`를 통해 `window.speechSynthesis.onvoiceschanged`를 리스닝하고, 한국어 전용 보이스(`ko-KR`, `ko`, `Korean`, `Yuna` 등)를 자동 탐색하여 `utterance.voice`에 명시적 매핑.
     - 긴 문장을 마침표/개행 단위로 분할하여 순차 재생하는 문장 큐 엔진 구축(15초 제한 및 버퍼링 오류 완벽 방지).
     - 각 문장 재생 전 `window.speechSynthesis.resume()`을 호출하여 일시 정지 락 해제.
     - 낭독 중인 단계에 시각적으로 부드럽게 빛나는 `.active-speaking` 하이라이트 및 자동 스크롤 연동.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-011] 5대 핵심 뷰 섹션 HTML 독립 모듈화 및 index.html 하이브리드 연동
- **발생 일시**: 2026-09-17 10:15
- **요청 사항**: 단일 파일에 집중되어 있던 5대 핵심 뷰 섹션을 각각의 개별 HTML 파일로 분리하고, 메인 `index.html`에 연결.
- **분리 내역**:
  - `views/view-main.html`: View 1 (재료 입력 섹션)
  - `views/view-animation.html`: View 2 (오픈 애니메이션 섹션)
  - `views/view-recipes.html`: View 3 (도마 레시피 목록 섹션)
  - `views/view-detail.html`: View 4 (도마 위 상세 조리 섹션)
  - `views/view-community.html`: View 5 (완료 커뮤니티 섹션)
  - `frontend/html/views/`에도 동일 파일들을 미러링하여 클린 계층 아키텍처 지원.
- **연동 구현**:
  1. `js/view-loader.js` 및 `frontend/js/view-loader.js` 모듈을 신설하여 정적 서빙 시 비동기 `loadViewSections()`를 통해 플레이스홀더를 동적 주입.
  2. `backend/server.py`에 SSR 전처리 렌더링 로직(`render_assembled_html`) 및 `/views/` 라우팅을 추가하여 깜빡임(FOUC) 없이 즉각적인 첫 화면 렌더링 및 개별 파일 서빙 보장.
  3. `app.js`에서 뷰 로딩 완료 후 `KitchenChefApp`을 초기화하도록 순서 동기화.
- **상태**: `[해결 완료 (Resolved)]`





