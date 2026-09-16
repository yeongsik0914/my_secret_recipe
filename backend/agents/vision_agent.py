# backend/agents/vision_agent.py
"""
Vision & Inventory Agent (Python 백엔드 에이전트)
이미지 파일(영수증/냉장고 사진) 및 자연어 텍스트로부터 식재료 품목 및 수량 추출
"""

import re
from typing import List, Dict, Any

class VisionAgent:
    def __init__(self):
        self.name = "Vision & Inventory Agent"

    def analyze_image_metadata(self, filename: str) -> List[Dict[str, Any]]:
        """이미지 메타데이터 및 OCR 분석 모의 시뮬레이션"""
        return [
            {"name": "대파", "count": 2.0, "unit": "대", "shelf": "vege", "confidence": 0.98},
            {"name": "양파", "count": 1.0, "unit": "개", "shelf": "vege", "confidence": 0.95},
            {"name": "스팸", "count": 1.0, "unit": "캔", "shelf": "meat", "confidence": 0.99},
            {"name": "계란", "count": 6.0, "unit": "알", "shelf": "dairy", "confidence": 0.97},
            {"name": "두부", "count": 1.0, "unit": "모", "shelf": "dairy", "confidence": 0.96},
            {"name": "김치", "count": 500.0, "unit": "g", "shelf": "sauce", "confidence": 0.94},
        ]

    def parse_natural_text(self, text: str) -> List[Dict[str, Any]]:
        """자연어 텍스트 파싱 ("감자 3개", "스팸 1캔" 등)"""
        chunks = [c.strip() for c in re.split(r'[,;\n]+', text) if c.strip()]
        results = []

        for chunk in chunks:
            match = re.match(r'^([가-힣a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?)\s*([가-힣a-zA-Z]*)$', chunk)
            if match:
                name = match.group(1).strip()
                count = float(match.group(2))
                unit = match.group(3) or "개"
            else:
                name = chunk
                count = 1.0
                unit = "개"

            # 보관 선반 자동 분류
            shelf = "vege"
            if any(k in name for k in ["스팸", "삼겹살", "소고기", "돼지고기", "소시지", "햄"]):
                shelf = "meat"
                if not match: unit = "캔"
            elif any(k in name for k in ["계란", "달걀", "두부", "치즈", "우유"]):
                shelf = "dairy"
                if not match: unit = "알" if "계란" in name else "모"
            elif any(k in name for k in ["김치", "마늘", "간장", "고추장", "밥", "라면", "양념"]):
                shelf = "sauce"
                if not match: unit = "공기" if "밥" in name else "스푼"

            results.append({
                "name": name,
                "count": count,
                "unit": unit,
                "shelf": shelf,
                "freshness": "fresh",
                "daysLeft": 7
            })

        return results
