# backend/agents/search_agent.py
"""
Recipe Search & YouTube Discovery Agent (Python 백엔드 에이전트)
"""

from typing import List, Dict, Any
try:
    from domain.recipes_data import PYTHON_RECIPES_DATA
    from domain.models import Recipe
except ImportError:
    from ..domain.recipes_data import PYTHON_RECIPES_DATA
    from ..domain.models import Recipe

class SearchAgent:
    def __init__(self):
        self.name = "Recipe Search Agent"

    def search_candidates(self, selected_ingredients: List[str], theme: str = "all") -> List[Dict[str, Any]]:
        candidates = []

        for recipe in PYTHON_RECIPES_DATA:
            match_count = 0
            total_req = len(recipe.ingredients)

            for req in recipe.ingredients:
                if any(req.name in s or s in req.name for s in selected_ingredients):
                    match_count += 1

            match_rate = min(100, round((match_count / total_req) * 100)) if total_req > 0 else 0
            data = recipe.to_dict()
            data["calculatedMatchRate"] = match_rate
            data["matchedCount"] = match_count
            candidates.append(data)

        if theme and theme != "all":
            candidates = [c for c in candidates if c.get("theme") == theme or c.get("calculatedMatchRate", 0) >= 80]

        return candidates
