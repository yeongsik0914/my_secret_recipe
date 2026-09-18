# [구현 계획] 관리자 콘솔 역할 기반 회원 삭제 및 체크박스 일괄 삭제 시스템 구축

## 개요 (Overview)
관리자 콘솔에서 계정 권한 계층에 따른 정밀 삭제 인가(Authorization) 가드 및 체크박스 기반 다중 선택/일괄 삭제 UX를 구축합니다.
- **총괄 어드민 (`admin`)**: 다른 관리자(`manager`, `admin`) 및 일반 회원(`user`)을 모두 삭제할 수 있습니다. (단, 시스템 루트 어드민 `admin@kitchenchef.com` 및 본인 계정은 영구 보호)
- **관리자 (`manager`)**: 관리자가 아닌 일반 회원(`user`)만 삭제할 수 있으며, 관리자(`manager`)나 어드민(`admin`) 삭제 시도시 권한 부족으로 차단됩니다.
- **체크박스 다중 선택 (Batch Selection)**: 테이블 전체 선택/해제 및 개별 행 체크박스를 제공하고, 상단에 '선택 회원 삭제 (N명)' 액션 바 및 개별 행 '삭제' 버튼을 배치합니다.

---

## User Review Required

> [!IMPORTANT]
> **권한 계층 및 삭제 대상 정책**
> 1. **어드민 (`admin`) 계정**:
>    - `user` (일반 회원), `manager` (관리자), 다른 `admin` (어드민) 삭제 가능.
>    - 본인 계정 자가 삭제 방지 (`CANNOT_DELETE_SELF`).
>    - 시스템 루트 계정(`admin@kitchenchef.com`) 영구 보호 (`CANNOT_DELETE_ROOT_ADMIN`).
> 2. **관리자 (`manager`) 계정**:
>    - `user` (일반 회원)만 삭제 가능.
>    - 다른 `manager` 또는 `admin` 선택 시 즉시 경고 및 차단 (`INSUFFICIENT_PERMISSIONS`).
> 3. **데이터 연계 삭제**:
>    - 회원 계정 삭제 시 `users` 저장소뿐만 아니라 해당 회원의 `fridges` (전용 냉장고 데이터)도 함께 원자적으로 삭제되고, `ACCOUNT_DELETION` 카테고리 감사 로그에 영구 기록됩니다.

---

## Proposed Changes

### 1. 백엔드 엔진 및 REST API

#### [MODIFY] [server.py](file:///e:/my_secret_recipe/backend/server.py)
- **`AdminDataStore.delete_user(target_user_id, operator_user_id, operator_role, admin_name)`**:
  - `admin@kitchenchef.com` 삭제 방어 가드.
  - 본인 계정 삭제 방어 가드.
  - 역할별 권한 검증:
    - `operator_role == 'admin'`: 모든 역할(user, manager, admin) 삭제 허용.
    - `operator_role == 'manager'`: target이 `user`일 때만 허용, `manager` 또는 `admin`일 경우 `INSUFFICIENT_PERMISSIONS` 에러 반환.
    - `operator_role == 'user'`: `FORBIDDEN` 에러 반환.
  - `self.users` 및 `self.fridges`에서 원자적 제거.
  - 보안 감사 로그(`ACCOUNT_DELETION`) 기록 및 파일 영구 저장.
- **`AdminDataStore.delete_users_batch(...)`**:
  - 다중 `userIds` 배열을 순회하며 역할 검증 후 삭제 성공/실패 내역 집계 반환.
- **`KitchenChefHandler.do_POST`**:
  - `POST /api/admin/users/delete` 엔드포인트 신설 (단일 `userId` 및 다중 `userIds` 동시 지원).

---

### 2. 프론트엔드 마크업 & 스타일

#### [MODIFY] [views/view-admin.html](file:///e:/my_secret_recipe/views/view-admin.html) & [frontend/html/views/view-admin.html](file:///e:/my_secret_recipe/frontend/html/views/view-admin.html)
- 관리자 콘솔 회원 목록 상단 액션 바에 `선택 회원 삭제 (N명)` 버튼 (`#btn-admin-batch-delete`) 추가.
- 회원 목록 테이블(`admin-users-table`) thead 첫 번째 열에 전체 선택 체크박스 (`#admin-user-check-all`) 추가.

#### [MODIFY] [css/style.css](file:///e:/my_secret_recipe/css/style.css) & [frontend/css/style.css](file:///e:/my_secret_recipe/frontend/css/style.css)
- 체크박스 전용 열 너비 고정 (`width: 44px; text-align: center;`).
- 일괄 삭제 버튼(`.btn-admin-batch-delete`) 및 개별 행 삭제 버튼(`.btn-danger-action`) 전용 프리미엄 댄저 스타일 추가 (소프트 레드 배경, 레드 보더, 호버 애니메이션).

---

### 3. 프론트엔드 스토어 & 컨트롤러

#### [MODIFY] [js/store.js](file:///e:/my_secret_recipe/js/store.js) & [frontend/js/store.js](file:///e:/my_secret_recipe/frontend/js/store.js)
- `store.deleteUsers(userIds, operatorInfo)`: 백엔드 `/api/admin/users/delete` 호출 및 로컬 `adminUsers` 동기화.

#### [MODIFY] [js/app.js](file:///e:/my_secret_recipe/js/app.js) & [frontend/js/app.js](file:///e:/my_secret_recipe/frontend/js/app.js)
- `renderAdminUsers()`:
  - 각 행 첫 번째 열에 `<input type="checkbox" class="admin-user-chk">` 렌더링.
  - 각 행 9번째 액션 열에 `🗑️ 삭제` 버튼 (`.btn-delete-user`) 추가 (루트 어드민 계정은 삭제 버튼 미노출 또는 비활성화).
  - 체크박스 이벤트 바인딩:
    - `#admin-user-check-all` 클릭 시 현재 필터링된 모든 체크박스 토글.
    - 체크 상태 변경 시 선택된 회원 수 카운트 및 `#btn-admin-batch-delete` 표시/숨김 처리.
- 삭제 이벤트 핸들러:
  - 현재 로그인 사용자의 역할(`store.currentUser.role`) 확인.
  - `manager`가 `admin` 또는 `manager`를 선택한 경우: "⚠️ 관리자(Manager)는 관리자가 아닌 일반 회원만 삭제할 수 있습니다." 토스트/알럿 표시 및 차단.
  - 확인 컨펌 다이얼로그(`window.confirm`) 노출 후 삭제 API 호출.
  - 성공 시 토스트 알림, 사용자 목록 및 관리자 메트릭스 갱신.

---

### 4. 미러 파일 100% 동기화 & 문서화
- `index.html` (또는 `view-admin.html`), `style.css`, `store.js`, `app.js` 간 100% SHA256 패리티 유지.
- `log.md`에 `[ISSUE-030]` 등록 및 `@yeongsik0914` 기여 표기.
- `git commit` & `push origin main`.

---

## Verification Plan

### Automated Tests
- `scratch/test_admin_delete_permissions.py` 테스트 스크립트 작성 및 실행:
  1. `admin` 권한으로 일반 `user` 삭제 -> 성공 (200).
  2. `admin` 권한으로 다른 `manager` 삭제 -> 성공 (200).
  3. `admin` 권한으로 다른 `admin` 삭제 -> 성공 (200).
  4. `admin` 권한으로 본인 계정 삭제 시도 -> 차단 (400, `CANNOT_DELETE_SELF`).
  5. `admin` 권한으로 루트 어드민(`admin@kitchenchef.com`) 삭제 시도 -> 차단 (400, `CANNOT_DELETE_ROOT_ADMIN`).
  6. `manager` 권한으로 일반 `user` 삭제 -> 성공 (200).
  7. `manager` 권한으로 다른 `manager` 삭제 시도 -> 차단 (403, `INSUFFICIENT_PERMISSIONS`).
  8. `manager` 권한으로 `admin` 삭제 시도 -> 차단 (403, `INSUFFICIENT_PERMISSIONS`).
  9. `user` 권한으로 삭제 시도 -> 차단 (403, `FORBIDDEN`).
  10. 체크박스 다중 일괄 삭제 API 검증 (여러 명 한 번에 삭제 및 전용 냉장고 동시 삭제 확인).

### Manual Verification
- 사용자 브라우저 또는 로컬 환경에서 관리자 콘솔 탭 진입:
  - 체크박스 전체 선택/개별 선택 동작 확인.
  - 상단 "선택 회원 삭제 (N명)" 버튼 노출 및 카운트 반영 확인.
  - 매니저 계정 로그인 시 관리자 삭제 차단 알림 확인.
  - 어드민 계정 로그인 시 삭제 정상 수행 및 감사 로그 기록 확인.
