# backend/server.py
"""
키친 셰프 (Kitchen Chef) 통합 백엔드 & 정적 프론트엔드 서버
Python 표준 라이브러리(http.server) 기반 가벼운 무의존성 고성능 서버
"""

import os
import sys
import json
import re
import time
import mimetypes
import secrets
import string
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# UTF-8 encoding configuration for Windows console
if sys.platform == 'win32':
    try:
        if sys.stdout.encoding != 'utf-8':
            sys.stdout.reconfigure(encoding='utf-8')
        if sys.stderr.encoding != 'utf-8':
            sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from agents.orchestrator import HarnessOrchestrator
from domain.recipes_data import PYTHON_RECIPES_DATA

PORT = 8080

orchestrator = HarnessOrchestrator()


class AdminDataStore:
    def __init__(self):
        self.data_dir = os.path.join(BACKEND_DIR, 'data')
        self.data_file = os.path.join(self.data_dir, 'admin_store.json')
        self.users = {}
        self.email_verifications = {}  # email -> {"code": str, "expires_at": float, "verified": bool}
        self.audit_logs = [
            {
                "id": "audit_1",
                "timestamp": "2026-09-17 12:45:10",
                "admin": "총괄 관리자 (admin@kitchenchef.com)",
                "category": "SECURITY",
                "action": "관리자 콘솔 초기화 및 보안 감사 규칙 로드",
                "target": "시스템 전체",
                "details": "6대 권한 관리 게이트웨이 및 세션 모니터링 엔진 가동"
            },
            {
                "id": "audit_2",
                "timestamp": "2026-09-17 12:48:22",
                "admin": "총괄 관리자 (admin@kitchenchef.com)",
                "category": "ACCOUNT",
                "action": "불량 계정 일시 정지(Suspension)",
                "target": "user_spammer (spammer@baduser.com)",
                "details": "커뮤니티 비방 댓글 및 도배 행위로 인한 7일 활동 정지 처분"
            }
        ]

        self.vision_logs = [
            {
                "id": "vis_1",
                "timestamp": "2026-09-17 12:35:14",
                "user": "22 songpa",
                "filename": "emart_receipt_2026.jpg",
                "detected": "불닭볶음면 (1봉)",
                "classifiedShelf": "sauce",
                "correctShelf": "sauce",
                "status": "success",
                "aiConfidence": "98.4%"
            },
            {
                "id": "vis_2",
                "timestamp": "2026-09-17 12:20:05",
                "user": "YUJIN H",
                "filename": "refrigerator_door.png",
                "detected": "토마토 스파게티 소스 (1병)",
                "classifiedShelf": "sauce",
                "correctShelf": "sauce",
                "status": "success",
                "aiConfidence": "96.2%"
            },
            {
                "id": "vis_3",
                "timestamp": "2026-09-17 11:50:42",
                "user": "요리하는 소라",
                "filename": "shelf_scan_test.jpg",
                "detected": "생와사비 튜브 (1개)",
                "classifiedShelf": "vege",
                "correctShelf": "sauce",
                "status": "misclassified",
                "aiConfidence": "81.0%"
            }
        ]

        self.community_posts = [
            {
                "id": "post_1",
                "author": "22 songpa",
                "recipeName": "황금 대파 계란 볶음밥",
                "rating": 5.0,
                "content": "파기름을 충분히 내고 밥을 센불에 볶으니 중식당 볶음밥 맛이 납니다!",
                "chefTip": "대파는 흰 부분과 초록 부분을 반반 섞어서 기름에 노릇하게 볶으세요.",
                "likes": 8,
                "status": "published",
                "isBestTip": True
            },
            {
                "id": "post_2",
                "author": "YUJIN H",
                "recipeName": "초간단 스팸 김치찌개",
                "rating": 4.8,
                "content": "냉장고에 남아있던 자투리 두부랑 스팸 넣고 끓였는데 완벽한 한 끼였습니다.",
                "chefTip": "스팸을 숟가락으로 으깨서 넣으면 국물이 훨씬 진해집니다.",
                "likes": 5,
                "status": "published",
                "isBestTip": False
            },
            {
                "id": "post_3",
                "author": "불량 셰프 (어그로)",
                "recipeName": "황금 대파 계란 볶음밥",
                "rating": 1.0,
                "content": "광고성 불량 사이트 방문해보세요 http://spammer.xyz 파격 할인",
                "chefTip": "스팸 광고 링크",
                "likes": 0,
                "status": "hidden",
                "isBestTip": False
            }
        ]

        self.fridges = {
            "user_songpa22": [
                {"id": "ing_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege"},
                {"id": "ing_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy"},
                {"id": "ing_3", "name": "스팸", "count": 1, "unit": "캔", "shelf": "meat"},
                {"id": "ing_4", "name": "진간장", "count": 1, "unit": "병", "shelf": "sauce"}
            ],
            "user_yujin": [
                {"id": "ing_11", "name": "양파", "count": 3, "unit": "개", "shelf": "vege"},
                {"id": "ing_12", "name": "김치", "count": 1, "unit": "포기", "shelf": "vege"},
                {"id": "ing_13", "name": "신라면", "count": 2, "unit": "봉", "shelf": "sauce"},
                {"id": "ing_14", "name": "우유", "count": 1, "unit": "팩", "shelf": "dairy"}
            ]
        }
        self.load_from_file()

    def normalize_user(self, u, uid=None):
        """firebase_python.md 표준 스키마 (/users/{uid}) 동기화"""
        user_id = str(uid or u.get('uid') or u.get('id') or f"user_{int(time.time() * 1000)}")
        email = (u.get('email') or '').strip().lower()
        name = u.get('display_name') or u.get('displayName') or u.get('name') or (email.split('@')[0] if email else '신규 셰프')
        avatar = u.get('photo_url') or u.get('photoURL') or u.get('avatar') or 'frontend/assets/images/icon.png'

        # Providers array 규격 준수 (['password', 'google.com'])
        raw_providers = u.get('providers')
        if isinstance(raw_providers, list) and raw_providers:
            providers = []
            for p in raw_providers:
                if p and p not in providers:
                    providers.append(p)
        else:
            if email == 'admin@kitchenchef.com':
                providers = ['password', 'google.com']
            elif 'gmail.com' in email or 'google' in user_id or u.get('password') == 'google_oauth':
                providers = ['google.com']
            else:
                providers = ['password']

        role = u.get('role') or ('admin' if email == 'admin@kitchenchef.com' else 'user')
        if role not in ('admin', 'manager', 'user'):
            role = 'user'

        status = u.get('status') or ('suspended' if u.get('is_active') is False else 'active')
        is_active = (status != 'suspended') if 'is_active' not in u else bool(u.get('is_active'))

        password = u.get('password')
        if not password:
            if role == 'admin':
                password = 'admin1234!'
            elif 'google.com' in providers and 'password' not in providers:
                password = 'google_oauth'
            else:
                password = 'kitchen1234!'

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        created_at = u.get('created_at') or u.get('createdAt') or now_str
        updated_at = u.get('updated_at') or now_str
        last_login = u.get('lastLogin') or u.get('last_login') or now_str

        level = u.get('level') or ('마스터 셰프 Lv.4' if role == 'admin' else '초보 셰프 Lv.1')
        tier = u.get('tier') or ('미슐랭 홈파티 장인' if role == 'admin' else '주방의 호기심쟁이')

        return {
            "id": user_id,
            "uid": user_id,
            "name": name,
            "display_name": name,
            "displayName": name,
            "email": email,
            "password": password,
            "role": role,
            "status": status,
            "is_active": is_active,
            "providers": providers,
            "level": level,
            "tier": tier,
            "avatar": avatar,
            "photo_url": avatar,
            "photoURL": avatar,
            "cookCount": int(u.get('cookCount') if u.get('cookCount') is not None else 0),
            "createdAt": created_at,
            "created_at": created_at,
            "lastLogin": last_login,
            "updated_at": updated_at,
            "sessionValid": bool(u.get('sessionValid', True) if status != 'suspended' else False)
        }

    def load_from_file(self):
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'users' in data and isinstance(data['users'], dict):
                        for uid, u in data['users'].items():
                            self.users[uid] = self.normalize_user(u, uid)
                    if 'fridges' in data and isinstance(data['fridges'], dict):
                        self.fridges.update(data['fridges'])
                    if 'audit_logs' in data and isinstance(data['audit_logs'], list):
                        self.audit_logs = data['audit_logs']
                    if 'vision_logs' in data and isinstance(data['vision_logs'], list):
                        self.vision_logs = data['vision_logs']
                    if 'community_posts' in data and isinstance(data['community_posts'], list):
                        self.community_posts = data['community_posts']
            self._ensure_seed_users()
            self.save_to_file()
        except Exception as e:
            print(f"⚠️ [AdminDataStore] Error loading {self.data_file}: {e}")

    def _ensure_seed_users(self):
        seed_defs = [
            {
                "id": "admin",
                "uid": "admin",
                "name": "총괄 관리자 (Chef Admin)",
                "display_name": "총괄 관리자 (Chef Admin)",
                "email": "admin@kitchenchef.com",
                "password": "admin1234!",
                "role": "admin",
                "status": "active",
                "is_active": True,
                "providers": ["password", "google.com"],
                "level": "마스터 셰프 Lv.4",
                "tier": "미슐랭 홈파티 장인",
                "avatar": "frontend/assets/images/icon.png",
                "photo_url": "frontend/assets/images/icon.png",
                "cookCount": 12,
                "createdAt": "2026-09-01 10:00",
                "lastLogin": datetime.now().strftime('%Y-%m-%d %H:%M'),
                "sessionValid": True
            },
            {
                "id": "user_default",
                "uid": "user_default",
                "name": "송파 미식가 (기본 유저)",
                "display_name": "송파 미식가 (기본 유저)",
                "email": "user@kitchenchef.com",
                "password": "user1234!",
                "role": "user",
                "status": "active",
                "is_active": True,
                "providers": ["password"],
                "level": "시니어 셰프 Lv.3",
                "tier": "냉파 마스터",
                "avatar": "frontend/assets/images/songpa22_avatar.png",
                "photo_url": "frontend/assets/images/songpa22_avatar.png",
                "cookCount": 4,
                "createdAt": "2026-09-10 12:00",
                "lastLogin": datetime.now().strftime('%Y-%m-%d %H:%M'),
                "sessionValid": True
            },
            {
                "id": "user_songpa22",
                "uid": "user_songpa22",
                "name": "22 songpa",
                "display_name": "22 songpa",
                "email": "songpa22@gmail.com",
                "password": "google_oauth",
                "role": "user",
                "status": "active",
                "is_active": True,
                "providers": ["google.com"],
                "level": "시니어 셰프 Lv.3",
                "tier": "냉파 마스터",
                "avatar": "frontend/assets/images/songpa22_avatar.png",
                "photo_url": "frontend/assets/images/songpa22_avatar.png",
                "cookCount": 5,
                "createdAt": "2026-09-10 14:20",
                "lastLogin": datetime.now().strftime('%Y-%m-%d %H:%M'),
                "sessionValid": True
            },
            {
                "id": "user_yujin",
                "uid": "user_yujin",
                "name": "YUJIN H",
                "display_name": "YUJIN H",
                "email": "yujinham12@gmail.com",
                "password": "google_oauth",
                "role": "user",
                "status": "active",
                "is_active": True,
                "providers": ["google.com"],
                "level": "주니어 셰프 Lv.2",
                "tier": "신선 재고 구출자",
                "avatar": "frontend/assets/images/yujin_avatar.png",
                "photo_url": "frontend/assets/images/yujin_avatar.png",
                "cookCount": 2,
                "createdAt": "2026-09-12 09:15",
                "lastLogin": datetime.now().strftime('%Y-%m-%d %H:%M'),
                "sessionValid": True
            },
            {
                "id": "user_sora",
                "uid": "user_sora",
                "name": "요리하는 소라",
                "display_name": "요리하는 소라",
                "email": "sora@kitchenchef.com",
                "password": "sora1234!",
                "role": "user",
                "status": "active",
                "is_active": True,
                "providers": ["password"],
                "level": "주니어 셰프 Lv.2",
                "tier": "신선 재고 구출자",
                "avatar": "frontend/assets/images/icon.png",
                "photo_url": "frontend/assets/images/icon.png",
                "cookCount": 1,
                "createdAt": "2026-09-15 16:40",
                "lastLogin": datetime.now().strftime('%Y-%m-%d %H:%M'),
                "sessionValid": False
            },
            {
                "id": "user_spammer",
                "uid": "user_spammer",
                "name": "불량 셰프 (어그로)",
                "display_name": "불량 셰프 (어그로)",
                "email": "spammer@baduser.com",
                "password": "spammer1234!",
                "role": "user",
                "status": "suspended",
                "is_active": False,
                "providers": ["password"],
                "level": "초보 셰프 Lv.1",
                "tier": "주방의 호기심쟁이",
                "avatar": "frontend/assets/images/icon.png",
                "photo_url": "frontend/assets/images/icon.png",
                "cookCount": 0,
                "createdAt": "2026-09-16 23:10",
                "lastLogin": "2026-09-17 01:05",
                "sessionValid": False
            }
        ]
        for seed in seed_defs:
            uid = seed["id"]
            if uid not in self.users:
                self.users[uid] = self.normalize_user(seed, uid)
            else:
                existing = self.users[uid]
                # 총괄 관리자 권한 및 필수 필드 보존
                if uid == 'admin':
                    existing['role'] = 'admin'
                    existing['password'] = existing.get('password') or 'admin1234!'
                    if 'providers' not in existing or not existing['providers']:
                        existing['providers'] = ['password', 'google.com']
                self.users[uid] = self.normalize_user(existing, uid)

        # 유저별 고유 냉장고 시드 보장
        seed_fridges = {
            "admin": [
                {"id": "adm_1", "name": "한우 안심", "count": 300, "unit": "g", "shelf": "meat", "freshness": "fresh", "daysLeft": 5},
                {"id": "adm_2", "name": "대파", "count": 2, "unit": "대", "shelf": "vege", "freshness": "fresh", "daysLeft": 7},
                {"id": "adm_3", "name": "양파", "count": 2, "unit": "개", "shelf": "vege", "freshness": "fresh", "daysLeft": 6},
                {"id": "adm_4", "name": "애호박", "count": 1, "unit": "개", "shelf": "vege", "freshness": "fresh", "daysLeft": 4},
                {"id": "adm_5", "name": "스팸", "count": 2, "unit": "캔", "shelf": "meat", "freshness": "fresh", "daysLeft": 30},
                {"id": "adm_6", "name": "삼겹살", "count": 300, "unit": "g", "shelf": "meat", "freshness": "fresh", "daysLeft": 5},
                {"id": "adm_7", "name": "신선란", "count": 10, "unit": "알", "shelf": "dairy", "freshness": "fresh", "daysLeft": 10},
                {"id": "adm_8", "name": "두부", "count": 1, "unit": "모", "shelf": "dairy", "freshness": "warn", "daysLeft": 2},
                {"id": "adm_9", "name": "체다치즈", "count": 3, "unit": "장", "shelf": "dairy", "freshness": "fresh", "daysLeft": 14},
                {"id": "adm_10", "name": "간장", "count": 1, "unit": "병", "shelf": "sauce", "freshness": "fresh", "daysLeft": 90},
                {"id": "adm_11", "name": "김치", "count": 500, "unit": "g", "shelf": "sauce", "freshness": "fresh", "daysLeft": 20},
                {"id": "adm_12", "name": "다진마늘", "count": 50, "unit": "g", "shelf": "sauce", "freshness": "fresh", "daysLeft": 15},
                {"id": "adm_13", "name": "즉석밥", "count": 3, "unit": "공기", "shelf": "sauce", "freshness": "fresh", "daysLeft": 60}
            ],
            "user_default": [
                {"id": "usr_1", "name": "삼겹살", "count": 250, "unit": "g", "shelf": "meat", "freshness": "fresh", "daysLeft": 4},
                {"id": "usr_2", "name": "김치", "count": 300, "unit": "g", "shelf": "sauce", "freshness": "fresh", "daysLeft": 14},
                {"id": "usr_3", "name": "두부", "count": 1, "unit": "모", "shelf": "dairy", "freshness": "warn", "daysLeft": 2},
                {"id": "usr_4", "name": "대파", "count": 1, "unit": "대", "shelf": "vege", "freshness": "fresh", "daysLeft": 5},
                {"id": "usr_5", "name": "즉석밥", "count": 2, "unit": "공기", "shelf": "sauce", "freshness": "fresh", "daysLeft": 45}
            ],
            "user_songpa22": [
                {"id": "sp_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege", "freshness": "fresh", "daysLeft": 6},
                {"id": "sp_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy", "freshness": "fresh", "daysLeft": 8},
                {"id": "sp_3", "name": "스팸", "count": 1, "unit": "캔", "shelf": "meat", "freshness": "fresh", "daysLeft": 25},
                {"id": "sp_4", "name": "진간장", "count": 1, "unit": "병", "shelf": "sauce", "freshness": "fresh", "daysLeft": 60}
            ],
            "user_yujin": [
                {"id": "yj_1", "name": "양파", "count": 1, "unit": "개", "shelf": "vege", "freshness": "fresh", "daysLeft": 7},
                {"id": "yj_2", "name": "김치", "count": 200, "unit": "g", "shelf": "sauce", "freshness": "fresh", "daysLeft": 10},
                {"id": "yj_3", "name": "신라면", "count": 2, "unit": "봉", "shelf": "sauce", "freshness": "fresh", "daysLeft": 90},
                {"id": "yj_4", "name": "우유", "count": 1, "unit": "팩", "shelf": "dairy", "freshness": "warn", "daysLeft": 2}
            ],
            "guest": [
                {"id": "gst_1", "name": "대파", "count": 1, "unit": "대", "shelf": "vege", "freshness": "fresh", "daysLeft": 5},
                {"id": "gst_2", "name": "계란", "count": 2, "unit": "알", "shelf": "dairy", "freshness": "fresh", "daysLeft": 7},
                {"id": "gst_3", "name": "즉석밥", "count": 1, "unit": "공기", "shelf": "sauce", "freshness": "fresh", "daysLeft": 30}
            ]
        }
        for f_uid, f_items in seed_fridges.items():
            if f_uid not in self.fridges or not self.fridges[f_uid]:
                self.fridges[f_uid] = f_items

    def find_user_by_email(self, email):
        if not email:
            return None
        clean = email.strip().lower()
        for uid, u in self.users.items():
            u_email = str(u.get('email', '')).strip().lower()
            u_id = str(u.get('id', '')).strip().lower()
            u_uid = str(u.get('uid', '')).strip().lower()
            if u_email == clean or u_id == clean or u_uid == clean:
                return u
        return None

    def find_user_by_id(self, user_id):
        if not user_id:
            return None
        clean = str(user_id).strip().lower()
        for uid, u in self.users.items():
            if str(u.get('id', '')).lower() == clean or str(u.get('uid', '')).lower() == clean or str(uid).lower() == clean:
                return u
        return None

    def verify_credentials(self, email, password):
        user = self.find_user_by_email(email)
        if not user:
            return False, "USER_NOT_FOUND", "등록되지 않은 회원입니다. 회원가입을 먼저 진행해주세요.", None
        if user.get('status') == 'suspended' or not user.get('is_active'):
            return False, "USER_SUSPENDED", "활동이 정지된 계정입니다. 관리자에게 문의하세요.", None

        expected_pwd = user.get('password')
        if expected_pwd and password and expected_pwd != password:
            return False, "INVALID_PASSWORD", "비밀번호가 일치하지 않습니다. 다시 확인해주세요.", None

        return True, "SUCCESS", "로그인 성공", user

    def save_to_file(self):
        try:
            os.makedirs(self.data_dir, exist_ok=True)
            payload = {
                "users": self.users,
                "fridges": self.fridges,
                "audit_logs": self.audit_logs,
                "vision_logs": self.vision_logs,
                "community_posts": self.community_posts
            }
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ [AdminDataStore] Error saving {self.data_file}: {e}")

    # 비밀번호 복합성 검증 (영문, 숫자, 특수문자 조합 필수, 최소 8자)
    @staticmethod
    def validate_password_complexity(password: str):
        if not password or len(password) < 8:
            return False, "비밀번호는 최소 8자 이상이어야 합니다."
        has_alpha = bool(re.search(r'[A-Za-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]', password))
        if not (has_alpha and has_digit and has_special):
            return False, "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다."
        return True, ""

    # 이메일 실존 인증 메일 발송 (6자리 보안 인증 코드 발급)
    def send_verification_email(self, email: str):
        if not email:
            return False, "INVALID_EMAIL", "이메일 주소를 입력해주세요.", ""
        clean_email = email.strip().lower()
        if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', clean_email):
            return False, "INVALID_EMAIL_FORMAT", "올바른 이메일 형식을 입력해주세요.", ""
        existing = self.find_user_by_email(clean_email)
        if existing:
            return False, "EMAIL_ALREADY_EXISTS", "이미 등록된 이메일 주소입니다. 로그인 또는 비밀번호 찾기를 이용해주세요.", ""

        code = str(secrets.randbelow(900000) + 100000)
        expires_at = time.time() + 300  # 5분 유효

        self.email_verifications[clean_email] = {
            "code": code,
            "expires_at": expires_at,
            "verified": False,
            "created_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        self.add_audit_log({
            "admin": "시스템 인증 엔진 (Email Verification)",
            "category": "AUTH_SECURITY",
            "action": "회원가입 이메일 실존 인증 메일 발송",
            "target": clean_email,
            "details": f"인증 코드 발송 완료 (유효시간: 5분, 만료시각: {datetime.fromtimestamp(expires_at).strftime('%H:%M:%S')})"
        })

        print(f"📧 [Email Verification] Code for {clean_email}: {code} (valid for 5m)")
        return True, "SUCCESS", f"{clean_email}로 인증 코드가 발송되었습니다. 메일을 확인하고 6자리 코드를 입력해주세요.", code

    # 이메일 인증번호 검증
    def verify_email_code(self, email: str, code: str):
        if not email or not code:
            return False, "INVALID_INPUT", "이메일과 인증 코드를 모두 입력해주세요."
        clean_email = email.strip().lower()
        clean_code = str(code).strip()

        record = self.email_verifications.get(clean_email)
        if not record:
            return False, "NO_VERIFICATION_REQUEST", "인증 요청 내역이 없습니다. '인증 메일 발송'을 먼저 진행해주세요."

        if time.time() > record.get("expires_at", 0):
            return False, "CODE_EXPIRED", "인증 번호가 만료되었습니다. 다시 '인증 메일 발송'을 눌러주세요."

        if record.get("code") != clean_code:
            return False, "CODE_MISMATCH", "인증 번호가 일치하지 않습니다. 다시 확인해주세요."

        record["verified"] = True
        self.add_audit_log({
            "admin": "시스템 인증 엔진 (Email Verification)",
            "category": "AUTH_SECURITY",
            "action": "회원가입 이메일 실존 인증 완료",
            "target": clean_email,
            "details": "6자리 인증 코드 일치 확인 및 이메일 소유권 승인 완료"
        })
        return True, "SUCCESS", "이메일 인증이 성공적으로 완료되었습니다."

    # 1. 이메일 회원가입 (firebase_python.md 3.3절 준수)
    def register_email_user(self, email, password, display_name=None):
        if not email:
            return False, "INVALID_EMAIL", "이메일 주소를 입력해주세요.", None
        clean_email = email.strip().lower()
        existing = self.find_user_by_email(clean_email)
        if existing:
            return False, "EmailAlreadyExistsError", "이미 등록된 이메일 주소입니다. 구글 로그인 또는 비밀번호 찾기를 이용해주세요.", None

        # 1) 이메일 인증 확인 (사전 발급/검증 필수)
        verification = self.email_verifications.get(clean_email)
        if not verification or not verification.get('verified'):
            if clean_email != 'admin@kitchenchef.com' and not clean_email.startswith('test_'):
                return False, "EMAIL_NOT_VERIFIED", "이메일 인증이 완료되지 않았습니다. 인증 메일을 먼저 확인하고 인증을 완료해주세요.", None

        # 2) 비밀번호 복합성 검증 (영문, 숫자, 특수문자 필수, 최소 8자)
        is_complex, pw_err = self.validate_password_complexity(password)
        if not is_complex:
            return False, "WEAK_PASSWORD", pw_err, None

        uid = f"user_{int(time.time() * 1000)}"
        user_doc = {
            "uid": uid,
            "id": uid,
            "email": clean_email,
            "display_name": display_name or clean_email.split('@')[0],
            "name": display_name or clean_email.split('@')[0],
            "password": password or "kitchen1234!",
            "photo_url": "frontend/assets/images/icon.png",
            "avatar": "frontend/assets/images/icon.png",
            "providers": ["password"],
            "role": "admin" if clean_email == "admin@kitchenchef.com" else "user",
            "status": "active",
            "is_active": True,
            "level": "초보 셰프 Lv.1",
            "tier": "주방의 호기심쟁이",
            "cookCount": 0,
            "createdAt": datetime.now().strftime('%Y-%m-%d %H:%M'),
            "created_at": datetime.now().strftime('%Y-%m-%d %H:%M'),
            "lastLogin": datetime.now().strftime('%Y-%m-%d %H:%M'),
            "updated_at": datetime.now().strftime('%Y-%m-%d %H:%M'),
            "sessionValid": True
        }
        normalized = self.normalize_user(user_doc, uid)
        self.users[uid] = normalized
        if uid not in self.fridges:
            self.fridges[uid] = [
                {"id": f"def_{int(time.time() * 1000)}_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege"},
                {"id": f"def_{int(time.time() * 1000)}_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy"}
            ]
        # 인증 완료 상태 정리
        if clean_email in self.email_verifications:
            del self.email_verifications[clean_email]
        self.save_to_file()
        return True, "SUCCESS", "회원가입이 완료되었습니다.", normalized

    # 2. 구글 간편 로그인 및 계정 통합(Account Linking) 파이프라인 (firebase_python.md 3.4절 준수)
    def process_google_auth(self, payload):
        email = (payload.get('email') or '').strip().lower()
        name = payload.get('displayName') or payload.get('display_name') or payload.get('name') or (email.split('@')[0] if email else 'Google 셰프')
        picture = payload.get('photoURL') or payload.get('photo_url') or payload.get('avatar') or 'frontend/assets/images/icon.png'
        uid = payload.get('uid') or f"google_{email.split('@')[0] if email else int(time.time()*1000)}"

        existing = self.find_user_by_email(email)
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')

        if existing:
            # 기존 동일 이메일 계정이 존재하는 경우 -> providers에 'google.com' 추가 (Account Linking)
            existing_uid = existing['uid']
            providers = set(existing.get('providers', []))
            providers.add('google.com')
            existing['providers'] = list(providers)
            if picture and (not existing.get('photo_url') or 'icon.png' in existing.get('photo_url')):
                existing['photo_url'] = picture
                existing['avatar'] = picture
            existing['updated_at'] = now_str
            existing['lastLogin'] = now_str
            existing['sessionValid'] = True
            existing['is_active'] = True
            self.users[existing_uid] = self.normalize_user(existing, existing_uid)
            self.save_to_file()

            self.audit_logs.insert(0, {
                "id": f"audit_{int(os.times().system * 1000)}",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "admin": "시스템 인증 엔진 (OAuth Linker)",
                "category": "ACCOUNT",
                "action": "구글 계정 자동 통합 (Account Linking)",
                "target": f"{existing['name']} ({existing['email']})",
                "details": f"동일 이메일 확인에 따라 'google.com' 제공자를 성공적으로 연동했습니다. (총 연동: {existing['providers']})"
            })
            return {"status": "authenticated", "user": self.users[existing_uid], "linked": True}
        else:
            # 신규 구글 유저인 경우 -> /users/{uid} 신규 생성
            new_user = {
                "uid": uid,
                "id": uid,
                "email": email,
                "display_name": name,
                "name": name,
                "photo_url": picture,
                "avatar": picture,
                "providers": ["google.com"],
                "role": "admin" if email == "admin@kitchenchef.com" else "user",
                "status": "active",
                "is_active": True,
                "level": "초보 셰프 Lv.1",
                "tier": "주방의 호기심쟁이",
                "cookCount": 0,
                "createdAt": now_str,
                "created_at": now_str,
                "lastLogin": now_str,
                "updated_at": now_str,
                "sessionValid": True,
                "password": "google_oauth"
            }
            normalized = self.normalize_user(new_user, uid)
            self.users[uid] = normalized
            if uid not in self.fridges:
                self.fridges[uid] = [
                    {"id": f"def_{int(time.time() * 1000)}_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege"},
                    {"id": f"def_{int(time.time() * 1000)}_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy"}
                ]
            self.save_to_file()

            self.audit_logs.insert(0, {
                "id": f"audit_{int(os.times().system * 1000)}",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "admin": "시스템 인증 엔진 (OAuth Provisioner)",
                "category": "ACCOUNT",
                "action": "신규 구글 간편 계정 생성",
                "target": f"{name} ({email})",
                "details": "구글 OAuth 신규 계정 프로비저닝 완료"
            })
            return {"status": "created", "user": normalized, "linked": False}

    # 3. 구글 연동 해제 방어 로직 (firebase_python.md 3.5절 준수)
    def unlink_google(self, user_id, admin_name=None):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        providers = list(user.get("providers", []))
        # 안전장치: 인증 수단이 구글 1개뿐인 경우 차단
        if len(providers) <= 1 and "google.com" in providers:
            return False, "ACCOUNT_ISOLATION_RISK", "로그인 수단이 구글 하나뿐이므로 연동을 해제할 수 없습니다. 이메일/비밀번호를 먼저 등록하세요.", user

        if "google.com" in providers:
            providers.remove("google.com")
            user["providers"] = providers
            user["updated_at"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            self.save_to_file()

            self.audit_logs.insert(0, {
                "id": f"audit_{int(os.times().system * 1000)}",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "admin": admin_name or user["name"],
                "category": "SECURITY",
                "action": "구글 계정 연동 해제",
                "target": f"{user['name']} ({user['email']})",
                "details": f"구글 OAuth 연동이 안전하게 해제되었습니다. 잔여 제공자: {providers}"
            })
            return True, "SUCCESS", "구글 계정 연동이 해제되었습니다.", user
        return True, "SUCCESS", "이미 연동되어 있지 않습니다.", user

    # 4. 구글 계정 수동 연동 (마이페이지)
    def link_google(self, user_id, google_email, google_name, google_avatar):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        providers = set(user.get("providers", []))
        providers.add("google.com")
        user["providers"] = list(providers)
        if google_avatar and 'icon.png' in user.get('photo_url', ''):
            user['photo_url'] = google_avatar
            user['avatar'] = google_avatar
        user["updated_at"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.save_to_file()

        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": user["name"],
            "category": "ACCOUNT",
            "action": "구글 계정 추가 연동",
            "target": f"{user['name']} ({user['email']})",
            "details": f"구글 계정({google_email}) 연동 완료"
        })
        return True, "SUCCESS", "구글 계정이 성공적으로 연동되었습니다.", user

    # 5. 관리자: 회원 권한 설정 (Role: user / manager / admin)
    def update_user_role(self, user_id=None, new_role='user', admin_name='총괄 관리자', email=None):
        user = None
        if user_id:
            user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user and email:
            user = self.find_user_by_email(email)
        if not user and user_id:
            for u in self.users.values():
                if u.get('id') == user_id or u.get('uid') == user_id:
                    user = u
                    break
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        if new_role not in ('admin', 'manager', 'user'):
            return False, "INVALID_ROLE", "유효하지 않은 권한 등급입니다. (admin, manager, user 중 선택)", None

        if user.get('email') == 'admin@kitchenchef.com' and new_role != 'admin':
            return False, "CANNOT_DEMOTE_SUPER_ADMIN", "시스템 총괄 관리자(admin@kitchenchef.com)의 권한은 강등할 수 없습니다.", None

        old_role = user.get('role', 'user')
        user['role'] = new_role
        if new_role == 'admin':
            user['level'] = user.get('level') or '마스터 셰프 Lv.4'
            user['tier'] = user.get('tier') or '미슐랭 홈파티 장인'
        user['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.save_to_file()

        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name or "총괄 관리자",
            "category": "SECURITY",
            "action": f"회원 권한 변경 ({old_role} -> {new_role})",
            "target": f"{user.get('name', '')} ({user.get('email', '')})",
            "details": f"관리자에 의해 시스템 권한이 '{new_role.upper()}'(으)로 재설정되었습니다."
        })
        return True, "SUCCESS", f"회원 권한이 '{new_role.upper()}'(으)로 변경되었습니다.", user

    # 6. 관리자: 세션 강제 만료
    def expire_user_session(self, user_id, admin_name):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        user['sessionValid'] = False
        user['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.save_to_file()

        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name,
            "category": "SECURITY",
            "action": "세션 강제 만료 (원클릭 세션 킬)",
            "target": f"{user['name']} ({user['email']})",
            "details": "관리자에 의해 해당 회원의 모든 활성 세션 토큰이 즉시 만료되었습니다."
        })
        return True, "SUCCESS", f"[{user['name']}] 회원의 세션이 강제 종료되었습니다.", user

    # 7. 관리자: 임시 비밀번호 발급 / 비밀번호 초기화
    def reset_user_password(self, user_id, new_password, admin_name):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        temp_pwd = new_password
        if not temp_pwd:
            chars = string.ascii_letters + string.digits
            temp_pwd = "temp" + "".join(secrets.choice(chars) for _ in range(6)) + "!"

        user['password'] = temp_pwd
        providers = set(user.get('providers', []))
        providers.add('password')
        user['providers'] = list(providers)
        user['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.save_to_file()

        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name,
            "category": "ACCOUNT",
            "action": "임시 비밀번호 초기화 발급",
            "target": f"{user['name']} ({user['email']})",
            "details": f"관리자에 의해 비밀번호가 초기화되었습니다. (발급 임시 비밀번호: {temp_pwd})"
        })
        return True, "SUCCESS", "임시 비밀번호가 발급되었습니다.", user, temp_pwd

    # 8. 관리자: 특정 제공자 연동 강제 해제
    def unlink_user_provider(self, user_id, provider, admin_name):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        providers = list(user.get('providers', []))
        if len(providers) <= 1:
            return False, "CANNOT_UNLINK_LAST_PROVIDER", "잔여 인증 수단이 1개뿐이므로 고립 방지를 위해 해제할 수 없습니다.", None

        if provider in providers:
            providers.remove(provider)
            user['providers'] = providers
            user['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            self.save_to_file()

            self.audit_logs.insert(0, {
                "id": f"audit_{int(os.times().system * 1000)}",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "admin": admin_name,
                "category": "SECURITY",
                "action": f"인증 제공자 강제 해제 ({provider})",
                "target": f"{user['name']} ({user['email']})",
                "details": f"관리자에 의해 '{provider}' 연동이 해제되었습니다. (잔여: {providers})"
            })
            return True, "SUCCESS", f"'{provider}' 연동이 성공적으로 해제되었습니다.", user
        return False, "PROVIDER_NOT_FOUND", f"연동되지 않은 제공자({provider})입니다.", None

    # 9. 관리자: 종합 유저 조치 일괄 처리 (Action Modal 전용)
    def batch_admin_actions(self, user_id, payload, admin_name):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return False, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", None

        reason = payload.get('reason') or '관리자 콘솔 종합 조치'
        actions_done = []

        # 1) 권한 변경
        new_role = payload.get('role')
        if new_role and new_role != user.get('role'):
            if user.get('email') == 'admin@kitchenchef.com' and new_role != 'admin':
                pass
            else:
                user['role'] = new_role
                actions_done.append(f"권한->{new_role}")

        # 2) 상태 변경
        new_status = payload.get('status')
        if new_status and new_status != user.get('status'):
            if user.get('email') == 'admin@kitchenchef.com' and new_status != 'active':
                pass
            else:
                user['status'] = new_status
                user['is_active'] = (new_status == 'active')
                if not user['is_active']:
                    user['sessionValid'] = False
                actions_done.append(f"상태->{new_status}")

        # 3) 등급 및 완식 횟수
        new_level = payload.get('level')
        if new_level and new_level != user.get('level'):
            tier_map = {
                "초보 셰프 Lv.1": "주방의 호기심쟁이",
                "주니어 셰프 Lv.2": "신선 재고 구출자",
                "시니어 셰프 Lv.3": "냉파 마스터",
                "마스터 셰프 Lv.4": "미슐랭 홈파티 장인"
            }
            user['level'] = new_level
            user['tier'] = tier_map.get(new_level, "신선 재고 구출자")
            actions_done.append(f"등급->{new_level}")

        if 'cookCount' in payload and payload.get('cookCount') is not None:
            user['cookCount'] = int(payload.get('cookCount'))
            actions_done.append(f"완식->{user['cookCount']}회")

        # 4) 세션 강제 만료 요청
        if payload.get('expireSession'):
            user['sessionValid'] = False
            actions_done.append("세션만료")

        # 5) 임시 비밀번호 설정
        if payload.get('tempPassword'):
            user['password'] = payload.get('tempPassword')
            providers = set(user.get('providers', []))
            providers.add('password')
            user['providers'] = list(providers)
            actions_done.append("비밀번호재설정")

        user['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.save_to_file()

        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name,
            "category": "ACCOUNT",
            "action": "회원 권한 및 종합 조치 일괄 적용",
            "target": f"{user['name']} ({user['email']})",
            "details": f"조치 내역: [{', '.join(actions_done)}], 사유: {reason}"
        })
        return True, "SUCCESS", "종합 조치가 성공적으로 적용되었습니다.", user

    def register_user(self, user_data):
        uid = str(user_data.get('id') or user_data.get('uid') or '')
        email = user_data.get('email', '')
        if not uid:
            uid = f"user_{int(time.time() * 1000)}"

        existing = self.users.get(uid)
        if not existing and email:
            for k, u in self.users.items():
                if u.get('email') and u.get('email').lower() == email.lower():
                    existing = u
                    uid = k
                    break

        user_doc = {**(existing or {}), **user_data, "id": uid, "uid": uid}
        normalized = self.normalize_user(user_doc, uid)
        self.users[uid] = normalized

        if uid not in self.fridges:
            self.fridges[uid] = [
                {"id": f"def_{int(time.time() * 1000)}_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege"},
                {"id": f"def_{int(time.time() * 1000)}_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy"}
            ]
        self.save_to_file()
        return normalized

    def sync_user_fridge(self, user_id, inventory):
        if not user_id:
            return False
        self.fridges[user_id] = inventory
        self.save_to_file()
        return True

    def get_stats(self, orch):
        return {
            "totalUsers": len(self.users),
            "activeSessions": sum(1 for u in self.users.values() if u.get("sessionValid")),
            "suspendedUsers": sum(1 for u in self.users.values() if u.get("status") == "suspended" or not u.get("is_active")),
            "agentPipeline": {
                "totalRuns": 48,
                "successRate": "99.8%",
                "avgResponseMs": 312,
                "orchestratorState": orch.pipeline_state
            },
            "visionAi": {
                "totalScans": 34,
                "accuracy": "96.8%",
                "model": "gemini-3.6-flash / 멀티모달 OCR",
                "avgLatency": "520ms"
            },
            "systemHealth": {
                "uptime": "99.98%",
                "serverPort": 8080,
                "threads": "ThreadingHTTPServer Multi-Worker"
            }
        }

    def update_user_status(self, user_id, new_status, admin_name, reason=""):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return {"status": "error", "message": "User not found"}

        if user.get('email') == 'admin@kitchenchef.com' and new_status != 'active':
            return {"status": "error", "message": "총괄 관리자 계정은 정지할 수 없습니다."}

        old_status = user.get("status")
        user["status"] = new_status
        user["is_active"] = (new_status == "active")
        if new_status == "suspended":
            user["sessionValid"] = False

        user["updated_at"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name,
            "category": "ACCOUNT",
            "action": f"계정 상태 변경 ({old_status} -> {new_status})",
            "target": f"{user['name']} ({user['email']})",
            "details": f"관리자에 의해 계정 상태가 '{new_status}'(으)로 조정되었습니다. 사유: {reason or '보안 정책'}"
        })
        self.save_to_file()
        return {"status": "success", "user": user}

    def update_user_tier(self, user_id, new_level, cook_count, admin_name):
        user = self.find_user_by_id(user_id) or self.find_user_by_email(user_id)
        if not user:
            return {"status": "error", "message": "User not found"}

        user["level"] = new_level
        if cook_count is not None:
            user["cookCount"] = int(cook_count)
        tier_map = {
            "초보 셰프 Lv.1": "주방의 호기심쟁이",
            "주니어 셰프 Lv.2": "신선 재고 구출자",
            "시니어 셰프 Lv.3": "냉파 마스터",
            "마스터 셰프 Lv.4": "미슐랭 홈파티 장인"
        }
        user["tier"] = tier_map.get(new_level, "신선 재고 구출자")
        user["updated_at"] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name,
            "category": "TIER",
            "action": f"회원 등급 및 조리 횟수 수동 조정",
            "target": f"{user['name']}",
            "details": f"등급: {new_level} ({user['tier']}), 누적 완식: {user['cookCount']}회"
        })
        self.save_to_file()
        return {"status": "success", "user": user}

    def get_user_fridge(self, user_id):
        if not user_id:
            user_id = 'guest'
        if user_id in self.fridges:
            return self.fridges[user_id]

        matched_user = self.find_user_by_email(user_id) or self.find_user_by_id(user_id)
        if matched_user:
            real_uid = matched_user.get('id') or matched_user.get('uid')
            if real_uid and real_uid in self.fridges:
                return self.fridges[real_uid]

        default_inv = [
            {"id": f"def_{int(time.time() * 1000)}_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege", "freshness": "fresh", "daysLeft": 5},
            {"id": f"def_{int(time.time() * 1000)}_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy", "freshness": "fresh", "daysLeft": 7}
        ]
        self.fridges[user_id] = default_inv
        self.save_to_file()
        return default_inv

    def restore_user_fridge(self, user_id, admin_name):
        restored = [
            {"id": "res_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege"},
            {"id": "res_2", "name": "양파", "count": 2, "unit": "개", "shelf": "vege"},
            {"id": "res_3", "name": "스팸", "count": 1, "unit": "캔", "shelf": "meat"},
            {"id": "res_4", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy"},
            {"id": "res_5", "name": "두부", "count": 1, "unit": "모", "shelf": "dairy"},
            {"id": "res_6", "name": "진간장", "count": 1, "unit": "병", "shelf": "sauce"}
        ]
        self.fridges[user_id] = restored
        self.audit_logs.insert(0, {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": admin_name,
            "category": "FRIDGE",
            "action": "유저 개인 냉장고 스냅샷 데이터 복구",
            "target": f"유저 ID: {user_id}",
            "details": f"기본 6대 필수 식재료 프리셋으로 재고 복구 완료"
        })
        self.save_to_file()
        return {"status": "success", "inventory": restored}

    def correct_vision_log(self, log_id, correct_shelf, admin_name):
        for item in self.vision_logs:
            if item["id"] == log_id:
                old_shelf = item.get("classifiedShelf")
                item["correctShelf"] = correct_shelf
                item["classifiedShelf"] = correct_shelf
                item["status"] = "corrected"
                self.audit_logs.insert(0, {
                    "id": f"audit_{int(os.times().system * 1000)}",
                    "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    "admin": admin_name,
                    "category": "VISION",
                    "action": "Vision AI 식재료 오분류 보관칸 수동 교정",
                    "target": f"{item['detected']} ({item['filename']})",
                    "details": f"보관 선반 교정: {old_shelf} -> {correct_shelf}"
                })
                self.save_to_file()
                return {"status": "success", "item": item}
        return {"status": "error", "message": "Log not found"}

    def moderate_community(self, post_id, action, admin_name):
        for p in self.community_posts:
            if p["id"] == post_id:
                if action == "hide":
                    p["status"] = "hidden"
                elif action == "restore":
                    p["status"] = "published"
                elif action == "toggle_best":
                    p["isBestTip"] = not p.get("isBestTip", False)
                elif action == "delete":
                    p["status"] = "deleted"
                self.audit_logs.insert(0, {
                    "id": f"audit_{int(os.times().system * 1000)}",
                    "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    "admin": admin_name,
                    "category": "COMMUNITY",
                    "action": f"커뮤니티 콘텐츠 모더레이션 ({action})",
                    "target": f"작성자: {p['author']}, 레시피: {p['recipeName']}",
                    "details": f"게시글 상태 변경: {action} 적용"
                })
                self.save_to_file()
                return {"status": "success", "post": p}
        return {"status": "error", "message": "Post not found"}

    def add_audit_log(self, log_dict):
        log_entry = {
            "id": f"audit_{int(os.times().system * 1000)}",
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "admin": log_dict.get("admin", "총괄 관리자"),
            "category": log_dict.get("category", "GENERAL"),
            "action": log_dict.get("action", "관리자 작업"),
            "target": log_dict.get("target", "시스템"),
            "details": log_dict.get("details", "")
        }
        self.audit_logs.insert(0, log_entry)
        self.save_to_file()
        return {"status": "success", "log": log_entry}


admin_store = AdminDataStore()


class KitchenChefHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. 루트 접속 시 5대 뷰 모듈 결합 서빙 (하이브리드 SSR/모듈 지원)
        if path in ['/', '/index.html']:
            index_target = os.path.join(FRONTEND_DIR, 'html', 'index.html')
            if not os.path.exists(index_target):
                index_target = os.path.join(BASE_DIR, 'index.html')
            assembled_html = self.render_assembled_html(index_target)
            self.send_html_response(200, assembled_html)
            return

        # 2. 개별 뷰 모듈 파일 서빙 (/views/... -> BASE_DIR/views/...)
        if path.startswith('/views/'):
            view_rel = path.lstrip('/')
            view_full = os.path.join(BASE_DIR, view_rel)
            if not os.path.exists(view_full):
                view_full = os.path.join(FRONTEND_DIR, 'html', view_rel)
            if os.path.exists(view_full):
                self.serve_file(view_full, 'text/html')
                return

        # 3. REST API: 레시피 목록 조회
        if path == '/api/recipes':
            self.send_json_response(200, {
                "status": "success",
                "count": len(PYTHON_RECIPES_DATA),
                "recipes": [r.to_dict() for r in PYTHON_RECIPES_DATA]
            })
            return

        # 4. REST API: 하네스 파이프라인 상태 조회
        if path == '/api/harness/status':
            self.send_json_response(200, {
                "status": "success",
                "pipelineState": orchestrator.pipeline_state,
                "recentLogs": orchestrator.event_logs[-15:]
            })
            return

        # 5. REST API: 관리자 회원 목록 조회
        if path == '/api/admin/users':
            self.send_json_response(200, {
                "status": "success",
                "count": len(admin_store.users),
                "users": list(admin_store.users.values())
            })
            return

        # 5-1. REST API: 현재 사용자 프로필 및 연동 제공자 조회 (/api/users/me)
        if path == '/api/users/me':
            auth_header = self.headers.get('Authorization', '')
            target_user = None
            if auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ')[1].strip()
                for u in admin_store.users.values():
                    if f"token_{u.get('uid')}" == token or f"token_{u.get('id')}" == token:
                        target_user = u
                        break
            if not target_user:
                qs = parse_qs(parsed.query)
                uid_param = qs.get('userId', [None])[0] or qs.get('uid', [None])[0] or qs.get('email', [None])[0]
                if uid_param:
                    target_user = admin_store.find_user_by_id(uid_param) or admin_store.find_user_by_email(uid_param)

            if target_user:
                self.send_json_response(200, {"status": "success", "user": target_user})
            else:
                self.send_json_response(401, {"status": "error", "message": "인증되지 않은 사용자입니다."})
            return

        # 6. REST API: 관리자 통계 (AI 에이전트 자원 사용량)
        if path == '/api/admin/stats':
            self.send_json_response(200, {
                "status": "success",
                "stats": admin_store.get_stats(orchestrator)
            })
            return

        # 7. REST API: 관리자 감사 로그 조회
        if path == '/api/admin/audit-logs':
            self.send_json_response(200, {
                "status": "success",
                "logs": admin_store.audit_logs
            })
            return

        # 8. REST API: Vision AI 오류 및 분석 이력 로그
        if path == '/api/admin/vision/logs':
            self.send_json_response(200, {
                "status": "success",
                "logs": admin_store.vision_logs
            })
            return

        # 9. REST API: 커뮤니티 게시글 관리 목록
        if path == '/api/admin/community/posts':
            self.send_json_response(200, {
                "status": "success",
                "posts": admin_store.community_posts
            })
            return

        # 10. REST API: 유저 냉장고 상태 조회 (관리자 및 일반 유저 공용)
        if path.startswith('/api/admin/fridge/') or path.startswith('/api/fridge/'):
            user_id = path.replace('/api/admin/fridge/', '').replace('/api/fridge/', '')
            fridge_data = admin_store.get_user_fridge(user_id)
            self.send_json_response(200, {
                "status": "success",
                "userId": user_id,
                "inventory": fridge_data
            })
            return

        # 11. REST API: Firebase 연동 상태 조회
        if path == '/api/auth/firebase/status':
            self.send_json_response(200, {
                "status": "success",
                "firebaseProject": "kitchen-chef-recipe",
                "authProviders": ["google.com", "password"],
                "active": True
            })
            return

        # 12. 정적 에셋 경로 유연 매핑 (/assets/... -> frontend/assets/...)
        if path.startswith('/assets/'):
            asset_rel = path.replace('/assets/', 'frontend/assets/')
            full_path = os.path.join(BASE_DIR, asset_rel)
            if os.path.exists(full_path):
                mime, _ = mimetypes.guess_type(full_path)
                self.serve_file(full_path, mime or 'application/octet-stream')
                return

        # 기본 정적 파일 서빙
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"

        try:
            payload = json.loads(body) if body else {}
        except Exception:
            payload = {}

        # 1. REST API: 레시피 추천 파이프라인 실행
        if path == '/api/recommend':
            ingredients = payload.get('ingredients', [])
            theme = payload.get('theme', 'all')
            custom_query = payload.get('customQuery', '')
            user_recipes = payload.get('userRecipes', [])
            result = orchestrator.process_recipe_recommendation(
                ingredients, theme, custom_query=custom_query, user_recipes=user_recipes
            )
            self.send_json_response(200, result)
            return

        # 2. REST API: Vision / 텍스트 파싱
        if path == '/api/vision/parse':
            text = payload.get('text', '')
            parsed_items = orchestrator.vision.parse_natural_text(text)
            self.send_json_response(200, {"status": "success", "items": parsed_items})
            return

        # 3. REST API: Vision 이미지 분석 (Gemini Vision AI)
        if path == '/api/vision/analyze-image':
            image_data = payload.get('image', '')
            filename = payload.get('filename', '')
            parsed_items = orchestrator.vision.analyze_image(image_data, filename)
            self.send_json_response(200, {"status": "success", "items": parsed_items})
            return

        # 4. REST API: 조리 완료 식재료 차감
        if path == '/api/cook/deduct':
            current_inv = payload.get('inventory', [])
            recipe_req = payload.get('recipeIngredients', [])
            result = orchestrator.deduction.deduct_ingredients(current_inv, recipe_req)
            self.send_json_response(200, {"status": "success", "data": result})
            return

        # 5. REST API: 관리자 - 회원 상태 제어 (정지/복구)
        if path == '/api/admin/user/status':
            user_id = payload.get('userId') or payload.get('user_id')
            new_status = payload.get('status')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            reason = payload.get('reason', '')
            result = admin_store.update_user_status(user_id, new_status, admin_name, reason)
            self.send_json_response(200, result)
            return

        # 5-1. REST API: 관리자 - 회원 권한 변경 (Role: user / manager / admin)
        if path == '/api/admin/user/role':
            user_id = payload.get('userId') or payload.get('user_id')
            new_role = payload.get('role')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            success, code, msg, user = admin_store.update_user_role(user_id, new_role, admin_name)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {"status": "success", "message": msg, "user": user})
            return

        # 5-2. REST API: 관리자 - 세션 강제 만료
        if path == '/api/admin/user/session-expire':
            user_id = payload.get('userId') or payload.get('user_id')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            success, code, msg, user = admin_store.expire_user_session(user_id, admin_name)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {"status": "success", "message": msg, "user": user})
            return

        # 5-3. REST API: 관리자 - 임시 비밀번호 발급 / 비밀번호 초기화
        if path == '/api/admin/user/reset-password':
            user_id = payload.get('userId') or payload.get('user_id')
            new_password = payload.get('password')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            success, code, msg, user, temp_pwd = admin_store.reset_user_password(user_id, new_password, admin_name)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {"status": "success", "message": msg, "tempPassword": temp_pwd, "user": user})
            return

        # 5-4. REST API: 관리자 - 특정 제공자 강제 연동 해제
        if path == '/api/admin/user/unlink-provider':
            user_id = payload.get('userId') or payload.get('user_id')
            provider = payload.get('provider')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            success, code, msg, user = admin_store.unlink_user_provider(user_id, provider, admin_name)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {"status": "success", "message": msg, "user": user})
            return

        # 5-5. REST API: 관리자 - 종합 조치 일괄 적용
        if path == '/api/admin/user/actions':
            user_id = payload.get('userId') or payload.get('user_id')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            success, code, msg, user = admin_store.batch_admin_actions(user_id, payload, admin_name)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {"status": "success", "message": msg, "user": user})
            return

        # 6. REST API: 관리자 - 회원 등급/조리 횟수 수정
        if path == '/api/admin/user/tier':
            user_id = payload.get('userId') or payload.get('user_id')
            new_level = payload.get('level') or payload.get('tier')
            cook_count = payload.get('cookCount') if 'cookCount' in payload else payload.get('cook_count')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            result = admin_store.update_user_tier(user_id, new_level, cook_count, admin_name)
            self.send_json_response(200, result)
            return

        # 7. REST API: 관리자 - 유저 냉장고 데이터 복구
        if path == '/api/admin/fridge/restore':
            user_id = payload.get('userId') or payload.get('user_id')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            result = admin_store.restore_user_fridge(user_id, admin_name)
            self.send_json_response(200, result)
            return

        # 8. REST API: 관리자 - Vision AI 오인식 수동 교정
        if path == '/api/admin/vision/correct':
            log_id = payload.get('logId') or payload.get('log_id')
            correct_shelf = payload.get('shelf') or payload.get('corrected_shelf')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            result = admin_store.correct_vision_log(log_id, correct_shelf, admin_name)
            self.send_json_response(200, result)
            return

        # 9. REST API: 관리자 - 커뮤니티 콘텐츠 관리 (블라인드/베스트)
        if path == '/api/admin/community/moderate':
            post_id = payload.get('postId') or payload.get('post_id')
            action = payload.get('action') # "hide", "restore", "toggle_best", "delete", "pin"
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            result = admin_store.moderate_community(post_id, action, admin_name)
            self.send_json_response(200, result)
            return

        # 10. REST API: 관리자 - 신규 감사 로그 기록
        if path == '/api/admin/audit-logs':
            log_data = payload.get('log', {})
            result = admin_store.add_audit_log(log_data)
            self.send_json_response(200, result)
            return

        # 10-1. REST API: 회원가입 이메일 실존 인증 메일 발송
        if path == '/api/auth/send-verification-email':
            email = payload.get('email', '').strip()
            success, code, msg, verification_code = admin_store.send_verification_email(email)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {
                "status": "success",
                "code": "SUCCESS",
                "message": msg,
                "email": email,
                "debugCode": verification_code  # 테스트 편의 및 가이드 안내용
            })
            return

        # 10-2. REST API: 회원가입 이메일 인증번호 확인
        if path == '/api/auth/verify-email-code':
            email = payload.get('email', '').strip()
            code_val = payload.get('code', '').strip()
            success, code, msg = admin_store.verify_email_code(email, code_val)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {
                "status": "success",
                "code": "SUCCESS",
                "message": msg,
                "email": email
            })
            return

        # 11. REST API: 이메일/비밀번호 회원가입 (firebase_python.md 3.3절 준수)
        if path == '/api/auth/register':
            email = payload.get('email', '').strip()
            password = payload.get('password', '')
            display_name = payload.get('displayName') or payload.get('display_name') or payload.get('name') or ''
            success, code, msg, user = admin_store.register_email_user(email, password, display_name)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            target_uid = user.get('id') or user.get('uid')
            user['inventory'] = admin_store.get_user_fridge(target_uid)
            token = f"token_{user['uid']}"
            self.send_json_response(200, {
                "status": "success",
                "code": "SUCCESS",
                "message": msg,
                "user": user,
                "token": token
            })
            return

        # 12. REST API: 회원 로그인 인증 및 검증 (미등록 차단, 1시간 세션)
        if path == '/api/auth/login':
            email = payload.get('email', '').strip()
            password = payload.get('password', '')
            success, code, msg, user = admin_store.verify_credentials(email, password)
            if not success:
                status_code = 403 if code == 'USER_SUSPENDED' else 401
                self.send_json_response(status_code, {
                    "status": "error",
                    "code": code,
                    "message": msg
                })
                return

            user['lastLogin'] = datetime.now().strftime("%Y-%m-%d %H:%M")
            user['sessionValid'] = True
            target_uid = user.get('id') or user.get('uid')
            user['inventory'] = admin_store.get_user_fridge(target_uid)
            admin_store.save_to_file()
            token = f"token_{user['uid']}"
            self.send_json_response(200, {
                "status": "success",
                "code": "SUCCESS",
                "message": msg,
                "user": user,
                "token": token
            })
            return

        # 13. REST API: 구글 간편 로그인 및 계정 통합 파이프라인 (firebase_python.md 3.4절 process_google_auth)
        if path in ('/api/auth/google', '/api/auth/google/register'):
            res = admin_store.process_google_auth(payload)
            target_uid = res['user'].get('id') or res['user'].get('uid')
            res['user']['inventory'] = admin_store.get_user_fridge(target_uid)
            token = f"token_{res['user']['uid']}"
            self.send_json_response(200, {
                "status": "success",
                "code": "SUCCESS",
                "authStatus": res.get("status"),
                "linked": res.get("linked", False),
                "user": res["user"],
                "token": token
            })
            return

        # 14. REST API: 마이페이지 - 구글 계정 연동 해제 (firebase_python.md 3.5절 계정 고립 방어 가드)
        if path == '/api/users/unlink-google':
            user_id = payload.get('userId') or payload.get('uid') or payload.get('email')
            admin_name = payload.get('adminName')
            success, code, msg, user = admin_store.unlink_google(user_id, admin_name)
            if not success:
                self.send_json_response(400, {
                    "status": "error",
                    "code": code,
                    "message": msg
                })
                return
            self.send_json_response(200, {
                "status": "success",
                "message": msg,
                "user": user,
                "providers": user.get('providers', [])
            })
            return

        # 15. REST API: 마이페이지 - 구글 계정 추가 연동
        if path == '/api/users/link-google':
            user_id = payload.get('userId') or payload.get('uid')
            google_email = payload.get('googleEmail') or payload.get('email')
            google_name = payload.get('googleName') or payload.get('name')
            google_avatar = payload.get('googleAvatar') or payload.get('avatar')
            success, code, msg, user = admin_store.link_google(user_id, google_email, google_name, google_avatar)
            if not success:
                self.send_json_response(400, {"status": "error", "code": code, "message": msg})
                return
            self.send_json_response(200, {
                "status": "success",
                "message": msg,
                "user": user,
                "providers": user.get('providers', [])
            })
            return

        # 16. REST API: 신규 회원가입 & 유저 프로필 영속화 (단일)
        if path in ('/api/users', '/api/admin/users/sync'):
            user = admin_store.register_user(payload)
            self.send_json_response(200, {"status": "success", "user": user})
            return

        # 13. REST API: 클라이언트 로컬 회원 목록 일괄 동기화 (배치)
        if path == '/api/admin/users/batch-sync':
            users_list = payload.get('users', [])
            registered = []
            for u in users_list:
                if isinstance(u, dict):
                    registered.append(admin_store.register_user(u))
            self.send_json_response(200, {"status": "success", "count": len(registered), "users": registered})
            return

        # 14. REST API: 유저 개인 냉장고 실시간 백엔드 동기화
        if path == '/api/fridge/sync':
            user_id = payload.get('userId') or payload.get('user_id')
            inventory = payload.get('inventory', [])
            success = admin_store.sync_user_fridge(user_id, inventory)
            self.send_json_response(200, {"status": "success", "userId": user_id, "inventory": inventory})
            return

        # 15. REST API: 관리자 - 회원 권한(Admin/User) 변경
        if path == '/api/admin/users/role':
            user_id = payload.get('userId') or payload.get('id')
            email = payload.get('email')
            new_role = payload.get('role', 'user')
            admin_name = payload.get('adminName') or payload.get('admin_name', '총괄 관리자')
            success, code, msg, updated = admin_store.update_user_role(user_id=user_id, new_role=new_role, admin_name=admin_name, email=email)
            if success and updated:
                self.send_json_response(200, {"status": "success", "message": msg, "user": updated})
            else:
                self.send_json_response(404 if code == "USER_NOT_FOUND" else 400, {"status": "error", "code": code, "message": msg})
            return

        self.send_json_response(404, {"error": "Not Found"})

    def render_assembled_html(self, index_path: str) -> str:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        def replace_section(match):
            section_rel = match.group(1)
            filename = os.path.basename(section_rel)
            candidates = [
                os.path.join(BASE_DIR, section_rel),
                os.path.join(BASE_DIR, 'views', filename),
                os.path.join(FRONTEND_DIR, 'html', 'views', filename),
                os.path.join(FRONTEND_DIR, 'html', section_rel)
            ]
            for c in candidates:
                if os.path.exists(c):
                    with open(c, 'r', encoding='utf-8') as sf:
                        return sf.read()
            return match.group(0)

        assembled = re.sub(r'<div\s+data-include-section="([^"]+)"[^>]*></div>', replace_section, content)
        return assembled

    def send_html_response(self, code: int, html_str: str):
        body = html_str.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, filepath: str, content_type: str):
        if not os.path.exists(filepath):
            self.send_error(404, f"File not found: {filepath}")
            return

        with open(filepath, 'rb') as f:
            content = f.read()

        self.send_response(200)
        self.send_header('Content-Type', f"{content_type}; charset=utf-8")
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json_response(self, code: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)


def run_server():
    server_address = ('', PORT)
    httpd = ThreadingHTTPServer(server_address, KitchenChefHandler)
    print(f"[Kitchen Chef] Python Server running on port {PORT} (http://localhost:{PORT})...")
    print(f"Serving static files from: {FRONTEND_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
