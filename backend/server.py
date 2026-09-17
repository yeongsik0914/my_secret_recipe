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
        self.users = {
            "admin": {
                "id": "admin",
                "name": "총괄 관리자 (Chef Admin)",
                "email": "admin@kitchenchef.com",
                "role": "admin",
                "status": "active",
                "level": "마스터 셰프 Lv.4",
                "tier": "미슐랭 홈파티 장인",
                "avatar": "frontend/assets/images/icon.png",
                "cookCount": 12,
                "createdAt": "2026-09-01 10:00",
                "lastLogin": "2026-09-17 12:50",
                "sessionValid": True
            },
            "user_songpa22": {
                "id": "user_songpa22",
                "name": "22 songpa",
                "email": "songpa22@gmail.com",
                "role": "user",
                "status": "active",
                "level": "시니어 셰프 Lv.3",
                "tier": "냉파 마스터",
                "avatar": "frontend/assets/images/songpa22_avatar.png",
                "cookCount": 5,
                "createdAt": "2026-09-10 14:20",
                "lastLogin": "2026-09-17 11:35",
                "sessionValid": True
            },
            "user_yujin": {
                "id": "user_yujin",
                "name": "YUJIN H",
                "email": "yujinham12@gmail.com",
                "role": "user",
                "status": "active",
                "level": "주니어 셰프 Lv.2",
                "tier": "신선 재고 구출자",
                "avatar": "frontend/assets/images/yujin_avatar.png",
                "cookCount": 2,
                "createdAt": "2026-09-12 09:15",
                "lastLogin": "2026-09-17 12:40",
                "sessionValid": True
            },
            "user_sora": {
                "id": "user_sora",
                "name": "요리하는 소라",
                "email": "sora@kitchenchef.com",
                "role": "user",
                "status": "active",
                "level": "주니어 셰프 Lv.2",
                "tier": "신선 재고 구출자",
                "avatar": "frontend/assets/images/icon.png",
                "cookCount": 1,
                "createdAt": "2026-09-15 16:40",
                "lastLogin": "2026-09-17 08:20",
                "sessionValid": False
            },
            "user_spammer": {
                "id": "user_spammer",
                "name": "불량 셰프 (어그로)",
                "email": "spammer@baduser.com",
                "role": "user",
                "status": "suspended",
                "level": "초보 셰프 Lv.1",
                "tier": "주방의 호기심쟁이",
                "avatar": "frontend/assets/images/icon.png",
                "cookCount": 0,
                "createdAt": "2026-09-16 23:10",
                "lastLogin": "2026-09-17 01:05",
                "sessionValid": False
            }
        }

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

    def load_from_file(self):
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'users' in data and isinstance(data['users'], dict):
                        self.users.update(data['users'])
                    if 'fridges' in data and isinstance(data['fridges'], dict):
                        self.fridges.update(data['fridges'])
                    if 'audit_logs' in data and isinstance(data['audit_logs'], list):
                        self.audit_logs = data['audit_logs']
                    if 'vision_logs' in data and isinstance(data['vision_logs'], list):
                        self.vision_logs = data['vision_logs']
                    if 'community_posts' in data and isinstance(data['community_posts'], list):
                        self.community_posts = data['community_posts']
        except Exception as e:
            print(f"⚠️ [AdminDataStore] Error loading {self.data_file}: {e}")

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

        existing = existing or {}
        role = user_data.get('role') or existing.get('role', 'user')
        if email == 'admin@kitchenchef.com':
            role = 'admin'

        user = {
            "id": uid,
            "name": user_data.get('name') or user_data.get('displayName') or existing.get('name', '신규 셰프'),
            "email": email or existing.get('email', ''),
            "role": role,
            "status": user_data.get('status') or existing.get('status', 'active'),
            "level": user_data.get('level') or existing.get('level', '초보 셰프 Lv.1'),
            "tier": user_data.get('tier') or existing.get('tier', '주방의 호기심쟁이'),
            "avatar": user_data.get('avatar') or existing.get('avatar', 'frontend/assets/images/icon.png'),
            "cookCount": user_data.get('cookCount') if user_data.get('cookCount') is not None else existing.get('cookCount', 0),
            "createdAt": user_data.get('createdAt') or existing.get('createdAt', datetime.now().strftime('%Y-%m-%d %H:%M')),
            "lastLogin": user_data.get('lastLogin') or datetime.now().strftime('%Y-%m-%d %H:%M'),
            "sessionValid": True if user_data.get('sessionValid') is not False else False
        }
        self.users[uid] = user
        if uid not in self.fridges:
            self.fridges[uid] = [
                {"id": f"def_{int(time.time() * 1000)}_1", "name": "대파", "count": 2, "unit": "대", "shelf": "vege"},
                {"id": f"def_{int(time.time() * 1000)}_2", "name": "계란", "count": 6, "unit": "알", "shelf": "dairy"}
            ]
        self.save_to_file()
        return user

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
            "suspendedUsers": sum(1 for u in self.users.values() if u.get("status") == "suspended"),
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

    def update_user_status(self, user_id, new_status, admin_name):
        if user_id in self.users:
            old_status = self.users[user_id].get("status")
            self.users[user_id]["status"] = new_status
            if new_status == "suspended":
                self.users[user_id]["sessionValid"] = False
            self.audit_logs.insert(0, {
                "id": f"audit_{int(os.times().system * 1000)}",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "admin": admin_name,
                "category": "ACCOUNT",
                "action": f"계정 상태 변경 ({old_status} -> {new_status})",
                "target": f"{self.users[user_id]['name']} ({self.users[user_id]['email']})",
                "details": f"관리자에 의해 계정 상태가 '{new_status}'(으)로 조정되었습니다."
            })
            self.save_to_file()
            return {"status": "success", "user": self.users[user_id]}
        return {"status": "error", "message": "User not found"}

    def update_user_tier(self, user_id, new_level, cook_count, admin_name):
        if user_id in self.users:
            self.users[user_id]["level"] = new_level
            if cook_count is not None:
                self.users[user_id]["cookCount"] = int(cook_count)
            # Level to Tier mapping
            tier_map = {
                "초보 셰프 Lv.1": "주방의 호기심쟁이",
                "주니어 셰프 Lv.2": "신선 재고 구출자",
                "시니어 셰프 Lv.3": "냉파 마스터",
                "마스터 셰프 Lv.4": "미슐랭 홈파티 장인"
            }
            self.users[user_id]["tier"] = tier_map.get(new_level, "신선 재고 구출자")
            self.audit_logs.insert(0, {
                "id": f"audit_{int(os.times().system * 1000)}",
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "admin": admin_name,
                "category": "TIER",
                "action": f"회원 등급 및 조리 횟수 수동 조정",
                "target": f"{self.users[user_id]['name']}",
                "details": f"등급: {new_level} ({self.users[user_id]['tier']}), 누적 완식: {cook_count}회"
            })
            self.save_to_file()
            return {"status": "success", "user": self.users[user_id]}
        return {"status": "error", "message": "User not found"}

    def get_user_fridge(self, user_id):
        return self.fridges.get(user_id, [
            {"id": "def_1", "name": "대파", "count": 1, "unit": "대", "shelf": "vege"},
            {"id": "def_2", "name": "계란", "count": 4, "unit": "알", "shelf": "dairy"}
        ])

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

        # 10. REST API: 유저 냉장고 상태 조회
        if path.startswith('/api/admin/fridge/'):
            user_id = path.replace('/api/admin/fridge/', '')
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
            result = admin_store.update_user_status(user_id, new_status, admin_name)
            self.send_json_response(200, result)
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

        # 11. REST API: 구글 API 연동 사용자 Firebase 등록
        if path == '/api/auth/google/register':
            email = payload.get('email', '')
            name = payload.get('name', 'Google 셰프')
            uid = payload.get('uid', f"google_{email.split('@')[0] if email else 'user'}")
            is_signup = payload.get('isSignup', False)
            user_doc = {
                "id": uid,
                "uid": uid,
                "email": email,
                "name": name,
                "displayName": name,
                "providerId": "google.com",
                "authProvider": "google_api",
                "firebaseRegistered": True,
                "role": "user",
                "level": "초보 셰프 Lv.1" if is_signup else "조리 마스터 Lv.2",
                "status": "active"
            }
            registered_user = admin_store.register_user(user_doc)
            self.send_json_response(200, {"status": "success", "user": registered_user})
            return

        # 12. REST API: 신규 회원가입 & 유저 프로필 영속화 (단일)
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
