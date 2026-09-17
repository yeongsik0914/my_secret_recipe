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
                yt = self.resolve_matching_youtube(title, primary, theme)
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
                    "youtube": yt,
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

        for c in candidates:
            if not c.get("youtube") or not c["youtube"].get("embedId"):
                c["youtube"] = self.resolve_matching_youtube(c.get("title", ""), [i.get("name", "") for i in c.get("ingredients", [])], c.get("theme", ""))

        return candidates

    def resolve_matching_youtube(self, title: str, ingredients: List[str], theme: str = "") -> Dict[str, str]:
        text = f"{title} {' '.join(ingredients)} {theme}".lower()
        if any(k in text for k in ["마라탕", "마라전골", "마라두부", "마라찌개"]):
            return {
                "channel": "다솔쿠 DASOL COO",
                "subscribers": "120만명",
                "views": "150만회",
                "title": "라면보다 쉬운 집에서 끓이는 얼큰 마라탕 & 마라두부전골 찌개",
                "embedId": "gFoT-Df74Kk",
                "url": "https://www.youtube.com/watch?v=gFoT-Df74Kk"
            }
        if any(k in text for k in ["마라샹궈", "마라볶음", "마라삼겹", "마라"]):
            return {
                "channel": "오늘 뭐 먹지?",
                "subscribers": "128만명",
                "views": "180만회",
                "title": "냉장고 털기 좋은 마라샹궈 & 마라 삼겹살 볶음 황금 비법",
                "embedId": "F7jL913kX6Q",
                "url": "https://www.youtube.com/watch?v=F7jL913kX6Q"
            }
        if any(k in text for k in ["카레", "카레라이스"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "490만회",
                "title": "돼지고기와 감자가 듬뿍! 백종원표 진한 풍미 감자 카레라이스",
                "embedId": "I6oK6Ew0hno",
                "url": "https://www.youtube.com/watch?v=I6oK6Ew0hno"
            }
        if any(k in text for k in ["제육", "두루치기"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "670만회",
                "title": "실패 없는 불맛 가득 제육볶음 & 돼지고기 두루치기 황금레시피",
                "embedId": "R9Z8bWz-sJ8",
                "url": "https://www.youtube.com/watch?v=R9Z8bWz-sJ8"
            }
        if any(k in text for k in ["갈비", "갈비찜", "갈비구이"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "410만회",
                "title": "입에서 살살 녹는 단짠단짠 돼지갈비찜 & 갈비구이 황금레시피",
                "embedId": "kYJqO0cT-0c",
                "url": "https://www.youtube.com/watch?v=kYJqO0cT-0c"
            }
        if any(k in text for k in ["샐러드", "클린"]):
            return {
                "channel": "맛있는 다이어트",
                "subscribers": "95만명",
                "views": "260만회",
                "title": "닭가슴살과 신선 채소로 만드는 극강의 단백질 샐러드",
                "embedId": "kY0U1y_o2-0",
                "url": "https://www.youtube.com/watch?v=kY0U1y_o2-0"
            }
        if any(k in text for k in ["찌개", "탕", "짜글이", "순두부"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "348만회",
                "title": "스팸과 김치만 있으면 끝! 밥도둑 스팸김치짜글이",
                "embedId": "N_7i62FEKkk",
                "url": "https://www.youtube.com/watch?v=N_7i62FEKkk"
            }
        return {
            "channel": "백종원의 요리비책",
            "subscribers": "568만명",
            "views": "612만회",
            "title": "중식당 볶음밥보다 맛있는 황금 대파계란 볶음밥 비법",
            "embedId": "A5Qg-JriOX4",
            "url": "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        }

        return candidates
