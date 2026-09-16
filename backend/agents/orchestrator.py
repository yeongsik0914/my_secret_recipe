# backend/agents/orchestrator.py
"""
Harness Core Orchestrator (Python 멀티 에이전트 파이프라인 관리자)
"""

from typing import List, Dict, Any
from .vision_agent import VisionAgent
from .search_agent import SearchAgent
from .quality_agent import QualityGateAgent
from .deduction_agent import DeductionAgent

class HarnessOrchestrator:
    def __init__(self):
        self.vision = VisionAgent()
        self.search = SearchAgent()
        self.quality = QualityGateAgent()
        self.deduction = DeductionAgent()
        self.pipeline_state = "IDLE"
        self.event_logs = []

    def log(self, source: str, title: str, detail: str = ""):
        entry = {
            "source": source,
            "title": title,
            "detail": detail
        }
        self.event_logs.append(entry)
        if len(self.event_logs) > 100:
            self.event_logs.pop(0)

    def process_recipe_recommendation(self, selected_ingredients: List[str], theme: str = "all") -> Dict[str, Any]:
        """추천 레시피 탐색 -> 품질 검증 파이프라인 일괄 실행"""
        self.pipeline_state = "SEARCHING"
        self.log("HARNESS", "레시피 추천 파이프라인 가동", f"재료: {selected_ingredients}")

        candidates = self.search.search_candidates(selected_ingredients, theme)
        self.log("SEARCH", f"후보 레시피 {len(candidates)}건 발굴")

        self.pipeline_state = "VERIFYING"
        verified = self.quality.verify_recipes(candidates)
        self.log("QUALITY_GATE", f"표준 검증 통과 {len(verified)}건 완료")

        self.pipeline_state = "READY"
        return {
            "state": self.pipeline_state,
            "count": len(verified),
            "recipes": verified,
            "logs": self.event_logs[-10:]
        }
