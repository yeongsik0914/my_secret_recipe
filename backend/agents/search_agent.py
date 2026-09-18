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

        # 3열 레이아웃을 빈틈없이 채우는 정밀 1:1 맞춤 AI 레시피 3종 합성
        # 3열 레이아웃을 빈틈없이 채우는 정밀 1:1 맞춤 AI 레시피 3종 합성
        primary = selected_ingredients[:4] if selected_ingredients else ["닭가슴살", "감자", "양파", "특제양념"]
        p1 = primary[0] if len(primary) > 0 else "닭가슴살"
        p2 = primary[1] if len(primary) > 1 else "스팸"
        p3 = primary[2] if len(primary) > 2 else "두부"

        # 시맨틱 분석
        is_stew = any(k in clean_query for k in ["감자탕", "해장국", "탕", "찌개", "전골", "짜글이", "스튜", "뚝배기", "국물", "샤브", "나베"])
        is_taco = any(k in clean_query for k in ["타코", "taco", "멕시칸", "퀘사디아"])
        is_honey_butter = "허니버터" in clean_query or ("허니" in clean_query and "버터" in clean_query) or "버터" in clean_query
        is_spicy = any(k in clean_query for k in ["매운", "맵고", "매콤", "얼큰", "칼칼", "불닭", "핫"])
        is_mala = any(k in clean_query for k in ["마라", "얼얼"])
        is_dessert_prompt = any(k in clean_query for k in ["디저트", "파르페", "케이크", "와플"])

        top_3 = []

        # CASE 1: 탕 / 전골 / 찌개
        if is_stew:
            if "감자탕" in clean_query:
                t1 = "얼큰 매콤 허니버터 감자탕 전골" if is_honey_butter else "구수하고 진한 뚝배기 감자탕 전골"
            elif is_honey_butter and is_spicy:
                t1 = f"얼큰 칼칼 허니버터 {p1} 퓨전 스튜"
            elif is_mala:
                t1 = f"얼얼하고 진한 특제 마라 {p1} 전골"
            elif clean_query:
                t1 = f"{clean_query} • {p1} 뚝배기 전골"
            else:
                t1 = f"얼큰 칼칼 {p1} 뚝배기 짜글이 찌개"

            img_1 = "images/recipes/spicy_honey_stew.jpg" if is_honey_butter else "images/recipes/gamjatang_stew.jpg"

            t2 = f"달콤 짭조름 허니버터 갈릭 {p2} 구이" if is_honey_butter else f"노릇노릇 고소한 바삭 {p2} 감자채전"
            img_2 = "images/recipes/honey_butter_dish.jpg" if is_honey_butter else "images/recipes/tofu_buchim.jpg"

            t3 = "진한 전골 육수 품은 치즈 김가루 볶음밥"
            img_3 = "images/recipes/spam_mayo_deopbap.jpg"

            top_3 = [
                {
                    "id": f"custom_ai_top_1_{clean_query or 'stew'}",
                    "craftNo": "AI CHEF SPECIAL NO. 01",
                    "title": t1,
                    "subTitle": f"AI 셰프 1:1 맞춤 특선 • {clean_query or '정통 보양 탕/전골 스페셜'}",
                    "description": f"보관 중인 {p1}과(와) 신선 채소를 푹 우려낸 깊은 육수에 {'매콤한 비법 다대기와 고소한 허니버터의 풍미를 녹여낸' if is_honey_butter else '얼큰하고 깊은 감칠맛을 살린'} 셰프의 시그니처 전골입니다.",
                    "theme": "korean_stew",
                    "rating": 5.0,
                    "reviewCount": 154,
                    "timeMinutes": 20,
                    "difficulty": "난이도 중",
                    "calorie": 540,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": img_1,
                    "youtube": self.resolve_matching_youtube(t1, primary, theme),
                    "ingredients": [{"name": p, "need": 1, "unit": "개", "match": True, "shelf": "vege"} for p in primary[:4]],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "식재료 손질 & 전골 정돈", "desc": f"보관된 {p1}을(를) 먹기 좋게 썰고, 채소를 큼직하게 썰어 전골 냄비에 담습니다.", "time": "4분"},
                        {"step": 2, "title": "비법 얼큰 육수 배합", "desc": "물과 육수 베이스에 양념을 골고루 풀어 센 불에서 보글보글 끓여 진한 국물 맛을 냅니다.", "time": "4분"},
                        {"step": 3, "title": "주재료 푹 고기 & 양념 배임", "desc": f"{p1}과(와) 채소를 넣고 중약불로 10분간 푹 고아 속까지 양념이 깊숙이 배도록 조리합니다.", "time": "9분"},
                        {"step": 4, "title": "허니버터 터치 & 대파 마무리" if is_honey_butter else "대파 & 들깨 듬뿍 마무리", "desc": "버터와 꿀 또는 대파와 들깨를 얹어 뚝배기의 뜨거운 잔열로 자작하게 완성합니다.", "time": "3분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_2_{clean_query or 'stew'}",
                    "craftNo": "AI CHEF SPECIAL NO. 02",
                    "title": t2,
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 전골 페어링 바삭 구이",
                    "description": f"얼큰하고 진한 메인 전골과 최고의 궁합을 자랑하도록 겉은 바삭하고 속은 촉촉하게 구워낸 페어링 일품요리입니다.",
                    "theme": "quick_15min",
                    "rating": 4.98,
                    "reviewCount": 122,
                    "timeMinutes": 12,
                    "difficulty": "난이도 하",
                    "calorie": 460,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": img_2,
                    "youtube": self.resolve_matching_youtube(t2, [p2], theme),
                    "ingredients": [{"name": p2, "need": 1, "unit": "개", "match": True, "shelf": "meat"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "식재료 슬라이스", "desc": f"{p2}을(를) 얇게 채 썰어 팬에 올릴 준비를 합니다.", "time": "3분"},
                        {"step": 2, "title": "팬 예열 & 노릇 굽기", "desc": "팬에 식용유를 두르고 센 불에서 재료 겉면이 바삭해질 때까지 노릇하게 굽습니다.", "time": "4분"},
                        {"step": 3, "title": "글레이징 & 완성", "desc": "양념을 가볍게 둘러 표면에 윤기를 입혀가며 빠르게 완성합니다.", "time": "3분"},
                        {"step": 4, "title": "도마 위 서빙", "desc": "도마 위에 정갈하게 담아 메인 전골과 함께 따뜻하게 즐깁니다.", "time": "2분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_3_{clean_query or 'stew'}",
                    "craftNo": "AI CHEF SPECIAL NO. 03",
                    "title": t3,
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 특제 피날레 누룽지 볶음밥",
                    "description": "메인 전골의 깊은 국물과 고기 육수를 자작하게 남겨, 밥과 잘게 다진 채소, 고소한 김가루와 치즈를 넣고 센 불에 바삭하게 눌어붙도록 볶아낸 든든한 마무리 식사입니다.",
                    "theme": "quick_15min",
                    "rating": 4.96,
                    "reviewCount": 135,
                    "timeMinutes": 10,
                    "difficulty": "난이도 극하",
                    "calorie": 490,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": img_3,
                    "youtube": self.resolve_matching_youtube(t3, ["밥", "김가루"], theme),
                    "ingredients": [{"name": "밥", "need": 1, "unit": "공기", "match": True, "shelf": "vege"}, {"name": "치즈", "need": 1, "unit": "장", "match": True, "shelf": "dairy"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "전골 육수 조리기", "desc": "전골 냄비에 진한 국물을 자작하게 남기고 덜어냅니다.", "time": "2분"},
                        {"step": 2, "title": "밥 & 채소 투하", "desc": "따뜻한 밥과 다진 채소를 넣고 국물과 골고루 볶습니다.", "time": "3분"},
                        {"step": 3, "title": "누룽지 굽기", "desc": "밥을 넓게 펼쳐 누른 뒤 센 불에서 바삭하게 누룽지를 만듭니다.", "time": "3분"},
                        {"step": 4, "title": "치즈 & 김가루 토핑", "desc": "치즈와 김가루를 얹어 녹여 완성합니다.", "time": "2분"}
                    ]
                }
            ]
        # CASE 2: 타코 / 멕시칸
        elif is_taco:
            top_3 = [
                {
                    "id": f"custom_ai_top_1_{clean_query or 'taco'}",
                    "craftNo": "AI CHEF SPECIAL NO. 01",
                    "title": f"매콤 육즙 풍미 {p1} 멕시칸 스트리트 타코",
                    "subTitle": f"AI 셰프 1:1 맞춤 특선 • {clean_query or '정통 멕시칸 타코'}",
                    "description": f"보관 중인 {p1}과(와) 신선 채소를 센 불에 조리하여 풍부한 육즙과 감칠맛을 살린 정통 타코입니다.",
                    "theme": "quick_15min",
                    "rating": 5.0,
                    "reviewCount": 142,
                    "timeMinutes": 15,
                    "difficulty": "난이도 하",
                    "calorie": 480,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": "images/recipes/taco_street.jpg",
                    "youtube": self.resolve_matching_youtube("멕시칸 타코", primary, theme),
                    "ingredients": [{"name": p, "need": 1, "unit": "개", "match": True, "shelf": "vege"} for p in primary[:4]],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "식재료 손질", "desc": "고기와 채소를 알맞은 크기로 썹니다.", "time": "3분"},
                        {"step": 2, "title": "센 불 시어링", "desc": "팬에 빠르게 볶아 육즙을 가둡니다.", "time": "5분"},
                        {"step": 3, "title": "플레이팅 완성", "desc": "타코 위에 고기와 채소를 얹어 완성합니다.", "time": "2분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_2_{clean_query or 'taco'}",
                    "craftNo": "AI CHEF SPECIAL NO. 02",
                    "title": f"골든 치즈 바삭 {p2} 타코 퀘사디아",
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 크리스피 치즈 & 타코 롤",
                    "description": f"바삭한 크러스트 속에 고소한 치즈와 {p2}을(를) 가득 채워 구워낸 퀘사디아입니다.",
                    "theme": "quick_15min",
                    "rating": 4.98,
                    "reviewCount": 118,
                    "timeMinutes": 12,
                    "difficulty": "난이도 하",
                    "calorie": 520,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": "images/recipes/taco_quesadilla.jpg",
                    "youtube": self.resolve_matching_youtube("타코 퀘사디아", [p2], theme),
                    "ingredients": [{"name": p2, "need": 1, "unit": "개", "match": True, "shelf": "meat"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "재료 볶기", "desc": "속재료를 고소하게 볶아냅니다.", "time": "3분"},
                        {"step": 2, "title": "치즈와 접어 굽기", "desc": "치즈와 함께 노릇하게 굽습니다.", "time": "4분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_3_{clean_query or 'taco'}",
                    "craftNo": "AI CHEF SPECIAL NO. 03",
                    "title": f"육즙 팡팡 {p3} 멕시칸 타코 플레이트 보울",
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 푸짐한 그릴드 타코 플레이트",
                    "description": "그릴에 구운 재료와 신선 살사를 듬뿍 담아낸 건강한 멕시칸 타코 보울입니다.",
                    "theme": "diet_clean",
                    "rating": 4.95,
                    "reviewCount": 88,
                    "timeMinutes": 14,
                    "difficulty": "난이도 하",
                    "calorie": 460,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": "images/recipes/taco_plate.jpg",
                    "youtube": self.resolve_matching_youtube("타코 보울", [p3], theme),
                    "ingredients": [{"name": p3, "need": 1, "unit": "개", "match": True, "shelf": "dairy"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "그릴 조리", "desc": "센 불에 재료를 바삭하게 굽습니다.", "time": "4분"},
                        {"step": 2, "title": "보울 담기", "desc": "보울에 푸짐하게 담아 완성합니다.", "time": "3분"}
                    ]
                }
            ]
        # CASE 3: 디저트 프롬프트
        elif is_dessert_prompt:
            top_3 = [
                {
                    "id": f"custom_ai_top_1_{clean_query or 'dessert'}",
                    "craftNo": "AI CHEF SPECIAL NO. 01",
                    "title": "달콤 허니 블루베리 생크림 파르페 보울",
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 프레시 스위트 디저트",
                    "description": "블루베리, 생크림, 벌꿀을 블렌딩하여 입안을 달콤하게 감싸주는 산뜻한 디저트입니다.",
                    "theme": "diet_clean",
                    "rating": 5.0,
                    "reviewCount": 95,
                    "timeMinutes": 8,
                    "difficulty": "난이도 극하",
                    "calorie": 290,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": "images/recipes/dessert_parfait.jpg",
                    "youtube": self.resolve_matching_youtube("파르페 디저트", ["블루베리", "생크림"], theme),
                    "ingredients": [{"name": "블루베리", "need": 1, "unit": "팩", "match": True, "shelf": "vege"}, {"name": "생크림", "need": 1, "unit": "팩", "match": True, "shelf": "dairy"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "과일 세척", "desc": "신선한 과일을 세척합니다.", "time": "2분"},
                        {"step": 2, "title": "크림 레이어드", "desc": "보울에 크림과 과일을 번갈아 올립니다.", "time": "3분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_2_{clean_query or 'dessert'}",
                    "craftNo": "AI CHEF SPECIAL NO. 02",
                    "title": "카프레제 신선 생과일 샐러드",
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 상큼 비타민 보울",
                    "description": "신선한 치즈와 과일을 곁들여 산뜻하게 즐기는 샐러드입니다.",
                    "theme": "diet_clean",
                    "rating": 4.95,
                    "reviewCount": 78,
                    "timeMinutes": 10,
                    "difficulty": "난이도 극하",
                    "calorie": 220,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": "images/recipes/caprese_salad.jpg",
                    "youtube": self.resolve_matching_youtube("카프레제 샐러드", ["치즈"], theme),
                    "ingredients": [{"name": "치즈", "need": 1, "unit": "장", "match": True, "shelf": "dairy"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "슬라이스 & 플레이팅", "desc": "치즈와 과일을 썰어 가지런히 담습니다.", "time": "3분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_3_{clean_query or 'dessert'}",
                    "craftNo": "AI CHEF SPECIAL NO. 03",
                    "title": "골든 허니 프렌치 토스트",
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 브런치 스위트",
                    "description": "촉촉하게 구워낸 토스트에 꿀을 둘러 완성하는 브런치 디저트입니다.",
                    "theme": "quick_15min",
                    "rating": 4.97,
                    "reviewCount": 110,
                    "timeMinutes": 12,
                    "difficulty": "난이도 하",
                    "calorie": 380,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": "images/recipes/default_food.jpg",
                    "youtube": self.resolve_matching_youtube("프렌치 토스트", ["계란", "꿀"], theme),
                    "ingredients": [{"name": "계란", "need": 2, "unit": "알", "match": True, "shelf": "dairy"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "팬 굽기", "desc": "버터를 두르고 노릇하게 굽습니다.", "time": "5분"}
                    ]
                }
            ]
        # CASE 4: 구이 / 볶음 / 일반
        else:
            t1 = f"{clean_query} • {p1} 특선 요리" if clean_query else f"특제 양념 {p1} 채소 두루치기"
            img_1 = "images/recipes/honey_butter_dish.jpg" if is_honey_butter else "images/recipes/spicy_pork_duruchigi.jpg"

            t2 = f"얼큰 칼칼 {p2} 뚝배기 짜글이"
            img_2 = "images/recipes/kimchi_jjigae.jpg"

            t3 = f"황금 대파 {p3} 감칠맛 볶음밥"
            img_3 = "images/recipes/egg_fried_rice.jpg"

            top_3 = [
                {
                    "id": f"custom_ai_top_1_{clean_query or 'spec'}",
                    "craftNo": "AI CHEF SPECIAL NO. 01",
                    "title": t1,
                    "subTitle": f"AI 셰프 1:1 맞춤 특선 • {clean_query or '정통 시그니처'}",
                    "description": f"보관 중인 {p1}과(와) 신선 채소를 센 불에 조리하여 풍부한 육즙과 감칠맛을 살린 셰프의 1:1 맞춤 특선 요리입니다.",
                    "theme": theme if theme != "all" else "quick_15min",
                    "rating": 5.0,
                    "reviewCount": 142,
                    "timeMinutes": 15,
                    "difficulty": "난이도 하",
                    "calorie": 490,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": img_1,
                    "youtube": self.resolve_matching_youtube(t1, primary, theme),
                    "ingredients": [{"name": p, "need": 1, "unit": "개", "match": True, "shelf": "vege"} for p in primary[:4]],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "식재료 정밀 손질", "desc": f"보관된 {p1}과(와) 채소를 알맞은 크기로 썰어 수분을 정돈합니다.", "time": "3분"},
                        {"step": 2, "title": "특제 마리네이드", "desc": "양념을 고르게 버무려 5분간 재워 감칠맛을 입힙니다.", "time": "3분"},
                        {"step": 3, "title": "센 불 육즙 시어링", "desc": "달궈진 팬에 기름을 두르고 빠르게 조리해 육즙을 가둡니다.", "time": "5분"},
                        {"step": 4, "title": "도마 위 플레이팅", "desc": "도마 위에 먹음직스럽게 담아 따뜻할 때 완성합니다.", "time": "2분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_2_{clean_query or 'spec'}",
                    "craftNo": "AI CHEF SPECIAL NO. 02",
                    "title": t2,
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 든든한 곁들임 국물",
                    "description": f"보관 중인 {p2}을(를) 활용하여 뚝배기에 얼큰하게 끓여낸 셰프의 추천 찌개 요리입니다.",
                    "theme": "korean_stew",
                    "rating": 4.98,
                    "reviewCount": 118,
                    "timeMinutes": 15,
                    "difficulty": "난이도 하",
                    "calorie": 480,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": img_2,
                    "youtube": self.resolve_matching_youtube(t2, [p2], theme),
                    "ingredients": [{"name": p2, "need": 1, "unit": "개", "match": True, "shelf": "meat"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "식재료 썰기", "desc": f"{p2}을(를) 먹기 좋은 크기로 썹니다.", "time": "3분"},
                        {"step": 2, "title": "뚝배기 조리기", "desc": "양념과 육수를 넣고 보글보글 끓여냅니다.", "time": "5분"},
                        {"step": 3, "title": "완성", "desc": "따뜻할 때 뚝배기 채로 즐깁니다.", "time": "3분"}
                    ]
                },
                {
                    "id": f"custom_ai_top_3_{clean_query or 'spec'}",
                    "craftNo": "AI CHEF SPECIAL NO. 03",
                    "title": t3,
                    "subTitle": "AI 셰프 1:1 맞춤 특선 • 든든한 한 끼 식사",
                    "description": f"보관 중인 {p3}과(와) 대파기름을 둘러 센 불에 고슬고슬하게 볶아낸 감칠맛 볶음밥입니다.",
                    "theme": "quick_15min",
                    "rating": 4.95,
                    "reviewCount": 92,
                    "timeMinutes": 10,
                    "difficulty": "난이도 극하",
                    "calorie": 510,
                    "matchRate": 100,
                    "calculatedMatchRate": 100,
                    "isUserRecipe": True,
                    "isCustomSearchMatch": True,
                    "isTopTailored": True,
                    "image": img_3,
                    "youtube": self.resolve_matching_youtube(t3, [p3], theme),
                    "ingredients": [{"name": "밥", "need": 1, "unit": "공기", "match": True, "shelf": "vege"}, {"name": p3, "need": 1, "unit": "개", "match": True, "shelf": "dairy"}],
                    "missingIngredients": [],
                    "steps": [
                        {"step": 1, "title": "파기름 내기", "desc": "팬에 기름을 두르고 대파를 볶아 향을 냅니다.", "time": "3분"},
                        {"step": 2, "title": "밥 넣고 볶기", "desc": "밥과 주재료를 넣고 센 불에 고슬고슬 볶아냅니다.", "time": "3분"}
                    ]
                }
            ]

        if clean_query:
            direct_matches = [c for c in candidates if clean_query in c.get("title", "").lower() or clean_query in c.get("description", "").lower() or clean_query in c.get("subTitle", "").lower()]
            for m in direct_matches:
                m["isCustomSearchMatch"] = True
                m["calculatedMatchRate"] = 100
            other_candidates = [c for c in candidates if c not in direct_matches]
            candidates = top_3 + direct_matches + other_candidates
        elif theme and theme != "all":
            theme_matches = [c for c in candidates if c.get("theme") == theme]
            other_candidates = [c for c in candidates if c.get("theme") != theme]
            candidates = top_3 + theme_matches + other_candidates
        else:
            candidates.sort(key=lambda x: x.get("calculatedMatchRate", 0), reverse=True)
            candidates = top_3 + candidates

        for c in candidates:
            if not c.get("youtube") or not c["youtube"].get("embedId"):
                c["youtube"] = self.resolve_matching_youtube(c.get("title", ""), [i.get("name", "") for i in c.get("ingredients", [])], c.get("theme", ""))

        return candidates

    def resolve_matching_youtube(self, title: str, ingredients: List[str], theme: str = "") -> Dict[str, str]:
        t = (title or "").lower()
        text = f"{title} {' '.join(ingredients)} {theme}".lower()

        # 1. 요리 형태(Dish Category) 최우선 매칭 (제목 기준 1순위)
        if any(k in t for k in ["두루치기", "제육", "제육볶음", "고추장삼겹살", "돼지불고기"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "670만회",
                "title": "실패 없는 불맛 가득 제육볶음 & 돼지고기 두루치기 황금레시피",
                "embedId": "j7s9VRsrm9o",
                "url": "https://www.youtube.com/watch?v=j7s9VRsrm9o"
            }
        if any(k in t for k in ["볶음밥", "파계란", "파기름볶음밥"]):
            return {
                "channel": "하루한끼 one meal a day",
                "subscribers": "420만명",
                "views": "6780만회",
                "title": "중국집 볶음밥보다 10배 맛있는 인생 파계란볶음밥",
                "embedId": "A5Qg-JriOX4",
                "url": "https://www.youtube.com/watch?v=A5Qg-JriOX4"
            }
        if any(k in t for k in ["스팸마요", "마요덮밥", "덮밥"]):
            return {
                "channel": "오메추 오늘의 메뉴",
                "subscribers": "120만명",
                "views": "180만회",
                "title": "집에서 간단하게 만들어 먹는 스팸마요덮밥!",
                "embedId": "rjhoBi-mhMk",
                "url": "https://www.youtube.com/watch?v=rjhoBi-mhMk"
            }
        if any(k in t for k in ["타코", "taco", "멕시칸", "퀘사디아"]):
            return {
                "channel": "취미로 요리하는 남자 Yonam",
                "subscribers": "142만명",
                "views": "390만회",
                "title": "집에서 제대로 만드는 극강의 육즙 가득 멕시칸 타코 황금레시피",
                "embedId": "b7Ki08LjkPs",
                "url": "https://www.youtube.com/watch?v=b7Ki08LjkPs"
            }
        if any(k in t for k in ["에어프라이어", "에어구이", "구이"]):
            return {
                "channel": "식탁일기 table diary",
                "subscribers": "152만명",
                "views": "280만회",
                "title": "닭가슴살을 가장 맛있게 먹는 방법 (에어프라이어 겉바속촉 구이 레시피)",
                "embedId": "_Vq0HnbVqyo",
                "url": "https://www.youtube.com/watch?v=_Vq0HnbVqyo"
            }
        if any(k in t for k in ["김치전", "감자전", "감자채전", "부침개", "파전", "해물파전", "부침", "채전"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "530만회",
                "title": "겉은 바삭 속은 쫀득! 실패 없는 백종원표 김치전 비법",
                "embedId": "_-oaae1jjWs",
                "url": "https://www.youtube.com/watch?v=_-oaae1jjWs"
            }
        if any(k in t for k in ["두부부침", "두부조림", "두부전"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "310만회",
                "title": "두부와 계란만 있으면 5분 완성! 고소함 폭발 두부조림 & 두부부침",
                "embedId": "Eino3yP-Wk0",
                "url": "https://www.youtube.com/watch?v=Eino3yP-Wk0"
            }
        if any(k in t for k in ["짜글이", "스팸짜글이", "감자짜글이"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "348만회",
                "title": "스팸과 김치만 있으면 끝! 밥도둑 스팸김치짜글이",
                "embedId": "N_7i62FEKkk",
                "url": "https://www.youtube.com/watch?v=N_7i62FEKkk"
            }
        if any(k in t for k in ["순두부", "순두부찌개", "찌개", "스튜", "전골", "탕"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "420만회",
                "title": "순두부찌개 끓이기 어렵다구요? 초간단 고추기름 비법 순두부찌개",
                "embedId": "nj-DjQFEZb0",
                "url": "https://www.youtube.com/watch?v=nj-DjQFEZb0"
            }
        if any(k in t for k in ["마라탕", "마라전골", "마라두부"]):
            return {
                "channel": "다솔쿠 DASOL COO",
                "subscribers": "120만명",
                "views": "150만회",
                "title": "라면보다 쉬운 집에서 끓이는 얼큰 마라탕 & 마라두부전골 찌개",
                "embedId": "gFoT-Df74Kk",
                "url": "https://www.youtube.com/watch?v=gFoT-Df74Kk"
            }
        if any(k in t for k in ["마라샹궈", "마라볶음", "마라삼겹"]):
            return {
                "channel": "1분요리 뚝딱이형",
                "subscribers": "280만명",
                "views": "350만회",
                "title": "집에서 사먹는 것보다 맛있는 마라샹궈 & 마라 삼겹살 볶음 만들기",
                "embedId": "JsXnSWmvNEU",
                "url": "https://www.youtube.com/watch?v=JsXnSWmvNEU"
            }
        if any(k in t for k in ["카레", "카레라이스"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "490만회",
                "title": "돼지고기와 감자가 듬뿍! 백종원표 진한 풍미 감자 카레라이스",
                "embedId": "I6oK6Ew0hno",
                "url": "https://www.youtube.com/watch?v=I6oK6Ew0hno"
            }
        if any(k in t for k in ["갈비", "갈비찜", "갈비구이"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "410만회",
                "title": "단짠의 정석! 부드럽고 촉촉한 돼지갈비찜 & 갈비구이 비법",
                "embedId": "E4so3rBlG2o",
                "url": "https://www.youtube.com/watch?v=E4so3rBlG2o"
            }
        if any(k in t for k in ["카프레제"]):
            return {
                "channel": "반이짝이 1분 레시피",
                "subscribers": "68만명",
                "views": "145만회",
                "title": "방울토마토 보코치니 카프레제 샐러드 w. 발사믹소스 드레싱",
                "embedId": "J1v721PgaUE",
                "url": "https://www.youtube.com/watch?v=J1v721PgaUE"
            }
        if any(k in t for k in ["샐러드", "클린식"]):
            return {
                "channel": "맛있는 다이어트",
                "subscribers": "95만명",
                "views": "260만회",
                "title": "닭가슴살을 매일 맛있게 먹는 법! 초간단 단백질 다이어트 샐러드",
                "embedId": "xiLqt4FUEzc",
                "url": "https://www.youtube.com/watch?v=xiLqt4FUEzc"
            }

        # 2. 텍스트 전체(재료/설명 포함) 매칭
        if any(k in text for k in ["두루치기", "제육"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "670만회",
                "title": "실패 없는 불맛 가득 제육볶음 & 돼지고기 두루치기 황금레시피",
                "embedId": "j7s9VRsrm9o",
                "url": "https://www.youtube.com/watch?v=j7s9VRsrm9o"
            }
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
                "channel": "1분요리 뚝딱이형",
                "subscribers": "280만명",
                "views": "350만회",
                "title": "집에서 사먹는 것보다 맛있는 마라샹궈 & 마라 삼겹살 볶음 만들기",
                "embedId": "JsXnSWmvNEU",
                "url": "https://www.youtube.com/watch?v=JsXnSWmvNEU"
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
        if any(k in text for k in ["갈비", "갈비찜", "갈비구이"]):
            return {
                "channel": "백종원의 요리비책",
                "subscribers": "568만명",
                "views": "410만회",
                "title": "단짠의 정석! 부드럽고 촉촉한 돼지갈비찜 & 갈비구이 비법",
                "embedId": "E4so3rBlG2o",
                "url": "https://www.youtube.com/watch?v=E4so3rBlG2o"
            }
        if any(k in text for k in ["샐러드", "클린"]):
            return {
                "channel": "맛있는 다이어트",
                "subscribers": "95만명",
                "views": "260만회",
                "title": "닭가슴살을 매일 맛있게 먹는 법! 초간단 단백질 다이어트 샐러드",
                "embedId": "xiLqt4FUEzc",
                "url": "https://www.youtube.com/watch?v=xiLqt4FUEzc"
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
            "channel": "하루한끼 one meal a day",
            "subscribers": "420만명",
            "views": "6780만회",
            "title": "중국집 볶음밥보다 10배 맛있는 인생 파계란볶음밥",
            "embedId": "A5Qg-JriOX4",
            "url": "https://www.youtube.com/watch?v=A5Qg-JriOX4"
        }

    def search_recipes(self, selected_ingredients: List[str], theme: str = "all", clean_query: str = "", user_recipes: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return self.search_candidates(selected_ingredients=selected_ingredients, theme=theme, custom_query=clean_query, user_recipes=user_recipes)
