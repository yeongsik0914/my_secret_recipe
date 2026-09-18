# backend/agents/user_recipe_agent.py
"""
User Recipe & Personal DB Agent (Python 백엔드 에이전트)
개인 계정별 1:1 맞춤 AI 레시피 및 매칭 식재료 DB 영구 보관, 계정별 취향 프로파일링 및 감사 로그 중계
"""

from typing import List, Dict, Any, Optional

class UserRecipeAgent:
    def __init__(self, admin_store=None):
        self.name = "User Recipe & Personal DB Agent"
        self.admin_store = admin_store

    def set_store(self, admin_store):
        self.admin_store = admin_store

    def persist_user_recipes(
        self,
        user_id: str,
        recipes: List[Dict[str, Any]],
        custom_query: str = "",
        selected_ingredients: Optional[List[Dict[str, Any]]] = None,
        admin_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        검증 완료된 맞춤 레시피 3종 및 매칭 식재료 목록을 사용자 개인 DB에 영구 보존
        """
        if not self.admin_store:
            raise RuntimeError("AdminDataStore가 바인딩되지 않았습니다.")

        return self.admin_store.save_user_recipes(
            user_id=user_id,
            recipes=recipes,
            custom_query=custom_query,
            selected_ingredients=selected_ingredients,
            admin_name=admin_name
        )

    def get_user_recipes(self, user_id: str) -> Dict[str, Any]:
        """
        사용자 계정 DB에서 보관 중인 1:1 맞춤 레시피 복원 조회
        """
        if not self.admin_store:
            return {"query": "", "savedAt": "", "selectedIngredients": [], "recipes": []}

        return self.admin_store.get_user_recipes(user_id)

user_recipe_agent = UserRecipeAgent()
