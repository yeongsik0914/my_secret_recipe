# src/my_secret_recipe/__init__.py
"""
키친 셰프 (Kitchen Chef) 멀티 에이전트 하네스 패키지
모던 파이썬 src-layout 표준 패키지 모듈
"""

__version__ = "1.8.0"

from my_secret_recipe.server import main, run_server

__all__ = ["main", "run_server", "__version__"]
