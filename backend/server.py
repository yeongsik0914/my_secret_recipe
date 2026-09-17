# backend/server.py
"""
키친 셰프 (Kitchen Chef) 통합 백엔드 & 정적 프론트엔드 서버
Python 표준 라이브러리(http.server) 기반 가벼운 무의존성 고성능 서버
"""

import os
import sys
import json
import re
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
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

        # 5. 정적 에셋 경로 유연 매핑 (/assets/... -> frontend/assets/...)
        if path.startswith('/assets/'):
            asset_rel = path.replace('/assets/', 'frontend/assets/')
            full_path = os.path.join(BASE_DIR, asset_rel)
            if os.path.exists(full_path):
                mime, _ = mimetypes.guess_type(full_path)
                self.serve_file(full_path, mime or 'application/octet-stream')
                return

        # 6. 기본 정적 파일 서빙
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
    httpd = HTTPServer(server_address, KitchenChefHandler)
    print(f"[Kitchen Chef] Python Server running on port {PORT} (http://localhost:{PORT})...")
    print(f"Serving static files from: {FRONTEND_DIR}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
