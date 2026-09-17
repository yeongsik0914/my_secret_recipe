# backend/agents/search_agent.py
"""
Recipe Search & YouTube Discovery Agent (Python 백엔드 에이전트)
외부 유튜브 데이터 + 사용자 공유 레시피 종합 수집 및 메뉴/조리방식 검색 지원
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

    def search_candidates(self, selected_ingredients: List[str], theme: str = "all", custom_query: str = "", user_recipes: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        user_recipes = user_recipes or []
        combined_recipes = [r.to_dict() for r in PYTHON_RECIPES_DATA] + user_recipes
        candidates = []
        clean_query = custom_query.strip().lower()

        for item in combined_recipes:
            req_list = item.get("ingredients", [])
            total_req = len(req_list)
            match_count = 0

            for req in req_list:
                name = req.get("name", "")
                if any(name in s or s in name for s in selected_ingredients):
                    match_count += 1
                    req["match"] = True
                else:
                    req["match"] = False

            base_match = min(100, round((match_count / total_req) * 100)) if total_req > 0 else 0
            
            # 메뉴 / 조리방식 키워드 가중치
            bonus = 0
            if clean_query:
                if clean_query in item.get("title", "").lower():
                    bonus += 15
                elif clean_query in item.get("description", "").lower() or clean_query in item.get("subTitle", "").lower():
                    bonus += 10

            final_match = min(100, base_match + bonus)
            item["calculatedMatchRate"] = final_match
            item["matchedCount"] = match_count
            candidates.append(item)

        if clean_query:
            direct_matches = [c for c in candidates if clean_query in c.get("title", "").lower() or clean_query in c.get("description", "").lower() or clean_query in c.get("subTitle", "").lower()]
            if direct_matches:
                for m in direct_matches:
                    m["isCustomSearchMatch"] = True
                    m["calculatedMatchRate"] = 100
                candidates = direct_matches
            else:
                # 합성 레시피
                primary = selected_ingredients[:4] if selected_ingredients else ["기본재료"]
                title = clean_query if any(k in clean_query for k in ["요리", "구이", "찌개", "볶음", "밥", "전"]) else f"{clean_query} 특선 요리"
                synth = {
                    "id": f"custom_ai_{clean_query}",
                    "craftNo": "AI CHEF SPECIAL",
                    "title": title,
                    "subTitle": f"AI 셰프 맞춤 프롬프트 레시피 • {clean_query}",
                    "description": f"사용자 맞춤 프롬프트 '{clean_query}'을(를) 반영하여 냉장고 재료({', '.join(primary)})로 완성하는 특별 레시피입니다.",
                    "theme": theme if theme != "all" else "quick_15min",
                    "rating": 5.0,
                    "reviewCount": 88,
                    "timeMinutes": 15,
                    "difficulty": "난이도 하",
                    "calorie": 460,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "ingredients": [{"name": p, "need": 1, "unit": "개", "match": True, "shelf": "vege"} for p in primary],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "재료 손질", "desc": f"{', '.join(primary)}을(를) 먹기 좋게 손질합니다.", "time": "3분"},
                        {"step": 2, "title": "예열 및 베이스 조리", "desc": "팬에 기름을 두르고 풍미를 냅니다.", "time": "4분"},
                        {"step": 3, "title": f"{clean_query} 조리", "desc": f"{clean_query}의 깊은 맛을 냅니다.", "time": "5분"},
                        {"step": 4, "title": "완성", "desc": "도마 위에 담아 따뜻할 때 맛있게 즐깁니다.", "time": "3분"}
                    ]
                }
                candidates = [synth] + candidates
        elif theme and theme != "all":
            theme_matches = [c for c in candidates if c.get("theme") == theme]
            others = [c for c in candidates if c.get("theme") != theme]
            candidates = theme_matches + others
        else:
            candidates.sort(key=lambda x: x.get("calculatedMatchRate", 0), reverse=True)

        return candidates
