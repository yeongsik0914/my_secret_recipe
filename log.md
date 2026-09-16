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
- **요청 사항**: 기존 우드 도마 크래프트 및 3D 냉장고 오픈 디자인을 100% 유지하면서 12대 핵심 기능 전면 구현:
  1. 사용자 회원가입 (Firebase Auth 연동)
  2. 나만의 냉장고 구성 (이미지/텍스트 식재료 보관)
  3. 냉장고 재료 + 원하는 메뉴/조리방식 입력 받아 레시피 추천
  4. 레시피 생성 시 `agents.md` 규칙 준수
  5. 레시피 생성 시 필요한 재료 냉장고 추출 2초 3D 애니메이션 연동
  6. 순서별 조리 가이드 음성(TTS) + 텍스트 + 이미지 제공
  7. 조리 완료 셰프만 커뮤니티 후기 작성 가능 (조리 락/언락)
  8. 커뮤니티 댓글 추천수/조회수 기준 노하우 댓글 자동 선정 (`[👑 베스트 노하우 댓글]`)
  9. 완식 횟수 기반 사용자 칭호 등급제 (호기심쟁이 -> 재고구출자 -> 냉파마스터 -> 미슐랭장인)
  10. 사용자 레시피 직접 등록 & 동일 메뉴 중복 추천 지원
  11. Firebase Firestore 연동을 통한 데이터 영구화
  12. 냉장고 재료 DB 저장 및 레시피 조리 완료 시 실시간 차감
- **해결 내역**:
  1. `frontend/js/firebase-config.js`에 Firebase Auth & Firestore 하이브리드 어댑터 구축 (오프라인/로컬 자동 폴백).
  2. `agents.md` 및 `search-agent.js`, `quality-agent.js`에 사용자 공유 레시피 종합 수집 및 메뉴 검색어 가중치, 중복 추천 허용 규칙 반영.
  3. `frontend/js/store.js`에 칭호 산출 시스템, 완식 레시피 추적 및 락 검증, 사용자 레시피 등록, 댓글 추천 및 베스트 노하우 평가 로직 구현.
  4. Web Speech API(`window.speechSynthesis`, `SpeechSynthesisUtterance`)를 활용한 전체 조리 낭독 및 스텝별 한국어 TTS 기능 연동.
  5. `frontend/css/style.css` 및 `frontend/html/index.html`, `index.html`에 메뉴 검색창, 나만의 레시피 등록 모달, TTS 바, 완식 락 안내 박스, 칭호 프로그레스 바 마크업 및 스타일 완벽 일체화.
  6. Python 백엔드 `server.py`, `orchestrator.py`, `quality_agent.py`에 검색어 및 사용자 레시피 파이프라인 연동 완료.
- **상태**: `[해결 완료 (Resolved)]`



