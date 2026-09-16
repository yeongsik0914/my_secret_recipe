# backend/server.py
"""
키친 셰프 (Kitchen Chef) 통합 백엔드 & 정적 프론트엔드 서버
Python 표준 라이브러리(http.server) 기반 가벼운 무의존성 고성능 서버
"""

import os
import sys
import json
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

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
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

orchestrator = HarnessOrchestrator()

class KitchenChefHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. 루트 접속 시 frontend/html/index.html 서빙
        if path in ['/', '/index.html']:
            self.serve_file(os.path.join(FRONTEND_DIR, 'html', 'index.html'), 'text/html')
            return

        # 2. REST API: 레시피 목록 조회
        if path == '/api/recipes':
            self.send_json_response(200, {
                "status": "success",
                "count": len(PYTHON_RECIPES_DATA),
                "recipes": [r.to_dict() for r in PYTHON_RECIPES_DATA]
            })
            return

        # 3. REST API: 하네스 파이프라인 상태 조회
        if path == '/api/harness/status':
            self.send_json_response(200, {
                "status": "success",
                "pipelineState": orchestrator.pipeline_state,
                "recentLogs": orchestrator.event_logs[-15:]
            })
            return

        # 4. 정적 에셋 경로 유연 매핑 (/assets/... -> frontend/assets/...)
        if path.startswith('/assets/'):
            asset_rel = path.replace('/assets/', 'frontend/assets/')
            full_path = os.path.join(BASE_DIR, asset_rel)
            if os.path.exists(full_path):
                mime, _ = mimetypes.guess_type(full_path)
                self.serve_file(full_path, mime or 'application/octet-stream')
                return

        # 5. 기본 정적 파일 서빙
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

        # 3. REST API: 조리 완료 식재료 차감
        if path == '/api/cook/deduct':
            current_inv = payload.get('inventory', [])
            recipe_req = payload.get('recipeIngredients', [])
            result = orchestrator.deduction.deduct_ingredients(current_inv, recipe_req)
            self.send_json_response(200, {"status": "success", "data": result})
            return

        self.send_json_response(404, {"error": "Not Found"})

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
    httpd = HTTPServer(server_address, KitchenChefHandler)
    print(f"✨ [Kitchen Chef] Python Server running on port {PORT}...")
    print(f"📁 Serving static files from: {FRONTEND_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
