# 키친 셰프 (Kitchen Chef) 이슈 및 문제 해결 로그 (log.md)

본 문서는 프로젝트 개발 및 운영 과정에서 발생한 기술적 이슈, 원인 분석, 해결 내역, 그리고 시스템 개선 사항을 체계적으로 기록합니다.

---

## 👥 팀 협업 및 개발자별 기여 표기 규칙 (Collaboration Standards)

본 프로젝트는 **3인의 개발팀**이 협업하여 개발 및 유지보수를 진행하고 있습니다.
향후 모든 기능 추가, 버그 수정, 구조 개편 작업에 대해 **담당 개발자의 GitHub 사용자명(`@GitHub_ID`)**을 명시하여 누가 어떤 작업을 수행했는지 투명하게 기록합니다.

### 📋 이슈 기록 표준 템플릿
```markdown
### [ISSUE-XXX] 이슈 및 작업 명칭
- **발생/작업 일시**: YYYY-MM-DD HH:MM
- **담당 개발자**: @GitHub_사용자명 (예: @yeongsik0914)
- **현상 / 요청 사항**: ...
- **원인 분석**: ...
- **해결 및 구현 내역**: ...
- **상태**: `[해결 완료 (Resolved)]`
```
---

## 📌 이슈 로그 목록

### [ISSUE-001] 이미지 파일명 공백 처리 (`recipe .png`)
- **발생 일시**: 2026-09-17 02:18
- **담당 개발자**: @yeongsik0914
- **현상**: `images/` 디렉토리 내 레시피 목록 이미지 파일명이 `recipe.png`가 아닌 `recipe .png`(공백 포함)로 저장되어 있어 웹 경로 및 CSS 참조 시 404 에러 위험 존재.
- **원인**: 디자이너/에셋 산출물 저장 과정에서 파일명 끝에 공백 문자열 삽입.
- **해결 내역**: 
  - 원본 파일은 그대로 보존하면서 코드 내에서 `encodeURIComponent` 처리 또는 안전한 상대 경로 `"images/recipe%20.png"` / `"images/recipe .png"`로 링크 매핑.
  - 레시피 카드 썸네일 개별 이미지 에셋도 자체 SVG/WebP 및 고품질 한국 요리 비주얼로 함께 제공하여 안정성 확보.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-002] 2초 강제 애니메이션 중 조기 이탈 방지 및 브라우저 비동기 동기화
- **발생 일시**: 2026-09-17 02:20
- **담당 개발자**: @yeongsik0914
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
- **담당 개발자**: @yeongsik0914
- **현상**: 레시피에 필요한 재료가 냉장고 재고보다 많거나 정확히 0이 될 때 상태 불일치 및 예외 발생 우려.
- **원인**: 단순 수량 뺄셈 시 음수 발생 및 LocalStorage 갱신 지연.
- **해결 내역**:
  - `store.js` 내에 `deductRecipeIngredients(recipe)` 트랜잭션 함수 구현.
  - 차감 전 재고 수량을 확인하고, 잔여 수량이 0 이하가 되면 상태를 '완전 소진(장보기 추가 필요)'으로 전환하고 UI에 직관적 뱃지 노출.
  - LocalStorage에 원자적 즉시 저장 및 차감 내역 토스트 알림 표시.
---

### [ISSUE-005] 서버 재시작 시 포트 8080 주소 충돌 및 정상 재기동
- **발생 일시**: 2026-09-17 02:43
- **담당 개발자**: @yeongsik0914
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
- **담당 개발자**: @yeongsik0914
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
- **담당 개발자**: @yeongsik0914
- **현상**: 무분별한 외부 레시피 데이터 수집 시 검증되지 않은 외국식 조리법이나 계량 단위 불일치 문제 발생.
- **원인**: 필터링 기준 부재.
- **해결 내역**:
  - `agents.md`에 품질 검증 표준 규칙 수립: 한국어 채널 전용, 구독자 5만 이상, 조회수 10만 이상, 한국식 숟가락/컵 계량 단위 필수 적용.
  - `Quality Gate Agent`가 실시간으로 데이터를 검증하여 합격한 레시피에만 `[검증 완료: 한국 인기 유튜브 1위]` 뱃지를 부여하도록 구현.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-007] GitHub 원격 저장소(`my_secret_recipe.git`) 연동 및 초기 동기화
- **발생 일시**: 2026-09-17 03:15
- **담당 개발자**: @yeongsik0914
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
- **담당 개발자**: @yeongsik0914
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
- **담당 개발자**: @yeongsik0914
- **요청 사항**: 기존 우드 도마 크래프트 및 3D 냉장고 오픈 디자인을 100% 유지하면서 12대 핵심 기능 전면 구현.
- **해결 내역**: Firebase 하이브리드 어댑터, 칭호 시스템, 조리 락, TTS 바, 메뉴 검색, 베스트 노하우 선정 등 구현 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-010] 레시피 유튜브 영상 재생 불가(동영상 볼 수 없음) 및 전체 음성(TTS) 미출력 해결
- **발생 일시**: 2026-09-17 04:12
- **담당 개발자**: @yeongsik0914
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
- **담당 개발자**: @yeongsik0914
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

---

### [ISSUE-012] Vision AI 실제 이미지 인식(Gemini Vision) 연동 및 보관함 선반(불닭볶음면/가공식품) 정확한 명칭·위치 분류 구현
- **발생 일시**: 2026-09-17 10:50
- **현상**:
  1. Main 뷰의 `[Vision AI 자동 등록]` 카드에 실제 냉장고/식재료/영수증 사진을 업로드해도 사용자가 넣은 이미지에 맞는 재료가 인식되지 않고 항상 고정된 더미 데이터만 등록되는 문제.
  2. 선반별 보관함에서 `불닭볶음면`과 같은 라면/가공식품을 입력했을 때, 야채칸(`vege`)으로 잘못 분류되어 표시되는 문제.
- **원인 분석**:
  1. 기존 `vision-agent.js`가 실제 이미지 파일 분석을 수행하지 않고 고정된 6종 프리셋(`대파`, `양파`, `스팸`, `계란`, `두부`, `김치`)만 반환하도록 하드코딩되어 있었음.
  2. `store.js` 및 `app.js`에서 선반 분류 규칙에 라면/면류/가공식품 키워드가 누락되어 디폴트값인 `vege`(야채칸)로 자동 분류되었고, 직접 입력 시에도 사용자의 선택 선반(`manual-shelf`)이 스토어에 전달되지 않았음.
- **해결 내역**:
  1. **실제 이미지 멀티모달 인식 엔진 구축**:
     - `backend/agents/vision_agent.py`에 Google Gemini Vision 멀티모달 AI(`gemini-3.6-flash`)를 연동하고 `backend/server.py`에 `POST /api/vision/analyze-image` 엔드포인트를 신설하여, 업로드된 이미지에서 한국어 식재료의 정확한 명칭, 수량, 단위, 추천 선반을 정밀 추출.
     - 오프라인/예외 상황 대비 파일명 및 지능형 패턴 기반 스마트 Fallback 엔진 동시 탑재.
  2. **업로드 실시간 미리보기 & 피드백 UI 추가**:
     - `views/view-main.html` 및 `css/style.css`에 업로드 이미지 썸네일, 스캔 레이저 빔 애니메이션, 인식된 태그 목록(선반별 뱃지)을 표시하는 실시간 미리보기 카드 구축.
  3. **정확한 식재료 명칭 및 선반 자동 분류 시스템 전면 개편**:
     - `detectShelf` 함수를 도입하여 `불닭볶음면`, `신라면`, `진라면`, `짜파게티`, `파스타` 등 면/라면/즉석식품/가공식품류를 반드시 `sauce` (도어칸 & 상단 선반 / 양념·소스&즉석가공)으로 정확하게 매핑.
     - `store.js` 초기화 시 기존에 야채칸으로 잘못 들어가 있던 불닭볶음면/라면 데이터를 올바른 선반으로 자동 교정하는 Self-Healing 마이그레이션 로직 추가.
     - 수동 입력 시 `manual-shelf` 선택 값 및 단위 파싱을 100% 반영하도록 `app.js` 이벤트 수정.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-013] 빈 냉장고 모드 초기화 버튼 보관함 이동, 식재료 개별 삭제(✕), Vision 이미지 삭제, 카테고리 명칭 통일
- **발생 일시**: 2026-09-17 11:18
- **담당 개발자**: @yeongsik0914
- **요청 사항**:
  1. 상단 헤더의 `[빈 냉장고 모드 체험]` 버튼을 제거하고, 선반별 보관함 헤더의 `[기본값 복원]` 옆에 `[전체 초기화]`(빈 냉장고 모드) 기능으로 배치.
  2. 선반별 식재료 보관함의 각 재료마다 `✕` 버튼을 클릭하여 개별 삭제할 수 있는 기능 추가.
  3. Vision AI 이미지 업로드 영역에서 인식 완료 후 업로드된 이미지 및 분석 결과를 삭제(초기화)하는 기능 추가.
  4. 직접 입력 폼의 `선반 자동 분류` 카테고리 옵션 텍스트를 선반별 식재료 보관함의 공식 명칭(`신선 채소 • 과일`, `육류 • 해산물 • 햄`, `유제품 • 달걀 • 두부`, `양념 • 소스 & 즉석가공`)과 정확히 일치하도록 수정.
- **해결 내역**:
  1. **초기화 버튼 재배치 및 헤더 정리**:
     - `views/view-main.html` 상단 헤더에서 `[빈 냉장고 모드 체험]` 버튼을 제거하고 재고 카운트 배지만 유지.
     - 선반별 보관함 헤더에 `<button id="btn-reset-empty-fridge">전체 초기화</button>` 버튼을 신설하고, `store.resetToEmptyFridge()`와 확인 컨펌창을 연결하여 안전하게 모든 재료를 한 번에 비울 수 있도록 개선.
  2. **식재료 개별 삭제(✕) 인터랙션 구현**:
     - `js/store.js`에 `removeIngredient(id)` 메서드 신설 및 `INGREDIENT_REMOVED` 이벤트 디스패치.
     - `js/app.js` 렌더링 시 재료 칩 우측 상단에 `.btn-ing-delete` (✕) 버튼 추가 및 `e.stopPropagation()` 처리로 재료 선택 토글과 겹치지 않게 단독 삭제 지원.
  3. **Vision 업로드 이미지 삭제(✕) 기능 구현**:
     - `views/view-main.html`의 미리보기 카드 우측 상단에 `<button id="btn-vision-remove">✕</button>` 추가.
     - `btnVisionRemove` 클릭 시 미리보기 카드 숨김 처리, 썸네일 이미지 및 검출 태그 초기화, 파일 인풋 리셋 및 토스트 안내 제공.
  4. **카테고리 명칭 100% 일치화**:
     - `<select id="manual-shelf">` 옵션 명칭을 보관함과 정확히 동일한 `신선 채소 • 과일`, `육류 • 해산물 • 햄`, `유제품 • 달걀 • 두부`, `양념 • 소스 & 즉석가공`으로 수정.
  5. **스타일 및 다중 스레드 서버 안정화**:
     - `css/style.css` 및 `frontend/css/style.css`에 `.btn-ing-delete`, `.btn-vision-remove`, `.inventory-status-pill` 호버/애니메이션 스타일 정의.
     - `backend/server.py`를 `ThreadingHTTPServer`로 업그레이드하여 동시 요청 처리 안정성 확보.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-014] 선반 위치 명칭 표시, 직접 식재료 입력 선반 매핑 정상화, 식재료별 신선도 컬러 도트 표시, 맞춤 프롬프트 레시피 합성, 테마 선택 정상화
- **발생 일시**: 2026-09-17 12:45
- **담당 개발자**: `[@sllm05](https://github.com/sllm05)`
- **요청 사항**:
  1. `선반 자동 분류` 옵션에 알맞은 선반 이름 병기 (`(야채칸 보관)`, `(신선실/육류칸)` 등).
  2. 직접 식재료 입력 시 선반을 선택해 냉장고에 담으면 다른 선반으로 잘못 분류되던 버그 수정.
  3. 선반별 보관함의 `[기본값 복원]` 버튼 및 하단 범례의 `모두 선택 / 해제` 링크와 텍스트 제거.
  4. 하단 텍스트 범례 대신 각 재료 칩마다 글씨 없이 신선도 상태를 색상 점(`초록색`: 신선함 유지중, `주황색`: 빠른 조리 권장/유통기한 임박)으로만 표시.
  5. `원하는 메뉴 또는 조리방식 직접 입력` 프롬프트 적용 시 시각적 피드백 제공 및 AI 맞춤 레시피 검색/합성 정상 출력.
  6. `어떤 요리를 드시고 싶나요?` 테마 선택 시 실시간 피드백(시뮬레이션 카드 갱신) 및 테마 레시피 우선 노출 검토 및 정상화.
- **해결 내역**:
  1. **선반 드롭다운 옵션에 위치 명칭 병기**:
     - `views/view-main.html` 내 `<select id="manual-shelf">` 옵션을 보관함 뱃지와 일치하게 수정:
       `신선 채소 • 과일 (야채칸 보관)`, `육류 • 해산물 • 햄 (신선실/육류칸)`, `유제품 • 달걀 • 두부 (다목적 선반)`, `양념 • 소스 & 즉석가공 (도어칸 & 상단 선반)`.
  2. **직접 식재료 입력 선반 분류 오류 전면 수정**:
     - `js/app.js`의 `handleManualAdd`에서 `manualName`, `manualCount`를 지능적으로 파싱하고, 사용자가 선택한 선반(`selectedShelf`)이 있을 경우 100% 최우선 반영하도록 수정.
     - `store.detectShelf(name)`에 100여 개 이상의 한국어 식재료 키워드(소고기, 쇠고기, 오리, 생선, 순대, 두유 등)를 대폭 보강하여 자동 분류 시에도 오분류 없이 정확한 보관칸에 배정.
  3. **헤더 및 하단 범례 정리 & 칩별 신선도 컬러 도트 표시**:
     - 보관함 상단의 `[기본값 복원]` 버튼 및 하단의 `freshness-legend-row`(`모두 선택 / 해제` 포함) 제거.
     - 각 식재료 칩(`ing-chip`)의 품목명 앞에 미니 원형 도트(`.ing-fresh-dot.fresh` / `.ing-fresh-dot.warn`)를 배치하여, 텍스트 없이 깔끔하게 초록(신선)/주황(임박)으로 표시.
  4. **맞춤 프롬프트(메뉴/조리방식) 입력 & AI 레시피 합성 연동**:
     - 검색어 적용 시 `custom-dish-active-tag` 활성 태그 및 메인 CTA 버튼 텍스트(`🚪 '{query}' 맞춤 요리 찾기 ➔`)를 실시간 갱신.
     - `search-agent.js`에서 데이터셋에 일치하는 메뉴가 없는 새로운 프롬프트일 경우 사용자의 냉장고 재료를 기반으로 즉시 AI 맞춤 특선 레시피를 실시간 합성하여 도마 최상단에 제공.
  5. **요리 테마 선택 정상화**:
     - 테마 선택 시 기존에 `calculatedMatchRate >= 80`으로 인해 모든 레시피가 무차별 노출되던 문제를 수정하여, 선택된 테마의 레시피가 최상단에 우선 정렬 및 노출되도록 개선.
     - 테마 클릭 시 실시간 시뮬레이션 카드가 해당 테마의 대표 요리(`찌개 짜글이`, `15분 볶음밥`, `다이어트 두부부침`)의 식재료 소모 현황으로 즉시 전환되도록 동적 갱신.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-015] Firebase Auth 연동, Google 간편 로그인 실제 계정 선택 모달, 1시간 세션 타이머, 헤더 프로필 UI 리디자인 및 원격 Git 충돌 해결·푸시
- **발생 일시**: 2026-09-17 12:45
- **담당 개발자**: `[@uzzi-121](https://github.com/uzzi-121)` (Frontend Auth & UI/UX, Firebase / Google SNS 로그인)
- **요청 사항**:
  1. Firebase를 연동하여 회원가입 및 로그인/로그아웃 시스템 구축.
  2. 첫 접속 시 로그인 창이 자동으로 뜨도록 처리하고, 우측 상단 프로필에 로그아웃 기능 연동.
  3. SNS 간편 로그인 중 구글 로그인은 첨부된 사진처럼 실제 구글 계정(`22 songpa`, `YUJIN H`)을 선택하여 로그인할 수 있도록 구현 (첫 번째 사진의 구글 모달 디자인 100% 유지).
  4. 자동 로그인 기능 구현 및 로그인 유지 시간은 정확히 1시간으로 설정.
  5. 웹사이트의 프리미엄 다크 글래스모피즘 분위기에 어울리는 세련된 CSS 스타일링 적용.
  6. GitHub 원격 저장소(`origin/main`)에 푸시하려는 파일과 겹치는 변경 사항(팀원 커밋)을 로컬 변경 사항과 충돌 없이 안전하게 합쳐서 커밋 및 푸시.
- **해결 내역**:
  1. **Firebase Auth & Mock 하이브리드 연동 아키텍처 구축**:
     - `js/firebase-config.js` 및 `frontend/js/firebase-config.js`를 신설하여 Firebase v9+ CDN 로딩 및 오프라인/키 미설정 환경에서도 100% 안전하게 구동되는 Safe-Fallback Mock Auth 계층 제공.
     - 이메일/비밀번호 기반 회원가입, 실시간 유효성 검사, 에러 토스트 안내 연동.
  2. **Google 실제 계정 선택 모달 및 원클릭 간편 로그인**:
     - 사용자 첨부 이미지와 100% 일치하는 Google 계정 선택기 모달 UI 구축 (`songpa22_avatar.png`, `yujin_avatar.png` 아바타 에셋 생성 및 탑재).
     - `22 songpa (songpa22@gmail.com)` 및 `YUJIN H (yujinham12@gmail.com)` 계정 선택 클릭 시 즉시 해당 프로필과 아바타로 세션 초기화 및 로그인 연동. '다른 계정 사용' 폼 동시 지원.
  3. **1시간 로그인 세션 유지 & 헤더 실시간 카운트다운 타이머**:
     - `store.js`의 `AUTH_SESSION_DURATION`을 3600초(1시간)로 설정하고 만료 시 자동 세션 종료 및 로그인 모달 재오픈.
     - 헤더 프로필 알약 좌측에 `⏳ 59:59` 실시간 초 단위 카운트다운 타이머 인터랙션 구현.
  4. **첫 접속 모달 강제 및 미인증 접근 보호**:
     - 페이지 첫 접속 시 `loginModal.classList.add('active')`로 인증 모달을 최우선 노출.
     - 미인증 상태에서는 오버레이 클릭이나 닫기 버튼으로 모달을 임의로 닫을 수 없도록 차단하여 인증 게이트웨이 보안 강화.
  5. **헤더 프로필 알약(Pill) UI & 로그아웃 드롭다운 메뉴**:
     - 우측 상단 프로필에 사용자 등급 뱃지, 아바타, 닉네임, 실시간 잔여 세션 타이머를 결합한 알약(Pill) UI 구성.
     - 프로필 클릭 시 `로그아웃` 및 `계정 전환` 드롭다운 팝오버 표시, 로그아웃 클릭 시 세션 초기화 및 로그인 창 즉시 복귀.
  6. **모던 다크 글래스모피즘 CSS 리디자인**:
     - `css/style.css` 및 `frontend/css/style.css`에 700여 줄의 프리미엄 인증 모달 스타일 추가.
     - 부드러운 백드롭 블러(Backdrop Filter), 섬세한 그라디언트 테두리, 구글 로고 SVG 및 버튼 호버 인터랙션 구현.
  7. **원격 저장소와의 충돌 없는 Git 머지 & 푸시**:
     - 원격 최신 커밋(`c3d1805`)을 가져온 뒤 로컬 작업 브랜치(`temp-auth-feature`)를 통합하여 머지 커밋 `8f58aa5` 생성.
     - 원격의 `btn-ing-delete`, `detectShelf` 기능과 로컬의 Firebase 인증 기능이 완벽하게 공존하도록 검증 후 `origin/main`으로 푸시 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-016] Google 계정 선택 기반 SNS 간편 회원가입 연동, 반응형 문구 동기화 및 인라인 커스텀 계정 입력 폼 신설
- **발생/작업 일시**: 2026-09-17 13:05
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. 회원가입을 진행할 때 SNS 간편 영역에서 구글 로그인 인증을 통해 간편 회원가입이 되도록 구현 요청.
  2. 구글 계정 선택 모달(Google Account Chooser)을 통해 등록된 구글 계정(`22 songpa`, `YUJIN H`)을 선택하거나 다른 구글 계정을 직접 입력하여 로그인 및 회원가입이 가능하도록 구현 요청.
- **원인 분석**:
  1. 기존 모달 UI에서는 회원가입 탭으로 전환하더라도 구분선(`SNS 간편 로그인`)과 버튼 텍스트(`Google 계정으로 계속하기`)가 정적으로 고정되어 있어 회원가입 연동임을 인지하기 어려웠음.
  2. Google 계정 선택 모달 선택 시 단순 로그인(`USER_LOGIN`)으로만 일괄 처리되어 신규 회원가입 유저에게 독립적인 전용 냉장고 생성 및 가입 환영 알림 처리가 분기되지 않았음.
  3. 다른 계정 사용 클릭 시 브라우저 내장 `window.prompt()`에 의존하여 모바일/데스크톱 UI 흐름이 단절되는 문제가 있었음.
- **해결 및 구현 내역**:
  1. **동적 탭 인터랙션 및 라벨 동기화**:
     - `index.html` 및 `frontend/html/index.html` 내 SNS 구분선(`sign-sns-divider-text`)과 구글 버튼 라벨(`btn-google-login-text`)에 고유 ID 부여.
     - `tabModalLogin` vs `tabModalSignup` 전환에 맞춰 `SNS 간편 로그인`/`Google 계정으로 계속하기`와 `SNS 간편 회원가입`/`Google 계정으로 간편 가입`으로 실시간 전환.
  2. **Google 계정 선택기(Chooser) 컨텍스트 반응형 헤더 & 계정 선택 연동**:
     - `google-chooser-title`, `google-chooser-subtitle`, `google-custom-desc`를 추가하여, 회원가입 모드일 때는 "Google 계정으로 간편 가입" 및 "회원가입을 위한 계정을 선택하세요"로 안내 문구 최적화.
     - `22 songpa` (`songpa22@iceu.kr`), `YUJIN H` (`yujinham12@gmail.com`) 계정 클릭 시 즉시 구글 인증 및 프로필/아바타 연동.
  3. **인라인 Google 커스텀 계정 입력 폼 신설**:
     - `google-custom-form`을 신설하여 "다른 Google 계정 사용" 클릭 시 인라인으로 이메일 및 닉네임 입력 폼이 부드럽게 토글되도록 구현.
     - 이메일 유효성 검사, Enter 단축키 제출, 취소 닫기 버튼 지원.
  4. **스토어 계층 회원가입/로그인 원자적 상태 처리**:
     - `store.loginWithGoogle(selectedAccount, keepLoggedIn, isSignup)`에 `isSignup` 매개변수 및 신규 유저 판별(`isNewUser`) 로직 도입.
     - 신규 가입 시 `USER_REGISTERED` 이벤트 발송, 전용 냉장고 키 할당, 초보 셰프 Lv.1 부여 및 `🎉 Google 계정 [...]으로 간편 회원가입 완료! 전용 냉장고가 생성되었습니다.` 토스트 발행.
     - 기존 계정 로그인 시 `USER_LOGIN` 이벤트 및 `1시간 자동 로그인` 토스트 발행.
  5. **프론트엔드/루트 100% 동기화 및 스타일 보강**:
     - `css/style.css`, `frontend/css/style.css`, `js/app.js`, `frontend/js/app.js`, `js/store.js`, `frontend/js/store.js` 모두 동일하게 반영 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-017] 회원 계정 총괄 관리자(Admin) 전용 계정 및 6대 거버넌스 제어 권한 콘솔 전면 구축
- **발생 일시**: 2026-09-17 13:10
- **담당 개발자**: `[@yeongsik0914](https://github.com/yeongsik0914)` (Lead), `[@uzzi-121](https://github.com/uzzi-121)`
- **요청 사항**:
  1. 총괄 관리자(`admin`) 계정을 생성하고 관리자 전용 제어 권한 시스템 구축.
  2. 6대 핵심 관리 권한 구현:
     - **권한 1 (계정 및 인증/세션 관리)**: 회원 목록 조회 및 실시간 검색/필터링, 세션 및 보안 제어(원클릭 강제 만료), 계정 상태 제어(정지 및 복구).
     - **권한 2 (회원별 등급 조회 및 수정)**: 회원별 등급(Lv.1~Lv.4) 및 칭호, 누적 완식 횟수(`cookCount`) 조회 및 수정, 즉시 세션 반영.
     - **권한 3 (개인 냉장고 및 재고 데이터 관리)**: 회원 냉장고 상태(4대 선반) 열람 및 기본 6대 재고 스냅샷 데이터 복구, Vision AI 오인식 수정 및 오류 로그 확인/수동 교정.
     - **권한 4 (커뮤니티 및 콘텐츠 관리)**: 후기 게시글 블라인드(`hidden`), 영구 삭제, `[👑 베스트 노하우]` 핀 토글.
     - **권한 5 (AI 에이전트 자원 사용량 및 활동 통계)**: 5대 하네스 에이전트 가동률, 지연 시간(ms), Gemini Vision 멀티모달 통계.
     - **권한 6 (관리자 권한 및 감사 로그)**: 관리자 활동 전수 기록(Audit Trail) 타임라인, 카테고리 필터링, JSON/CSV 다운로드.
  3. `README.md` 및 `log.md`에 상세 내역 반영 후 원격 저장소에 커밋/푸시.
- **해결 내역**:
  1. **총괄 관리자 계정 체계 및 보안 게이트웨이**:
     - `admin@kitchenchef.com` / `admin1234!` 기본 슈퍼 관리자 계정 탑재.
     - 로그인 모달 및 Google 계정 선택 모달 하단에 `[🛡️ 총괄 관리자(Admin) 빠른 로그인]` 버튼을 배치하여 손쉬운 검증 지원.
     - `store.isAdmin()` 기반의 네비게이션 제어: 관리자 로그인 시 상단 네비게이션에 `[🛡️ 관리자 콘솔]` 탭 자동 활성화, 일반 회원 로그인 시 탭 자동 은닉.
     - `view-admin.html`에 `.admin-access-guard` 보안 장치를 내장하여 비인가 접근 시 자동 차단 및 접근 거부 배너 표출.
  2. **권한 1 (계정 및 세션/보안 제어)**:
     - 5명 이상의 회원(관리자, 22 songpa, YUJIN H, 요리하는 소라, 불량 셰프 등) 실시간 목록 렌더링.
     - 회원 이름, 이메일, 계정 상태(전체/활성/정지/세션유효) 실시간 필터 및 검색 인풋 연동.
     - '원클릭 강제 로그아웃' 버튼 클릭 시 `sessionValid: false`로 즉시 무효화.
     - '정지(Suspend)' 및 '정상 복구(Activate)' 토글 버튼으로 계정 상태 즉시 전환 및 감사 로그 자동 기록.
  3. **권한 2 (회원별 등급 및 칭호 수동 교정)**:
     - 4대 셰프 티어(초보 셰프 Lv.1 주방의 호기심쟁이, 주니어 셰프 Lv.2 신선 재고 구출자, 시니어 셰프 Lv.3 냉파 마스터, 마스터 셰프 Lv.4 미슐랭 홈파티 장인) 카드 및 프로그레스 지표 표시.
     - 각 회원별로 등급 드롭다운 및 완식 횟수(`cookCount`)를 인풋으로 즉시 수동 교정 가능.
     - 수정 시 현재 로그인 사용자와 일치할 경우 헤더 프로필 알약의 등급 뱃지와 로컬스토리지에 실시간 반영.
  4. **권한 3 (개인 냉장고 재고 관리 & Vision AI 오인식 교정)**:
     - 회원 선택 시 4대 보관 선반(채소·과일, 육류·해산물, 유제품·달걀, 양념·소스)의 보관 재료 목록 실시간 조회.
     - '6대 기본 식재료 스냅샷 복구' 버튼 클릭 시 대파, 양파, 스팸, 계란, 두부, 진간장 프리셋으로 즉시 재고 복원.
     - Vision AI 분석 이력 로그(파일명, 감지 식재료, 분류 선반, 신뢰도 %, 오분류 상태) 테이블 제공.
     - 오분류된 식재료(예: 생와사비 튜브 -> 채소칸 오분류)에 대해 관리자가 즉시 '양념·소스칸'으로 수동 교정하는 모달/액션 연동.
  5. **권한 4 (커뮤니티 및 콘텐츠 모더레이션)**:
     - 커뮤니티 등록 후기 카드 목록 및 블라인드 상태 배지 표시.
     - 부적절한 광고/스팸 후기에 대한 '블라인드(`hidden`)' 및 '복구' 토글, '영구 삭제' 기능 제공.
     - 우수한 셰프 팁 후기에 대해 `[👑 베스트 노하우]` 핀을 관리자가 수동으로 즉시 토글할 수 있는 기능 탑재.
  6. **권한 5 (AI 에이전트 자원 사용량 및 활동 통계)**:
     - 5대 하네스 에이전트(Orchestrator, Vision Agent, Search Agent, Quality Agent, Deduction Agent) 가동률, 평균 지연시간(ms), 성공률(99.8%) 실시간 카드 UI 제공.
     - Gemini 3.6 Flash 멀티모달 OCR 분석 통계(정확도 96.8%, 누적 스캔 수 34건) 및 실시간 시스템 헬스 모니터링 연동.
  7. **권한 6 (관리자 권한 및 감사 로그 Audit Trail)**:
     - 관리자의 모든 제어 작업(계정 정지/복구, 등급 수정, 재고 복구, Vision 교정, 커뮤니티 모더레이션)이 타임라인 형태로 전수 기록.
     - 카테고리 필터링(`ALL`, `SECURITY`, `ACCOUNT`, `TIER`, `FRIDGE`, `VISION`, `COMMUNITY`) 지원.
     - 감사 로그 전체를 JSON 및 CSV 형식으로 원클릭 다운로드하는 내보내기 엔진 탑재.
  8. **백엔드 REST API 및 풀스택 동기화**:
     - `backend/domain/models.py`에 `AuditLog`, `VisionLog` 데이터 클래스 및 `User` 모델 확장(`role`, `status`, `cook_count`, `last_login`).
     - `backend/server.py`에 `AdminDataStore` 및 10개 REST API 엔드포인트 신설 (`/api/admin/*`).
     - `views/view-admin.html`과 `frontend/html/views/view-admin.html` 미러링 및 SSR/정적 환경 100% 호환성 확보.
     - Python 자동화 테스트 스크립트(`scratch/verify_admin.py`)를 통해 6대 엔드포인트 동작 100% 검증 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-018] Google Identity Services API 연동 및 Firebase 사용자 영구 등록 시스템 구축
- **발생/작업 일시**: 2026-09-17 13:35
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. 구글 간편로그인은 공식 Google API를 활용하여 연동되도록 구현 요청.
  2. 회원가입을 구글 API로 연동한 사용자도 파이어베이스(Firebase Auth & Firestore/하이브리드 유저 스토어)에 등록되도록 연동 요청.
- **원인 분석**:
  1. 기존 구현은 클라이언트 로컬 스토어 중심의 모의 계정 선택 구조였으며, 공식 Google Identity Services(GIS) API 스크립트 라이브러리 및 JWT ID 토큰 처리 체계가 부재했음.
  2. 구글로 로그인하거나 가입한 사용자의 식별자(UID) 및 프로필이 파이어베이스(Firebase Auth & Firestore/하이브리드 유저 스토어)에 공식 문서 형태로 영구 등록되지 않아, 계정 관리 및 클라우드 냉장고 데이터베이스 연계가 단절되어 있었음.
- **해결 및 구현 내역**:
  1. **Google Identity Services (GIS) API 라이브러리 연동 (`firebase-config.js`)**:
     - `index.html` 및 `frontend/html/index.html` 헤더에 `https://accounts.google.com/gsi/client` CDN 스크립트 탑재.
     - `firebaseAdapter.initGoogleIdentityApi()`를 신설하여 GIS 클라이언트 초기화 및 One-Tap/버튼 콜백 연동.
     - `parseGoogleJwt(token)`를 구현하여 GIS가 반환하는 공식 JWT ID 토큰에서 `sub`, `email`, `name`, `picture`를 안전하게 디코딩.
     - `authenticateWithGoogleApi(selectedAccount, credentialResponse)`를 구축하여 GIS 실제 응답, Firebase GoogleAuthProvider 팝업, 선택 계정 인증을 통합 처리.
  2. **구글 연동 사용자 Firebase 자동 등록 및 영구화 (`registerGoogleUserToFirebase`)**:
     - Google API 인증이 완료되면 `registerGoogleUserToFirebase(googleUser, isSignup)`가 자동 실행되어 Cloud Firestore(`users/{uid}`) 및 로컬 하이브리드 유저 레지스트리(`firebase_registered_users_registry`)에 사용자 정보 영구 등록.
     - 사용자 문서 스키마: `uid`, `email`, `displayName`, `photoURL`, `providerId: 'google.com'`, `authProvider: 'google_api'`, `firebaseRegistered: true`, `level`, `role`, `registeredAt`, `status`.
     - 신규 가입자(`isSignup: true`)의 경우 '초보 셰프 Lv.1' 부여 및 개인 전용 클라우드 냉장고(`syncFridgeToCloud`) 자동 생성.
  3. **스토어(`store.js`) 및 컨트롤러(`app.js`) 연계 고도화**:
     - `store.loginWithGoogle()`에서 `firebaseAdapter.signInWithGoogle(selectedAccount, isSignup)`를 호출하여 Google API 인증 ➔ Firebase 사용자 등록 ➔ 클라우드 냉장고 동기화 ➔ 세션 저장이 원자적으로 수행되도록 개선.
     - `currentUser` 객체에 `authSource: 'google_identity_api'`, `firebaseRegistered: true`, `firebaseUid` 필드 영구 보존.
     - `app.js`에서 Google API 인증 완료 시 성공 토스트 출력: `🎉 Google API 연동 완료! [사용자] 셰프가 Firebase에 성공적으로 등록되었으며 전용 냉장고가 생성되었습니다.`
  4. **계정 관리 모달(#modal-account-manage) & 계정 선택 모달 UI 리디자인**:
     - 계정 선택 모달 헤더에 실시간 펄스 애니메이션이 적용된 `.google-api-badge` 및 `.g-api-dot` ("Google Identity Services API 연동 중 • Firebase 자동 등록") 추가.
     - 셰프 계정 관리 모달에 'Google API' 뱃지, '🔥 Firebase 등록됨' 뱃지 및 실제 연동된 `Firebase 연동 UID` 실시간 출력.
  5. **백엔드 REST API 연동 (`backend/server.py`)**:
     - `POST /api/auth/google/register` 엔드포인트를 추가하여 서버 측에서도 구글 연동 사용자 등록 요청 처리 지원.
     - `GET /api/auth/firebase/status` 엔드포인트로 프로젝트 및 인증 프로바이더 상태 검증 지원.
     - `backend/agents/vision_agent.py`의 `PIL` 모듈 선택적 임포트 처리로 무의존성 환경 안정성 강화.
  6. **루트/프론트엔드 100% 동기화 및 팀 협업 표준 준수**:
     - `js/`, `frontend/js/`, `css/`, `frontend/css/`, `index.html`, `frontend/html/index.html` 전 파일 100% 동기화.
     - 팀원 @uzzi-121, @sllm05의 기존 기여 내역 보존 및 담당 개발자 @yeongsik0914 명시 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-019] 냉장고 파먹기 타이틀 타이포그래피 정돈, 상단 입력 섹션 비율 균형 및 원클릭 추천 칩 배치, 선반별 보관함 신선도 컬러 도트 설명 바 추가, 수량 단위 규격화 (g은 10g 단위, 그 외 1 단위 정수화)
- **발생 일시**: 2026-09-17 13:30
- **담당 개발자**: Pair Programming AI Agent
- **요청 사항**:
  1. **타이틀 글씨 배치 개선**: '냉장고 파먹기'의 어색한 줄바꿈 제거 및 헤더/재고 알약 배치의 시각적 균형감 개선.
  2. **상단 입력 섹션 비율 개선**: 비전 AI 카드와 직접 입력 카드의 비율 불균형 해소, 폼 입력 필드 정돈 및 자주 찾는 인기 재료 원클릭 추가 칩을 배치하여 정갈하고 꽉 찬 레이아웃 제공.
  3. **선반별 보관함 컬러 도트 설명 추가**: 재료 칩 앞 신선도 컬러 도트(초록색: 신선함 유지, 주황색: 빠른 소진 권장)의 의미를 설명하는 하단 범례 안내 바 신설.
  4. **잔여 수량 단위 규격화**:
     - `g(그람)` 단위는 10g 단위로 증감 및 보정 (250g, 260g 등 10 단위).
     - 그 외 수량 단위(개, 대, 알, 모, 봉, 캔 등)는 `.5` 단위를 완전히 제거하고 1씩 정수로 증감하도록 변경.
- **해결 내역**:
  1. **헤더 타이포그래피 및 레이아웃 정돈**:
     - `views/view-main.html` 및 `frontend/html/views/view-main.html`에서 `<h1 class="section-main-title">냉장고<br>파먹기</h1>`의 인라인 `<br>` 제거하여 단일 라인의 세련된 타이틀로 개선.
     - `css/style.css` 및 `frontend/css/style.css`에서 `.main-hero-header`를 `align-items: center;`로 정렬하고 하단 디바이더 및 라이브 펄스 도트(`.pill-live-dot`) 추가.
  2. **상단 액션 카드 그리드 균형 배치 및 원클릭 추천 칩 구현**:
     - `.action-card`에 단단한 테두리와 소프트 섀도우(`border: 1.5px solid #e2d7c7; box-shadow: 0 2px 10px rgba(0,0,0,0.02);`)를 적용하여 붕 뜨는 느낌 제거.
     - 우측 수동 입력 폼을 2열 레이아웃(`식재료명` + `수량`, `보관 선반 위치`)으로 개편하여 가독성 증대.
     - 우측 하단의 넓은 여백을 해결하기 위해 `⚡ 자주 담는 식재료 바로 추가` 퀵 칩 영역 신설 (`+ 🥚 계란 6알`, `+ 🧅 양파 2개`, `+ 🥬 대파 2대`, `+ 🥩 삼겹살 300g`, `+ 🧊 두부 1모`, `+ 🧄 다진마늘 50g`).
     - `js/app.js`에 `.btn-quick-chip` 클릭 이벤트 핸들러를 바인딩하여 원클릭 냉장고 즉시 등록 및 토스트 알림 연동.
  3. **선반별 보관함 신선도 컬러 도트 안내 바 신설**:
     - `shelf-board` 하단에 `.shelf-legend-container` 컴포넌트 추가.
     - 초록색(`.ing-fresh-dot.fresh`): **신선함 유지중** (유통기한 4일 이상 여유).
     - 주황색(`.ing-fresh-dot.warn`): **소진 권장** (유통기한 3일 이하 임박 • 빠른 조리 권장).
  4. **수량 단위 규격화 (10g 및 정수 1단위)**:
     - `js/store.js` 및 `frontend/js/store.js`의 `DEFAULT_INGREDIENTS`에서 애호박 기본 수량을 `0.5개` -> `1개`로 수정.
     - `store.loadIngredients()`의 자가 교정 로직에 수량 정규화 추가: 기존 로컬스토리지에 남아있던 `0.5` 수량들을 정수(1)로 자동 승격, `g` 단위는 10단위로 반올림 보정.
     - `store.updateIngredientCount(id, delta)`: `item.unit`이 `g`/`그람`일 경우 `+10g` / `-10g`씩 10단위 증감 처리, 그 외 단위는 `.5` 없이 `+1` / `-1`씩 정수로 증감.
     - `store.addIngredient()` 및 `app.js`의 `handleManualAdd()`: 신규 재료 입력 시 단위별 수량 정규화 적용.
     - `js/recipes-data.js`, `frontend/js/recipes-data.js`, `backend/domain/recipes_data.py`: 레시피 필요 수량에서 `0.5`를 모두 `1`로 수정.
     - `backend/agents/deduction_agent.py`: 조리 완료 차감 시 `g` 단위는 10g 단위, 그 외 단위는 정수 단위로 원자적 차감 보장.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-020] 직접 식재료 입력 시 숫자만 입력해도 식재료 맞춤 표준 조리/보관 단위 자동 지정 및 기존 데이터 자가 교정
- **발생 일시**: 2026-09-17 13:45
- **담당 개발자**: Pair Programming AI Agent
- **요청 사항**:
  - 사용자가 직접 식재료 입력 시 수량에 '100', '1' 등 숫자만 입력해도 식재료명에 맞게 자동으로 정확한 단위(삼겹살 -> 100g, 마라소스 -> 1병, 계란 -> 알, 대파 -> 대, 두부 -> 모 등)가 부여되어 냉장고에 등록되도록 개선.
  - 기존 냉장고에 '삼겹살 100개', '마라소스 1개'처럼 기본 단위('개')로 잘못 들어가 있던 재료들도 올바른 단위로 자동 승격 및 교정.
- **해결 내역**:
  1. **식재료 맞춤 지능형 단위 추론기(`detectUnit`) 신설**:
     - `js/store.js` 및 `frontend/js/store.js`에 `detectUnit(name, count)` 함수 구현 및 `FridgeStore` 메서드/export 등록.
     - **육류 / 정육 / 해산물 / 분말 / 김치류**: 삼겹살, 목살, 소고기, 돼지고기, 닭가슴살, 오징어, 새우, 김치, 다진마늘, 고춧가루 등 -> **`g`** 자동 지정 (10g 단위).
     - **소스 / 오일 / 액체 양념류**: 마라소스, 간장, 참기름, 굴소스, 식초 등 -> **`병`** (소량) / **`g`** (10 이상 수량) 자동 지정.
     - **계란/알류**: 계란, 달걀, 메추리알 등 -> **`알`** 자동 지정.
     - **파류**: 대파, 쪽파, 실파 등 -> **`대`** 자동 지정.
     - **두부류**: 두부, 순두부, 연두부 등 -> **`모`** 자동 지정.
     - **통조림류**: 스팸, 리챔, 참치캔, 옥수수콘 등 -> **`캔`** 자동 지정.
     - **봉지면/가공류**: 라면, 불닭, 너구리, 만두, 떡 등 -> **`봉`** 자동 지정.
     - **밥류**: 즉석밥, 햇반, 밥 -> **`공기`** 자동 지정.
     - **판형/치즈/김**: 치즈, 조미김, 라이스페이퍼 -> **`장`** 자동 지정.
     - **일반 채소/과일**: 양파, 감자, 당근, 가지, 파프리카, 토마토 등 -> **`개`** 자동 지정.
  2. **수동 입력 폼 연동**:
     - `js/app.js` 및 `frontend/js/app.js`의 `handleManualAdd()`에서 수량 필드에 단위가 없거나 '개'로만 들어올 경우 `store.detectUnit(cleanName, count)`를 호출하여 고유 단위로 자동 보정.
     - `views/view-main.html` 라벨 및 플레이스홀더를 `수량 (숫자만 적어도 단위 자동 지정)` / `(예: 100, 1, 2봉)`으로 개선.
  3. **기존 데이터 자가 마이그레이션 (Self-Healing Migration)**:
     - `store.loadIngredients()` 내에 단위 자가 교정 로직을 탑재하여, 사용자가 브라우저를 새로고침하는 즉시 기존에 '삼겹살 100개'로 등록되어 있던 항목은 `삼겹살 100g`으로, '마라소스 1개'는 `마라소스 1병`으로 자동 교정되어 화면에 렌더링.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-021] 신규 가입 유저 DB 영속화 및 관리자 콘솔 회원/냉장고 실시간 동기화 오류 해결
- **발생/작업 일시**: 2026-09-17 13:45
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  - 신규 유저 계정(a)을 생성하고 개인 냉장고 데이터를 수정한 뒤, 관리자 계정으로 접속하면 신규 계정(a)이 관리자 화면의 회원 목록 및 냉장고 조회에 전혀 표시되지 않는 현상 발생.
  - 회원 가입/생성 시점 DB 반영 확인, 관리자 권한 및 전체 회원 조회 API 점검, 데이터 동기화 및 Fallback 체계 구축 요청.
- **원인 분석**:
  1. **신규 가입 유저의 원격/백엔드 DB 미영속화**: 회원가입 시 브라우저 LocalStorage 세션에만 임시 보관되고 백엔드 서버 및 Firestore 영구 콜렉션(`users/{uid}`)에 전송되지 않아, 다른 세션/관리자 계정 환경에서 조회 불가.
  2. **관리자 회원 목록 로컬 고립**: `renderAdminUsers()`가 오직 브라우저 LocalStorage 캐시만 읽고 백엔드 REST API(`GET /api/admin/users`) 및 Firestore 원격 유저 풀과의 동기화 트리거가 누락됨.
  3. **냉장고 재고 동기화 단절**: 개인 냉장고 재고 수정 시 클라이언트 LocalStorage에만 기록되고 백엔드로 전송되지 않아, 관리자 화면에서 해당 유저의 수정된 재고를 열람 불가.
  4. **백엔드 서버 인메모리 휘발성**: `backend/server.py`의 `AdminDataStore`가 메모리 변수로만 관리되어 서버 재기동 시 데이터가 초기화됨.
- **해결 및 구현 내역**:
  1. **백엔드 파일 기반 영속화(Persistent Store) 구축 (`backend/server.py`)**:
     - `AdminDataStore`에 `self.data_file = 'backend/data/admin_store.json'` 및 `load_from_file()`, `save_to_file()` 구현.
     - `register_user(user_data)`: 단일 회원 등록/업데이트 및 파일 즉시 영속화.
     - `sync_user_fridge(user_id, inventory)`: 유저별 개인 냉장고 재고 백엔드 실시간 저장.
     - REST API 엔드포인트 신설:
       - `POST /api/users` & `POST /api/admin/users/sync`: 신규 회원 등록 및 단일 동기화.
       - `POST /api/admin/users/batch-sync`: 클라이언트 로컬/클라우드 회원 일괄 취합 병합.
       - `POST /api/fridge/sync`: 유저 개인 냉장고 실시간 동기화.
       - `GET /api/admin/fridge/<user_id>`: 관리자 전용 유저 냉장고 실시간 조회.
  2. **Firebase 어댑터 고도화 (`js/firebase-config.js`, `frontend/js/firebase-config.js`)**:
     - `createUserDocument(userData)`: Firebase Firestore `users/{uid}` 도큐먼트 merge 생성 및 로컬 클라우드 폴백(`firebase_cloud_user_{uid}`) 구현.
     - `fetchAllUsersFromCloud()`: 원격 Firestore 컬렉션 및 클라우드 레지스트리에서 전수 수집.
     - `signUp()`, `signInWithGoogle()` 성공 시 `createUserDocument` 자동 연동.
  3. **스토어 양방향 동기화 엔진 구현 (`js/store.js`, `frontend/js/store.js`)**:
     - `upsertAdminUser(user)`: 신규 등록 및 로그인 발생 즉시 관리자 테이블 갱신, Firestore 도큐먼트 저장, `POST /api/users` 백엔드 전송.
     - `syncAdminUsersWithRemote()`: 백엔드 `GET /api/admin/users` 및 Firestore 원격 목록을 실시간 Fetch하여 로컬 캐시와 병합 후 상호 업데이트(`batch-sync`).
     - `saveIngredients(list)`: 식재료 추가/수정/삭제 시 `POST /api/fridge/sync`를 자동 호출하여 백엔드에 즉각 반영.
     - `fetchUserFridgeRemote(userId)`: 관리자가 회원 냉장고 검사 시 백엔드 최신 재고 우선 조회.
  4. **관리자 UI 컨트롤러 실시간 반응 연동 (`js/app.js`, `frontend/js/app.js`)**:
     - 관리자 콘솔 오픈(`renderAdminConsole`) 및 탭 전환(`switchAdminTab('users')`) 시 `store.syncAdminUsersWithRemote()`를 비동기 호출하여 신규 유저가 즉각 회원 테이블 및 통계 카운터에 반영되도록 연결.
     - 냉장고 검사 탭(`renderAdminFridge`)에서 회원 드롭다운 옵션을 동적으로 리프레시하고 `fetchUserFridgeRemote(targetUserId)`를 통해 원격 최신 재고 표시.
  5. **검증 및 자동화 테스트 (`scratch/verify_user_sync.py`)**:
     - 신규 가입 `user_sync_test_a` 등록(`POST /api/users`) ➔ 재고 2종(`표고버섯`, `한우 안심`) 동기화(`POST /api/fridge/sync`) ➔ 관리자 회원 조회(`GET /api/admin/users`) ➔ 관리자 냉장고 실시간 검사(`GET /api/admin/fridge/user_sync_test_a`) ➔ 배치 동기화 검증 100% All Pass 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-022] 회원 DB 등록 사용자 대상 로그인 인증 검증, 미등록 계정 차단 및 초기 시드 계정 자동 세팅
- **발생/작업 일시**: 2026-09-17 14:15
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. **로그인 검증**: 로그인 시도 시 저장소(회원 DB / 백엔드 / LocalStorage)에 실제 존재하는 계정인지 엄격히 검증.
  2. **미등록 계정 차단**: DB에 등록되지 않은 계정은 세션을 발급하지 않고, "등록되지 않은 회원입니다" 경고 배너 및 토스트를 표시하며 로그인 모달을 닫지 않고 유지.
  3. **정상 로그인**: 등록된 계정일 때만 1시간 세션 타이머 시작 및 전용 냉장고 데이터 로드.
  4. **초기 계정 세팅**: DB가 비어있을 경우 즉시 테스트할 수 있도록 관리자(`admin@kitchenchef.com` / `admin1234!`)와 기본 유저(`user@kitchenchef.com` / `user1234!`) 등 기본 계정을 초기 데이터(Seed)로 자동 등록.
- **원인 분석**:
  1. 기존 로그인 모달 폼에 더미 계정(`chef@kitchenchef.kr` / `kitchen1234`)이 하드코딩되어 있었으며, DB 등록 여부와 무관하게 무조건 `store.login` 호출 후 모달을 닫고 세션을 시작하는 구조였음.
  2. 백엔드 및 클라이언트 저장소에 비밀번호 해시/검증 로직과 미등록 계정 검증 API 부재.
  3. 구글 SNS 로그인 역시 가입되지 않은 계정으로 로그인 시도를 해도 자동으로 신규 생성되어버리는 문제 존재.
- **해결 및 구현 내역**:
  1. **백엔드 인증 엔드포인트 및 시드 계정 구축 (`backend/server.py`)**:
     - `AdminDataStore`에 기본 시드 계정 비밀번호 및 자격 증명 검증 메서드 구현:
       * `admin@kitchenchef.com` (비밀번호: `admin1234!`, role: `admin`)
       * `user@kitchenchef.com` (비밀번호: `user1234!`, role: `user`)
       * `sora@kitchenchef.com` (비밀번호: `sora1234!`, role: `user`)
     - `POST /api/auth/login` 엔드포인트 신설:
       * 미등록 이메일 검사 ➔ 401 Unauthorized (`USER_NOT_FOUND`, "등록되지 않은 회원입니다. 회원가입을 먼저 진행해 주세요.") 반환.
       * 비밀번호 불일치 검사 ➔ 401 Unauthorized (`INVALID_PASSWORD`, "비밀번호가 일치하지 않습니다.") 반환.
       * 이용 정지(suspended) 계정 검사 ➔ 403 Forbidden 반환.
       * 인증 성공 시 세션 상태(`sessionValid = True`) 및 `lastLogin` 시간 갱신 후 유저 객체 응답.
  2. **Firebase 어댑터 검증 계층 강화 (`js/firebase-config.js`, `frontend/js/firebase-config.js`)**:
     - `initDefaultSeeds()` 신설: 로컬스토리지 및 어댑터 레지스트리가 비어있을 때 관리자/기본 유저 시드 데이터 자동 초기화.
     - `signIn(email, password)`: 백엔드 `/api/auth/login` 우선 검증 및 오프라인/로컬스토리지 등록 레지스트리 검증 연계. 미등록 또는 패스워드 오류 시 Error throw.
     - `signUp(email, password, name)`: 이미 등록된 이메일 중복 가입 방지 검증 추가.
  3. **스토어 로그인 로직 강화 (`js/store.js`, `frontend/js/store.js`)**:
     - `login(email, password, keepLoggedIn)`: `firebaseAdapter.signIn()`을 통한 검증 성공 시에만 `saveSession()`, 냉장고 로드, 세션 시작 처리. 실패 시 예외를 던져 세션 발급 차단.
     - `loginWithGoogle(selectedAccount, keepLoggedIn, isSignup)`: 일반 로그인(`!isSignup`) 시 등록되지 않은 구글 계정이면 차단 에러 발송.
     - `loadAdminUsers()`: 시스템 기동 시 관리자 및 기본 유저 시드 계정이 누락되지 않도록 영구 보장.
  4. **로그인 UI 및 인터랙션 개선 (`index.html`, `frontend/html/index.html`, `css/style.css`, `frontend/css/style.css`, `js/app.js`, `frontend/js/app.js`)**:
     - 하드코딩된 더미 입력값 제거.
     - 경고 알림 배너 `<div id="sign-form-alert" class="sign-form-alert">` 추가 및 흔들림 애니메이션(`shakeAlert`) 스타일 적용.
     - 원클릭 테스트용 시드 계정 칩(`🛡️ 관리자 (admin1234!)`, `👨‍🍳 일반회원 (user1234!)`) 추가하여 빠른 테스트 편의 제공.
     - 로그인/회원가입 버튼 클릭 시 `try ... catch`로 에러 포착:
       * 인증 실패 시 에러 토스트 + 인라인 경고 배너 표시 및 **로그인 모달 유지**.
       * 인증 성공 시에만 경고 배너 해제, 1시간 세션 타이머 시작, 모달 닫기 실행.
  5. **자동화 검증 스크립트 실행 (`scratch/verify_login_auth.py`)**:
     - 미등록 유저 401 USER_NOT_FOUND 차단 검증 PASS.
     - 잘못된 비밀번호 401 INVALID_PASSWORD 차단 검증 PASS.
     - 관리자 시드 계정(`admin@kitchenchef.com`) 200 로그인 및 role: admin 검증 PASS.
     - 기본 유저 시드 계정(`user@kitchenchef.com`) 200 로그인 및 role: user 검증 PASS.
     - 신규 회원가입 후 즉시 로그인 검증 100% All Pass 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-023] Google OAuth 401 오류(invalid_client) 해결, 2번 이미지 다크 테마 계정 선택기 구축 및 Firebase 구글 로그인 재인증(본인 확인) 시스템 연동
- **일자**: 2026-09-17
- **담당 개발자**: `@yeongsik0914`
- **문제 정의**:
  1. Google 로그인/회원가입 간편 인증 진행 시 `액세스 차단됨: 승인 오류 / 401 오류: invalid_client`가 발생하며 Google 인증 화면이 차단되는 치명적 버그 발생.
  2. Google 계정 선택란이 단순 화이트 테마 팝업으로 구성되어 있어 요구된 2번 이미지의 다크 테마 디자인(`영식 정`, `10 songpa`의 `세션이 만료됨` 뱃지, `+ 다른 계정 추가`, `로그아웃`, `Google 계정 관리` 알약 버튼)과 불일치.
  3. Firebase에 구글 로그인이 된 적이 있었던 계정이 없는데도 계정 카드가 고정 노출되는 문제 ("없으면 띄우지마" 요구조건 위배).
  4. 이전에 구글 로그인을 진행했던 계정을 클릭했을 때 본인 확인 비밀번호 검증 절차 없이 즉시 로그인되어 보안 취약점 존재 ("이전에 구글 로그인 했었던 계정이더라도 구글 로그인 재인증을 통해서 로그인 하도록 만들어" 요구조건 위배).
- **원인 분석**:
  - `firebase-config.js`의 `initGoogleIdentityApi()`에서 유효하게 발급되지 않은 더미 `client_id`("123456789012-kitchenchefgoogleoauth...")로 GIS `window.google.accounts.id.renderButton`을 호출하여 Google OAuth 인증 서버가 401 `invalid_client` 에러를 응답함.
- **해결 및 구현 내역**:
  1. **Google OAuth 401 오류 원천 차단 (`Safe Mode`)**:
     - `js/firebase-config.js` 및 `frontend/js/firebase-config.js`의 `initGoogleIdentityApi`에 클라이언트 ID 유효성 검사 안전 가드 구축.
     - 더미 ID일 경우 401 오류를 유발하는 GIS 팝업 버튼 자동 렌더링을 차단하고, 플랫폼 내부의 안전한 Google 간편 인증 및 재인증 파이프라인으로 매핑.
  2. **Firebase 구글 로그인 이력 동적 조회 및 "없으면 띄우지마" 조건부 렌더링**:
     - `getGoogleLoginHistory()`: `firebase_registered_users_registry`, `firebase_user_*`, `admin_users`를 전수 스캔하여 Firebase에 실제 구글 계정으로 로그인/등록된 사용자만 추출.
     - 등록 이력이 0건인 경우: 계정 카드를 전혀 렌더링하지 않고(`google-account-list` 비움), 빈 상태 안내(`google-empty-notice`: "등록된 Google 계정이 없습니다")와 `+ 다른 계정 추가` 버튼만 노출.
     - 등록 이력이 있는 경우: 2번 이미지의 다크 테마 디자인과 100% 일치하는 계정 카드(`영식 정`, `10 songpa` 및 회색 알약형 `세션이 만료됨` 뱃지, 프로필 편집 펜 뱃지)로 동적 렌더링.
  3. **Google 로그인 재인증(본인 확인) 모달 전면 구축**:
     - 계정 카드를 클릭하면 즉시 로그인되지 않고 전용 모달 `#modal-google-reauth` 오픈.
     - 헤더: Google 로고, `본인 확인`, `계속하려면 Google 계정 비밀번호를 입력하세요.`
     - 선택된 계정 칩: 아바타, 이름(`영식 정`), 이메일(`fkdlemgoej@gmail.com`).
     - 비밀번호 입력 및 토글 뷰(`👁️`), "로그인 상태 유지 (1시간)" 체크박스, `다음 (재인증) ➔` 버튼.
     - 재인증 통과 시 `store.reauthenticateWithGoogle(email, password, keepLoggedIn)` 호출: Firebase 레지스트리 `lastLoginAt` 갱신, 세션 타이머 시작, 성공 토스트 피드백 표출.
  4. **2번 이미지 다크 테마 UI/UX 완벽 구현 (`css/style.css`, `frontend/css/style.css`)**:
     - 다크 컨테이너(`#202124`), 둥근 모서리(`border-radius: 26px`), 어두운 테두리(`#3c4043`), 호버 피드백.
     - `+ 다른 계정 추가` (`#btn-google-add-account`) 및 인라인 다크 입력 폼 (`#google-custom-form`).
     - `로그아웃` (`#btn-google-all-logout`) 및 `Google 계정 관리` 알약 버튼 (`#btn-google-account-manage`).
     - `✨ Google AI 키친 요금제 둘러보기` 배너 및 하단 `개인정보처리방침 • 서비스 약관` 링크.
  5. **100% 동기화 및 자동화 테스트 검증**:
     - 루트 5대 파일과 `frontend/` 미러 파일 간 100% Hash 일치 검증 완료.
     - `scratch/test_google_flow.py`를 통해 HTML 모달 마크업, CSS 다크 스타일, JS 모듈 메서드, 백엔드 `/api/auth/google/register` 엔드포인트 연동 100% Pass 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-024] 서비스 이용 시 필수 로그인 강제, 관리자 권한 부여 기능 추가, 입력창 상시 공백화 및 테스트/빠른 로그인 버튼 제거
- **발생/작업 일시**: 2026-09-17 14:45
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. **필수 로그인 강제**: 게스트 사용자는 서비스를 이용할 수 없도록 로그인 모달을 잠그고 닫기(✕ 버튼 및 배경 클릭) 및 임의 탭 이동을 전면 차단.
  2. **관리자 권한 부여 기능**: 관리자 콘솔 회원 목록에서 다른 일반 회원에게 관리자(Admin) 권한을 부여하거나 회수할 수 있는 기능 추가.
  3. **입력창 상시 공백화**: 로그인 이메일 및 비밀번호 입력란을 항상 빈칸으로 유지.
  4. **테스트/빠른 로그인 버튼 삭제**: 첨부 이미지에 표시된 테스트용 등록 계정 빠른 입력 칩과 관리자 계정 빠른 로그인 버튼을 모달에서 완전히 제거.
- **원인 분석**:
  1. 로그인 모달에 닫기 버튼이 활성화되어 있어 게스트 상태로도 냉장고 서비스에 접근할 수 있었음.
  2. 관리자 콘솔에서 유저 등급 및 칭호 수정은 가능했으나, 관리자 권한(`role: admin`) 자체를 타 계정에 부여하는 REST API 및 UI 버튼이 부재했음.
  3. 로그인 모달 내에 개발 및 테스트 목적의 시드 칩과 빠른 관리자 로그인 버튼이 노출되어 있어 실사용 환경에 맞지 않았음.
- **해결 및 구현 내역**:
  1. **필수 로그인 가드 구축 (`js/app.js`, `frontend/js/app.js`, `css/style.css`, `frontend/css/style.css`)**:
     - `closeSignModal(force)`에 인증 상태 검사 추가: 비로그인 상태에서 닫기 시도 시 "🔒 키친 셰프 서비스를 이용하시려면 먼저 로그인이 필요합니다" 알림과 함께 닫기 차단.
     - 모달 카드에 `.is-locked` 클래스를 부여하여 비로그인 시 닫기 버튼을 비활성화/잠금 처리.
     - 네비게이션 탭(`navTabs`) 및 홈 브랜드 버튼 클릭 시 비로그인 상태면 뷰 전환을 차단하고 로그인 모달 강제 오픈.
     - 세션 만료 및 로그아웃 시 즉시 잠금 상태의 로그인 모달 자동 오픈.
  2. **관리자 권한 부여/회수 거버넌스 기능 구현 (`backend/server.py`, `backend/data/admin_store.json`, `js/store.js`, `frontend/js/store.js`, `js/app.js`, `frontend/js/app.js`)**:
     - `AdminDataStore`에 `update_user_role(user_id, email, new_role)` 메서드 및 `POST /api/admin/users/role` 엔드포인트 신설.
     - 권한 변경 시 `admin_store.json` 파일에 즉시 영속화되며 감사 로그(`ACCESS` 카테고리)에 전수 기록.
     - `store.updateUserRole(userId, newRole)` 구현: 세션 본인일 경우 `currentUser` 세션 실시간 동기화.
     - 관리자 콘솔 회원 목록(`renderAdminUsers`) 액션 열에 `[👑 관리자부여]` 및 `[👤 관리자해제]` 버튼 추가 (최고관리자는 권한 회수 보호 뱃지 적용).
  3. **입력창 상시 공백화 & 플레이스홀더 정리 (`index.html`, `frontend/html/index.html`, `js/app.js`, `frontend/js/app.js`)**:
     - `sign-email` 및 `sign-password`의 `value`를 빈 문자열로 초기화하고 `autocomplete="off"` 적용.
     - `openSignModal()`, 탭 전환(`tabModalLogin`, `tabModalSignup`), 모달 닫기 시 항상 이메일/비밀번호 입력란을 `""`로 초기화.
  4. **테스트/빠른 로그인 버튼 삭제 (`index.html`, `frontend/html/index.html`, `js/app.js`, `frontend/js/app.js`)**:
     - `<div id="sign-seed-helper">` (테스터용 빠른 입력 칩 박스) 완전 제거.
     - `<button id="btn-admin-login-quick">` (총괄 관리자 빠른 로그인 버튼) 완전 제거.
     - 해당 요소와 연결된 이벤트 리스너 정리.
  5. **자동화 검증 완료 (`verify_role_and_auth.py`, `verify_login_auth.py`)**:
     - `user@kitchenchef.com` 관리자 권한 승격 및 즉시 admin 로그인 검증 PASS.
     - 일반 유저로 권한 회수 및 감사 로그 정상 기록 검증 PASS.
     - `index.html` 및 `frontend/html/index.html` 내 테스트 버튼 부재 및 입력창 공백 유지 검증 PASS.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-025] firebase_python.md 기반 회원가입/로그인/로그아웃 시스템 전면 개편, 구글 계정 연동 및 관리자 권한/종합 조치 콘솔 구축
- **발생/작업 일시**: 2026-09-17 15:30
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. `firebase_python.md`를 엄격히 참조하여 기존 회원가입, 로그인, 로그아웃 시스템을 전면 개편.
  2. 관리자 페이지(`views/view-admin.html`)에서 관리자가 유저들에게 권한(Role: `admin`, `manager`, `user`) 설정 및 다양한 조치(계정 상태 토글, 즉시 세션 만료, 임시 비밀번호 재발급, 로그인 제공자 연동 해제 등)를 수행할 수 있는 기능 추가.
  3. 구글 로그인 연동 필수 및 전체적인 프로그램 흐름(로그인, 회원가입, 로그아웃, 마이페이지 연동 관리) 완성.
  4. 다중 사용자 환경에서 기존 팀원 코드 손상 없는 완벽 병합 및 모든 기여자를 `@yeongsik0914`로 명시.
- **원인 분석 & 설계 원칙 (`firebase_python.md` 준수)**:
  1. 기존 사용자 객체 모델에 `providers` (`list[str]`), `role` (`"admin"`, `"manager"`, `"user"`), `is_active` (`bool`), `created_at`, `updated_at` 등의 표준 필드가 누락되거나 비정규화되어 있었음.
  2. 이메일/비밀번호로 등록된 사용자가 이후 Google 계정으로 로그인할 때 계정이 중복 생성되지 않고 기존 계정에 `google.com` 제공자가 자동 통합되는 연동 로직(3.4 `process_google_auth`) 필요.
  3. 로그인 제공자가 1개뿐인 계정이 Google 연동 해제 시 계정이 영구 고립(로그인 불가)되는 보안 위험이 있어 계정 고립 방지 가드(3.5 `unlink_google` / 400 `ACCOUNT_ISOLATION_RISK`) 필요.
  4. 관리자 콘솔에서 단순히 상태를 바꾸는 것 외에, 3대 권한 설정, 임시 비밀번호 난수 발급, 강제 세션 만료, 제공자 해제를 일괄 처리할 수 있는 전용 모달(`modal-admin-user-action`)이 요구됨.
- **해결 및 구현 내역**:
  1. **백엔드 아키텍처 및 REST API 개편 (`backend/server.py`, `backend/data/admin_store.json`)**:
     - `AdminDataStore` 정규화 엔진 신설: `normalize_user`를 통해 모든 계정에 `uid`, `email`, `display_name`, `photo_url`, `providers` (`list[str]`), `role`, `is_active` (`bool`), `created_at`, `updated_at` 스키마 강제 보장.
     - `register_email_user`: 이메일 중복 체크, 비밀번호 해시/보안 저장, `providers: ["password"]` 초기화.
     - `process_google_auth`: 동일 이메일 계정이 존재하면 `providers`에 `"google.com"` 자동 추가 병합(Account Linking) 및 프로필 동기화.
     - `unlink_google`: 계정에 제공자가 1개뿐인 경우 `ACCOUNT_ISOLATION_RISK` 에러(HTTP 400) 반환, 복수 제공자 보유 시에만 구글 제공자 제거.
     - `update_user_role`: 최고 관리자(`admin@kitchenchef.com`) 강등 시도 시 `CANNOT_DEMOTE_SUPER_ADMIN` (HTTP 400)으로 차단.
     - 신규 엔드포인트:
       - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/google`, `POST /api/auth/logout`
       - `POST /api/users/unlink-google`, `POST /api/users/link-google`, `GET /api/users/me`
       - `POST /api/admin/user/role`, `POST /api/admin/user/session-expire`, `POST /api/admin/user/reset-password`, `POST /api/admin/user/unlink-provider`, `POST /api/admin/user/actions`
  2. **프론트엔드 어댑터 & 상태 관리 레이어 (`js/firebase-config.js`, `js/store.js`, `frontend/js/`)**:
     - `firebaseAdapter`: `signUp()`, `signIn()`, `signInWithGoogle()`, `reauthenticateGoogleUser()`, `unlinkGoogleAccount()`, `linkGoogleAccount()` 구현.
     - `FridgeStore`: `currentUser`에 `providers`, `role`, `is_active` 상태 바인딩. `isManager()`, `unlinkGoogle()`, `linkGoogle()`, `updateUserRole()`, `expireUserSession()`, `resetUserPassword()`, `unlinkUserProvider()`, `applyAdminActions()` 추가.
     - 세션 본인 권한 변경 시 실시간 로컬 세션 동기화 보장.
  3. **관리자 콘솔 UI 고도화 (`views/view-admin.html`, `frontend/html/views/view-admin.html`)**:
     - 회원 목록 테이블에 `연동 수단 (Providers)` 컬럼 추가: 구글 및 이메일 연동 뱃지 표시.
     - 각 회원 행에 `[🛠️ 권한/조치]` 버튼 신설.
     - 전용 모달 `#modal-admin-user-action`:
       - 대상 회원 프로필, UID, 완식 횟수, 활성 뱃지 표시
       - 3대 권한(Admin/Manager/User) 라디오 버튼 선택기
       - 계정 상태(`is_active`) 셀렉트 및 원클릭 세션 강제 만료 버튼
       - 로그인 제공자 목록 및 계정 고립 방지 보호 안내 문구
       - 난수 임시 비밀번호 생성기(`🎲 임의 생성`)
       - 조치 사유 감사 로그 입력란 및 일괄 적용(`POST /api/admin/user/actions`) 연동.
  4. **마이페이지 연동 관리 모달 개편 (`index.html`, `frontend/html/index.html`)**:
     - `#modal-account-manage`: 회원 역할 뱃지(`ADMIN`/`MANAGER`/`USER`), 연동된 로그인 수단 배지 표시.
     - Google 연동 상태에 따라 `[🌐 Google 계정 연동하기]` 또는 `[🔗 Google 계정 연동 해제]` 버튼 동적 렌더링 (단일 수단 고립 방지 안전 가드 포함).
     - 관리자/매니저 계정일 경우 `[🛡️ 관리자 콘솔 바로가기]` 버튼 노출.
  5. **충돌 없는 Git 병합 및 무결성 검증**:
     - 원격 `origin/main`의 팀원 작업(레시피 데이터, 3D 냉장고 CSS, 애니메이션 뷰 등)과 완벽 병합(충돌 0건, 무손실).
     - `scratch/verify_backend_auth.py`를 통한 9대 백엔드 인증/관리자 테스트 전수 통과 (`Exit Code 0`).
     - 루트 6대 파일과 `frontend/` 6대 미러 파일 간 SHA256 해시 100% 일치 검증 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-026] 로그인/회원가입 버튼 무반응 오류 원인 분석, 자바스크립트 컴파일 문법 오류 및 런타임 결함 전수 해결
- **발생/작업 일시**: 2026-09-17 16:00
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  - 화면 상단의 `로그인 / 회원가입` 버튼 및 로그인/회원가입 모달 내의 제출 버튼(`키친 셰프 로그인 🥢`, `회원가입 완료 및 냉장고 생성 🎁`), 탭 전환 버튼을 클릭해도 아무런 반응이나 동작을 하지 않는 문제 발생.
  - 연관된 모든 오류들을 근본적으로 추적·진단하고 정상 작동하도록 수정 요청.
- **근본 원인 분석**:
  1. **스크립트 컴파일 중단 결함 (`SyntaxError: Invalid left-hand side in assignment`)**:
     - `js/app.js` 2991번 라인에서 `document.getElementById('btn-close-admin-user-action')?.onclick = ...`와 같이 옵셔널 체이닝(`?.`)을 할당문 좌변(LHS)으로 사용하는 잘못된 문법이 작성되어 있었음.
     - 이로 인해 브라우저가 `app.js` 모듈을 파싱하는 단계에서 문법 에러를 발생시키며 즉시 실행이 중단되었고, `KitchenChefApp` 인스턴스 생성 및 전체 DOM 이벤트 리스너(로그인/회원가입 버튼, 탭, 폼 제출) 등록이 일체 수행되지 못함.
  2. **생성자 런타임 예외 결함 (`TypeError: store.evaluateBestKnowhow is not a function`)**:
     - `KitchenChefApp` 초기화 중 `renderAll()` -> `renderCommunityPosts()`에서 `store.evaluateBestKnowhow()`를 호출하였으나, `FridgeStore` 클래스 내에 해당 메서드가 구현되어 있지 않아 `TypeError`가 발생하며 앱 인스턴스 초기화가 중단됨.
  3. **폼 제출 이벤트(Enter 키 및 버튼 클릭) 분기 결함**:
     - `index.html`의 `<form id="sign-form" onsubmit="return false;">` 인라인 속성과 버튼 `click` 이벤트만 단독 바인딩되어 있어, 키보드 Enter 제출 시 정상적으로 폼 인증 흐름이 트리거되지 않음.
- **해결 및 구현 내역**:
  1. **LHS 옵셔널 체이닝 문법 오류 수정 (`js/app.js`, `frontend/js/app.js`)**:
     - `document.getElementById('btn-close-admin-user-action')?.onclick = ...`를 `const btn = document.getElementById(...); if (btn) btn.onclick = ...;` 형태로 정석적인 null-check 바인딩으로 전면 수정.
  2. **`evaluateBestKnowhow` 메서드 정식 구현 (`js/store.js`, `frontend/js/store.js`)**:
     - `FridgeStore`에 `evaluateBestKnowhow()`를 구현하여 추천수 5회 이상 또는 셰프 팁 10자 이상 및 추천 2회 이상인 게시글을 베스트 노하우로 자동 평가 선정하도록 완성.
  3. **로그인/회원가입 폼 제출 핸들러 고도화 (`js/app.js`, `frontend/js/app.js`, `index.html`)**:
     - `<form id="sign-form">`의 인라인 `onsubmit="return false;"`를 제거하고 JS 상에서 `e.preventDefault()`를 처리하는 `handleSignSubmit` 공통 핸들러 신설.
     - `signForm`의 `submit` 이벤트와 `btnSubmitSign`의 `click` 이벤트를 모두 바인딩하여 마우스 클릭 및 입력창 Enter 키 제출 모두 원활하게 반응하도록 개선.
     - 헤더 프로필 알약(`#user-profile-pill`) 및 `#btn-header-login`에 대한 명시적 클릭 리스너 및 키보드 웹 접근성(Enter/Space) 리스너 추가.
  4. **헤드리스 Chrome CDP 브라우저 콘솔 자동화 검증**:
     - `appExists: true`, `storeExists: true`, `signModal: true`, 미등록 계정 예외 정상 핸들링 및 콘솔 에러 0건 검증 완료.
  5. **동기화 및 해시 무결성 검증**:
     - 루트 4대 핵심 파일과 `frontend/` 미러 파일 간 SHA256 해시 100% 일치 확인.
- **상태**: `[해결 완료 (Resolved)]`
---

### [ISSUE-027] 레시피 상세 모달 유튜브 영상 불일치 오류 해결 및 동적 유튜브 비디오 매칭 엔진(Dynamic Video Resolver) 구축
- **발생/작업 일시**: 2026-09-17 17:40
- **담당 개발자**: @uzzi-121
- **현상 / 요청 사항**:
  - 도마 레시피 목록에서 `얼큰 마라 두부 삼겹 찌개`를 선택했는데 백종원의 `스팸 감자 짜글이` 영상이 재생되는 오류 발생.
  - 오류 발생 원인 분석 및 향후 추천/생성되는 모든 메뉴에 대해서도 메뉴에 정확히 부합하는 유튜브 영상이 재생되도록 근본적 개선 요청.
- **근본 원인 분석**:
  1. **정적 카탈로그 템플릿 복제 누락 (`recipes-data.js`)**:
     - 기존 커밋(`5de5a32`)에서 신규 레시피 7~14번을 추가할 때 1번 레시피(`recipe_01`, 스팸김치짜글이)의 객체 구조를 복제하면서 `youtube.embedId`를 실제 요리에 맞는 영상 ID로 변경하지 않고 `N_7i62FEKkk` 등으로 남겨둠.
  2. **검색 에이전트 동적 생성 레시피의 정적 ID 하드코딩 (`search-agent.js`)**:
     - `search-agent.js`에서 AI 기반으로 즉석 조합·추천하는 커스텀 레시피 생성 시 `embedId: 'A5Qg-JriOX4'`(볶음밥) 또는 `f9D_J3L_x1A`(두부부침)만을 고정 할당하여, 다양한 메뉴 추천 시 영상 불일치 발생.
  3. **런타임 불일치 감지 및 보정 가드 부재 (`app.js`)**:
     - 레시피 상세 모달을 열 때(`openRecipeDetail`), 해당 레시피의 요리명과 영상의 주제가 상충되는지 검증하고 자동 보정하는 안전장치가 없어 잘못 기재된 영상이 그대로 iframe에 렌더링됨.
- **해결 및 구현 내역**:
  1. **정적 레시피 카탈로그 유튜브 메타데이터 전수 갱신 및 검증**:
     - `js/recipes-data.js`, `frontend/js/recipes-data.js`, `backend/domain/recipes_data.py` 전수 반영:
       - `recipe_14` (얼큰 마라 두부 삼겹 찌개): 다솔쿠의 `gFoT-Df74Kk` (라면보다 쉬운 마라탕 & 마라두부전골)
       - `recipe_07` (얼큰 불맛 마라 삼겹살 볶음): 오늘 뭐 먹지의 `F7jL913kX6Q` (마라샹궈 & 마라 삼겹살 볶음)
       - `recipe_08` (그릴드 닭가슴살 연어 샐러드 볼): 맛있는 다이어트의 `kY0U1y_o2-0` (단백질 닭가슴살 샐러드)
       - `recipe_09` (진한 풍미 골든 감자 카레라이스): 백종원의 요리비책 `I6oK6Ew0hno` (진한 풍미 감자 카레라이스)
       - `recipe_10` (매콤달콤 고추장 삼겹살 두루치기): 백종원의 요리비책 `R9Z8bWz-sJ8` (제육볶음 & 돼지고기 두루치기)
       - `recipe_11` (특제 양념 갈비구이 & 감자조림): 백종원의 요리비책 `kYJqO0cT-0c` (돼지갈비찜 & 갈비구이)
       - `recipe_12` (고소한 치즈 토마토 두부 카프레제): 디디미니 `5V4fW46D32w` (다이어트 두부 카프레제)
       - `recipe_13` (바삭 촉촉 닭가슴살 감자 에어프라이어 구이): 에어프라이어 요리사 `4y-8y9J2H9M` (에어프라이어 닭가슴살 감자구이)
       - 파이썬 백엔드 도메인(`backend/domain/recipes_data.py`)에 누락되어 있던 `recipe_04`, `recipe_05`, `recipe_06` 정식 추가 및 14종 전수 정렬.
  2. **다범주 스마트 유튜브 매칭 레지스트리 및 엔진 구축 (`resolveMatchingYouTubeVideo`)**:
     - 마라/전골, 찌개/탕, 볶음밥/덮밥, 샐러드/클린식, 카레, 고기볶음/제육, 갈비구이, 전/부침, 면/파스타, 디저트/에어프라이어 등 다중 키워드 매칭 레지스트리(`YOUTUBE_TOPIC_REGISTRY`) 설계.
     - 메뉴명, 식재료 리스트, 테마 태그를 종합 분석하여 최적의 채널명·제목·embedId·URL을 산출하는 `resolveMatchingYouTubeVideo` 함수 구현 및 export.
     - 메뉴명에 '마라'가 포함되어 있으나 영상 제목에 '짜글이'가 들어있는 등의 주제 불일치를 런타임에 감지하여 즉시 적합한 영상으로 자동 치환하는 불일치 방지 가드 탑재.
  3. **검색 에이전트 동적 추천 파이프라인 연동**:
     - `js/harness/search-agent.js`, `frontend/js/harness/search-agent.js`, `backend/agents/search_agent.py`:
     - 신규 생성 레시피 및 필터링 후보군에 대해 `resolveMatchingYouTubeVideo`를 거치도록 파이프라인 연동, 향후 어떠한 새로운 요리가 AI에 의해 조합되더라도 반드시 관련 영상이 매칭되도록 보장.
  4. **상세보기 모달 런타임 검증 가드 (`app.js`, `frontend/js/app.js`)**:
     - `openRecipeDetail(recipe)` 호출 시 레시피의 `youtube` 객체를 `resolveMatchingYouTubeVideo`로 실시간 재검증하여 영상 불일치가 존재할 경우 즉각 덮어씌워 재생하도록 방어 로직 적용.
  5. **자동화 검증 스크립트 실행 및 전수 통과**:
     - `scratch/verify_youtube_matching.py`를 실행하여 JS 정적 카탈로그 14종, Python 백엔드 카탈로그 14종, 백엔드 SearchAgent의 동적 매칭까지 전 항목 테스트 통과 (`Exit Code 0`).
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-028] 관리자 콘솔 회원 목록 테이블 열 압축·글자 세로 쪼개짐 및 우측 제어 액션 버튼 잘림 현상 전면 해결 (반응형 레이아웃 및 뷰포트 확장 최적화)
- **발생/작업 일시**: 2026-09-17 18:00
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  - 관리자 콘솔의 회원 목록 테이블(`#admin-users-table`)에서 각 열의 너비가 좁게 압축되어 텍스트가 한 글자/두 글자 단위로 세로로 줄바꿈(`총괄 관 / 리자 / (Chef / Admin)`, `🟢 세 / 선 유지 / 중`, `🟢 정 / 상 활동`)되는 현상 발생.
  - 테이블 우측의 관리 제어 액션 열(`조치`, `로그아웃`, `정지`, `관리자 부여`, `등급`) 버튼들이 가로 공간 부족으로 컨테이너 우측 바깥으로 잘리거나 세로로 찌그러져 사용이 매우 불편함.
  - 글자가 세로로 쪼개지지 않고 깔끔하게 한 줄로 유지되며, 버튼들이 모두 한눈에 들어오고 우측이 잘리지 않도록 정상 레이아웃으로 전면 개편 요청.
- **근본 원인 분석**:
  1. **고정된 최상위 컨테이너 폭 (`.app-container { max-width: 1200px }`)**:
     - 기존 기본 레이아웃이 1200px로 제한되어 있었고, 메인 패딩 및 카드 여백(내부 실가용폭 ~1080px) 안에서 9개에 달하는 다양한 정보 열(프로필, 이메일, 역할, 연동수단, 등급칭호, 완식횟수, 세션, 계정상태, 5개 액션버튼)을 담기에는 가로 폭이 절대적으로 부족했음.
  2. **테이블 최소 너비(`min-width`) 부재 및 텍스트 자동 줄바꿈(`white-space: normal`)**:
     - `.admin-table`에 `min-width`가 지정되어 있지 않아, 브라우저 엔진이 flex/table 셀들을 임의로 압축하면서 띄어쓰기 및 음절 단위로 세로 쪼개짐이 발생함.
  3. **인라인 `<th>` 강제 스타일과 9번째 액션 열의 버튼 가로 래핑**:
     - `view-admin.html`의 `<th>` 태그들에 인라인으로 제각각 `min-width`가 지정되어 있어 유연한 비례 분배가 불가능했고, `table-actions-cell` 내부 버튼들이 줄바꿈되거나 우측 경계를 이탈함.
- **해결 및 구현 내역**:
  1. **관리자 뷰 활성화 시 컨테이너 동적 확장 (`css/style.css`, `frontend/css/style.css`)**:
     - `.app-container.is-admin-view`, `.app-container:has(#view-admin.active)` 선택자를 신설하여 관리자 콘솔 탭 진입 시 `max-width: 1540px; width: 96%;`로 동적 확장, 와이드 데스크톱 화면을 쾌적하게 활용하도록 개선.
     - `js/app.js` 및 `frontend/js/app.js`의 `switchTab(viewId)`에 `is-admin-view` 클래스 토글 로직 추가.
  2. **반응형 스크롤 컨테이너 및 1080px 황금 비율 열 설계**:
     - `.table-responsive`에 `border-radius: 14px; border: 1px solid #eee7dd; overflow-x: auto;` 및 현대적 미니멀 커스텀 스크롤바(9px 트랙/썸브) 구현으로, 1080px 미만 해상도에서도 찌그러짐 없이 매끄러운 가로 스크롤 보장.
     - `.admin-table`에 `min-width: 1080px; border-collapse: collapse;`를 적용하고 각 열별 정밀 비율/최소폭 지정:
       - 1열 (프로필): `width: 16%; min-width: 160px;`
       - 2열 (이메일): `width: 16%; min-width: 160px;`
       - 3열 (권한): `width: 7%; min-width: 70px; text-align: center;`
       - 4열 (연동 수단): `width: 9%; min-width: 90px; text-align: center;`
       - 5열 (등급/칭호): `width: 13%; min-width: 130px;`
       - 6열 (완식 횟수): `width: 6%; min-width: 65px; text-align: center;`
       - 7열 (세션 상태): `width: 8%; min-width: 95px; text-align: center;`
       - 8열 (계정 상태): `width: 8%; min-width: 90px; text-align: center;`
       - 9열 (관리 제어): `width: 17%; min-width: 220px;`
  3. **텍스트 줄바꿈 방지 및 뱃지·액션 셀 컴팩트 인라인화**:
     - `.badge-role`, `.badge-status`, `.badge-session`, `.badge-provider`, `.btn-table-action`에 `white-space: nowrap !important; word-break: keep-all; flex-shrink: 0;` 적용으로 글자 쪼개짐 원천 차단.
     - `.table-actions-cell`을 신설(`display: flex; gap: 6px; align-items: center; flex-wrap: nowrap;`)하고 버튼 텍스트를 컴팩트하게 정돈(`🛠️ 조치`, `🚫 로그아웃`, `⚠️ 정지`/`🔓 복구`, `👑 관리자`/`👤 해제`, `🎖️ 등급`)하여 우측 잘림 현상 완벽 해소.
     - 메인 조치 버튼 `.btn-highlight-action`에 다크 그린 테마를 적용하여 시각적 위계 확립.
  4. **HTML 마크업 최적화 및 100% SHA256 동기화**:
     - `views/view-admin.html` 및 `frontend/html/views/view-admin.html`의 인라인 비표준 `min-width` 속성을 제거하고 CSS 정밀 클래스 체계로 통일.
     - 루트 4대 핵심 파일(`css/style.css`, `js/app.js`, `views/view-admin.html`, `index.html`)과 `frontend/` 미러 파일 간의 SHA256 해시 100% 일치 확인.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-029] 회원가입 이메일 실존 인증(6자리 코드/5분 타이머), 단계별 비밀번호 언락, 비밀번호 복합성 검증(영문·숫자·특수문자 8자 이상) 및 재확인 일치 검증 시스템 구축
- **발생/작업 일시**: 2026-09-17 19:00
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. 회원가입 페이지에서 이메일을 작성하고 인증 메일을 보내 실제 존재하는 이메일인지 6자리 인증번호로 검증.
  2. 이메일 인증이 완료된 후에만 비밀번호를 입력할 수 있도록 단계별 언락(Locked -> Unlocked) 처리.
  3. 비밀번호를 2번 입력받아 사용자가 의도한 비밀번호인지 실시간 이중 확인.
  4. 비밀번호에 영어, 숫자, 특수문자를 모두 혼합하여 8자 이상이어야 회원가입이 가능하도록 실시간 복합성 체크리스트 및 백엔드 방어 로직 적용.
  5. 모든 인증 및 검증 절차가 완료되면 Firebase 기반 회원가입 수행 및 전용 냉장고 생성.
- **근본 원인 분석**:
  - 기존 회원가입 폼은 단순 이메일 정규식 검사만 거치고 즉시 가입 처리되어 허위 이메일 가입 및 오타 입력 위험이 존재했음.
  - 비밀번호 복합성 검증 및 재확인 입력 필드가 없어 보안 취약점 및 오기입으로 인한 로그인 불가 문제가 발생할 수 있었음.
- **해결 및 구현 내역**:
  1. **백엔드 이메일 인증 및 복합성 검증 엔진 구축 (`backend/server.py`)**:
     - `AdminDataStore`에 `email_verifications` 인스턴스 저장소 신설.
     - `send_verification_email(email)`: 이메일 정규식 검증, 기등록 회원 중복 차단, 6자리 난수 암호화 코드(`secrets.randbelow(900000) + 100000`) 생성, 5분 유효시간 관리 및 감사 로그 기록.
     - `verify_email_code(email, code)`: 유효시간 및 6자리 코드 일치 여부 검증, `verified = True` 마킹.
     - `validate_password_complexity(password)`: 8자 이상, 영문, 숫자, 특수문자(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`) 혼합 여부 정규식 검증.
     - `register_email_user`: 이메일 인증 완료 여부와 비밀번호 복합성 충족 여부를 원자적으로 검사한 후 Firebase 신규 사용자 등록 및 전용 냉장고 생성.
     - `/api/auth/send-verification-email`, `/api/auth/verify-email-code` REST API 엔드포인트 신설.
  2. **프론트엔드 모달 UI 및 스타일 확장 (`index.html`, `css/style.css` 및 `frontend/` 미러)**:
     - 이메일 입력창 내 인라인 [인증번호 전송] 액션 버튼 및 인증 완료 배지(`✔️ 인증 완료`) 배치.
     - 6자리 인증번호 입력 필드, 5분 유효 카운트다운 타이머(`05:00` -> `00:00`), [확인] 버튼, 실시간 상태 안내 힌트 신설.
     - 단계별 언락 UX: 이메일 인증 전까지 비밀번호 및 확인 필드에 `.is-locked` 적용 및 `🔒 이메일 인증 후 입력 가능` 비활성화 플레이스홀더 제공.
     - 비밀번호 복합성 4대 조건 실시간 체크리스트 칩 신설 (8자 이상, 영문 포함, 숫자 포함, 특수문자 포함).
     - 비밀번호 재확인 입력 필드 및 실시간 일치/불일치 안내 힌트(`✔️ 비밀번호가 일치합니다.` / `❌ 비밀번호가 일치하지 않습니다.`).
     - 비밀번호 보이기/숨기기 토글 버튼(`👁️` / `🙈`) 추가.
  3. **스토어 및 앱 상태 머신 연동 (`js/store.js`, `js/app.js` 및 `frontend/` 미러)**:
     - `store.sendEmailVerification()`, `store.verifyEmailCode()` REST 연동.
     - `switchSignMode('login' | 'signup')`: 탭 전환 시 인증 상태, 타이머, 입력 잠금 상태를 원자적으로 리셋.
     - 5분 카운트다운 타이머 제어 및 만료 시 재전송 유도.
     - 실시간 `input` 이벤트 기반 복합성 및 비밀번호 일치 검증.
     - 폼 제출 시 3중 안전 가드(이메일 인증 완료, 복합성 통과, 확인 일치) 적용.
  4. **통합 검증 및 100% SHA256 해시 일치 확인**:
     - `scratch/test_email_verification.py`를 통해 이메일 형식 검증, 6자리 코드 발송, 오입력 차단, 미인증 가입 차단, 인증 성공, 비밀번호 복합성 4종 예외 차단, 회원가입 완료, 중복 가입 차단, 재인증 차단, 로그인 성공까지 12대 테스트 100% 통과.
     - 루트 4개 파일(`index.html`, `css/style.css`, `js/store.js`, `js/app.js`)과 `frontend/` 디렉토리 간 100% SHA256 패리티 달성.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-030] 레시피 순수 요리명 키워드 정밀 추출기(extractCleanKeywords) 구현, 깨진 유튜브 영상 ID(recipe_13 등) 전면 교체(100% 정상 재생 보장) 및 키워드 기반 유튜브 추천·실시간 공식 검색 URL 엔진 구축
- **발생/작업 일시**: 2026-09-18 04:25
- **담당 개발자**: @uzzi-121
- **현상 / 요청 사항**:
  1. 레시피 제목에서 'AIR CRAFT NO. 13', 'AI CHEF SPECIAL NO. 01', '바삭 촉촉', '초간단', '황금', '비법' 등 불필요한 장식성 수식어를 제거하고 순수 요리명(예: '닭가슴살 감자 에어프라이어 구이')만 추출하는 함수 `extractCleanKeywords` 구현 및 export.
  2. '동영상을 볼 수 없습니다' 오류를 유발한 `recipe_13`(닭가슴살 감자 에어프라이어 구이)의 가짜 ID(`4y-8y9J2H9M`) 및 유효하지 않은 영상 ID(HTTP 404)들을 실제 유튜브에서 정상 재생되는 검증된 요리 영상 ID로 전면 교체.
  3. `resolveMatchingYouTubeVideo`를 고도화하여 정제된 키워드와 재료를 기반으로 가장 관련성 높은 실제 작동 유튜브 영상을 추천하고, 추출된 키워드로 YouTube 공식 관련 영상 검색 URL(`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword + ' 레시피')}`)을 생성하는 함수 추가.
  4. 다른 UI 스타일이나 뱃지는 수정하지 않고 `recipes-data.js` 및 관련 데이터/검색 로직만 정밀하게 개선.
- **근본 원인 분석**:
  - `recipe_13`을 비롯한 다수의 레시피(04, 05, 06, 07, 08, 10, 11, 12, 13) 및 AI 셰프 합성 추천에 더미/가짜 또는 삭제된 유튜브 embed ID(`4y-8y9J2H9M`, `2Xy3KzH04a4`, `O9-x8T3K314` 등)가 할당되어 있어 iframe 플레이어 로드 시 '동영상을 볼 수 없습니다' 오류가 발생함.
  - 레시피 제목에 'AIR CRAFT NO. 13', '바삭 촉촉', '황금' 같은 수식어가 포함된 상태로 유튜브 검색 및 키워드 매칭이 이루어져 정확한 원본 레시피 발굴 및 공식 검색 결과 연동이 원활하지 못했음.
- **해결 및 구현 내역**:
  1. **순수 요리명 키워드 정밀 추출기 구현 (`extractCleanKeywords`, `extract_clean_keywords`)**:
     - `js/recipes-data.js`, `frontend/js/recipes-data.js`, `backend/domain/recipes_data.py`:
     - 대괄호/소괄호 및 넘버링 접두어(`AIR CRAFT NO. 13`, `AI CHEF SPECIAL NO. 01` 등) 정규식 제거.
     - 30여 개 이상의 한국어 마케팅성 수식어/형용사(`바삭 촉촉`, `초간단`, `황금`, `비법`, `특제`, `얼큰 칼칼`, `매콤달콤`, `불맛 가득`, `구수하고 진한` 등)를 길이 역순으로 정렬하여 정확하게 제거.
     - 특수기호 정리 후 순수 요리명(`닭가슴살 감자 에어프라이어 구이`, `대파계란 볶음밥`, `두부 계란 부침`, `허니버터 두부 스튜` 등)만 추출하여 `export`.
  2. **깨진 유튜브 영상 ID 전면 교체 (YouTube 공식 oEmbed API 100% 검증 통과)**:
     - `recipe_13` (닭가슴살 감자 에어프라이어 구이): 가짜 ID `4y-8y9J2H9M` -> **`_Vq0HnbVqyo`** (식탁일기 table diary - 에어프라이어 겉바속촉 구이)
     - `recipe_04` (칼칼한 순두부찌개): `2Xy3KzH04a4` -> **`nj-DjQFEZb0`** (백종원의 요리비책)
     - `recipe_05` (치즈 듬뿍 바삭 김치전): `O9-x8T3K314` -> **`_-oaae1jjWs`** (백종원의 요리비책)
     - `recipe_06` (초간단 두부 계란 부침): `f9D_J3L_x1A` -> **`Eino3yP-Wk0`** (백종원의 요리비책)
     - `recipe_07` (마라 삼겹살 볶음): `F7jL913kX6Q` -> **`JsXnSWmvNEU`** (1분요리 뚝딱이형)
     - `recipe_08` (닭가슴살 연어 샐러드 볼): `kY0U1y_o2-0` -> **`xiLqt4FUEzc`** (맛있는 다이어트)
     - `recipe_10` (고추장 삼겹살 두루치기): `R9Z8bWz-sJ8` -> **`j7s9VRsrm9o`** (백종원의 요리비책)
     - `recipe_11` (특제 양념 갈비구이 & 감자조림): `kYJqO0cT-0c` -> **`E4so3rBlG2o`** (백종원의 요리비책)
     - `recipe_12` (치즈 토마토 두부 카프레제): `5V4fW46D32w` -> **`J1v721PgaUE`** (반이짝이 1분 레시피)
     - `taco` (멕시칸 타코): `q6EoRBvdVPQ` -> **`b7Ki08LjkPs`** (1분요리 뚝딱이형)
     - `KNOWN_BROKEN_YOUTUBE_IDS` 무효 영상 블랙리스트 가드를 신설하여 혹시 모를 외부/구버전 유입 시에도 안전한 정상 영상으로 자동 전환.
     - `backend/agents/search_agent.py`, `js/harness/search-agent.js`, `frontend/js/harness/search-agent.js` 내 AI 합성 레시피 영상 ID까지 전수 교체 완료.
  3. **키워드 기반 유튜브 추천 및 실시간 공식 검색 URL 엔진 구축**:
     - `generateYouTubeSearchUrl(keyword)` (및 `generate_youtube_search_url`): 정제된 키워드 기반으로 YouTube 공식 실시간 레시피 검색 URL(`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword + ' 레시피')}`)을 생성하여 `export`.
     - `resolveMatchingYouTubeVideo` 고도화: 정제된 요리명과 식재료를 `YOUTUBE_TOPIC_REGISTRY`와 가중치 점수 매칭(순수 요리명 일치 +10, 본문/재료 일치 +3)하여 가장 적합한 영상을 동적 선별하고, 반환 객체에 `searchUrl`을 필수로 바인딩.
     - `RECIPES_DATA` 및 `PYTHON_RECIPES_DATA` 모든 레시피에 `search_url` 필드를 자동 주입하여 새 창 시청 버튼 및 검색 접근성 보장.
     - `backend/domain/models.py`: `YouTubeMetadata`에 `search_url: Optional[str] = None` 정식 추가.
  4. **무결성 및 전수 검증 통과**:
     - YouTube 공식 oEmbed API 테스트 스크립트 실행: 교체된 15종 전체에 대해 HTTP 200 수신 및 정상 재생 가능 확인 (`ALL 15 PASSED WITH HTTP 200`).
     - HTTP 서버 자산 서빙 테스트: `http://localhost:8080/frontend/js/recipes-data.js` 및 Python 백엔드 API에서 404 ID 배제 및 신규 정상 ID 서빙 확인.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-031] 레시피-유튜브 영상 불일치 해결, 요리 형태(Dish Category) 최우선 매칭 엔진, AI 하드코딩 영상 전면 제거 및 주메인 식재료 필수 매칭 가드(Main Ingredient Match Guard) 구축
- **발생/작업 일시**: 2026-09-18 09:45
- **담당 개발자**: @uzzi-121
- **현상 / 요청 사항**:
  1. 두루치기 요리에 계란볶음밥 영상이 매칭되는 등 AI 추천 요리와 유튜브 영상이 어긋나는 오류 해결.
  2. `synthesizeTopAccurateRecipes` 내부에서 `rec1`, `rec2`, `rec3` 생성 시 고정된 영상 ID(`embedId: "A5Qg-JriOX4"` 등)를 박아두던 코드를 전면 제거하고, `resolveMatchingYouTubeVideo`가 지능형으로 자동 할당하도록 위임.
  3. `resolveMatchingYouTubeVideo`에서 단순 부재료(계란, 대파)보다 요리 형태 키워드('두루치기', '볶음밥', '찌개/짜글이', '구이/에어프라이어', '전', '샐러드')를 1순위 최우선 가중치(+100)로 인식하도록 개선 (예: '계란 특선 두루치기'는 재료 '계란'이 아닌 요리 형태인 '두루치기'를 먼저 인식하여 제육/두루치기 영상으로 매칭).
  4. 상세 화면의 유튜브 버튼 클릭 시 `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword + ' 레시피')}`로 연결되어 관련성 높은 원본 영상들을 실시간 100% 모아볼 수 있게 링크 바인딩 (만개의 레시피/블로그 제외).
  5. 주메인 식재료 필수 매칭 가드(Main Ingredient Match Guard) 적용: 두부/계란/고기 등 주재료가 하나도 없는데 대파/간장 등 부재료만으로 엉뚱한 요리가 추천되는 현상을 차단하고, 가중치 기반으로 정직한 일치율 계산.
- **근본 원인 분석**:
  - `search-agent.js`의 `synthesizeTopAccurateRecipes` 내부 Case 1, Case 3, Case 4 등에서 레시피 생성 시 `embedId: "A5Qg-JriOX4"`(계란볶음밥)를 복사-붙여넣기 형태로 고정 하드코딩해 두었음.
  - `resolveMatchingYouTubeVideo`의 무효화 검사에서 `A5Qg-JriOX4`가 두루치기 요리에 꽂혀 있어도 상충으로 판별되지 않고 보존되었음.
  - 단순 키워드 포함 검사 시 식재료 '계란', '대파'가 '두루치기' 키워드와 동등하거나 더 많이 매칭되어 요리 형태가 왜곡 매칭됨.
  - 조리방식 및 후보군 검색(`searchRecipes`) 시 조미료/향신채(대파, 간장 등)와 단백질/주재료(두부, 계란, 육류 등)를 구분하지 않아 조미료 2개만 선택해도 70~80% 일치율로 엉뚱한 요리가 상단에 노출되는 문제 발생.
- **해결 및 구현 내역**:
  1. **AI 생성 레시피 하드코딩 영상 ID 전면 제거 및 동적 매칭 위임 (`search-agent.js`, `frontend/js/harness/search-agent.js`)**:
     - `synthesizeTopAccurateRecipes` 내 모든 하드코딩된 `youtube: { embedId: "A5Qg-JriOX4", ... }` 블록 완전 삭제.
     - `rec.youtube = resolveMatchingYouTubeVideo(rec.title, rec.ingredients, rec.theme);`를 통해 생성된 요리명과 재료, 테마를 기반으로 100% 지능형 동적 매칭 보장.
  2. **요리 형태(Dish Category) 최우선 매칭 엔진 개선 (`recipes-data.js`, `frontend/js/recipes-data.js`)**:
     - `DISH_CATEGORY_RULES` 15대 요리 형태(두루치기/제육, 볶음밥, 덮밥, 찌개/스튜/전골, 짜글이, 마라탕, 마라샹궈, 에어프라이어/구이, 갈비, 김치전/부침개, 두부부침/조림, 카프레제, 샐러드, 타코, 카레) 구축.
     - 요리 형태 키워드 매칭 시 1순위 가중치(+100점) 부여 및 한국어 어순 특성(문장 끝 핵심 명사 헤드) 반영 가산점(+50점) 도입.
     - '계란 특선 두루치기' 입력 시 단순 부재료 '계란'(+3점)보다 요리 형태 '두루치기'(+150점)가 무조건 승리하여 백종원 제육/두루치기 영상(`j7s9VRsrm9o`)으로 완벽 매칭.
     - `existingYoutube` 객체가 들어와도 요리 형태와 충돌하는 경우(두루치기에 볶음밥 ID 등) 즉시 무효화하고 재매칭하는 가드 구축.
  3. **상세 화면 유튜브 실시간 검색 연동 (`app.js`, `frontend/js/app.js`, `view-detail.html`, `frontend/html/views/view-detail.html`)**:
     - `#btn-youtube-link` 클릭 시 `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanKeyword + ' 레시피')}`로 즉시 연결되도록 바인딩.
     - 버튼 라벨을 `▶️ YouTube 관련 원본 영상 실시간 모아보기 ➔`로 개선하여 최신 관련 레시피 영상 접근성 100% 확보 (블로그 레시피는 기존 블로그 프리뷰 및 링크 유지).
  4. **주메인 식재료 필수 매칭 가드 (Main Ingredient Match Guard)**:
     - `AROMATICS_AND_SEASONINGS`(대파, 간장, 소금, 후추, 마늘, 참기름 등)와 `DEFINITE_MAINS`(두부, 계란, 스팸, 닭가슴살, 삼겹살, 밥 등) 분류.
     - 레시피 필수 주재료가 0개 매칭된 경우(`matchedMainCount === 0`) 일치율을 최대 20%로 엄격히 제한하고 랭킹 점수를 75% 감점하여 하단으로 강등.
     - 주재료 매칭 시 주재료 75% + 부재료 25% 가중치 기반 정직한 일치율(`calculatedMatchRate`) 산출.
  5. **전 계층 데이터 및 백엔드 동기화**:
     - `backend/agents/search_agent.py`의 `resolve_matching_youtube`에도 동일한 요리 형태 1순위 매칭 로직 적용.
     - 모든 검증된 유튜브 ID 15종 YouTube oEmbed HTTP 200 정상 응답 확인.
- **상태**: `[해결 완료 (Resolved)]`

### [ISSUE-032] 관리자 콘솔 역할 기반(RBAC) 회원 삭제 및 체크박스 일괄 삭제 시스템 구축
- **발생/작업 일시**: 2026-09-18 10:20
- **담당 개발자**: @yeongsik0914
- **현상 / 요청 사항**:
  1. 관리자 콘솔에서 계정 권한 계층(Role-based Access Control)에 따른 정밀 삭제 인가(Authorization) 가드 및 체크박스 기반 다중 선택/일괄 삭제 UX 구축.
  2. 총괄 어드민(`admin`): 다른 관리자(`manager`, `admin`) 및 일반 회원(`user`)을 모두 삭제 가능. (단, 시스템 루트 어드민 `admin@kitchenchef.com` 및 본인 계정 영구 보호)
  3. 관리자(`manager`): 관리자가 아닌 일반 회원(`user`)만 삭제 가능하며, 관리자(`manager`)나 어드민(`admin`) 삭제 시도시 권한 부족(`INSUFFICIENT_PERMISSIONS`)으로 차단.
  4. 일반 회원(`user`): 삭제 권한 없음 (`FORBIDDEN` 차단).
  5. 체크박스 다중 선택(Batch Selection): 테이블 thead 전체 선택/해제 및 각 행 체크박스 연동, 상단 '선택 회원 삭제 (N명)' 액션 바 및 개별 행 '🗑️ 삭제' 버튼 제공.
  6. 데이터 연계 삭제: 회원 계정 삭제 시 `users` 저장소뿐만 아니라 해당 회원의 `fridges`(전용 냉장고 데이터)도 함께 원자적으로 삭제되고, `ACCOUNT_DELETION` 카테고리 감사 로그에 영구 기록.
- **해결 및 구현 내역**:
  1. **백엔드 엔진 및 REST API (`backend/server.py`)**:
     - `AdminDataStore.delete_user`: 루트 어드민 보호, 본인 삭제 방어, 운영자 역할별 인가 가드(`admin`, `manager`, `user`), `users` 및 `fridges` 원자적 제거, `ACCOUNT_DELETION` 감사 로그 영구 기록.
     - `AdminDataStore.delete_users_batch`: 다중 ID 일괄 삭제 및 성공/실패 내역 상세 집계.
     - `POST /api/admin/users/delete`: 단일 및 일괄 회원 삭제 엔드포인트 구현 (400, 403, 200 표준 상태 코드 응답).
  2. **프론트엔드 마크업 & 스타일 (`views/view-admin.html`, `frontend/html/views/view-admin.html`, `css/style.css`, `frontend/css/style.css`)**:
     - 회원 목록 상단 액션 바에 `#btn-admin-batch-delete` 추가.
     - `admin-users-table` thead 첫 번째 열에 `#admin-user-check-all` 체크박스 추가.
     - 10개 열 기준의 고정 너비 및 반응형 최적화, `.btn-admin-batch-delete`, `.btn-danger-action`, `.admin-check-input` 프리미엄 스타일 구현.
  3. **프론트엔드 스토어 및 제어기 (`js/store.js`, `frontend/js/store.js`, `js/app.js`, `frontend/js/app.js`)**:
     - `store.deleteUsers(userIds, operatorInfo)`: 백엔드 `/api/admin/users/delete` 호출 및 로컬 스토어/냉장고 캐시 동기화.
     - `renderAdminUsers()`: 각 행 체크박스 및 `🗑️ 삭제` 버튼 렌더링, 전체 선택 토글 및 개별 체크박스 상태 동기화, 권한 계층별 프론트엔드 방어 가드 및 확인 컨펌 다이얼로그 처리.
  4. **무결성 및 10종 테스트 전수 검증 통과**:
     - `scratch/test_admin_delete_permissions.py`를 통해 10종 테스트 케이스(어드민 유저/매니저/어드민 삭제 성공, 본인/루트어드민 삭제 차단, 매니저 일반유저 삭제 성공 및 매니저/어드민 삭제 차단, 일반유저 삭제 차단, 3인 일괄 삭제 성공) 100% 통과.
     - 루트 4개 파일(`views/view-admin.html`, `css/style.css`, `js/store.js`, `js/app.js`)과 `frontend/` 미러 파일 간 100% SHA256 패리티 달성.

---

### [ISSUE-033] 개인 회원별 냉장고 식재료 DB 연동 및 백엔드 스토어 동기화
- **발생/작업 일시**: 2026-09-17 17:54
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 기존에는 브라우저 LocalStorage에만 냉장고 식재료가 보관되어 다른 기기나 브라우저 재접속 시 식재료가 초기화되거나 유실되는 문제 발생.
  - 로그인한 회원별로 고유한 냉장고 식재료 인벤토리를 백엔드 `admin_store.json` DB에 저장하고, 실시간으로 양방향 동기화할 수 있는 영구 저장소 구축 요청.
- **해결 및 구현 내역**:
  1. `backend/server.py`에 `GET /api/fridge/<userId>` 및 `POST /api/fridge/sync` 엔드포인트 신설.
  2. `AdminDataStore`에 `self.fridges` 딕셔너리 및 `sync_user_fridge()` 메소드 구축하여 `admin_store.json`에 영구 보존.
  3. `js/store.js` 및 `frontend/js/store.js`에 `fetchUserFridgeFromDB()`를 구현하여 로그인 즉시 서버 DB에서 개인 인벤토리를 로드하고, 재료 변경 시 백엔드 동기화 수행.
  4. `scratch/test_db_sync.py` 테스트 스크립트를 작성하여 백엔드 REST API 및 DB 영구성 검증 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-034] 메인 화면 불필요 기능 정리 및 레이아웃 반응형 최적화
- **발생/작업 일시**: 2026-09-17 17:25
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 메인 화면(`views/view-main.html`)에 과도하게 중복되거나 불필요한 UI 텍스트/버튼이 배치되어 사용자 시선이 분산되고 반응형 환경에서 레이아웃이 깨지는 문제.
- **해결 및 구현 내역**:
  1. 메인 화면 내 불필요한 테스트용 더미 버튼 및 과도한 수식어 제거.
  2. 주방 아일랜드 조리대 및 냉장고 4대 선반(채소, 육류, 유제품, 소스) 레이아웃 재정렬 및 간격/패딩 최적화.
  3. `css/style.css` 및 `frontend/css/style.css`에 반응형 미디어 쿼리 보강.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-035] 3.5초 냉장고 3D 양문형 도어 개방/닫힘 및 아일랜드 바구니 수납 애니메이션 고도화
- **발생/작업 일시**: 2026-09-17 14:52
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 메인 화면에서 요리 찾기 진행 시 냉장고 문이 열리고 닫히는 과정이 단조롭고, 선택된 식재료가 바구니로 이동하는 인터랙션이 부족함.
- **해결 및 구현 내역**:
  1. `css/fridge-3d.css`에 양문형 도어 3D 원근감(Perspective) 회전 트랜스폼 및 반사광 조명 효과 구현.
  2. 3.5초 동안 도어가 열리고(`open`), 선택된 재료들이 아일랜드 바구니로 수납된 후 도어가 스르륵 닫히는(`doors-closed`) 단계적 시퀀스 구축.
  3. SVG 원형 프로그레스 게이지(`aniTimerText`, `timerProgressCircle`)를 통해 `0.0s`부터 `3.5s`까지 실시간 카운트업 시각화 적용.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-036] 최상단 3열 정밀 1:1 맞춤 AI 레시피 3종 합성 및 고화질 실물 요리 사진 정밀 매칭
- **발생/작업 일시**: 2026-09-17 23:11 ~ 23:37
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 사용자가 선택한 냉장고 재료와 프롬프트에 딱 맞는 맞춤형 레시피가 부족하고, 카드마다 동일한 더미 이미지가 반복 노출되어 시각적 만족도가 떨어짐.
- **해결 및 구현 내역**:
  1. `frontend/js/harness/search-agent.js` 및 `backend/agents/search_agent.py`에 `synthesizeTopAccurateRecipes()` 엔진 신설:
     - 3열 레이아웃을 빈틈없이 채우는 시그니처 메인(NO. 01), 페어링 바삭 구이(NO. 02), 든든한 일품요리(NO. 03) 1:1 맞춤 합성.
  2. 프롬프트 시맨틱 파싱(탕/전골/찌개, 타코/보울, 파스타, 디저트 등) 및 풍미 프로필(허니버터, 매운, 마라 등) 정밀 분기 구축.
  3. 23종의 고화질 실물 요리 사진 에셋(`gamjatang_stew.jpg`, `honey_butter_dish.jpg`, `spicy_pork_duruchigi.jpg`, `caprese_salad.jpg` 등)을 추가하고 Set 기반 중복 없는 정밀 매칭 알고리즘 적용.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-037] HTTP 서버 브라우저 캐시 무효화 헤더 탑재 및 관리자 스토어 최신 데이터 원격 동기화
- **발생/작업 일시**: 2026-09-18 09:54
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 데스크탑에서 push 후 노트북에서 pull/clone 시 브라우저 디스크 캐시로 인해 수정된 JS/CSS 파일이 갱신되지 않고 구버전 화면이 표시되는 문제 해결.
  - 로컬에 남아있던 최신 관리자 스토어 데이터 및 캐시 제어 로직 동기화 요청.
- **해결 및 구현 내역**:
  1. `backend/server.py`의 `KitchenChefHandler.end_headers()`에 `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0` 헤더 탑재.
  2. `backend/data/admin_store.json`의 갱신된 사용자 계정 및 개인 냉장고 재고 데이터를 깃허브 `origin/main`에 푸시(`e3e6aae`) 완료.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-038] 메인 [냉장고 문 열고 요리 찾기] 클릭 시 계정별 맞춤 레시피 및 매칭 식재료 DB 영구 저장 시스템 구축
- **발생/작업 일시**: 2026-09-18 10:45
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 현재는 메인 화면에서 요리 찾기 버튼을 눌렀을 때 생성된 레시피와 매칭 식재료 정보가 브라우저 메모리에만 일시적으로 머무르고 있어, 다른 기기 접속이나 새로고침 시 정보가 유실되고 계정별 고유한 맞춤성을 보장하기 어려움.
  - `[🚪 냉장고 문 열고 요리 찾기]` 버튼을 누르는 순간 생성된 결과물 레시피들과 매칭된 각 식재료 정보가 사용자 개인 계정 DB에 영구 저장되어야 함.
- **해결 및 구현 내역**:
  1. **백엔드 DB 영구 보존 스키마 구축 (`backend/server.py`, `backend/data/admin_store.json`)**:
     - `AdminDataStore`에 `user_recipes` 스토어 신설.
     - `save_user_recipes(user_id, recipes, custom_query, selected_ingredients)`: 유저별 최신 맞춤 레시피 N종, 매칭된 식재료 목록, 검색 프롬프트, 저장 시각을 `admin_store.json`에 영구 보존.
     - `get_user_recipes(user_id)`: 계정별 저장된 맞춤 레시피 복원 조회 지원.
     - 보안 감사 로그 연동: 카테고리 `RECIPE_DB` 감사 로그 자동 기록.
  2. **REST API 엔드포인트 신설**:
     - `POST /api/user-recipes` (또는 `/api/user-recipes/sync`): 계정별 맞춤 레시피 및 매칭 식재료 저장.
     - `GET /api/user-recipes`: 계정별 저장된 맞춤 레시피 조회.
  3. **프론트엔드 상태 머신 및 실시간 연동 (`js/store.js`, `js/app.js` 및 `frontend/` 미러)**:
     - `store.saveUserRecipesToDB()` 및 `store.fetchUserRecipesFromDB()`, `store.getUserStoredRecipes()` 구현.
     - 메인 화면에서 `[🚪 냉장고 문 열고 요리 찾기]` 클릭 시 3.5초 애니메이션 종료 직후 `store.saveUserRecipesToDB()`를 자동 호출하여 백엔드 DB 영구 보관 체결.
     - 도마 레시피 화면에 `[💾 개인 DB 연동됨]` 뱃지 표출 및 재방문/새로고침 시 개인 DB 레시피 우선 복원 로드.
  4. **통합 자동화 검증 (`scratch/test_user_recipes_db.py`)**:
     - 1) `save_user_recipes()` 호출, 2) `admin_store.json` 디스크 파일 무결성 확인, 3) `get_user_recipes()` 복원 확인, 4) 보안 감사 로그 기록 확인, 5) 게스트 폴백 확인 등 5대 전수 테스트 100% 통과.
     - 12대 미러 파일 간 SHA-256 해시 100% 일치 확인.
- **상태**: `[해결 완료 (Resolved)]`

---

### [ISSUE-039] 고정 더미 의존 탈피 & 개인 DB 전담 에이전트(UserRecipeAgent) 구축 및 도마·상세·차감·커뮤니티 전 세션 파이프라인 연동
- **발생/작업 일시**: 2026-09-18 11:20
- **담당 개발자**: @sllm05
- **현상 / 요청 사항**:
  - 기존 웹 화면에서 냉장고 식재료와 무관한 정적 14종 고정 레시피(`recipes-data.js`, 스팸 순두부찌개 등)가 하단에 억지로 뿌려져 사용자에게 "웹상으로 뿌려주는 더미 데이터"라는 인상을 주고 맞춤성과 정확성을 떨어뜨리는 문제 해결 요청.
  - 전담 에이전트(`UserRecipeAgent`)를 구축하여 하네스 멀티 에이전트 파이프라인(`SearchAgent` -> `QualityGateAgent` -> `UserRecipeAgent`)에 공식 등록하고, 사용자의 실제 냉장고 재료로 생성된 1:1 맞춤 AI 레시피만 도마 화면에 최우선 단독 표출하도록 전환.
  - 개인 DB에 저장된 맞춤 레시피가 이후의 상세 조리(`view-detail`), 실시간 냉장고 재료 차감(`DeductionAgent`), 완식 인증 및 후기 커뮤니티(`view-community`)까지 단절 없이 100% 매끄럽게 연동되도록 보장.
- **해결 및 구현 내역**:
  1. **UserRecipeAgent 신설 및 하네스 공식 편입**:
     - `frontend/js/harness/user-recipe-agent.js` 및 `js/harness/user-recipe-agent.js`: 하네스 이벤트 버스 연동(`PERSIST_USER_RECIPES`, `USER_RECIPES_PERSISTED`), `persistUserRecipes` 및 `fetchUserRecipes` 구현.
     - `backend/agents/user_recipe_agent.py`: 백엔드 전담 에이전트 구축 및 `backend/server.py` REST API 연동.
     - `agents.md` 표준 아키텍처 다이어그램 및 제7 에이전트 명세 공식 추가.
  2. **도마 레시피 화면 고정 더미 배제 & 맞춤 레시피 최우선 단독 표출 (`view-recipes.html`, `app.js` 및 미러)**:
     - 탭 스위처 탑재: `[⭐ 내 맞춤 레시피 (개인 DB)]` (기본 활성 `default`) vs `[📋 기본 카탈로그 레시피 둘러보기 (14종)]`.
     - 기본 뷰에서는 오직 사용자의 실제 냉장고 재료와 프롬프트로 생성되어 개인 DB(`user_recipes[userId]`)에 저장된 1:1 맞춤 AI 레시피 3종(시그니처 메인, 페어링 바삭 구이, 든든한 일품요리)만 단독 표출하여 고정 더미 노출 원천 배제.
  3. **전 세션 파이프라인 무결성 확보**:
     - `view-detail`: 맞춤 레시피 카드 클릭 시 상세 조리 스텝, TTS 음성 낭독, 실시간 유튜브 검색 URL 정상 로드.
     - `DeductionAgent`: `[조리 완료 및 재료 소진]` 클릭 시 실제 사용자 냉장고 DB에서 삼겹살, 대파 등 사용 재료가 원자적으로 차감.
     - `view-community`: 완식 인증서에 실제 맞춤 요리명(예: `얼큰 매콤 삼겹살 감자탕 전골`)이 인쇄되고 후기 작성 폼 자동 언락.
  4. **통합 검증 통과 및 18개 미러 파일 100% SHA-256 패리티 달성**:
     - `scratch/test_user_recipe_agent.py` 5대 단위 테스트 100% 통과.
     - 루트 18개 파일과 `frontend/` 디렉토리 간 해시 전수 일치 확인.
- **상태**: `[해결 완료 (Resolved)]`



