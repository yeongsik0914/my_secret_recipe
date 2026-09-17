# run.py
"""
키친 셰프 (Kitchen Chef) 메인 실행 스크립트
통합 백엔드 REST API 및 프론트엔드 정적 서빙 서버(backend/server.py)를 구동합니다.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.server import run_server

if __name__ == '__main__':
    print("=" * 60)
    print("🍳 [Kitchen Chef] 키친 셰프 멀티 에이전트 플랫폼 서버 시작")
    print(f"📁 작업 디렉터리: {BASE_DIR}")
    print("🌐 접속 주소: http://localhost:8080")
    print("=" * 60)
    run_server()
