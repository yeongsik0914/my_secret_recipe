# run.py
"""
키친 셰프 (Kitchen Chef) 메인 실행 스크립트
최신 파이썬 src-layout 패키지(src/my_secret_recipe/server.py)를 구동합니다.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, 'src')

if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from my_secret_recipe.server import run_server
except ImportError:
    from backend.server import run_server

if __name__ == '__main__':
    print("=" * 60)
    print("🍳 [Kitchen Chef] 키친 셰프 멀티 에이전트 플랫폼 서버 시작")
    print(f"📁 프로젝트 루트: {BASE_DIR}")
    print("🌐 접속 주소: http://localhost:8080")
    print("=" * 60)
    run_server()
