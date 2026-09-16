# backend/agents/deduction_agent.py
"""
Inventory Deduction Agent (Python 백엔드 에이전트)
레시피 조리 완료 시 냉장고 식재료 실시간 원자적 차감 관리
"""

from typing import List, Dict, Any

class DeductionAgent:
    def __init__(self):
        self.name = "Inventory Deduction Agent"

    def deduct_ingredients(self, current_inventory: List[Dict[str, Any]], recipe_ingredients: List[Dict[str, Any]]) -> Dict[str, Any]:
        deducted = []
        depleted = []

        for req in recipe_ingredients:
            req_name = req.get("name", "")
            need = float(req.get("need", 1.0))

            for item in current_inventory:
                item_name = item.get("name", "")
                if req_name in item_name or item_name in req_name:
                    prev = item.get("count", 0.0)
                    new_count = max(0.0, round(prev - need, 1))
                    item["count"] = new_count

                    deducted.append({
                        "name": item_name,
                        "unit": item.get("unit", "개"),
                        "prev": prev,
                        "curr": new_count,
                        "deducted": need
                    })

                    if new_count == 0.0:
                        item["selected"] = False
                        depleted.append(item_name)
                    break

        return {
            "updatedInventory": current_inventory,
            "deducted": deducted,
            "depleted": depleted
        }
