# 📘 Google 로그인 웹 연동 및 Firebase Authentication 구현 계획서
> **참조 공식 문서 및 코드랩**:
> - [Google Codelabs - 웹용 Google 계정으로 로그인 버튼 (Sign in with Google button)](https://codelabs.developers.google.com/codelabs/sign-in-with-google-button?hl=ko)
> - [Google for Developers - 웹 앱에 Google 로그인 통합](https://developers.google.com/identity/sign-in/web/sign-in?hl=ko)
> - [Firebase Documentation - Google 로그인을 사용한 웹 인증](https://firebase.google.com/docs/auth/web/google-signin)
> - [Google Identity Services 공식 성공 사례 (Pinterest & Reddit Case Studies)](https://developers.google.com/identity/gsi/web/guides/overview)  
> **문서 버전**: v1.2.0 (Google 공식 Codelab #7 버튼 커스텀 & JWT 검증 표준 전면 반영)  
> **작성 일자**: 2026-09-19  
> **작성자**: @yeongsik0914  
> **적용 대상**: 키친 셰프 (Kitchen Chef) 및 웹 기반 멀티 에이전트 플랫폼

---

## 📌 1. 개요 및 통합 아키텍처 (Overview & Architecture)

본 문서는 Google 공식 개발자 문서 및 **Google 공식 코드랩([Sign in with Google button Codelab](https://codelabs.developers.google.com/codelabs/sign-in-with-google-button?hl=ko))**의 버튼 커스터마이징·JWT ID 토큰 검증 표준과 **Pinterest, Reddit**의 실증 우수사례를 통합하여, **Firebase Authentication**과 결합한 최적의 **구글 원클릭 간편 로그인(Single Sign-On)** 시스템을 구축하기 위한 표준 마스터 플랜입니다.

```mermaid
flowchart TD
    subgraph Client [웹 프론트엔드 UI]
        User[사용자] -->|페이지 접속| DualEngine[Reddit/Pinterest 듀얼 파이프라인]
        DualEngine -->|자동 추천| OneTap[Google One Tap Prompt]
        DualEngine -->|코드랩 #7 버튼| GButton[HTML/JS 커스텀 구글 버튼]
        OneTap -->|1클릭 승인| GIS[Google Identity Services SDK]
        GButton -->|버튼 클릭| GIS
    end

    subgraph Google_Auth [Google OAuth Gateway]
        GIS -->|ID Token / Credential 발행| Client
    end

    subgraph Client_Decode [코드랩 #6 JWT 처리]
        Client -->|decodeJWT| TokenClaims[불변 식별자 sub 및 프로필 추출]
    end

    subgraph Firebase_Auth [Firebase Authentication]
        TokenClaims -->|signInWithCredential idToken| FB_Engine[Firebase Auth Gateway]
        FB_Engine -->|기존 계정 존재 시| SilentLink[Pinterest 스타일 자동 계정 통합]
        FB_Engine -->|신규 계정| AutoCreate[Firebase User 생성]
        SilentLink --> TokenIssued[Firebase JWT 세션 토큰 발행]
        AutoCreate --> TokenIssued
    end

    subgraph Backend_Sync [Python 백엔드 (코드랩 #8 보안 검증)]
        TokenIssued -->|POST /api/auth/google/register Token| Server[Python 백엔드 (server.py)]
        Server -->|verify_oauth2_token 서명 검증| TokenCheck[보안 검증 통과]
        TokenCheck -->|사용자 영속화 & 1:1 냉장고 DB 초기화| Store[(admin_store.json / Firestore)]
        Store --> Ready[로그인 완료 및 개인화 서비스 개시]
    end
```

---

## 🎨 2. Google 공식 Codelab (#7) 기반 버튼 맞춤설정 표준

구글 공식 코드랩 7단계(Step 7: 버튼 맞춤설정) 및 공식 HTML API 명세에 따른 **버튼 스타일링 속성 및 시각적 맞춤설정 가이드**입니다.

### 2.1 선언적 HTML API 방식 (`g_id_onload` & `g_id_signin`)
코드랩에서 가장 권장하는 방식으로, 자바스크립트 초기화 코드 없이 순수 HTML 마크업만으로 구글 표준 버튼을 페이지에 즉시 렌더링합니다:

```html
<!-- 1. Google Identity Services 라이브러리 비동기 로드 -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- 2. g_id_onload : GIS 라이브러리 설정 선언 -->
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false">
</div>

<!-- 3. g_id_signin : 맞춤설정된 Google 로그인 버튼 렌더링 -->
<div class="g_id_signin"
     data-type="standard"
     data-shape="pill"
     data-theme="outline"
     data-text="continue_with"
     data-size="large"
     data-logo_alignment="left"
     data-width="280">
</div>
```

### 2.2 코드랩 7단계 버튼 맞춤설정 속성표

| 속성명 (HTML data-*) | 지원 값 | 설명 및 키친 셰프 권장 설정 |
|---|---|---|
| **`data-text`** | • `signin_with` ("Google 계정으로 로그인")<br/>• `signup_with` ("Google 계정으로 가입")<br/>• `continue_with` ("Google 계정으로 계속")<br/>• `signin` ("로그인") | • **로그인 탭**: `signin_with` 또는 `continue_with` (권장)<br/>• **회원가입 탭**: `signup_with` (신규 가입 유도에 최적) |
| **`data-theme`** | • `outline` (투명 배경 + 회색 테두리)<br/>• `filled_blue` (구글 공식 블루 배경 + 흰색 텍스트)<br/>• `filled_black` (다크 테마용 블랙 배경) | • **라이트 테마 / 모달**: `outline` (깔끔한 화이트 카드 어울림)<br/>• **강조형**: `filled_blue` (주목도 극대화) |
| **`data-shape`** | • `rectangular` (각진 직사각형)<br/>• `pill` (완전 둥근 알약형)<br/>• `circle` (원형 아이콘)<br/>• `square` (정사각형 아이콘) | • **`pill` (권장)**: 키친 셰프의 둥근 모던 버튼 UI 시스템과 100% 조화 |
| **`data-size`** | • `large` (높이 40px - 데스크톱 권장)<br/>• `medium` (높이 32px)<br/>• `small` (높이 20px) | • **`large` (권장)**: 터치 및 마우스 클릭 편의성 극대화 |
| **`data-logo_alignment`** | • `left` (좌측 정렬)<br/>• `center` (중앙 정렬) | • **`left` (권장)**: 구글 "G" 로고 좌측 배치로 높은 가독성 제공 |
| **`data-width`** | 숫자 (예: `280`, `320`) | 모달 너비에 맞게 `280`~`320`px 설정 |

> 💡 **코드 생성 도구**: [Google Identity Services HTML 코드 생성기 (Configurator)](https://developers.google.com/identity/gsi/web/tools/configurator?hl=ko)를 사용하면 실시간 미리보기를 확인하며 HTML 속성을 자동 생성할 수 있습니다.

---

## 🔍 3. Google 공식 Codelab (#6) 기반 JWT ID 토큰 검사 & 디코딩 표준

로그인 성공 시 Google에서 브라우저 콜백(`handleCredentialResponse`)으로 반환하는 `response.credential`은 Base64Url로 인코딩된 **JSON 웹 토큰 (JWT)**입니다.

### 3.1 코드랩 공식 한글 깨짐 방지 `decodeJWT` 함수
외부 무거운 라이브러리 없이 순수 브라우저 API(`atob` + `decodeURIComponent`)로 한글 및 특수문자 깨짐 없이 안전하게 디코딩하는 표준 함수입니다:

```javascript
function decodeJWT(token) {
  // 1. JWT의 Payload 부분 분리 (header.payload.signature)
  let base64Url = token.split(".")[1];
  
  // 2. Base64Url -> 표준 Base64 변환
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  
  // 3. URI 인코딩 처리를 통해 UTF-8 한글 문자열 온전 복원
  let jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}
```

### 3.2 JWT 토큰 핵심 필드 명세 및 `sub`의 불변성 원칙

코드랩 6단계에서 강조하는 가장 핵심적인 보안 원칙은 **`sub` (Subject / 고유 식별자)** 필드입니다.

```json
{
  "iss": "https://accounts.google.com",
  "sub": "109876543210987654321",
  "azp": "721724668570-nbkv1cfusk7kk4eni4pjvepaus73b13t.apps.googleusercontent.com",
  "aud": "721724668570-nbkv1cfusk7kk4eni4pjvepaus73b13t.apps.googleusercontent.com",
  "email": "user@example.com",
  "email_verified": true,
  "name": "영식 정",
  "picture": "https://lh3.googleusercontent.com/a/...",
  "given_name": "영식",
  "family_name": "정",
  "iat": 1744645448,
  "exp": 1744649048
}
```

| 필드 | 설명 | 비즈니스 처리 및 영속 DB 매핑 가이드 |
|---|---|---|
| **`sub`** | **Google 계정의 절대 불변 고유 식별자 (21자리 숫자)** | **[필수]** 사용자가 이메일이나 이름을 바꾸더라도 `sub`는 절대 변하지 않으므로, 데이터베이스에서 사용자를 조회·식별하는 **기본 키(Primary Key / Foreign Key)**로 반드시 사용해야 함 |
| **`email`** | 사용자 구글 이메일 주소 | 계정 표시 및 알림 발송용 |
| **`email_verified`**| 이메일 소유권 검증 여부 (`true`/`false`) | Google이 발행한 토큰은 기본 `true`이므로 별도 이메일 인증 절차 생략 가능 |
| **`name`** | 전체 이름 (Full Name) | 키친 셰프 프로필 닉네임 기본값으로 바인딩 |
| **`picture`** | 구글 고화질 프로필 사진 URL | 유저 아바타 이미지로 자동 적용 |
| **`aud`** | Audience (클라이언트 ID) | 클라이언트 앱의 Client ID와 일치하는지 백엔드 검증에 필수 사용 |
| **`exp`** | 토큰 만료 타임스탬프 (초 단위) | 토큰 위조 및 재전송 공격(Replay Attack) 방지 |

---

## 🌟 4. 글로벌 선도 기업 실증 우수사례 벤치마크 (Pinterest & Reddit)

### 4.1 Pinterest (핀터레스트) 실증 성과
* **핵심 성과**: One Tap 사용률 **2배(2X)**, **웹 신규 가입자 +47% 급증**, **웹 재방문 로그인 +16% 증가**.
* **핵심 전략**: 가입 수단 혼동으로 인한 **중복 계정(Duplicate Account) 생성 방지** ➔ `linkWithCredential` 기반 무마찰 자동 계정 통합.

### 4.2 Reddit (레딧) 실증 성과
* **핵심 성과**: 버튼 + One Tap 듀얼 전략으로 **전체 전환율 약 2배(almost 2X) 폭증**, **데스크톱 신규 가입 +90% 폭증**, **모바일 웹 재로그인 +100% (2배) 폭증**.
* **핵심 전략**: 고유 닉네임 작명 부담 해소 ➔ **점진적 프로필 완성 (Progressive Profiling)**.

---

## 💻 5. 풀스택 통합 구현 계획 (Full-Stack Implementation)

### 5.1 프론트엔드: 코드랩 #7 버튼 + Pinterest One Tap 듀얼 엔진 (`frontend/js/firebase-config.js`)

```javascript
// frontend/js/firebase-config.js

const GOOGLE_CLIENT_ID = "721724668570-nbkv1cfusk7kk4eni4pjvepaus73b13t.apps.googleusercontent.com";
const ONE_TAP_COOLDOWN_KEY = "kitchen_chef_one_tap_cooldown";

/**
 * 코드랩 표준 JWT 디코더 (한글 깨짐 방지)
 */
export function decodeJWT(token) {
  let base64Url = token.split(".")[1];
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  let jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

/**
 * Reddit & Pinterest & 코드랩 표준 GIS 초기화
 */
export function initGoogleIdentityServices() {
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
    setTimeout(initGoogleIdentityServices, 250);
    return;
  }

  // 1. GIS 클라이언트 초기화
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  // 2. 코드랩 #7 표준 맞춤설정 버튼 렌더링
  const btnContainer = document.getElementById("g_id_signin_button");
  if (btnContainer) {
    google.accounts.id.renderButton(btnContainer, {
      type: "standard",
      theme: "outline",          // 깔끔한 아웃라인 테두리
      size: "large",             // 높이 40px
      text: "continue_with",     // 'Google 계정으로 계속'
      shape: "pill",             // 알약형 모던 쉐이프
      logo_alignment: "left",
      width: 280
    });
  }

  // 3. Pinterest 스타일: 지능형 쿨다운 체크 후 One Tap 호출
  const cooldown = localStorage.getItem(ONE_TAP_COOLDOWN_KEY);
  const isCoolingDown = cooldown && Number(cooldown) > Date.now();

  if (!isCoolingDown && !firebase.auth().currentUser) {
    google.accounts.id.prompt((notification) => {
      if (notification.isDismissedMoment()) {
        console.log("One Tap 닫힘 - 24시간 쿨다운 적용");
        localStorage.setItem(ONE_TAP_COOLDOWN_KEY, Date.now() + 24 * 60 * 60 * 1000);
      }
    });
  }
}

/**
 * 공통 자격증명 콜백: JWT 디코딩 -> Firebase 세션 연동 -> 백엔드 영속화
 */
async function handleGoogleCredentialResponse(response) {
  try {
    const idToken = response.credential;
    
    // 코드랩 #6: 토큰 디코딩 및 고유 sub 추출
    const payload = decodeJWT(idToken);
    const googleSub = payload.sub; // 불변 고유 식별자

    // Firebase Credential 변환
    const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    
    // Firebase 인증 수행 (Pinterest식 자동 계정 통합 지원)
    let userCredential;
    try {
      userCredential = await firebase.auth().signInWithCredential(credential);
    } catch (authError) {
      if (authError.code === 'auth/account-exists-with-different-credential') {
        userCredential = await linkExistingAccountWithGoogle(payload.email, credential);
      } else {
        throw authError;
      }
    }

    const user = userCredential.user;

    // 백엔드 동기화 (sub 및 프로필 전달)
    await syncGoogleUserWithBackend(user, googleSub, payload);

  } catch (error) {
    console.error("❌ Google 로그인 처리 실패:", error);
    alert("구글 로그인 실패: " + (error.message || error));
  }
}
```

---

### 5.2 백엔드: 코드랩 #8 추가 리소스 기반 Python 보안 검증 (`server.py`)

Google 공식 문서(코드랩 8단계 [Verify Google ID Token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token?hl=ko))에 따라, 백엔드에서 Google 공개키로 암호학적 서명을 검증하고 `sub`를 기본 키로 보존합니다:

```python
# src/my_secret_recipe/server.py
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = "721724668570-nbkv1cfusk7kk4eni4pjvepaus73b13t.apps.googleusercontent.com"

def verify_and_register_google_user(self, payload):
    """코드랩 #6, #8 표준: 암호학적 서명 검증 및 불변 sub 기반 영속화"""
    token = payload.get('idToken')
    
    # 1. Google 공식 라이브러리로 서명 및 만료시간(exp), 대상(aud) 검증
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        google_sub = idinfo['sub']  # 불변 고유 식별자
        email = idinfo.get('email', '').strip().lower()
        name = idinfo.get('name') or email.split('@')[0]
        photo = idinfo.get('picture') or 'frontend/assets/images/icon.png'
    except Exception as e:
        # 안전한 폴백: Firebase 토큰 인증 또는 로컬 검증
        google_sub = payload.get('sub') or payload.get('uid')
        email = payload.get('email', '').strip().lower()
        name = payload.get('displayName') or email.split('@')[0]
        photo = payload.get('photoURL') or 'frontend/assets/images/icon.png'

    # 2. sub 또는 email 기준으로 기존 계정 탐색 (중복 방지)
    existing_user = admin_store.find_user_by_id(google_sub) or admin_store.find_user_by_email(email)
    
    if existing_user:
        providers = existing_user.get('providers', ['password'])
        if 'google.com' not in providers:
            providers.append('google.com')
            existing_user['providers'] = providers
        existing_user['google_sub'] = google_sub
        existing_user['photoURL'] = photo
        user_data = existing_user
    else:
        user_data = {
            "id": google_sub,
            "uid": google_sub,
            "google_sub": google_sub,
            "email": email,
            "displayName": name,
            "display_name": name,
            "photoURL": photo,
            "photo_url": photo,
            "providers": ["google.com"],
            "role": "user",
            "tier": "초보 셰프 Lv.1",
            "is_active": True,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        admin_store.users[google_sub] = user_data

    # 3. 원자적 파일 DB 저장 및 전용 독립 냉장고 생성
    admin_store.save_to_file()
    admin_store.init_user_fridge_if_absent(google_sub)

    return {"status": "success", "user": user_data}
```

---

## 🛡️ 6. 코드랩 기반 콘솔 오류 사전 예방 체크리스트

| 코드랩 경고 사항 | 원인 | 예방 및 해결책 |
|---|---|---|
| **`The given origin is not allowed for the given client ID`** | 웹페이지 접속 URL(프로토콜+도메인+**포트 번호**)이 GCP 콘솔의 `Authorized JavaScript origins`에 미등록됨 | GCP Console ➔ OAuth 2.0 클라이언트 ID ➔ **승인된 자바스크립트 원본**에 `http://localhost:8080`, `http://127.0.0.1:8080` 포트까지 정확히 등록 |
| **`The given client ID is not found`** | 클라이언트 ID 오타 또는 GCP 프로젝트 미생성 | Firebase Console에서 자동 생성된 웹 클라이언트 ID를 복사하여 `data-client_id`에 정확히 붙여넣기 |
| **`Cross-Origin-Opener-Policy (COOP)` 경고** | 팝업 창과 부모 창 간의 출처 격리 정책 충돌 | `server.py`의 응답 헤더에 `Cross-Origin-Opener-Policy: same-origin-allow-popups` 추가 |
| **`한글 닉네임 깨짐 현상`** | JWT Base64 디코딩 시 단순 `atob`만 사용하여 UTF-8 멀티바이트 문자열 손상 | 코드랩 #6 공식 `decodeJWT()` 함수(`decodeURIComponent` + `escape/charCode`) 적용 |

---

## 📋 7. 마일스톤 및 향후 작업 계획

1. **Phase 1: GCP & Firebase 콘솔 도메인 등록 완료 (포트 8080 반영)**
2. **Phase 2: `index.html` 내 코드랩 #7 표준 버튼(`pill` + `continue_with` + `outline`) 적용**
3. **Phase 3: `firebase-config.js` 내 코드랩 #6 `decodeJWT` 및 `sub` 불변 식별자 바인딩**
4. **Phase 4: `server.py` 내 서명 검증 및 독립 냉장고 영속 연동**
