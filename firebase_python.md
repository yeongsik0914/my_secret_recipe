# [기술 기획서] Python 기반 Firebase 인증 및 구글 계정 통합 시스템

본 문서는 **Python 백엔드(FastAPI / Flask)** 환경에서 **Firebase Authentication**과 **Cloud Firestore**를 연동하여 이메일/비밀번호 회원가입, 구글 OAuth 간편 로그인, 그리고 동일 이메일 계정 통합(Account Linking)을 안전하게 처리하기 위한 기술 명세서입니다.

---

## 1. 시스템 개요 및 아키텍처

### 1.1 개요
* **목적**: 웹 프론트엔드와 Python 백엔드 간 안전한 토큰 기반 통신을 구축하고, 이메일 가입 유저와 구글 간편 가입 유저의 신원을 단일 Firebase `UID`로 통합 관리.
* **핵심 스택**:
  * **Backend**: Python 3.10+ (FastAPI 권장 / Flask 지원)
  * **인증 & DB SDK**: `firebase-admin` (v6.0+), `google-auth`
  * **데이터베이스**: Cloud Firestore
  * **보안 토큰**: Firebase ID Token (JWT 기반, 백엔드 공개키 검증)

### 1.2 시스템 아키텍처 및 토큰 검증 흐름

```
[사용자 웹 브라우저 (Client)]
     │
     ├── (1) 구글 OAuth 로그인 (Google ID Token 획득) 또는 이메일 가입 요청
     │
     ▼ (HTTPS Request + Bearer Token)
[Python 백엔드 API (FastAPI / Flask)]
     │
     ├── (2) firebase_admin.auth.verify_id_token(token)
     │       └─ 서명 검증, 만료 시간 확인, 발급자 확인
     │
     ├── (3) 사용자 조회 & 계정 충돌(이메일 중복) 판별
     │       └─ auth.get_user_by_email()
     │
     ├── (4) 계정 프로비저닝 또는 통합(Linking) 처리
     │       └─ auth.update_user(), 커스텀 클레임 또는 Firestore 업데이트
     │
     ▼
[Cloud Firestore: /users/{uid}]
     └─ 사용자 프로필, 권한(role), 연동 제공자(providers) 동기화
```

---

## 2. 데이터베이스 스키마 설계 (Cloud Firestore)

모든 사용자 문서는 Firebase Auth의 고유 식별자인 `UID`를 Document ID(Key)로 사용합니다.

### 경로: `/users/{uid}`

| 필드명 | 데이터 타입 | 필수 여부 | 설명 | 예시 |
|---|---|:---:|---|---|
| `uid` | string | Y | Firebase Auth 고유 식별자 (PK) | `"k8Z7a90bCde..."` |
| `email` | string | Y | 사용자 주 이메일 주소 | `"developer@example.com"` |
| `display_name` | string | N | 사용자 닉네임 / 성명 | `"홍길동"` |
| `photo_url` | string | N | 프로필 사진 URL | `"https://lh3.google..."` |
| `providers` | array[string] | Y | 연동된 인증 수단 목록 | `["password", "google.com"]` |
| `role` | string | Y | 권한 구분 (`user`, `admin`) | `"user"` |
| `is_active` | boolean | Y | 계정 활성화 상태 | `true` |
| `created_at` | timestamp | Y | 가입 일시 | `SERVER_TIMESTAMP` |
| `updated_at` | timestamp | Y | 최종 수정 일시 | `SERVER_TIMESTAMP` |

---

## 3. Python 백엔드 핵심 구현 요구사항

### 3.1 Firebase Admin SDK 초기화
Google Cloud 서비스 계정 키(`serviceAccountKey.json`)를 안전하게 주입받아 초기화합니다.

```python
# app/core/firebase.py
import os
import firebase_admin
from firebase_admin import credentials, auth, firestore

# 환경변수 또는 파일 경로로부터 서비스 계정 키 로드
cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_app = firebase_admin.initialize_app(cred)
else:
    firebase_app = firebase_admin.get_app()

db = firestore.client()
```

---

### 3.2 ID 토큰 검증 미들웨어 / 의존성 (FastAPI 예시)
클라이언트가 전달한 Firebase ID Token을 Python 백엔드에서 복호화 및 검증하여 안전하게 현재 유저 컨텍스트를 추출합니다.

```python
# app/core/dependencies.py
from fastapi import Header, HTTPException, status, Depends
from firebase_admin import auth

async def get_current_user(authorization: str = Header(...)):
    """HTTP Bearer 헤더에서 Firebase ID Token을 추출하고 검증"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="올바른 인증 헤더 형식이 아닙니다 (Bearer <token>)."
        )
    
    id_token = authorization.split("Bearer ")[1]
    try:
        # Firebase 백엔드 토큰 무결성 검증
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  # uid, email, firebase provider 정보 포함
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 만료되었습니다. 재발급이 필요합니다."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"인증에 실패했습니다: {str(e)}"
        )
```

---

### 3.3 이메일 회원가입 및 Firestore 프로필 동기화 (Python 백엔드 로직)

```python
# app/services/auth_service.py
from firebase_admin import auth, firestore
from app.core.firebase import db

def register_user_with_email(email: str, password: str, display_name: str = None):
    """이메일/비밀번호 신규 사용자 등록 및 Firestore 유저 문서 초기화"""
    try:
        # 1. Firebase Auth에 사용자 생성
        user_record = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=False
        )

        # 2. Firestore에 비즈니스 데이터 프로비저닝
        user_ref = db.collection("users").document(user_record.uid)
        user_data = {
            "uid": user_record.uid,
            "email": email,
            "display_name": display_name or "",
            "photo_url": None,
            "providers": ["password"],
            "role": "user",
            "is_active": True,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        user_ref.set(user_data)

        return {"success": True, "uid": user_record.uid, "email": email}

    except auth.EmailAlreadyExistsError:
        return {"success": False, "error": "이미 등록된 이메일 주소입니다."}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

### 3.4 구글 간편 로그인 및 계정 통합(Account Linking) 파이프라인

프론트엔드에서 Google 로그인 완료 후 획득한 토큰 정보를 백엔드에 넘겨 계정 검증 및 동기화를 수행합니다.

```python
# app/services/google_auth_service.py
from firebase_admin import auth, firestore
from app.core.firebase import db

def process_google_auth(decoded_token: dict):
    """
    구글 ID 토큰 인증 후 신규 가입 판별 및 기존 이메일 계정 통합 처리
    """
    uid = decoded_token["uid"]
    email = decoded_token.get("email")
    name = decoded_token.get("name", "")
    picture = decoded_token.get("picture", "")

    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()

    if not doc.exists:
        # 1. 신규 사용자인 경우 Firestore 문서 생성
        user_data = {
            "uid": uid,
            "email": email,
            "display_name": name,
            "photo_url": picture,
            "providers": ["google.com"],
            "role": "user",
            "is_active": True,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        user_ref.set(user_data)
        return {"status": "created", "uid": uid}
    else:
        # 2. 이미 존재하는 유저일 경우 연동 제공자 배열 갱신
        existing_data = doc.to_dict()
        providers = set(existing_data.get("providers", []))
        providers.add("google.com")

        user_ref.update({
            "providers": list(providers),
            "photo_url": picture or existing_data.get("photo_url"),
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        return {"status": "authenticated", "uid": uid}
```

---

### 3.5 마이페이지 연동 관리 API (연동 해제 방어 로직)

사용자가 구글 연동을 해제할 때, 단 하나의 로그인 수단만 남은 상태에서 고립되는 것을 방지합니다.

```python
# app/api/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.core.firebase import db

router = APIRouter(prefix="/users", tags=["User Security"])

@router.post("/unlink-google")
def unlink_google_account(current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    user_data = doc.to_dict()
    providers = user_data.get("providers", [])

    # 안전장치: 인증 수단이 구글 1개뿐인 경우 차단
    if len(providers) <= 1 and "google.com" in providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="로그인 수단이 구글 하나뿐이므로 연동을 해제할 수 없습니다. 이메일/비밀번호를 먼저 등록하세요."
        )

    if "google.com" in providers:
        providers.remove("google.com")
        user_ref.update({
            "providers": providers,
            "updated_at": firestore.SERVER_TIMESTAMP
        })

    return {"success": True, "message": "구글 계정 연동이 해제되었습니다.", "providers": providers}
```

---

## 4. 예외 및 에러 코드 대응 가이드

| 상황 | 발생 지점 | 에러 식별자 | 대응 가이드 |
|---|---|---|---|
| **중복 이메일 가입** | `auth.create_user()` | `EmailAlreadyExistsError` | "이미 가입된 계정입니다. 구글 로그인 또는 비밀번호 찾기를 이용해주세요." 안내 노출 |
| **토큰 만료** | `auth.verify_id_token()` | `ExpiredIdTokenError` | 프론트엔드에 401 반환 후 Client SDK의 `getIdToken(true)`를 통한 리프레시 요청 유도 |
| **자격 증명 충돌** | 클라이언트 로그인 | `auth/account-exists-with-different-credential` | 클라이언트에서 기존 패스워드 검증 모달을 띄운 뒤 `linkWithCredential` 완료 후 백엔드에 동기화 호출 |
| **계정 고립 위험** | 마이페이지 연동 해제 | HTTP 400 Validation | 잔여 provider가 1개일 경우 UI 비활성화 및 에러 메시지 반환 |

---

## 5. 배포 및 보안 체크리스트

1. **서비스 계정 키 관리**:
   * `serviceAccountKey.json`은 절대 Git 저장소에 커밋하지 않으며, 환경 변수(`FIREBASE_CONFIG_JSON` 또는 `GOOGLE_APPLICATION_CREDENTIALS`)로 주입.
2. **Cloud Firestore 보안 규칙 (Security Rules)**:
   * 백엔드(Admin SDK)는 보안 규칙을 우회하므로, 클라이언트에서 직접 Firestore에 접근하는 경우 반드시 본인 `request.auth.uid == userId`만 허용하도록 규칙 적용.
3. **CORS 설정**:
   * FastAPI / Flask의 CORS 미들웨어에서 승인된 프론트엔드 도메인(Origin)만 접근을 허용하도록 제한.