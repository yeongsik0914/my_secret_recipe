# backend/config.py
"""
키친 셰프 백엔드 환경 설정
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
PORT = int(os.environ.get('PORT', 8080))
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
